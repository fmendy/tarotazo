// Motor local de Tarotazo (app sin conexión): port fiel del backend Java (docs/MOBILE.md).
// Mismas formas JSON que el API §6 + extensiones; errores tipados (EngineError) en vez de HTTP 400/503.
import type { ContentSet } from './content';
import { DEFAULT_LANG } from './content';
import { bundledContent, type ContentSource } from './loader';
import { NarrativeEngine, DEFAULT_OPTIONS, type NarrativeOptions } from './narrative';
import { PendulumEngine } from './pendulum';
import { cryptoRandom } from './random';
import { CatalogService, ReadingService } from './services';
import type {
  DeckModelDef, EngineDeck, EngineProvince, EngineSpread, NextLineRequest, NextLineResponse, OnboardingFile,
  PendulumContent, PendulumRequest, PendulumResponse, ReadingRequest, ReadingResponse, TitlesFile,
} from './types';
import {
  validateDeckParam, validateNextLine, validatePendulum, validateProvinceParam, validateReading,
} from './validation';
import { EngineError } from './errors';

export { EngineError } from './errors';
export type { EngineDeck, EngineDeckModel, EngineProvince, EngineSpread } from './types';

export interface ArcanaApi {
  getDecks(lang: string): Promise<EngineDeck[]>;
  getSpreads(lang: string, deck?: string): Promise<EngineSpread[]>;
  getProvinces(lang: string): Promise<EngineProvince[]>;
  getTitles(lang: string): Promise<TitlesFile>;
  getOnboarding(lang: string): Promise<OnboardingFile>;
  getPendulumContent(lang: string, provincia?: string): Promise<PendulumContent>;
  createReading(req: ReadingRequest, lang: string): Promise<ReadingResponse>;
  nextLine(req: NextLineRequest, lang: string): Promise<NextLineResponse>;
  pendulumAnswer(req: PendulumRequest, lang: string): Promise<PendulumResponse>;
}

export interface LocalApiOptions {
  /** Azar en [0,1) para cartas, orientación y semillas. Por defecto crypto.getRandomValues. */
  random?: () => number;
  /** Reloj (hora/día si el contexto no los trae; estación y fase lunar). Por defecto el del dispositivo. */
  now?: () => Date;
  /** Contenido; por defecto el empaquetado en la app (import.meta.glob de content/). */
  content?: ContentSource;
  /** ¿Hay arte para un modelo? Por defecto todos disponibles. */
  artAvailable?: (model: DeckModelDef) => boolean;
  /** Probabilidades del motor narrativo (tests). */
  narrative?: NarrativeOptions;
}

/**
 * Idioma efectivo (LanguageResolver): el primer candidato con carpeta de contenido; si ninguno, `es`.
 * Acepta etiquetas tipo "ca-ES".
 */
export function resolveLang(candidates: Array<string | null | undefined>, set: ContentSet): string {
  for (const c of candidates) {
    const l = primary(c);
    if (l && set.languages().has(l)) return l;
  }
  return DEFAULT_LANG;
}

function primary(tag: string | null | undefined): string | null {
  if (!tag || tag === '*') return null;
  const l = tag.trim().toLowerCase().split(/[-_]/)[0];
  return /^[a-z]{2,3}$/.test(l) ? l : null;
}

export function createLocalApi(opts: LocalApiOptions = {}): ArcanaApi {
  const random = opts.random ?? cryptoRandom;
  const now = opts.now ?? (() => new Date());
  const source = opts.content ?? bundledContent();

  let services: Promise<{
    set: ContentSet; catalog: CatalogService; narrative: NarrativeEngine; reading: ReadingService; pendulum: PendulumEngine;
  }> | null = null;
  const boot = () => (services ??= source.get().then(set => {
    const catalog = new CatalogService(set, { random, artAvailable: opts.artAvailable });
    const narrative = new NarrativeEngine(set, now, opts.narrative ?? DEFAULT_OPTIONS, opts.random);
    return {
      set, catalog, narrative, reading: new ReadingService(set, catalog, narrative, random),
      pendulum: new PendulumEngine(set, now, opts.random),
    };
  }));
  /**
   * Asegura el idioma cargado y devuelve el efectivo. Candidatos en orden de prioridad, como el API:
   * context.lang > `lang` del argumento (equivale a Accept-Language) > es.
   */
  const withLang = async (...candidates: Array<string | null | undefined>) => {
    const s = await boot();
    for (const c of candidates) {
      const l = primary(c);
      if (l) await source.ensure(l);
    }
    return { s, lang: resolveLang(candidates, s.set) };
  };
  const ctxLangOf = (ctx: unknown) =>
    ctx && typeof ctx === 'object' && typeof (ctx as { lang?: unknown }).lang === 'string' ? (ctx as { lang: string }).lang : null;

  return {
    async getDecks(lang) {
      const { s, lang: l } = await withLang(lang);
      return s.catalog.decks(l);
    },
    async getSpreads(lang, deck) {
      validateDeckParam(deck);
      const { s, lang: l } = await withLang(lang);
      return s.catalog.spreads(deck, l);
    },
    async getProvinces(lang) {
      const { s, lang: l } = await withLang(lang);
      return s.catalog.provinces(l);
    },
    async getTitles(lang) {
      const { s, lang: l } = await withLang(lang);
      return s.catalog.titles(l) as TitlesFile;
    },
    async getOnboarding(lang) {
      const { s, lang: l } = await withLang(lang);
      return s.catalog.onboarding(l) as OnboardingFile;
    },
    async getPendulumContent(lang, provincia) {
      validateProvinceParam(provincia);
      const { s, lang: l } = await withLang(lang);
      return s.pendulum.content_(l, provincia ?? null);
    },
    async createReading(req, lang) {
      const v = validateReading(req);
      const { s, lang: l } = await withLang(ctxLangOf(req.context), lang);
      return s.reading.read(v, l);
    },
    async nextLine(req, lang) {
      const v = validateNextLine(req);
      const { s, lang: l } = await withLang(ctxLangOf(req.context), lang);
      const text = s.narrative.nextLine(l, v.interactionId, v.answer, v.tone, v.ctx);
      if (text === null) throw EngineError.badRequest(`Interacción desconocida: '${v.interactionId}'`);
      return { text };
    },
    async pendulumAnswer(req, lang) {
      const v = validatePendulum(req);
      const { s, lang: l } = await withLang(ctxLangOf(req.context), lang);
      return s.pendulum.answer({ mode: v.mode, model: v.model, options: v.options, ctx: v.ctx }, l);
    },
  };
}
