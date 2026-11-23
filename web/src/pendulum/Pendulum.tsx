// Péndulo interactivo en canvas 2D: física de physics.ts + dibujo en proyección oblicua
// (el tablero se ve de frente; la altura sobre el tablero desplaza hacia arriba en pantalla).
//
// Rendimiento: todo lo que tiene degradado (sombras, halos, reflejos, mano, guías) se
// pre-renderiza en sprites cacheados; por fotograma sólo hay drawImage y unas pocas líneas.
// El bucle se DUERME cuando el péndulo está quieto (calmado y sin mano) y se despierta al
// tocarlo, al cambiar objetivo/enfado/medianoche/modo o con un cambio de inclinación apreciable.
import { useEffect, useMemo, useRef, useState, type CSSProperties, type JSX, type ReactNode } from 'react';
import { PendulumSim, boardToWorld, type SimTarget } from './physics';
import { getLook, makeBobSprite } from './models';
import { useImageAvailable, useLatest, useReducedMotion, isLowPowerDevice, clamp } from '../fx/hooks';
import { playSfx } from '../fx/sound';

export type PendulumTarget =
  | { kind: 'axis'; axis: 'vertical' | 'horizontal' }
  | { kind: 'circle' }
  | { kind: 'point'; x: number; y: number }; // coords normalizadas 0..1 sobre el tablero

export type PendulumMode = 'sino' | 'tablero' | 'porcentaje' | 'ouija' | 'mapa' | 'opciones' | 'chakras';

export interface PendulumProps {
  model: string;
  mode: PendulumMode;
  target: PendulumTarget | null;
  yesAxis: 'vertical' | 'horizontal';
  onSettled?(): void;
  angry?: boolean;
  midnight?: boolean;
  board?: ReactNode;
  /** Inclinación del móvil (giroscopio), normalizada −1..1 en cada eje (≈ ±30°). x → derecha, y → hacia el usuario. */
  tilt?: { x: number; y: number };
  /** Se llama al sujetar (true) y soltar (false) la cadena. */
  onGrab?(grabbing: boolean): void;
  /** Sonido de vaivén (por defecto true). */
  sound?: boolean;
  /**
   * Segundos que sigue oscilando tras asentarse antes de calmarse y quedarse quieto (y dormir el
   * bucle de dibujo). Por defecto 12. `null` = no se calma nunca (gasta batería).
   */
  restAfter?: number | null;
  className?: string;
  style?: CSSProperties;
}

// Geometría (metros del mundo; L = 1).
const ASPECT = 1.3; // alto/ancho del componente
const BOARD_TOP = ASPECT - 1; // el tablero es el cuadrado inferior
const BOARD_HALF = 0.5; // medio lado del tablero (m)
const PIVOT_H = 1.2; // altura del pivote sobre el tablero (m)
const K = 0.6; // factor oblicuo: 1 m de altura = K·W px hacia arriba
const TILT_WAKE = 0.05; // cambio de inclinación que despierta al péndulo dormido

function toSimTarget(t: PendulumTarget | null): SimTarget | null {
  if (!t) return null;
  if (t.kind === 'axis') return { kind: 'axis', axis: t.axis === 'vertical' ? 'y' : 'x' };
  if (t.kind === 'circle') return { kind: 'circle' };
  const w = boardToWorld(clamp(t.x, 0, 1), clamp(t.y, 0, 1), BOARD_HALF);
  const r = Math.hypot(w.x, w.y);
  const max = 0.62;
  return r > max ? { kind: 'point', x: (w.x / r) * max, y: (w.y / r) * max } : { kind: 'point', ...w };
}

function describe(name: string, t: PendulumTarget | null, angry?: boolean): string {
  if (angry) return `Péndulo de ${name}: se ha enfadado y se enrolla en la cadena`;
  if (!t) return `Péndulo de ${name} en reposo. Puedes sujetar la cadena y moverla.`;
  if (t.kind === 'axis') return `Péndulo de ${name}: oscila en ${t.axis === 'vertical' ? 'vertical' : 'horizontal'}`;
  if (t.kind === 'circle') return `Péndulo de ${name}: gira en círculos`;
  return `Péndulo de ${name}: señala un punto del tablero`;
}

