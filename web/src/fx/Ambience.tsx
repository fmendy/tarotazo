// Capa de ambiente en canvas 2D propio: humo, velas, estrellas o polvo.
// Partículas ligeras con sprites pre-renderizados; 30 fps en móvil, pausa con la pestaña oculta
// o fuera de pantalla, y un único fotograma estático con movimiento reducido.
import { useEffect, useRef, type CSSProperties, type JSX } from 'react';
import { isLowPowerDevice, useLatest, useReducedMotion } from './hooks';

export type AmbienceVariant = 'humo' | 'velas' | 'estrellas' | 'polvo';

export interface AmbienceProps {
  variant: AmbienceVariant;
  /** 0..2 (por defecto 1): densidad y brillo. */
  intensity?: number;
  /** 'fixed' (por defecto, cubre la ventana) o 'absolute' (cubre el padre posicionado). */
  position?: 'fixed' | 'absolute';
  /** z-index de la capa (por defecto -1: detrás del contenido en flujo). */
  zIndex?: number;
  className?: string;
  style?: CSSProperties;
}

interface Sys {
  update(dt: number, t: number): void;
  draw(c: CanvasRenderingContext2D, t: number): void;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function sprite(size: number, stops: Array<[number, string]>): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const c = cv.getContext('2d')!;
  const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  c.fillStyle = g;
  c.fillRect(0, 0, size, size);
  return cv;
}

function makeSmoke(W: number, H: number, k: number, low: boolean): Sys {
  const puff = sprite(128, [[0, 'rgba(200,180,230,0.55)'], [0.4, 'rgba(160,140,200,0.25)'], [1, 'rgba(120,100,170,0)']]);
  const n = Math.round((low ? 9 : 16) * k);
  const spawn = (initial: boolean) => ({
    x: rand(-0.1, 1.1) * W,
    y: initial ? rand(0.2, 1.1) * H : H + rand(50, 200),
    vy: -rand(8, 22),
    s: rand(140, 260) * (W < 700 ? 0.7 : 1),
    grow: rand(6, 14),
    a: 0,
    life: initial ? rand(0, 0.6) : 0,
    dur: rand(14, 26),
    ph: rand(0, 6.28),
    rot: rand(0, 6.28),
    vr: rand(-0.05, 0.05),
  });
  const ps = Array.from({ length: n }, () => spawn(true));
  return {
    update(dt, t) {
      ps.forEach((p, i) => {
        p.life += dt / p.dur;
        p.y += p.vy * dt;
        p.x += Math.sin(t * 0.2 + p.ph) * 6 * dt;
        p.s += p.grow * dt;
        p.rot += p.vr * dt;
        p.a = Math.sin(Math.min(1, p.life) * Math.PI) * 0.6 * Math.min(1.4, k);
        if (p.life >= 1) ps[i] = spawn(false);
      });
    },
    draw(c) {
      ps.forEach((p) => {
        c.globalAlpha = p.a;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.drawImage(puff, -p.s / 2, -p.s / 2, p.s, p.s * 0.8);
        c.restore();
      });
      c.globalAlpha = 1;
    },
  };
}

