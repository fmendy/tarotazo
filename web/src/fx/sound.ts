// Sonidos sintetizados con Web Audio (sin ficheros). Ver docs/CONTRACTS.md §7.
// El AudioContext se crea perezosamente en la primera llamada (que debe venir de un gesto
// del usuario en iOS/Chrome). Todo pasa por un bus maestro; `setMuted` lo silencia todo,
// incluido el ambiente.

export type SfxName = 'shuffle' | 'flip' | 'candle' | 'bell' | 'chime' | 'stamp' | 'swing';
export interface SfxOptions {
  /** 0..1 (multiplica el volumen base del efecto). */
  volume?: number;
  /** Variación de tono (1 = normal). */
  rate?: number;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted = false;
const muteListeners = new Set<(m: boolean) => void>();
const MASTER = 0.8;

function audio(): AudioContext | null {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    return ctx;
  }
  const w = typeof window !== 'undefined' ? (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }) : undefined;
  const AC = w?.AudioContext ?? w?.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    return null;
  }
  master = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);
  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

/** Silencio global (incluye el ambiente). */
export function setMuted(b: boolean): void {
  muted = b;
  if (ctx && master) master.gain.setTargetAtTime(b ? 0 : MASTER, ctx.currentTime, 0.03);
  muteListeners.forEach((l) => l(b));
}
export function isMuted(): boolean {
  return muted;
}
export function onMutedChange(cb: (m: boolean) => void): () => void {
  muteListeners.add(cb);
  return () => {
    muteListeners.delete(cb);
  };
}

/* ------------------------------ primitivas ------------------------------ */
function noise(c: AudioContext, t: number, dur: number, out: AudioNode, rate = 1) {
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  s.playbackRate.value = rate;
  s.connect(out);
  s.start(t, Math.random() * 1.5, dur + 0.05);
  return s;
}
function env(c: AudioContext, t: number, peak: number, a: number, d: number, out: AudioNode) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  g.connect(out);
  return g;
}
function filter(c: AudioContext, type: BiquadFilterType, f: number, q: number, out: AudioNode) {
  const b = c.createBiquadFilter();
  b.type = type;
  b.frequency.value = f;
  b.Q.value = q;
  b.connect(out);
  return b;
}
function tone(c: AudioContext, t: number, freq: number, dur: number, peak: number, out: AudioNode, type: OscillatorType = 'sine') {
  const g = env(c, t, peak, 0.005, dur, out);
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g);
  o.start(t);
  o.stop(t + dur + 0.05);
  return o;
}
function bellAt(c: AudioContext, t: number, f: number, vol: number, out: AudioNode, decay = 1.6) {
  // parciales inarmónicos de campana
  const partials: Array<[number, number]> = [[1, 1], [2.76, 0.45], [5.4, 0.25], [8.93, 0.12]];
  partials.forEach(([m, a]) => tone(c, t, f * m, decay / (m > 1 ? m * 0.6 : 1), vol * a, out));
}

/* ------------------------------ efectos ------------------------------ */
const sfx: Record<SfxName, (c: AudioContext, out: AudioNode, rate: number) => void> = {
  // Riffle: ráfaga de clics de ruido filtrado que se aceleran y acaban en un golpe sordo.
  shuffle(c, out, rate) {
    const t0 = c.currentTime + 0.01;
    const n = 22;
    let t = t0;
    for (let i = 0; i < n; i++) {
      const g = env(c, t, 0.25 + Math.random() * 0.2, 0.002, 0.03 + Math.random() * 0.02, out);
      const bp = filter(c, 'bandpass', (2500 + Math.random() * 3000) * rate, 1.2, g);
      noise(c, t, 0.06, bp);
      t += 0.045 - (i / n) * 0.025 + Math.random() * 0.012;
    }
    const g = env(c, t + 0.02, 0.35, 0.005, 0.12, out);
    noise(c, t + 0.02, 0.15, filter(c, 'lowpass', 900 * rate, 0.7, g));
  },
  // Giro de carta: barrido de filtro sobre ruido + golpecito suave.
  flip(c, out, rate) {
    const t = c.currentTime + 0.005;
    const g = env(c, t, 0.35, 0.04, 0.16, out);
    const bp = filter(c, 'bandpass', 1200 * rate, 0.9, g);
    bp.frequency.setValueAtTime(800 * rate, t);
    bp.frequency.exponentialRampToValueAtTime(4200 * rate, t + 0.18);
    noise(c, t, 0.22, bp);
    const g2 = env(c, t + 0.19, 0.3, 0.003, 0.06, out);
    noise(c, t + 0.19, 0.08, filter(c, 'lowpass', 700, 1, g2));
  },
  // Vela: chasquido de cerilla + soplo cálido + chisporroteos.
  candle(c, out, rate) {
    const t = c.currentTime + 0.005;
    const g0 = env(c, t, 0.5, 0.002, 0.05, out);
    noise(c, t, 0.06, filter(c, 'highpass', 2500, 0.8, g0));
    const g = env(c, t + 0.03, 0.3, 0.12, 0.7, out);
    const lp = filter(c, 'lowpass', 400, 0.6, g);
    lp.frequency.setValueAtTime(300 * rate, t);
    lp.frequency.exponentialRampToValueAtTime(1400 * rate, t + 0.35);
    noise(c, t + 0.03, 0.9, lp);
    for (let i = 0; i < 6; i++) {
      const tt = t + 0.25 + Math.random() * 0.8;
      const gg = env(c, tt, 0.12, 0.001, 0.02, out);
      noise(c, tt, 0.03, filter(c, 'bandpass', 3000 + Math.random() * 3000, 3, gg));
    }
  },
  bell(c, out, rate) {
    bellAt(c, c.currentTime + 0.005, 880 * rate, 0.3, out, 2.2);
  },
  // Carillón: arpegio pentatónico.
  chime(c, out, rate) {
    const notes = [1568, 1318.5, 1174.7, 1568, 1975.5];
    notes.forEach((f, i) => bellAt(c, c.currentTime + 0.01 + i * 0.11 + Math.random() * 0.02, f * rate, 0.16, out, 1.4));
  },
  // Sello: golpe grave con caída de tono + papel.
  stamp(c, out, rate) {
    const t = c.currentTime + 0.005;
    const g = env(c, t, 0.9, 0.003, 0.25, out);
    const o = c.createOscillator();
    o.frequency.setValueAtTime(160 * rate, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.2);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.3);
    const g2 = env(c, t, 0.5, 0.002, 0.12, out);
    noise(c, t, 0.15, filter(c, 'lowpass', 1800, 0.8, g2));
    const g3 = env(c, t + 0.02, 0.15, 0.01, 0.3, out);
    noise(c, t + 0.02, 0.35, filter(c, 'bandpass', 5000, 0.6, g3));
  },
  // Vaivén del péndulo: soplo suave que sube y baja.
  swing(c, out, rate) {
    const t = c.currentTime + 0.005;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.18);
    g.gain.linearRampToValueAtTime(0.0001, t + 0.45);
    g.connect(out);
    const bp = filter(c, 'bandpass', 500 * rate, 1.4, g);
    bp.frequency.setValueAtTime(380 * rate, t);
    bp.frequency.linearRampToValueAtTime(900 * rate, t + 0.2);
    bp.frequency.linearRampToValueAtTime(420 * rate, t + 0.45);
    noise(c, t, 0.5, bp);
  },
};

