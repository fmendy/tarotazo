// Física pura del péndulo (sin DOM). Péndulo esférico amortiguado integrado con Verlet
// de posición a paso fijo + proyección sobre la ligadura |p - pivote| = L.
//
// Ejes del mundo: x → derecha del tablero, y → «hacia abajo» del tablero (hacia el usuario),
// z → hacia abajo (sentido de la gravedad). El pivote (la mano) está en el origen.
//
// La «respuesta» llega como objetivo (SimTarget) y una fuerza guía creciente (el efecto
// ideomotor) lleva el movimiento hacia él con un guion: quieto → tiembla → gira → se asienta.

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface SimParams {
  /** Longitud de la cadena (m). */
  length: number;
  /** Gravedad (m/s²). */
  gravity: number;
  /** Amortiguación lineal (1/s). 0 = sin pérdidas. */
  damping: number;
  /** Paso fijo (s). */
  dt: number;
  /** Amplitud horizontal de la oscilación en eje (fracción de L). */
  axisAmplitude: number;
  /** Radio del giro en círculo (fracción de L). */
  circleRadius: number;
  /** Temblor de la mano siempre presente (m/s²). */
  tremor: number;
}

export type SimTarget =
  | { kind: 'axis'; axis: 'x' | 'y' }
  | { kind: 'circle' }
  | { kind: 'point'; x: number; y: number }; // coordenadas horizontales del mundo (m)

export const DEFAULT_PARAMS: SimParams = {
  length: 1,
  gravity: 9.81,
  damping: 0.12,
  dt: 1 / 60,
  axisAmplitude: 0.32,
  circleRadius: 0.24,
  tremor: 0.05,
};

/** Fases del guion de respuesta (segundos desde que llega el objetivo). */
export const SCRIPT = { quiet: 0.6, tremble: 1.6, spin: 3.0, settleRamp: 2.4 } as const;

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

export class PendulumSim {
  readonly params: SimParams;
  /** Posición actual y anterior de la lenteja (Verlet). */
  p: Vec3;
  prev: Vec3;
  /** Pivote (la mano). Se mueve al sujetar la cadena. */
  pivot: Vec3 = { x: 0, y: 0, z: 0 };
  prevPivot: Vec3 = { x: 0, y: 0, z: 0 };
  /** Longitud efectiva (se acorta cuando el péndulo se enfada y se enrolla). */
  length: number;
  /** Aceleración externa horizontal (giroscopio, etc.). */
  extra = { x: 0, y: 0 };
  /** Multiplicador de la fuerza guía (0 = libre). */
  guideGain = 1;
  /**
   * Segundos que sigue moviéndose tras asentarse antes de «calmarse» y quedarse quieto
   * (la mano se relaja; ahorra batería porque el renderizador se duerme). Con valor, también se
   * calma a los 2,5 s si está libre y nadie lo sujeta. null = nunca (física pura).
   */
  restAfter: number | null = null;
  /** true mientras el usuario sujeta la cadena (impide la calma). */
  handActive = false;
  /** 0..1: cuánto se ha relajado la mano (desvanece guía y temblor, sube la amortiguación). */
  calm = 0;
  private idleTime = 0;
  private settledTime = 0;

  time = 0;
  target: SimTarget | null = null;
  targetTime = 0;
  angry = false;
  /** Vueltas de cadena enrolladas (sólo visual, crece con el enfado). */
  wind = 0;
  settled = false;
  private settledAccum = 0;
  private settledEvent = false;
  private spinDir = 1;
  private jitter = { x: 0, y: 0, t: 0 };
  private acc = 0;
  private rng: () => number;

  constructor(params: Partial<SimParams> = {}, rng: () => number = Math.random) {
    this.params = { ...DEFAULT_PARAMS, ...params };
    this.length = this.params.length;
    this.p = { x: 0, y: 0, z: this.length };
    this.prev = { ...this.p };
    this.rng = rng;
  }

  /** Coloca la lenteja con un ángulo polar (rad) y azimut, y velocidad tangencial opcional (m/s). */
  setAngle(theta: number, phi = 0, tangentialSpeed = 0): void {
    const L = this.length;
    const s = Math.sin(theta);
    this.p = { x: this.pivot.x + L * s * Math.cos(phi), y: this.pivot.y + L * s * Math.sin(phi), z: this.pivot.z + L * Math.cos(theta) };
    const tx = -Math.sin(phi) * tangentialSpeed * this.params.dt;
    const ty = Math.cos(phi) * tangentialSpeed * this.params.dt;
    this.prev = { x: this.p.x - tx, y: this.p.y - ty, z: this.p.z };
  }