function makeCandles(W: number, H: number, k: number, low: boolean): Sys {
  const glow = sprite(256, [[0, 'rgba(255,190,90,0.55)'], [0.25, 'rgba(255,150,60,0.22)'], [1, 'rgba(255,120,40,0)']]);
  const ember = sprite(16, [[0, 'rgba(255,220,150,1)'], [1, 'rgba(255,140,40,0)']]);
  const small = W < 700;
  const xs = small ? [0.1, 0.9] : [0.06, 0.15, 0.85, 0.94];
  const candles = xs.map((fx, i) => ({
    x: fx * W,
    h: (small ? 0.09 : 0.13) * H * (i % 2 ? 0.8 : 1),
    w: Math.max(14, Math.min(28, W * 0.02)),
    ph: rand(0, 10),
    f: 1,
  }));
  const embers: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = [];
  const maxEmbers = Math.round((low ? 8 : 18) * k);
  return {
    update(dt, t) {
      candles.forEach((cd) => {
        // parpadeo: suma de senos + saltos ocasionales
        cd.f = 0.82 + 0.1 * Math.sin(t * 9 + cd.ph) + 0.06 * Math.sin(t * 23.7 + cd.ph * 2) + (Math.random() < 0.02 ? -0.15 : 0);
        if (embers.length < maxEmbers && Math.random() < 1.6 * dt * k) {
          embers.push({ x: cd.x + rand(-3, 3), y: H - cd.h - cd.w * 1.6, vx: rand(-6, 6), vy: -rand(20, 45), life: 1 });
        }
      });
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.life -= dt * 0.45;
        e.x += (e.vx + Math.sin(t * 3 + i) * 8) * dt;
        e.y += e.vy * dt;
        if (e.life <= 0) embers.splice(i, 1);
      }
    },
    draw(c, t) {
      c.globalCompositeOperation = 'lighter';
      candles.forEach((cd) => {
        const fy = H - cd.h - cd.w * 0.9;
        const gs = (small ? 260 : 420) * cd.f * Math.min(1.5, 0.6 + 0.4 * k);
        c.globalAlpha = 0.75 * cd.f;
        c.drawImage(glow, cd.x - gs / 2, fy - gs / 2, gs, gs);
      });
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
      candles.forEach((cd) => {
        const top = H - cd.h;
        // cuerpo
        const g = c.createLinearGradient(cd.x - cd.w / 2, 0, cd.x + cd.w / 2, 0);
        g.addColorStop(0, '#b9a07c');
        g.addColorStop(0.4, '#f6ead2');
        g.addColorStop(1, '#8f7656');
        c.fillStyle = g;
        c.beginPath();
        c.roundRect?.(cd.x - cd.w / 2, top, cd.w, cd.h + 4, [cd.w * 0.2, cd.w * 0.2, 0, 0]);
        if (!c.roundRect) c.rect(cd.x - cd.w / 2, top, cd.w, cd.h + 4);
        c.fill();
        // mecha
        c.strokeStyle = '#2a1a10';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(cd.x, top);
        c.lineTo(cd.x, top - cd.w * 0.3);
        c.stroke();
        // llama
        const fh = cd.w * 1.5 * cd.f;
        const sway = Math.sin(t * 4 + cd.ph) * cd.w * 0.12;
        const fy = top - cd.w * 0.25;
        const fg = c.createLinearGradient(0, fy - fh, 0, fy);
        fg.addColorStop(0, 'rgba(255,240,180,0)');
        fg.addColorStop(0.3, 'rgba(255,220,120,0.95)');
        fg.addColorStop(0.8, 'rgba(255,150,50,0.95)');
        fg.addColorStop(1, 'rgba(120,120,255,0.7)');
        c.fillStyle = fg;
        c.beginPath();
        c.moveTo(cd.x + sway, fy - fh);
        c.quadraticCurveTo(cd.x + cd.w * 0.38, fy - fh * 0.3, cd.x, fy);
        c.quadraticCurveTo(cd.x - cd.w * 0.38, fy - fh * 0.3, cd.x + sway, fy - fh);
        c.fill();
      });
      c.globalCompositeOperation = 'lighter';
      embers.forEach((e) => {
        c.globalAlpha = Math.max(0, e.life);
        c.drawImage(ember, e.x - 4, e.y - 4, 8, 8);
      });
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    },
  };
}

