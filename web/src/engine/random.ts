// Azar del motor.
// - Textos: port EXACTO de java.util.SplittableRandom (misma semilla ⇒ mismos números que el backend Java),
//   para que el motor TS y el Java elijan los mismos textos con la misma semilla.
// - Cartas y orientación: crypto.getRandomValues (equivalente a SecureRandom).

const MASK64 = (1n << 64n) - 1n;
const GOLDEN_GAMMA = 0x9e3779b97f4a7c15n;
const DOUBLE_UNIT = 1 / 2 ** 53;

/** Generador de textos: interfaz mínima que usa el motor (igual que java.util.random.RandomGenerator). */
export interface TextRandom {
  nextDouble(): number;
  /** Entero uniforme en [0, bound). */
  nextInt(bound: number): number;
}

function mix64(z0: bigint): bigint {
  let z = z0;
  z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK64;
  z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK64;
  return z ^ (z >> 31n);
}

function mix32(z0: bigint): number {
  let z = ((z0 ^ (z0 >> 33n)) * 0x62a9d9ed799705f5n) & MASK64;
  z = ((z ^ (z >> 28n)) * 0xcb24d0a5c88c35b3n) & MASK64;
  return Number(BigInt.asIntN(32, z >> 32n));
}

/** java.util.SplittableRandom(long seed). */
export class SplittableRandom implements TextRandom {
  private seed: bigint;

  constructor(seed: bigint | number) {
    this.seed = BigInt.asUintN(64, BigInt(seed));
  }

  private nextSeed(): bigint {
    this.seed = (this.seed + GOLDEN_GAMMA) & MASK64;
    return this.seed;
  }

  /** long sin signo como bigint (Java: nextLong()). */
  nextLongUnsigned(): bigint {
    return mix64(this.nextSeed());
  }

  /** Java int con signo. */
  nextInt32(): number {
    return mix32(this.nextSeed());
  }

  nextDouble(): number {
    return Number(this.nextLongUnsigned() >> 11n) * DOUBLE_UNIT;
  }

  /** RandomSupport.boundedNextInt (JDK 17+). */
  nextInt(bound: number): number {
    if (!(bound > 0)) throw new RangeError('bound must be positive');
    let r = this.nextInt32();
    const m = bound - 1;
    if ((bound & m) === 0) {
      return r & m;
    }
    for (let u = r >>> 1; ((u + m - (r = u % bound)) | 0) < 0; u = this.nextInt32() >>> 1) {
      /* rechazo */
    }
    return r;
  }
}

/** Double en [0,1) criptográfico (53 bits). */
export function cryptoRandom(): number {
  const a = new Uint32Array(2);
  globalThis.crypto.getRandomValues(a);
  return ((a[0] >>> 5) * 67108864 + (a[1] >>> 6)) * DOUBLE_UNIT;
}

/** Semilla de 64 bits (como SecureRandom.nextLong()). */
export function seed64(random?: () => number): bigint {
  if (random) {
    const hi = BigInt(Math.floor(random() * 2 ** 32));
    const lo = BigInt(Math.floor(random() * 2 ** 32));
    return BigInt.asIntN(64, (hi << 32n) | lo);
  }
  const a = new Uint32Array(2);
  globalThis.crypto.getRandomValues(a);
  return BigInt.asIntN(64, (BigInt(a[0]) << 32n) | BigInt(a[1]));
}

/** Entero uniforme en [0, bound) a partir de un double en [0,1). */
export function randomInt(random: () => number, bound: number): number {
  return Math.min(bound - 1, Math.floor(random() * bound));
}