/* ------------------------------ sprites cacheados ------------------------------ */
const spriteCache = new Map<string, HTMLCanvasElement>();
/** Mancha radial de `color` (alfa 1 en el centro → 0 en el borde); la intensidad se da con globalAlpha. */
function radial(color: string, px: number, inner = 0): HTMLCanvasElement {
  const size = Math.max(8, Math.min(512, Math.round(px)));
  const key = `r|${color}|${size}|${inner}`;
  let cv = spriteCache.get(key);
  if (cv) return cv;
  cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const c = cv.getContext('2d');
  if (c) {
    const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, hexA(color, 1));
    if (inner > 0) g.addColorStop(inner, hexA(color, 0.6));
    g.addColorStop(1, hexA(color, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, size, size);
  }
  if (spriteCache.size > 64) spriteCache.clear();
  spriteCache.set(key, cv);
  return cv;
}

function handSprite(W: number, dpr: number, active: boolean): { cv: HTMLCanvasElement; half: number } {
  const s = W * 0.045;
  const half = Math.ceil(s * 1.8);
  const key = `h|${Math.round(W)}|${dpr}|${active}`;
  let cv = spriteCache.get(key);
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = cv.height = Math.ceil(half * 2 * dpr);
    const c = cv.getContext('2d');
    if (c) {
      c.scale(dpr, dpr);
      drawHand(c, half, half, W, active);
    }
    spriteCache.set(key, cv);
  }
  return { cv, half };
}

