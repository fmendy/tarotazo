// Péndulo interactivo en canvas 2D: física de physics.ts + dibujo en proyección oblicua
// (el tablero se ve de frente; la altura sobre el tablero desplaza hacia arriba en pantalla).
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
  className?: string;
  style?: CSSProperties;
}

// Geometría (metros del mundo; L = 1).
const ASPECT = 1.3; // alto/ancho del componente
const BOARD_TOP = ASPECT - 1; // el tablero es el cuadrado inferior
const BOARD_HALF = 0.5; // medio lado del tablero (m)
const PIVOT_H = 1.2; // altura del pivote sobre el tablero (m)
const K = 0.6; // factor oblicuo: 1 m de altura = K·W px hacia arriba

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

  // Objetivo y enfado.
  useEffect(() => {
    sim.setTarget(toSimTarget(p.target));
  }, [targetKey, sim]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    sim.setAngry(!!p.angry);
  }, [p.angry, sim]);

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, isLowPowerDevice() ? 1.5 : 2) : 1;
  const sprite = useMemo(() => {
    if (!W || typeof document === 'undefined') return null;
    return makeBobSprite(look, (PIVOT_H - 1) * K * W, dpr, img);
  }, [look, W, dpr, img]);

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
    let t0 = performance.now();

    const draw = (now: number, staticPose = false) => {
      const P = props.current;
      const time = (now - t0) / 1000;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      const bx = (x: number) => W / 2 + x * W;
      const by = (y: number, h: number) => (BOARD_TOP + 0.5) * W + y * W - h * K * W;

      const piv = sim.pivot;
      const pivH = PIVOT_H - piv.z;
      const bob = sim.p;
      const h = PIVOT_H - bob.z;
      const px = bx(piv.x);
      const py = by(piv.y, pivH);
      const ax = bx(bob.x);
      const ay = by(bob.y, h);

      // Guías del modo sí/no (cuando no hay tablero).
      if (!P.board && P.mode === 'sino') {
        const cx = bx(0);
        const cy = by(0, 0);
        const len = W * 0.42;
        c.lineWidth = 2;
        c.setLineDash([6, 8]);
        (['vertical', 'horizontal'] as const).forEach((axis) => {
          c.strokeStyle = axis === P.yesAxis ? 'rgba(212,162,76,0.45)' : 'rgba(244,233,216,0.18)';
          c.beginPath();
          if (axis === 'vertical') { c.moveTo(cx, cy - len); c.lineTo(cx, cy + len); } else { c.moveTo(cx - len, cy); c.lineTo(cx + len, cy); }
          c.stroke();
        });
        c.setLineDash([]);
      }

      // Indicaciones estáticas (movimiento reducido).
      const T = P.target;
      if (staticPose && T && !P.angry) {
        c.strokeStyle = 'rgba(212,162,76,0.85)';
        c.fillStyle = 'rgba(212,162,76,0.85)';
        c.lineWidth = 3;
        const cx = bx(0);
        const cy = by(0, 0);
        const A = sim.params.axisAmplitude * W;
        const arrow = (x: number, y: number, ang: number) => {
          c.beginPath();
          c.moveTo(x, y);
          c.lineTo(x - 12 * Math.cos(ang - 0.45), y - 12 * Math.sin(ang - 0.45));
          c.lineTo(x - 12 * Math.cos(ang + 0.45), y - 12 * Math.sin(ang + 0.45));
          c.closePath();
          c.fill();
        };
        if (T.kind === 'axis') {
          const v = T.axis === 'vertical';
          c.beginPath();
          if (v) { c.moveTo(cx, cy - A); c.lineTo(cx, cy + A); } else { c.moveTo(cx - A, cy); c.lineTo(cx + A, cy); }
          c.stroke();
          if (v) { arrow(cx, cy - A, -Math.PI / 2); arrow(cx, cy + A, Math.PI / 2); } else { arrow(cx - A, cy, Math.PI); arrow(cx + A, cy, 0); }
        } else if (T.kind === 'circle') {
          const R = sim.params.circleRadius * W;
          c.beginPath();
          c.arc(cx, cy, R, 0.3, Math.PI * 2 - 0.1);
          c.stroke();
          arrow(cx + R * Math.cos(-0.1), cy + R * Math.sin(-0.1), Math.PI / 2 - 0.1);
        }
      }

      // Sombra de la cadena y de la lenteja (luz cenital ligeramente desplazada).
      const sh = (x: number, y: number, hh: number): [number, number] => [bx(x + 0.1 * hh), by(y + 0.07 * hh, 0)];
      const [spx, spy] = sh(piv.x, piv.y, pivH);
      const [sbx, sby] = sh(bob.x, bob.y, h);
      c.strokeStyle = 'rgba(0,0,0,0.22)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(spx, spy);
      c.lineTo(sbx, sby);
      c.stroke();
      const shR = (0.035 + 0.06 * h) * W;
      const shA = clamp(0.5 - 0.45 * h, 0.12, 0.45);
      const sg = c.createRadialGradient(sbx, sby, 0, sbx, sby, shR);
      sg.addColorStop(0, `rgba(0,0,0,${shA})`);
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = sg;
      c.beginPath();
      c.ellipse(sbx, sby, shR, shR * 0.75, 0, 0, Math.PI * 2);
      c.fill();

      // Punto luminoso que «señala» sobre el tablero.
      const glowMul = P.midnight ? 1.8 : 1;
      const tx = bx(bob.x);
      const ty = by(bob.y, 0);
      const pr = W * 0.05 * glowMul;
      const pg = c.createRadialGradient(tx, ty, 0, tx, ty, pr);
      pg.addColorStop(0, hexA(look.glow, 0.35 * glowMul));
      pg.addColorStop(1, hexA(look.glow, 0));
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = pg;
      c.fillRect(tx - pr, ty - pr, pr * 2, pr * 2);
      c.globalCompositeOperation = 'source-over';

      // Cadena.
      const dx = ax - px;
      const dy = ay - py;
      const dl = Math.hypot(dx, dy) || 1;
      drawChain(c, look.chain, px, py, ax, ay, W);
      if (sim.wind > 0.3) {
        // vueltas enrolladas cerca de la mano
        const n = Math.round(sim.wind * 2);
        const nx = -dy / dl;
        const ny = dx / dl;
        c.strokeStyle = look.chain === 'gold' ? '#e8c46a' : look.chain === 'silver' ? '#d9dbe4' : '#cdb48a';
        c.lineWidth = 2;
        c.beginPath();
        for (let i = 0; i <= n; i++) {
          const f = (i / n) * Math.min(0.85, 0.25 + sim.wind * 0.07);
          const cx = px + dx * f;
          const cy = py + dy * f;
          const s = (i % 2 ? 1 : -1) * W * 0.018;
          if (i === 0) c.moveTo(cx + nx * s, cy + ny * s); else c.lineTo(cx + nx * s, cy + ny * s);
        }
        c.stroke();
      }

      // Lenteja: halo + sprite rotado + brillo especular dinámico.
      const rot = Math.atan2(-dx, dy);
      const v = sim.velocity();
      c.save();
      c.translate(ax, ay);
      c.rotate(rot);
      const s = (PIVOT_H - 1) * K * W;
      const flick = 0.85 + 0.15 * Math.sin(time * 7.3) * Math.sin(time * 3.1);
      const gStr = (P.angry ? 0.8 : look.glowStrength) * glowMul * flick;
      const gr = s * (P.midnight ? 1.6 : 1.05);
      const hg = c.createRadialGradient(0, s * 0.5, 0, 0, s * 0.5, gr);
      const gc = P.angry ? '#ff3b2f' : look.glow;
      hg.addColorStop(0, hexA(gc, 0.55 * gStr));
      hg.addColorStop(1, hexA(gc, 0));
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = hg;
      c.fillRect(-gr, s * 0.5 - gr, gr * 2, gr * 2);
      c.globalCompositeOperation = 'source-over';
      if (P.angry) c.translate(Math.sin(time * 60) * 1.2, 0);
      c.drawImage(sprite.canvas, -sprite.ox, -sprite.oy, sprite.w, sprite.h);
      // reflejo: se desliza según la velocidad (como si la luz corriese por el material)
      const hx = clamp(-v.x * 0.25, -0.5, 0.5) * s * 0.35;
      const hy = s * (0.35 + clamp(v.y * 0.05, -0.1, 0.1));
      const spec = look.specular * (P.midnight ? 1 : 0.75);
      const rg = c.createRadialGradient(hx, hy, 0, hx, hy, s * 0.22);
      rg.addColorStop(0, `rgba(255,255,255,${0.55 * spec})`);
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rg;
      c.fillRect(hx - s * 0.22, hy - s * 0.22, s * 0.44, s * 0.44);
      if (P.midnight) {
        for (let i = 0; i < 5; i++) {
          const a = time * 1.3 + i * 1.256;
          const rr = s * (0.6 + 0.15 * Math.sin(time * 2 + i));
          const tw = 0.5 + 0.5 * Math.sin(time * 5 + i * 2);
          c.fillStyle = hexA(look.glow, 0.8 * tw);
          c.beginPath();
          c.arc(Math.cos(a) * rr, s * 0.5 + Math.sin(a) * rr, 1.5 + tw * 1.5, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();
      c.globalCompositeOperation = 'source-over';

      // Mano (dedos que pinzan la cadena).
      drawHand(c, px, py, W, grab.current.active);
    };

    const staticDraw = () => {
      // Pose final sin física.
      const T = sim.target;
      const L = sim.length;
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
      void L;
      draw(performance.now(), true);
    };

    if (reduced) {
      staticDraw();
      const t = props.current.target || props.current.angry ? setTimeout(() => props.current.onSettled?.(), 700) : 0;
      return () => clearTimeout(t);
    }

    const frame = (now: number) => {
      const dt = last ? (now - last) / 1000 : 1 / 60;
      last = now;
      const P = props.current;
      // Mano: sigue al puntero si se sujeta; si no, vuelve suavemente al centro.
      const g = grab.current;
      const gx = g.active ? g.gx : 0;
      const gy = g.active ? g.gy : 0;
      const rate = g.active ? 25 : 2.5;
      const k = Math.min(1, rate * dt);
      sim.setPivot(sim.pivot.x + (gx - sim.pivot.x) * k, sim.pivot.y + (gy - sim.pivot.y) * k);
      const tilt = P.tilt;
      sim.extra.x = tilt ? clamp(tilt.x, -1, 1) * sim.params.gravity * 0.3 : 0;
      sim.extra.y = tilt ? clamp(tilt.y, -1, 1) * sim.params.gravity * 0.3 : 0;
      const before = { x: sim.p.x, y: sim.p.y };
      sim.advance(dt);
      if (sim.consumeSettled()) P.onSettled?.();
      // vaivén audible
      const moved = Math.hypot(sim.p.x - before.x, sim.p.y - before.y);
      const speed = moved / Math.max(dt, 1e-3);
      travel += moved;
      if (P.sound !== false && travel > 0.55 && speed > 0.45) {
        travel = 0;
        playSfx('swing', { volume: clamp(speed / 1.6, 0.15, 0.9), rate: look.swingRate });
      } else if (speed < 0.2) travel = 0;
      draw(now);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || !visible || document.hidden) return;
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
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) start(); else stop();
      });
      io.observe(cv);
    }
    t0 = performance.now();
    start();
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVis);
      io?.disconnect();
    };
  }, [W, dpr, sprite, reduced, sim, look, props, targetKey, p.angry]);

  // Sujetar la cadena con ratón / dedo.
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (reduced || !W) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    grab.current = { active: true, sx: e.clientX, sy: e.clientY, px: sim.pivot.x, py: sim.pivot.y, gx: sim.pivot.x, gy: sim.pivot.y };
    setGrabbing(true);
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
