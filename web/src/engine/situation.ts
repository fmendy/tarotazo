// Port de es.arcana.narrative.{Situation, WhenMatcher, Weighted}.
import type { Moment } from './astro';
import type { TextRandom } from './random';
import type { CardDef, When } from './types';

/** Contexto anónimo normalizado (campos ausentes = null), como ReadingContext en Java. */
export interface Ctx {
  signo: string | null;
  decada: number | null;
  numeroVida: number | null;
  provincia: string | null;
  tema: string | null;
  toneSeed: number | bigint | null;
  hora: number | null;
  diaSemana: number | null;
  lang: string | null;
}

export const EMPTY_CTX: Ctx = {
  signo: null, decada: null, numeroVida: null, provincia: null, tema: null, toneSeed: null, hora: null, diaSemana: null, lang: null,
};

export function temaOrGeneral(c: Ctx): string {
  return c.tema ?? 'general';
}

/** Carta sorteada con lo que necesita el motor. */
export interface NarrativeCard {
  def: CardDef;
  name: string;
  suitName: string | null;
  reversed: boolean;
  positionId: string;
  positionLabel: string;
  positionInline: string | null;
}

export class Situation {
  constructor(
    readonly family: string | null,
    readonly spread: string | null,
    readonly ctx: Ctx,
    readonly moment: Moment | null,
    readonly cards: NarrativeCard[],
    readonly card: NarrativeCard | null,
    readonly index: number,
  ) {}

  forCard(i: number): Situation {
    return new Situation(this.family, this.spread, this.ctx, this.moment, this.cards, this.cards[i], i);
  }

  tema(): string {
    return temaOrGeneral(this.ctx);
  }

  previous(): NarrativeCard | null {
    return this.card !== null && this.index > 0 ? this.cards[this.index - 1] : null;
  }

  mayores(): number {
    return this.cards.filter(c => c.def.arcana === 'major').length;
  }

  figuras(): number {
    return this.cards.filter(c => c.def.court === true).length;
  }

  /** Palo con más cartas (al menos 2 y sin empate), o null. */
  suitDominante(): string | null {
    const counts = new Map<string, number>();
    for (const c of this.cards) if (c.def.suit) counts.set(c.def.suit, (counts.get(c.def.suit) ?? 0) + 1);
    if (counts.size === 0) return null;
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted[0][1];
    if (top < 2 || (sorted.length > 1 && sorted[1][1] === top)) return null;
    return sorted[0][0];
  }
}

const inList = <T>(allowed: T[] | undefined, value: T | null | undefined): boolean =>
  allowed === undefined || (value !== null && value !== undefined && allowed.includes(value));

function anyCard(s: Situation, p: (c: NarrativeCard) => boolean): boolean {
  return s.card !== null ? p(s.card) : s.cards.some(p);
}

/** Rango de horas inclusivo; si min > max cruza la medianoche. */
export function horaOk(min: number | undefined, max: number | undefined, hora: number | null | undefined): boolean {
  if (min === undefined && max === undefined) return true;
  if (hora === null || hora === undefined) return false;
  if (min !== undefined && max !== undefined) return min <= max ? hora >= min && hora <= max : hora >= min || hora <= max;
  return min !== undefined ? hora >= min : hora <= (max as number);
}

/** Todas las condiciones AND; listas OR; si falta el dato del contexto, no se cumple. */
export function matches(w: When | null | undefined, s: Situation): boolean {
  if (!w) return true;
  const ctx = s.ctx;
  const m = s.moment;
  return inList(w.tema, s.tema())
    && (w.invertida === undefined || anyCard(s, c => c.reversed === w.invertida))
    && (w.arcana === undefined || anyCard(s, c => (c.def.arcana === 'major') === (w.arcana === 'major')))
    && (w.cardIds === undefined || anyCard(s, c => w.cardIds!.includes(c.def.id)))
    && (w.suit === undefined || anyCard(s, c => c.def.suit !== undefined && w.suit!.includes(c.def.suit)))
    && inList(w.family, s.family)
    && inList(w.spread, s.spread)
    && (w.posicion === undefined || (s.card !== null && w.posicion.includes(s.card.positionId)))
    && (w.decadaMin === undefined || (ctx.decada !== null && ctx.decada >= w.decadaMin))
    && (w.decadaMax === undefined || (ctx.decada !== null && ctx.decada <= w.decadaMax))
    && horaOk(w.horaMin, w.horaMax, m?.hora)
    && (w.mayoresMin === undefined || s.mayores() >= w.mayoresMin)
    && (w.figurasMin === undefined || s.figuras() >= w.figurasMin)
    && (w.suitDominante === undefined || w.suitDominante === s.suitDominante())
    && inList(w.provincia, ctx.provincia)
    && inList(w.signo, ctx.signo)
    && (w.diaSemana === undefined || (m !== null && w.diaSemana.includes(m.diaSemana)))
    && inList(w.faseLunar, m?.faseLunar)
    && inList(w.estacion, m?.estacion)
    && (w.primeraCarta === undefined || (s.card !== null && (s.index === 0) === w.primeraCarta))
    && (w.ultimaCarta === undefined || (s.card !== null && (s.index === s.cards.length - 1) === w.ultimaCarta));
}

// ---------------------------------------------------------------- Weighted

export function pick<T>(items: T[], weight: (t: T) => number, rng: TextRandom): T | undefined {
  if (items.length === 0) return undefined;
  let total = 0;
  for (const t of items) total += Math.max(0, weight(t));
  if (total <= 0) return items[rng.nextInt(items.length)];
  let r = rng.nextDouble() * total;
  for (const t of items) {
    r -= Math.max(0, weight(t));
    if (r < 0) return t;
  }
  return items[items.length - 1];
}

export function uniform<T>(items: T[] | undefined | null, rng: TextRandom): T | undefined {
  return !items || items.length === 0 ? undefined : items[rng.nextInt(items.length)];
}

export function effectiveWeight(w: number | undefined): number {
  return w === undefined || w <= 0 ? 1 : w;
}