export function Pendulum(p: PendulumProps): JSX.Element {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [W, setW] = useState(0);
  const props = useLatest(p);
  const look = getLook(p.model);
  const sim = useMemo(() => new PendulumSim(), []);
  const targetKey = JSON.stringify(p.target);
  const grab = useRef({ active: false, sx: 0, sy: 0, px: 0, py: 0, gx: 0, gy: 0 });
  const [grabbing, setGrabbing] = useState(false);
  const wakeRef = useRef<() => void>(() => {});
  const tiltAtSleep = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Imagen del modelo (si existe).
  const imgSrc = `/art/pendulums/${look.id}.svg`;
  const imgOk = useImageAvailable(imgSrc);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!imgOk) { setImg(null); return; }
    const im = new Image();
    im.onload = () => setImg(im);
    im.src = imgSrc;
  }, [imgOk, imgSrc]);

  // Tamaño.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const m = () => setW(Math.round(el.getBoundingClientRect().width));
    m();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  sim.restAfter = p.restAfter === undefined ? 12 : p.restAfter;

  // Objetivo, enfado y cambios visuales: despiertan al péndulo.
  useEffect(() => {
    sim.setTarget(toSimTarget(p.target));
    wakeRef.current();
  }, [targetKey, sim]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    sim.setAngry(!!p.angry);
    wakeRef.current();
  }, [p.angry, sim]);
  useEffect(() => {
    wakeRef.current();
  }, [p.midnight, p.mode, p.yesAxis, !!p.board]);
  // Inclinación: sólo despierta si cambia de forma apreciable.
  const tx = p.tilt?.x ?? 0;
  const ty = p.tilt?.y ?? 0;
  useEffect(() => {
    if (Math.hypot(tx - tiltAtSleep.current.x, ty - tiltAtSleep.current.y) > TILT_WAKE) wakeRef.current();
  }, [tx, ty]);

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, isLowPowerDevice() ? 1.5 : 2) : 1;
  const bobSize = (PIVOT_H - 1) * K * W;
  const sprite = useMemo(() => {
    if (!W || typeof document === 'undefined') return null;
    return makeBobSprite(look, bobSize, dpr, img);
  }, [look, W, dpr, img]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bucle principal (o dibujo estático con movimiento reducido).
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !W || !sprite) return;
    const H = W * ASPECT;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    const c = cv.getContext('2d');
    if (!c) return;

    let raf = 0;
    let last = 0;
    let travel = 0;
    let running = false;
    let visible = true;
    let restFor = 0;
    const t0 = performance.now();
    const bx = (x: number) => W / 2 + x * W;
    const by = (y: number, h: number) => (BOARD_TOP + 0.5) * W + y * W - h * K * W;

    // Capa estática de guías (se regenera sólo si cambian modo / eje / tablero).
    let guides: HTMLCanvasElement | null = null;
    let guidesKey = '';
    const getGuides = () => {
      const P = props.current;
      const key = `${!P.board && P.mode === 'sino'}|${P.yesAxis}`;
      if (key === guidesKey) return guides;
      guidesKey = key;
      if (P.board || P.mode !== 'sino') return (guides = null);
      const g = document.createElement('canvas');
      g.width = cv.width;
      g.height = cv.height;
      const gc = g.getContext('2d');
      if (gc) {
        gc.scale(dpr, dpr);
        const cx = bx(0);
        const cy = by(0, 0);
        const len = W * 0.42;
        gc.lineWidth = 2;
        gc.setLineDash([6, 8]);
        (['vertical', 'horizontal'] as const).forEach((axis) => {
          gc.strokeStyle = axis === P.yesAxis ? 'rgba(212,162,76,0.45)' : 'rgba(244,233,216,0.18)';
          gc.beginPath();
          if (axis === 'vertical') { gc.moveTo(cx, cy - len); gc.lineTo(cx, cy + len); } else { gc.moveTo(cx - len, cy); gc.lineTo(cx + len, cy); }
          gc.stroke();
        });
      }
      return (guides = g);
    };

    // Sprites de este tamaño.
    const shadowSpr = radial('#000000', 64);
    const specSpr = radial('#ffffff', bobSize * 0.44 * dpr);
    const s = bobSize;

    const draw = (now: number, staticPose = false) => {
      const P = props.current;
      const time = (now - t0) / 1000;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, cv.width, cv.height);
      const gl = getGuides();
      if (gl) c.drawImage(gl, 0, 0);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);

      const piv = sim.pivot;
      const pivH = PIVOT_H - piv.z;
      const bob = sim.p;
      const h = PIVOT_H - bob.z;
      const px = bx(piv.x);
      const py = by(piv.y, pivH);
      const ax = bx(bob.x);
      const ay = by(bob.y, h);

      // Indicaciones estáticas (movimiento reducido).
      const T = sim.target;
      if (staticPose && T && !P.angry) drawStaticHint(c, T, bx(0), by(0, 0), sim.params.axisAmplitude * W, sim.params.circleRadius * W);

      // Sombra de la cadena y de la lenteja (luz cenital ligeramente desplazada).
      const sbx = bx(bob.x + 0.07 * h);
      const sby = by(bob.y + 0.05 * h, 0);
      c.strokeStyle = 'rgba(0,0,0,0.22)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(bx(piv.x + 0.07 * pivH), by(piv.y + 0.05 * pivH, 0));
      c.lineTo(sbx, sby);
      c.stroke();
      const shR = (0.035 + 0.06 * h) * W;
      c.globalAlpha = clamp(0.5 - 0.45 * h, 0.12, 0.45);
      c.drawImage(shadowSpr, sbx - shR, sby - shR * 0.75, shR * 2, shR * 1.5);

      // Punto luminoso que «señala» sobre el tablero.
      const glowMul = P.midnight ? 1.8 : 1;
      const pr = W * 0.05 * glowMul;
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.min(1, 0.35 * glowMul);
      c.drawImage(radial(look.glow, 64), bx(bob.x) - pr, by(bob.y, 0) - pr, pr * 2, pr * 2);
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;

      // Cadena.
      const dx = ax - px;
      const dy = ay - py;
      const dl = Math.hypot(dx, dy) || 1;
      drawChain(c, look.chain, px, py, ax, ay, W);
      if (sim.wind > 0.3) {
        const n = Math.round(sim.wind * 2);
        const nx = -dy / dl;
        const ny = dx / dl;
        c.strokeStyle = look.chain === 'gold' ? '#e8c46a' : look.chain === 'silver' ? '#d9dbe4' : '#cdb48a';
        c.lineWidth = 2;
        c.beginPath();
        for (let i = 0; i <= n; i++) {
          const f = (i / n) * Math.min(0.85, 0.25 + sim.wind * 0.07);
          const off = (i % 2 ? 1 : -1) * W * 0.018;
          const x = px + dx * f + nx * off;
          const y = py + dy * f + ny * off;
          if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      }

      // Lenteja: halo + sprite rotado + brillo especular dinámico.
      const v = sim.velocity();
      c.save();
      c.translate(ax, ay);
      c.rotate(Math.atan2(-dx, dy));
      const flick = 0.85 + 0.15 * Math.sin(time * 7.3) * Math.sin(time * 3.1);
      const gStr = (P.angry ? 0.8 : look.glowStrength) * glowMul * flick;
      const gr = s * (P.midnight ? 1.6 : 1.05);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.min(1, 0.55 * gStr);
      c.drawImage(radial(P.angry ? '#ff3b2f' : look.glow, 128), -gr, s * 0.5 - gr, gr * 2, gr * 2);
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
      if (P.angry) c.translate(Math.sin(time * 60) * 1.2, 0);
      c.drawImage(sprite.canvas, -sprite.ox, -sprite.oy, sprite.w, sprite.h);
      // reflejo: se desliza según la velocidad (como si la luz corriese por el material)
      const hx = clamp(-v.x * 0.25, -0.5, 0.5) * s * 0.35;
      const hy = s * (0.35 + clamp(v.y * 0.05, -0.1, 0.1));
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.min(1, 0.55 * look.specular * (P.midnight ? 1 : 0.75));
      c.drawImage(specSpr, hx - s * 0.22, hy - s * 0.22, s * 0.44, s * 0.44);
      if (P.midnight) {
        c.fillStyle = look.glow;
        for (let i = 0; i < 5; i++) {
          const a = time * 1.3 + i * 1.256;
          const rr = s * (0.6 + 0.15 * Math.sin(time * 2 + i));
          const tw = 0.5 + 0.5 * Math.sin(time * 5 + i * 2);
          const d = 3 + tw * 3;
          c.globalAlpha = 0.8 * tw;
          c.fillRect(Math.cos(a) * rr - d / 2, s * 0.5 + Math.sin(a) * rr - d / 2, d, d);
        }
      }
      c.restore();
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;

      // Mano (dedos que pinzan la cadena).
      const hs = handSprite(W, dpr, grab.current.active);
      c.drawImage(hs.cv, px - hs.half, py - hs.half, hs.half * 2, hs.half * 2);
    };

    const staticDraw = () => {
      // Pose final sin física.
      const T = sim.target;
      if (props.current.angry) {
        sim.length = sim.params.length * 0.4;
        sim.wind = 5.4;
      } else {
        sim.length = sim.params.length;
        sim.wind = 0;
      }
      let x = 0;
      let y = 0;
      if (T && T.kind === 'point') { x = T.x; y = T.y; }
      const z = Math.sqrt(Math.max(sim.length * sim.length - x * x - y * y, 0.01));
      sim.pivot = { x: 0, y: 0, z: 0 };
      sim.p = { x, y, z };
      sim.prev = { ...sim.p };
      draw(performance.now(), true);
    };

    if (reduced) {
      let timer = 0;
      let lastKey = '';
      const show = () => {
        staticDraw();
        const key = `${JSON.stringify(props.current.target)}|${!!props.current.angry}`;
        if (key === lastKey) return;
        lastKey = key;
        clearTimeout(timer);
        if (props.current.target || props.current.angry) timer = window.setTimeout(() => props.current.onSettled?.(), 700);
      };
      wakeRef.current = show;
      show();
      return () => {
        clearTimeout(timer);
        wakeRef.current = () => {};
      };
    }

    const frame = (now: number) => {
      const dt = last ? (now - last) / 1000 : 1 / 60;
      last = now;
      const P = props.current;
      // Mano: sigue al puntero si se sujeta; si no, vuelve suavemente al centro.
      const g = grab.current;
      sim.handActive = g.active;
      const gx = g.active ? g.gx : 0;
      const gy = g.active ? g.gy : 0;
      const k = Math.min(1, (g.active ? 25 : 2.5) * dt);
      let nx = sim.pivot.x + (gx - sim.pivot.x) * k;
      let ny = sim.pivot.y + (gy - sim.pivot.y) * k;
      if (!g.active && Math.hypot(nx, ny) < 1e-4) { nx = 0; ny = 0; }
      sim.setPivot(nx, ny);
      const tilt = P.tilt;
      sim.extra.x = tilt ? clamp(tilt.x, -1, 1) * sim.params.gravity * 0.3 : 0;
      sim.extra.y = tilt ? clamp(tilt.y, -1, 1) * sim.params.gravity * 0.3 : 0;
      const bx0 = sim.p.x;
      const by0 = sim.p.y;
      sim.advance(dt);
      if (sim.consumeSettled()) P.onSettled?.();
      // vaivén audible
      const moved = Math.hypot(sim.p.x - bx0, sim.p.y - by0);
      const speed = moved / Math.max(dt, 1e-3);
      travel += moved;
      if (P.sound !== false && travel > 0.55 && speed > 0.45) {
        travel = 0;
        playSfx('swing', { volume: clamp(speed / 1.6, 0.15, 0.9), rate: look.swingRate });
      } else if (speed < 0.2) travel = 0;
      draw(now);
      // ¿Dormir? Quieto durante medio segundo → no se pide otro fotograma.
      restFor = sim.isAtRest() ? restFor + dt : 0;
      if (restFor > 0.5) {
        running = false;
        tiltAtSleep.current = { x: P.tilt?.x ?? 0, y: P.tilt?.y ?? 0 };
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      restFor = 0;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    wakeRef.current = start;
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) start(); else stop();
      });
      io.observe(cv);
    }
    start();
    return () => {
      stop();
      wakeRef.current = () => {};
      document.removeEventListener('visibilitychange', onVis);
      io?.disconnect();
    };
  }, [W, dpr, sprite, reduced, sim, look, props, bobSize]);

  // Sujetar la cadena con ratón / dedo.
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (reduced || !W) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    grab.current = { active: true, sx: e.clientX, sy: e.clientY, px: sim.pivot.x, py: sim.pivot.y, gx: sim.pivot.x, gy: sim.pivot.y };
    sim.handActive = true;
    setGrabbing(true);
    wakeRef.current();
    props.current.onGrab?.(true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = grab.current;
    if (!g.active || !W) return;
    g.gx = clamp(g.px + (e.clientX - g.sx) / W, -0.35, 0.35);
    g.gy = clamp(g.py + (e.clientY - g.sy) / W, -0.05, 0.3);
  };
  const release = () => {
    if (!grab.current.active) return;
    grab.current.active = false;
    setGrabbing(false);
    wakeRef.current();
    props.current.onGrab?.(false);
  };

  return (
    <div
      ref={wrapRef}
      className={['pend', p.className].filter(Boolean).join(' ')}
      style={{ position: 'relative', width: '100%', aspectRatio: `1 / ${ASPECT}`, userSelect: 'none', ...p.style }}
    >
      {p.board != null && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${(1 / ASPECT) * 100}%` }}>{p.board}</div>
      )}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={describe(look.name, p.target, p.angry)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: reduced ? 'default' : grabbing ? 'grabbing' : 'grab' }}
      />
    </div>
  );
}

/* ------------------------------ dibujo auxiliar ------------------------------ */
function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a, 0, 1).toFixed(3)})`;
}

function drawStaticHint(c: CanvasRenderingContext2D, T: SimTarget, cx: number, cy: number, A: number, R: number) {
  c.strokeStyle = 'rgba(212,162,76,0.85)';
  c.fillStyle = 'rgba(212,162,76,0.85)';
  c.lineWidth = 3;
  const arrow = (x: number, y: number, ang: number) => {
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - 12 * Math.cos(ang - 0.45), y - 12 * Math.sin(ang - 0.45));
    c.lineTo(x - 12 * Math.cos(ang + 0.45), y - 12 * Math.sin(ang + 0.45));
    c.closePath();
    c.fill();
  };
  if (T.kind === 'axis') {
    const v = T.axis === 'y';
    c.beginPath();
    if (v) { c.moveTo(cx, cy - A); c.lineTo(cx, cy + A); } else { c.moveTo(cx - A, cy); c.lineTo(cx + A, cy); }
    c.stroke();
    if (v) { arrow(cx, cy - A, -Math.PI / 2); arrow(cx, cy + A, Math.PI / 2); } else { arrow(cx - A, cy, Math.PI); arrow(cx + A, cy, 0); }
  } else if (T.kind === 'circle') {
    c.beginPath();
    c.arc(cx, cy, R, 0.3, Math.PI * 2 - 0.1);
    c.stroke();
    arrow(cx + R * Math.cos(-0.1), cy + R * Math.sin(-0.1), Math.PI / 2 - 0.1);
  }
}

