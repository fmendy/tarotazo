// Port de es.arcana.reading.DeckShuffler: barajado (Fisher–Yates como Collections.shuffle), corte en tres montones,
// picks y orientación. El azar es criptográfico (crypto.getRandomValues) salvo que se inyecte otro en tests.
import { randomInt } from './random';

export const PILES = 3;

export interface Drawn<T> { card: T; reversed: boolean }

export class DeckShuffler {
  constructor(private readonly random: () => number) {}

  /** Collections.shuffle: for i = n-1..1 swap(i, nextInt(i+1)). No muta el original. */
  shuffle<T>(deck: readonly T[]): T[] {
    const a = [...deck];
    for (let i = a.length - 1; i > 0; i--) {
      const j = randomInt(this.random, i + 1);
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /** Toma las cartas de los índices del abanico y sortea su orientación. */
  draw<T>(fan: readonly T[], picks: readonly number[], reversedProbability: number): Drawn<T>[] {
    if (new Set(picks).size !== picks.length) throw new RangeError('picks repetidos');
    return picks.map(idx => {
      if (idx < 0 || idx >= fan.length) throw new RangeError(`pick fuera de rango: ${idx}`);
      return { card: fan[idx], reversed: this.random() < reversedProbability };
    });
  }
}

/** Corta en tres montones consecutivos (el resto va a los primeros) y pone encima el elegido. */
export function cut<T>(deck: readonly T[], cutIndex: number): T[] {
  if (cutIndex < 0 || cutIndex >= PILES || !Number.isInteger(cutIndex)) throw new RangeError('cutIndex debe estar entre 0 y 2');
  const n = deck.length;
  const base = Math.trunc(n / PILES);
  const extra = n % PILES;
  const piles: T[][] = [];
  let start = 0;
  for (let i = 0; i < PILES; i++) {
    const size = base + (i < extra ? 1 : 0);
    piles.push(deck.slice(start, start + size));
    start += size;
  }
  const out = [...piles[cutIndex]];
  for (let i = 0; i < PILES; i++) if (i !== cutIndex) out.push(...piles[i]);
  return out;
}