  setTarget(t: SimTarget | null): void {
    this.calm = 0;
    this.idleTime = 0;
    this.settledTime = 0;
    this.target = t;
    this.targetTime = 0;
    this.settled = false;
    this.settledAccum = 0;
    this.settledEvent = false;
    this.spinDir = this.rng() < 0.5 ? -1 : 1;
  }

  setAngry(b: boolean): void {
    this.calm = 0;
    this.idleTime = 0;
    this.settledTime = 0;
    this.angry = b;
    this.settled = false;
    this.settledAccum = 0;
    this.settledEvent = false;
  }

  /** Mueve el pivote (la mano del usuario). */
  setPivot(x: number, y: number): void {
    this.pivot = { x, y, z: 0 };
  }

  /** Devuelve true una sola vez cuando el movimiento se ha asentado en el objetivo. */
  consumeSettled(): boolean {
    if (this.settledEvent) {
      this.settledEvent = false;
      return true;
    }
    return false;
  }

  /** Velocidad estimada (m/s). */
  velocity(): Vec3 {
    const dt = this.params.dt;
    return { x: (this.p.x - this.prev.x) / dt, y: (this.p.y - this.prev.y) / dt, z: (this.p.z - this.prev.z) / dt };
  }

  /** Energía mecánica por unidad de masa (referencia: pivote). */
  energy(): number {
    const v = this.velocity();
    return 0.5 * (v.x * v.x + v.y * v.y + v.z * v.z) - this.params.gravity * (this.p.z - this.pivot.z);
  }

  /** Avanza el tiempo real `frameDt` con paso fijo; devuelve los pasos dados (máx. 6). */
  advance(frameDt: number): number {
    this.acc += Math.min(frameDt, 0.25);
    let n = 0;
    while (this.acc >= this.params.dt && n < 6) {
      this.step();
      this.acc -= this.params.dt;
      n++;
    }
    if (n === 6) this.acc = 0;
    return n;
  }

  /** Un paso de integración. */
  step(): void {
    const { dt, gravity: g } = this.params;
    this.time += dt;
    if (this.target) this.targetTime += dt;

    // Longitud efectiva: enrollarse al enfadarse, desenrollarse al calmarse.
    const goalL = this.angry ? this.params.length * 0.38 : this.params.length;
    this.length += (goalL - this.length) * Math.min(1, dt * (this.angry ? 0.7 : 1.5));
    this.wind = ((this.params.length - this.length) / this.params.length) * 9;

    this.updateCalm(dt);
    const a = this.guide();
    let damp = this.params.damping;
    if (this.target && this.targetTime < SCRIPT.quiet) damp += 2.5; // «empieza quieto»
    if (this.target?.kind !== 'point') damp += 0.9 * this.calm;

    const v = { x: this.p.x - this.prev.x, y: this.p.y - this.prev.y, z: this.p.z - this.prev.z };
    const k = 1 - damp * dt;
    const dt2 = dt * dt;
    const next = {
      x: this.p.x + v.x * k + (a.x + this.extra.x) * dt2,
      y: this.p.y + v.y * k + (a.y + this.extra.y) * dt2,
      z: this.p.z + v.z * k + g * dt2,
    };
    // Ligadura (cadena inextensible) al estilo SHAKE: se corrige a lo largo de la dirección
    // de la cadena en el paso anterior, lo que hace el esquema reversible y conserva la energía.
    const rx = this.p.x - this.prevPivot.x;
    const ry = this.p.y - this.prevPivot.y;
    const rz = this.p.z - this.prevPivot.z;
    const ux = next.x - this.pivot.x;
    const uy = next.y - this.pivot.y;
    const uz = next.z - this.pivot.z;
    const L = this.length;
    const rr = rx * rx + ry * ry + rz * rz;
    const ur = ux * rx + uy * ry + uz * rz;
    const uu = ux * ux + uy * uy + uz * uz;
    const disc = ur * ur - rr * (uu - L * L);
    let px: number, py: number, pz: number;
    if (disc >= 0 && rr > 1e-12) {
      const lam = (-ur + Math.sqrt(disc)) / rr;
      px = ux + lam * rx;
      py = uy + lam * ry;
      pz = uz + lam * rz;
    } else {
      px = ux;
      py = uy;
      pz = uz;
    }
    // Normalización final (absorbe errores de redondeo y cambios de longitud).
    const s = L / (Math.hypot(px, py, pz) || 1);
    this.prev = this.p;
    this.prevPivot = { ...this.pivot };
    this.p = { x: this.pivot.x + px * s, y: this.pivot.y + py * s, z: this.pivot.z + pz * s };

    this.checkSettled();
  }