function drawChain(c: CanvasRenderingContext2D, kind: 'silver' | 'gold' | 'cord' | 'string', x0: number, y0: number, x1: number, y1: number, W: number) {
  c.lineCap = 'round';
  if (kind === 'silver' || kind === 'gold') {
    const [dark, light] = kind === 'gold' ? ['#7a5a17', '#f3d27a'] : ['#5d6070', '#eef0f6'];
    c.strokeStyle = dark;
    c.lineWidth = Math.max(2, W * 0.006);
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
    // eslabones
    c.strokeStyle = light;
    c.lineWidth = Math.max(1.2, W * 0.0035);
    c.setLineDash([Math.max(3, W * 0.009), Math.max(2, W * 0.006)]);
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
    c.setLineDash([]);
  } else {
    c.strokeStyle = kind === 'cord' ? '#6b4a2a' : '#e9dcc0';
    c.lineWidth = Math.max(1.5, W * (kind === 'cord' ? 0.006 : 0.004));
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
  }
}

function drawHand(c: CanvasRenderingContext2D, x: number, y: number, W: number, active: boolean) {
  const s = W * 0.045;
  c.save();
  c.translate(x, y);
  if (active) {
    c.strokeStyle = 'rgba(212,162,76,0.7)';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, 0, s * 1.6, 0, Math.PI * 2);
    c.stroke();
  }
  c.fillStyle = '#e2b08c';
  c.strokeStyle = 'rgba(80,40,20,0.5)';
  c.lineWidth = 1;
  // pulgar e índice
  c.beginPath();
  c.ellipse(-s * 0.55, -s * 0.35, s * 0.55, s * 0.95, 0.5, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.beginPath();
  c.ellipse(s * 0.55, -s * 0.35, s * 0.55, s * 0.95, -0.5, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = 'rgba(255,240,230,0.6)';
  c.beginPath();
  c.ellipse(-s * 0.35, -s * 0.1, s * 0.22, s * 0.3, 0.5, 0, Math.PI * 2);
  c.ellipse(s * 0.35, -s * 0.1, s * 0.22, s * 0.3, -0.5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
