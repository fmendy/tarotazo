// Port fiel de es.arcana.narrative.NarrativeEngine (CONTRACTS §3.4 + resoluciones).
// IMPORTANTE: el orden de las llamadas al PRNG es el mismo que en Java; con la misma semilla y las mismas cartas,
// ambos motores eligen exactamente los mismos textos (lo comprueba narrative.parity.test.ts).
import { moment, type Moment } from './astro';
import { DEFAULT_LANG, meaningVariants, type ContentSet, type LangContent } from './content';
import { SplittableRandom, seed64, type TextRandom } from './random';
import { EMPTY_CTX, Situation, effectiveWeight, matches, pick, temaOrGeneral, uniform, type Ctx, type NarrativeCard } from './situation';
import { SERVER_VARIABLES, gentilicio, render, resolvable, stripUnresolvedServerVariables, type Vars } from './text';
import type { Fragment, InteractionDef, LuckyColor, ServerLabels } from './types';

/** Tonos con su peso por defecto (§1), en orden estable. */
export const TONE_WEIGHTS: ReadonlyArray<readonly [string, number]> = [
  ['mistica', 25], ['abuela', 20], ['teletienda', 15], ['ironica', 20], ['dramatica', 10], ['coach', 10],
];
const TONE_WEIGHT = new Map(TONE_WEIGHTS);
export const INTERACTION_OPTIONS = ['si', 'no', 'skip'] as const;

export interface NarrativeOptions {
  moodChangeProbability: number;
  guinoProbability: number;
  interactionProbability: number;
  maxInteractions: number;
}
export const DEFAULT_OPTIONS: NarrativeOptions = {
  moodChangeProbability: 0.15, guinoProbability: 0.5, interactionProbability: 0.25, maxInteractions: 3,
};

export interface Line { kind: string; text: string }
export interface InteractionPrompt { id: string; prompt: string; options: string[] }
export interface CardNarrative { tone: string; lines: Line[]; interaction: InteractionPrompt | null }
export interface ReadingNarrative {
  tone: string;
  intro: string | null;
  cards: CardNarrative[];
  summary: string;
  luckyNumber: number;
  luckyColor: LuckyColor;
  outro: string | null;
  disclaimer: string;
  usedFragmentIds: string[];
}

export interface ReadingScript {
  lang: string;
  family: string;
  spread: string;
  cards: NarrativeCard[];
  ctx: Ctx;
  recentFragmentIds: string[] | null | undefined;
  textSeed: bigint;
}

/** Valor de {provincia}: XX → «tierras lejanas», sin provincia → «la tierra» (QA-01/QA-12). */
export function provinciaName(labels: ServerLabels, code: string | null | undefined, sheetName: string | undefined,
  defName: string | undefined): string | undefined {
  if (code === null || code === undefined) return labels.provinciaDesconocida ?? undefined;
  if (code === 'XX') return labels.provinciaExtranjero ?? undefined;
  return sheetName ?? defName;
}

function label(labels: Record<string, string>, key: string | null | undefined): string | undefined {
  if (key === null || key === undefined) return undefined;
  return labels[key] ?? key;
}

export class NarrativeEngine {
  constructor(
    private readonly content: ContentSet,
    private readonly now: () => Date = () => new Date(),
    private readonly options: NarrativeOptions = DEFAULT_OPTIONS,
    private readonly random?: () => number,
  ) {}

  moment(ctx: Ctx): Moment {
    return moment(ctx, this.now());
  }