  /** Aceleración horizontal de la «mano» (guía ideomotora + temblor). */
  private guide(): { x: number; y: number } {
    const out = { x: 0, y: 0 };
    const P = this.params;
    const L = this.length;
    const g = P.gravity;
    const rx = this.p.x - this.pivot.x;
    const ry = this.p.y - this.pivot.y;
    const v = this.velocity();
    const w = Math.sqrt(g / L);

    // Temblor permanente (suave, cambia ~8 veces por segundo).
    this.jitter.t -= P.dt;
    if (this.jitter.t <= 0) {
      this.jitter = { x: (this.rng() * 2 - 1), y: (this.rng() * 2 - 1), t: 0.08 + this.rng() * 0.08 };
    }
    const tremor = P.tremor * (1 - this.calm);
    out.x += this.jitter.x * tremor;
    out.y += this.jitter.y * tremor;

    if (this.angry) {
      this.addCircle(out, rx, ry, v, Math.min(0.6 * L, 0.3), 1.8 * (1 - this.calm), 4);
      return out;
    }
    const tt = this.target ? this.targetTime : 0;
    if (!this.target) return out;
    // En un punto la guía sostiene la posición (si se soltase, volvería al centro).
    const G = this.guideGain * (this.target.kind === 'point' ? 1 : 1 - this.calm);

    if (tt < SCRIPT.quiet) return out;
    if (tt < SCRIPT.tremble) {
      // tiembla: temblor fuerte y nervioso
      const amp = 0.9 * smooth(SCRIPT.quiet, SCRIPT.quiet + 0.4, tt);
      out.x += this.jitter.x * amp * 2.5 * G;
      out.y += this.jitter.y * amp * 2.5 * G;
      return out;
    }
    // gira (desaparece poco a poco mientras gana la guía final)
    const sFinal = smooth(SCRIPT.spin, SCRIPT.spin + SCRIPT.settleRamp, tt);
    const sSpin = smooth(SCRIPT.tremble, SCRIPT.tremble + 0.6, tt) * (1 - sFinal);
    if (sSpin > 0.001) this.addCircle(out, rx, ry, v, P.circleRadius * 0.55 * L, sSpin * G, 2.5);
    if (sFinal <= 0.001) return out;
    const S = sFinal * G;
    const t = this.target;
    if (t.kind === 'axis') {
      // Bombeo de energía en el eje (resonante, sin fase impuesta) + amortiguar lo perpendicular.
      const ux = t.axis === 'x' ? 1 : 0;
      const uy = 1 - ux;
      const along = rx * ux + ry * uy;
      const vAlong = v.x * ux + v.y * uy;
      const perp = rx * uy - ry * ux;
      const vPerp = v.x * uy - v.y * ux;
      const A = P.axisAmplitude * L;
      const amp = Math.sqrt(along * along + (vAlong / w) ** 2);
      let pump = 3.0 * (A - amp) / A; // >0 bombea, <0 frena
      pump = Math.max(-2, Math.min(2, pump));
      const dir = amp > 1e-4 ? vAlong / (amp * w) : 1; // ~cos(fase)
      const fAlong = pump * 1.6 * dir + (amp < 0.02 * L ? 1.2 * Math.sign(this.spinDir) : 0);
      const fPerp = -8 * perp - 3.5 * vPerp;
      out.x += S * (fAlong * ux + fPerp * uy);
      out.y += S * (fAlong * uy - fPerp * ux);
    } else if (t.kind === 'circle') {
      this.addCircle(out, rx, ry, v, P.circleRadius * L, S, 3);
    } else {
      // Punto: PD hacia el objetivo + compensación de la gravedad (para poder «quedarse» fuera del centro).
      const px = t.x;
      const py = t.y;
      const r2 = Math.min(px * px + py * py, 0.8 * L * L);
      const zt = Math.sqrt(L * L - r2);
      const ffx = (g * px) / zt;
      const ffy = (g * py) / zt;
      const kp = 22;
      const kd = 9;
      out.x += S * (ffx + kp * (px - rx) - kd * v.x);
      out.y += S * (ffy + kp * (py - ry) - kd * v.y);
    }
    return out;
  }