const lastPlayed: Partial<Record<SfxName, number>> = {};
export function playSfx(name: SfxName, opts: SfxOptions = {}): void {
  if (muted) return;
  const c = audio();
  if (!c || !master) return;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if ((lastPlayed[name] ?? -1e9) > now - 40) return; // antirrebote
  lastPlayed[name] = now;
  try {
    const g = c.createGain();
    g.gain.value = opts.volume ?? 1;
    g.connect(master);
    sfx[name](c, g, opts.rate ?? 1);
    setTimeout(() => g.disconnect(), 4000);
  } catch {
    /* audio no disponible: silencio */
  }
}

/* ------------------------------ ambiente («concentrarme») ------------------------------ */
let amb: { stop(): void } | null = null;
/** Dron grave + viento + campanillas lejanas, con fundido de entrada. */
export function startAmbient(): void {
  const c = audio();
  if (!c || !master || amb) return;
  const t = c.currentTime;
  const bus = c.createGain();
  bus.gain.setValueAtTime(0.0001, t);
  bus.gain.exponentialRampToValueAtTime(0.35, t + 2.5);
  bus.connect(master);
  const lp = filter(c, 'lowpass', 700, 0.8, bus);
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.07;
  lfoGain.gain.value = 350;
  lfo.connect(lfoGain).connect(lp.frequency);
  lfo.start();
  const oscs: OscillatorNode[] = [];
  [55, 82.4, 110.3, 164.8].forEach((f, i) => {
    const o = c.createOscillator();
    o.type = i % 2 ? 'triangle' : 'sawtooth';
    o.frequency.value = f;
    o.detune.value = (Math.random() - 0.5) * 14;
    const g = c.createGain();
    g.gain.value = i === 0 ? 0.22 : 0.09;
    o.connect(g).connect(lp);
    o.start();
    oscs.push(o);
  });
  const wind = c.createBufferSource();
  wind.buffer = noiseBuf;
  wind.loop = true;
  const wg = c.createGain();
  wg.gain.value = 0.12;
  wg.connect(bus);
  const wf = filter(c, 'bandpass', 450, 0.7, wg);
  wind.connect(wf);
  wind.start();
  const timer = setInterval(() => {
    if (!muted && Math.random() < 0.5) bellAt(c, c.currentTime, [659, 784, 988, 1175][Math.floor(Math.random() * 4)], 0.05, bus, 3);
  }, 4500);
  amb = {
    stop() {
      clearInterval(timer);
      const tt = c.currentTime;
      bus.gain.cancelScheduledValues(tt);
      bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0002), tt);
      bus.gain.exponentialRampToValueAtTime(0.0001, tt + 1.2);
      setTimeout(() => {
        [...oscs, lfo, wind].forEach((n) => {
          try {
            n.stop();
          } catch {
            /* ya parado */
          }
        });
        bus.disconnect();
      }, 1400);
    },
  };
}
export function stopAmbient(): void {
  amb?.stop();
  amb = null;
}
export function isAmbientPlaying(): boolean {
  return amb !== null;
}