  compose(script: ReadingScript): ReadingNarrative {
    const lc = this.content.lang(script.lang);
    const ctx = script.ctx ?? EMPTY_CTX;
    const rng = new SplittableRandom(script.textSeed);
    const used = new Set<string>();
    const recent = new Set(script.recentFragmentIds ?? []);
    const reading = new Situation(script.family, script.spread, ctx, this.moment(ctx), script.cards, null, -1);
    const n = reading.cards.length;

    const tones = new Tones(lc, this.random);
    const tone = tones.initial(ctx.toneSeed);
    let moodAt = -1;
    let newTone: string | null = null;
    if (n >= 2 && rng.nextDouble() < this.options.moodChangeProbability) {
      moodAt = Math.trunc(n / 2);
      newTone = tones.other(tone, rng);
    }

    const intro = this.text(lc, 'saludo', tone, reading, used, recent, rng);

    const cards: CardNarrative[] = [];
    let interactions = 0;
    let currentTone = tone;
    for (let i = 0; i < n; i++) {
      const s = reading.forCard(i);
      if (moodAt >= 0 && i === moodAt) currentTone = newTone as string;
      const lines: Line[] = [];
      line(lines, 'entrada', this.text(lc, 'entrada', currentTone, s, used, recent, rng));
      line(lines, 'puente', this.text(lc, 'puente', currentTone, s, used, recent, rng));
      line(lines, 'nucleo', this.nucleo(lc, s, currentTone, rng));
      if (i === 0 && ctx.tema === 'salud') {
        const salud = this.text(lc, 'salud', currentTone, s, used, recent, rng);
        line(lines, 'salud', salud ?? lc.labels.saludFallback);
      }
      line(lines, 'personalizacion', this.text(lc, 'personalizacion', currentTone, s, used, recent, rng));
      if (rng.nextDouble() < this.options.guinoProbability) {
        line(lines, 'guino', this.text(lc, 'guino', currentTone, s, used, recent, rng));
      }
      if (moodAt >= 0 && i === moodAt - 1) {
        // cambioHumor: se elige entre los fragmentos del tono NUEVO
        const target = newTone as string;
        const f = this.select(lc, 'cambioHumor', target, s, used, recent, rng, target);
        const change = f ? this.renderText(f.text, lc, s, target, rng) : null;
        if (change === null) moodAt = -1; // sin frase de transición no hay cambio de humor
        else lines.push({ kind: 'cambioHumor', text: change });
      }
      let prompt: InteractionPrompt | null = null;
      if (interactions < this.options.maxInteractions && rng.nextDouble() < this.options.interactionProbability) {
        prompt = this.interaction(lc, currentTone, s, used, recent, rng);
        if (prompt) interactions++;
      }
      cards.push({ tone: currentTone, lines, interaction: prompt });
    }

    const summary = this.text(lc, 'sintesis', currentTone, reading, used, recent, rng);
    const outro = this.text(lc, 'despedida', currentTone, reading, used, recent, rng);
    const labels = lc.labels;
    const lucky = 1 + rng.nextInt(99);
    const color = uniform(labels.luckyColors, rng) ?? { name: 'verde botella', hex: '#1f5e3b' };
    let disclaimer = labels.disclaimer ?? 'Entretenimiento, no consejo profesional.';
    if (ctx.tema === 'salud' && labels.disclaimerSalud !== null) disclaimer = `${disclaimer} ${labels.disclaimerSalud}`;
    return {
      tone, intro, cards, summary: summary ?? '', luckyNumber: lucky, luckyColor: color, outro, disclaimer,
      usedFragmentIds: [...used],
    };
  }

  /** Rama de una interacción (POST /readings/next-line). `null` si la interacción no existe. */
  nextLine(lang: string, interactionId: string, answer: string, tone: string | null | undefined, ctx: Ctx): string | null {
    const lc = this.content.lang(lang);
    const i = lc.interactions.get(interactionId);
    if (!i) return null;
    const c = ctx ?? EMPTY_CTX;
    const s = new Situation(null, null, c, this.moment(c), [], null, -1);
    const rng = new SplittableRandom(seed64(this.random));
    const t = tone ?? 'mistica';
    const text = answer === 'si' ? i.branches.si : answer === 'no' ? i.branches.no : i.branches.skip;
    return stripUnresolvedServerVariables(this.renderText(text, lc, s, t, rng));
  }

  // ---------------------------------------------------------------- selección

  private text(lc: LangContent, slot: string, tone: string, s: Situation, used: Set<string>, recent: Set<string>,
    rng: TextRandom): string | null {
    const f = this.select(lc, slot, tone, s, used, recent, rng, tone);
    return f ? this.renderText(f.text, lc, s, tone, rng) : null;
  }

  /** Filtra por slot, tono, usados y when; descarta variables de servidor sin valor; evita recientes; elige por peso. */
  select(lc: LangContent, slot: string, tone: string, s: Situation, used: Set<string>, recent: Set<string>,
    rng: TextRandom, varTone: string): Fragment | undefined {
    const vars = this.variables(lc, s, varTone, rng);
    const candidates = lc.fragmentsOf(slot).filter(f =>
      (f.tones.length === 0 || f.tones.includes(tone))
      && !used.has(f.id)
      && matches(f.when, s)
      && resolvable(f.text, SERVER_VARIABLES, vars));
    const fresh = candidates.filter(f => !recent.has(f.id));
    const chosen = pick(fresh.length === 0 ? candidates : fresh, f => effectiveWeight(f.weight), rng);
    if (chosen) used.add(chosen.id);
    return chosen;
  }