function makeStars(W: number, H: number, k: number, low: boolean): Sys {
  const n = Math.round(Math.min(220, (W * H) / (low ? 9000 : 5500)) * k);
  const stars = Array.from({ length: n }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() < 0.08 ? rand(1.4, 2.2) : rand(0.4, 1.2),
    ph: rand(0, 6.28),
    sp: rand(0.6, 2.4),
    hue: Math.random() < 0.15 ? '255,220,170' : Math.random() < 0.2 ? '200,210,255' : '255,250,240',
  }));
  const glint = sprite(32, [[0, 'rgba(255,255,255,0.9)'], [0.2, 'rgba(255,240,220,0.35)'], [1, 'rgba(255,255,255,0)']]);
  let shoot: { x: number; y: number; vx: number; vy: number; life: number } | null = null;
  let next = rand(3, 7);
  return {
    update(dt) {
      next -= dt;
      if (!shoot && next <= 0) {
        shoot = { x: rand(0.1, 0.8) * W, y: rand(0, 0.4) * H, vx: rand(350, 600), vy: rand(120, 260), life: 1 };
        next = rand(5, 11);
      }
      if (shoot) {
        shoot.x += shoot.vx * dt;
        shoot.y += shoot.vy * dt;
        shoot.life -= dt * 1.3;
        if (shoot.life <= 0) shoot = null;
      }
    },
    draw(c, t) {
      for (const s of stars) {
        const tw = 0.55 + 0.45 * Math.sin(t * s.sp + s.ph);
        c.fillStyle = `rgba(${s.hue},${(tw * Math.min(1, 0.6 + 0.4 * k)).toFixed(3)})`;
        if (s.r > 1.3) {
          c.globalAlpha = tw;
          c.drawImage(glint, s.x - s.r * 5, s.y - s.r * 5, s.r * 10, s.r * 10);
          c.globalAlpha = 1;
        } else {
          c.fillRect(s.x - s.r / 2, s.y - s.r / 2, s.r, s.r);
        }
      }
      if (shoot) {
        const len = 120;
        const nx = shoot.vx / Math.hypot(shoot.vx, shoot.vy);
        const ny = shoot.vy / Math.hypot(shoot.vx, shoot.vy);
        const g = c.createLinearGradient(shoot.x, shoot.y, shoot.x - nx * len, shoot.y - ny * len);
        g.addColorStop(0, `rgba(255,250,230,${Math.max(0, shoot.life).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255,250,230,0)');
        c.strokeStyle = g;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(shoot.x, shoot.y);
        c.lineTo(shoot.x - nx * len, shoot.y - ny * len);
        c.stroke();
      }
    },
  };
}

function makeDust(W: number, H: number, k: number, low: boolean): Sys {
  const mote = sprite(16, [[0, 'rgba(255,240,200,1)'], [0.4, 'rgba(255,230,180,0.4)'], [1, 'rgba(255,220,160,0)']]);
  const n = Math.round((low ? 35 : 70) * k);
  // haz de luz diagonal desde arriba a la izquierda
  const beam = { x0: W * 0.15, x1: W * 0.5, x2: W * 0.95, x3: W * 0.45 };
  const ps = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, s: rand(2, 6), ph: rand(0, 6.28) }));
  const inBeam = (x: number, y: number) => {
    const f = y / H;
    const a = beam.x0 + (beam.x3 - beam.x0) * f;
    const b = beam.x1 + (beam.x2 - beam.x1) * f;
    return x > a && x < b ? 1 - Math.abs((x - (a + b) / 2) / ((b - a) / 2)) : 0;
  };
  return {
    update(dt, t) {
      ps.forEach((p) => {
        p.vx += (Math.random() - 0.5) * 18 * dt + Math.sin(t * 0.3 + p.ph) * 2 * dt;
        p.vy += (Math.random() - 0.5) * 18 * dt + 1.5 * dt;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx * dt * 6;
        p.y += p.vy * dt * 6;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
      });
    },
    draw(c, t) {
      const g = c.createLinearGradient(0, 0, W * 0.3, H);
      g.addColorStop(0, `rgba(255,230,180,${(0.09 * k).toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,230,180,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(beam.x0, 0);
      c.lineTo(beam.x1, 0);
      c.lineTo(beam.x2, H);
      c.lineTo(beam.x3, H);
      c.closePath();
      c.fill();
      c.globalCompositeOperation = 'lighter';
      ps.forEach((p) => {
        const b = inBeam(p.x, p.y);
        c.globalAlpha = Math.min(1, (0.12 + b * 0.85) * (0.7 + 0.3 * Math.sin(t * 2 + p.ph)) * Math.min(1.3, k));
        c.drawImage(mote, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      });
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    },
  };
}

const FACTORIES: Record<AmbienceVariant, (W: number, H: number, k: number, low: boolean) => Sys> = {
  humo: makeSmoke,
  velas: makeCandles,
  estrellas: makeStars,
  polvo: makeDust,
};

export function Ambience(p: AmbienceProps): JSX.Element {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLCanvasElement>(null);
  const k = Math.max(0, Math.min(2, p.intensity ?? 1));
  const kRef = useLatest(k);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const c = cv.getContext('2d');
    if (!c) return;
    const low = isLowPowerDevice();
    const frameMs = low ? 1000 / 30 : 1000 / 60;
    let sys: Sys | null = null;
    let W = 0;
    let H = 0;
    let raf = 0;
    let last = 0;
    let acc = 0;
    let running = false;
    let onScreen = true;
    const t0 = performance.now();

    const build = () => {
      const r = cv.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      // DPR 1: el ambiente es suave, no necesita retina (ahorra fill-rate en móvil).
      cv.width = W;
      cv.height = H;
      sys = FACTORIES[p.variant](W, H, kRef.current, low);
      if (reduced) {
        // fotograma estático
        sys.update(0.016, 3);
        c.clearRect(0, 0, W, H);
        sys.draw(c, 3);
      }
    };
    build();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!last) last = now;
      acc += now - last;
      last = now;
      if (acc < frameMs - 1) return;
      const dt = Math.min(acc, 100) / 1000;
      acc = 0;
      const t = (now - t0) / 1000;
      sys!.update(dt, t);
      c.clearRect(0, 0, W, H);
      sys!.draw(c, t);
    };
    const start = () => {
      if (running || reduced || document.hidden || !onScreen) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    let ro: ResizeObserver | null = null;
    let rt = 0;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        clearTimeout(rt);
        rt = window.setTimeout(build, 120);
      });
      ro.observe(cv);
    }
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([e]) => {
        onScreen = e.isIntersecting;
        if (onScreen) start(); else stop();
      });
      io.observe(cv);
    }
    start();
    return () => {
      stop();
      clearTimeout(rt);
      document.removeEventListener('visibilitychange', onVis);
      ro?.disconnect();
      io?.disconnect();
    };
  }, [p.variant, reduced, k]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      aria-hidden
      className={['fx-ambience', p.className].filter(Boolean).join(' ')}
      style={{ position: p.position ?? 'fixed', zIndex: p.zIndex ?? -1, ...p.style }}
    >
      <canvas ref={ref} />
    </div>
  );
}