  /** Calma: sin objetivo ni mano durante 2,5 s, o asentado durante `restAfter` s. */
  private updateCalm(dt: number) {
    if (this.handActive) {
      this.idleTime = 0;
      this.calm = Math.max(0, this.calm - dt * 4);
      return;
    }
    this.idleTime += dt;
    if (this.settled) this.settledTime += dt;
    const free = this.restAfter !== null && !this.target && !this.angry && this.idleTime > 2.5;
    const rested = this.settled && this.restAfter !== null && this.settledTime > this.restAfter;
    if (free || rested) this.calm = Math.min(1, this.calm + dt / 2);
  }

  /** ¿Quieto del todo? (para dormir el bucle de dibujo). */
  isAtRest(): boolean {
    if (this.handActive || this.calm < 0.999) return false;
    const v = this.velocity();
    const pv = Math.hypot(this.pivot.x - this.prevPivot.x, this.pivot.y - this.prevPivot.y);
    return Math.hypot(v.x, v.y) < 0.004 && pv < 1e-6 && Math.abs(this.length - (this.angry ? this.params.length * 0.38 : this.params.length)) < 1e-3;
  }

  /** Fuerza que lleva a un péndulo cónico de radio R. */
  private addCircle(out: { x: number; y: number }, rx: number, ry: number, v: Vec3, R: number, gain: number, speedMul = 1) {
    const L = this.length;
    const g = this.params.gravity;
    const r = Math.hypot(rx, ry);
    let nx: number;
    let ny: number;
    if (r < 1e-4) {
      nx = 1;
      ny = 0;
    } else {
      nx = rx / r;
      ny = ry / r;
    }
    const tx = -ny * this.spinDir;
    const ty = nx * this.spinDir;
    const zc = Math.sqrt(Math.max(L * L - R * R, 1e-4));
    const wc = Math.sqrt(g / zc) * (speedMul > 3 ? 1.6 : 1);
    const vt = v.x * tx + v.y * ty;
    const vr = v.x * nx + v.y * ny;
    const fr = 10 * (R - r) - 4 * vr;
    const ft = 2.2 * (R * wc - vt) * (speedMul / 3);
    out.x += gain * (fr * nx + ft * tx);
    out.y += gain * (fr * ny + ft * ty);
  }

  private checkSettled() {
    if (this.settled) return;
    const P = this.params;
    const L = this.length;
    const rx = this.p.x - this.pivot.x;
    const ry = this.p.y - this.pivot.y;
    const v = this.velocity();
    let ok = false;
    if (this.angry) {
      ok = this.length < P.length * 0.45;
    } else if (this.target && this.targetTime > SCRIPT.spin + SCRIPT.settleRamp * 0.6) {
      const t = this.target;
      const w = Math.sqrt(P.gravity / L);
      if (t.kind === 'axis') {
        const ux = t.axis === 'x' ? 1 : 0;
        const uy = 1 - ux;
        const along = rx * ux + ry * uy;
        const vAlong = v.x * ux + v.y * uy;
        const perp = Math.abs(rx * uy - ry * ux);
        const amp = Math.sqrt(along * along + (vAlong / w) ** 2);
        ok = perp < 0.05 * L && Math.abs(amp - P.axisAmplitude * L) < 0.25 * P.axisAmplitude * L;
      } else if (t.kind === 'circle') {
        const r = Math.hypot(rx, ry);
        ok = Math.abs(r - P.circleRadius * L) < 0.2 * P.circleRadius * L;
      } else {
        ok = Math.hypot(rx - t.x, ry - t.y) < 0.03 * L && Math.hypot(v.x, v.y) < 0.08;
      }
    }
    this.settledAccum = ok ? this.settledAccum + P.dt : 0;
    if (this.settledAccum > 0.8) {
      this.settled = true;
      this.settledEvent = true;
    }
  }
}

/** Convierte coordenadas normalizadas del tablero (0..1) a metros horizontales del mundo. */
export function boardToWorld(x01: number, y01: number, halfSize: number): { x: number; y: number } {
  return { x: (x01 - 0.5) * 2 * halfSize, y: (y01 - 0.5) * 2 * halfSize };
}