  private interaction(lc: LangContent, tone: string, s: Situation, used: Set<string>, recent: Set<string>,
    rng: TextRandom): InteractionPrompt | null {
    const vars = this.variables(lc, s, tone, rng);
    const candidates: InteractionDef[] = [...lc.interactions.values()].filter(i =>
      (i.tones.length === 0 || i.tones.includes(tone))
      && !used.has(i.id)
      && matches(i.when, s)
      && resolvable(i.prompt, SERVER_VARIABLES, vars));
    const fresh = candidates.filter(i => !recent.has(i.id));
    const chosen = pick(fresh.length === 0 ? candidates : fresh, i => effectiveWeight(i.weight), rng);
    if (!chosen) return null;
    used.add(chosen.id);
    return { id: chosen.id, prompt: render(chosen.prompt, rng, vars), options: [...INTERACTION_OPTIONS] };
  }

  private nucleo(lc: LangContent, s: Situation, tone: string, rng: TextRandom): string | null {
    const c = s.card as NarrativeCard;
    const m = lc.meaning(s.family ?? '', c.def.id);
    if (!m) return null;
    const t = uniform(meaningVariants(m, c.reversed, s.tema()), rng);
    return t === undefined ? null : this.renderText(t, lc, s, tone, rng);
  }

  private renderText(text: string, lc: LangContent, s: Situation, tone: string, rng: TextRandom): string {
    return render(text, rng, this.variables(lc, s, tone, rng));
  }

  // ---------------------------------------------------------------- variables de servidor

  variables(lc: LangContent, s: Situation, tone: string | null, rng: TextRandom): Vars {
    const ctx = s.ctx;
    const labels = lc.labels;
    const sheet = lc.province(ctx.provincia);
    const prov = this.content.province(ctx.provincia);
    const card = s.card;
    const m = s.moment;
    return (name: string) => {
      switch (name) {
        case 'provincia': return provinciaName(labels, ctx.provincia, sheet?.nombre, prov?.nombre);
        case 'comunidad': return sheet ? sheet.comunidad : (prov?.comunidad ?? undefined);
        case 'gentilicio': return sheet ? gentilicio(sheet.gentilicio) : undefined;
        case 'plato': return sheet ? uniform(sheet.plato, rng) : undefined;
        case 'fiesta': return sheet ? uniform(sheet.fiesta, rng) : undefined;
        case 'clima': return sheet ? uniform(sheet.clima, rng) : undefined;
        case 'signo': return label(labels.signos, ctx.signo);
        case 'decada': return ctx.decada === null ? undefined : String(ctx.decada);
        case 'numeroVida': return ctx.numeroVida === null ? undefined : String(ctx.numeroVida);
        case 'tema': return ctx.tema === null ? undefined : label(labels.temas, ctx.tema);
        case 'carta': return card ? card.name : undefined;
        case 'palo': return card ? (card.suitName ?? undefined) : undefined;
        case 'posicion': return card ? (card.positionInline ?? card.positionLabel) : undefined;
        case 'cartaAnterior': return s.previous()?.name;
        case 'hora': return m ? String(m.hora) : undefined;
        case 'diaSemana': return m ? label(labels.dias, String(m.diaSemana)) : undefined;
        case 'estacion': return m ? label(labels.estaciones, m.estacion) : undefined;
        case 'faseLunar': return m ? label(labels.fasesLunares, m.faseLunar) : undefined;
        case 'tono': return tone === null ? undefined : label(labels.tonos, tone);
        default: return undefined;
      }
    };
  }
}

function line(lines: Line[], kind: string, text: string | null | undefined): void {
  if (text !== null && text !== undefined && text.trim() !== '') lines.push({ kind, text });
}

/** Tonos disponibles en el idioma (los que tienen algún fragmento propio), con los pesos del §1. */
export class Tones {
  readonly available: string[];

  constructor(lc: LangContent, private readonly random?: () => number) {
    const withContent = new Set<string>();
    for (const f of lc.fragments) for (const t of f.tones) withContent.add(t);
    const av = TONE_WEIGHTS.map(([t]) => t).filter(t => withContent.has(t));
    this.available = av.length ? av : TONE_WEIGHTS.map(([t]) => t);
  }

  initial(toneSeed: number | bigint | null): string {
    const r = new SplittableRandom(toneSeed !== null ? BigInt(toneSeed) : seed64(this.random));
    return pick(this.available, t => TONE_WEIGHT.get(t) ?? 0, r) ?? 'mistica';
  }

  other(current: string, rng: TextRandom): string {
    let others = this.available.filter(t => t !== current);
    if (others.length === 0) others = TONE_WEIGHTS.map(([t]) => t).filter(t => t !== current);
    return pick(others, t => TONE_WEIGHT.get(t) ?? 0, rng) ?? current;
  }
}

export { DEFAULT_LANG, temaOrGeneral };
