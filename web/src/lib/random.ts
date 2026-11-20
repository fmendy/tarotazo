// Aleatoriedad del navegador con crypto.getRandomValues.

export function randomUint32(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0]!;
}

/** Entero uniforme en [0, n). */
export function randomInt(n: number): number {
  if (n <= 1) return 0;
  // rechazo para evitar sesgo de módulo
  const limit = Math.floor(0x100000000 / n) * n;
  let x = randomUint32();
  while (x >= limit) x = randomUint32();
  return x % n;
}

export function pick<T>(arr: readonly T[]): T | undefined {
  return arr.length ? arr[randomInt(arr.length)] : undefined;
}

/** Semilla de tono: entero positivo de 31 bits (cabe en int de Java). */
export function newToneSeed(): number {
  return randomUint32() >>> 1;
}
