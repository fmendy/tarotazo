// Port de es.arcana.content (ContentRepository, LangContent, JsonMerge): contenido ya parseado, con fallback a `es`
// por fichero y por clave, y fragmentos con fallback por slot (no se mezclan idiomas en una frase).
import type {
  CardDef, CardsI18n, ChakraDef, DeckDef, DeckModelDef, Fragment, InteractionDef, LuckyColor, Meaning, PendulumDef,
  PendulumModelDef, ProvinceDef, ProvinceSheet, ServerLabels, SpreadDef, SpreadI18n, When,
} from './types';

export const DEFAULT_LANG = 'es';
const FAMILIES = ['tarot', 'spanish'] as const;
const LANG_RE = /^[a-z]{2,3}$/;

type Json = unknown;
type Obj = Record<string, Json>;

const isObj = (v: Json): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: Json): string | undefined => (typeof v === 'string' ? v : undefined);
const num = (v: Json): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const bool = (v: Json): boolean | undefined => (typeof v === 'boolean' ? v : undefined);
const strList = (v: Json): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const strMap = (v: Json): Record<string, string> => {
  const out: Record<string, string> = {};
  if (isObj(v)) for (const [k, x] of Object.entries(v)) if (typeof x === 'string') out[k] = x;
  return out;
};
const listMap = (v: Json): Record<string, string[]> => {
  const out: Record<string, string[]> = {};
  if (isObj(v)) for (const [k, x] of Object.entries(v)) if (Array.isArray(x)) out[k] = strList(x);
  return out;
};

/** JsonMerge.merge: los objetos se fusionan en profundidad; el resto lo sustituye el idioma. */
export function mergeJson(base: Json, override: Json): Json {
  if (base === undefined || base === null) return override;
  if (override === undefined || override === null) return base;
  if (isObj(base) && isObj(override)) {
    const out: Obj = { ...base };
    for (const [k, v] of Object.entries(override)) out[k] = mergeJson(out[k], v);
    return out;
  }
  return override;
}

/** Normaliza claves de import.meta.glob ("../../../content/es/x.json") a rutas relativas ("es/x.json"). */
export function normalizeGlob(files: Record<string, Json>): Record<string, Json> {
  const out: Record<string, Json> = {};
  for (const [k, v] of Object.entries(files)) {
    const m = k.replace(/\\/g, '/').match(/(?:^|\/)(?:content|content-fixture)\/(.+\.json)$/);
    if (m) out[m[1]] = v;
  }
  return out;
}

// ---------------------------------------------------------------- normalizadores («bind» tolerante)

function when(v: Json): When | null {
  if (!isObj(v)) return null;
  const w: When = {};
  const lists = ['tema', 'cardIds', 'suit', 'family', 'spread', 'posicion', 'provincia', 'signo', 'faseLunar', 'estacion'] as const;
  for (const k of lists) if (Array.isArray(v[k])) w[k] = strList(v[k]);
  const nums = ['decadaMin', 'decadaMax', 'horaMin', 'horaMax', 'mayoresMin', 'figurasMin'] as const;
  for (const k of nums) if (num(v[k]) !== undefined) w[k] = num(v[k]);
  if (bool(v.invertida) !== undefined) w.invertida = v.invertida as boolean;
  if (bool(v.primeraCarta) !== undefined) w.primeraCarta = v.primeraCarta as boolean;
  if (bool(v.ultimaCarta) !== undefined) w.ultimaCarta = v.ultimaCarta as boolean;
  if (str(v.arcana)) w.arcana = v.arcana as string;
  if (str(v.suitDominante)) w.suitDominante = v.suitDominante as string;
  if (Array.isArray(v.diaSemana)) w.diaSemana = (v.diaSemana as Json[]).filter((x): x is number => typeof x === 'number');
  return w;
}

function deck(v: Json): DeckDef | null {
  if (!isObj(v) || !str(v.family)) return null;
  const models: DeckModelDef[] = (Array.isArray(v.models) ? v.models : []).filter(isObj).filter(m => str(m.id)).map(m => ({
    id: m.id as string,
    deckSize: num(m.deckSize),
    art: str(m.art),
    minors: str(m.minors),
    pattern: str(m.pattern),
    numerals: strMap(m.numerals),
    reversedProbability: num(m.reversedProbability),
  }));
  const cards: CardDef[] = (Array.isArray(v.cards) ? v.cards : []).filter(isObj).filter(c => str(c.id)).map(c => ({
    id: c.id as string,
    arcana: c.arcana === 'major' ? 'major' : 'minor',
    number: num(c.number),
    suit: str(c.suit),
    rank: str(c.rank),
    court: bool(c.court),
    only48: bool(c.only48),
  }));
  return { family: v.family as string, reversedProbability: num(v.reversedProbability), defaultModel: str(v.defaultModel) ?? '', models, cards };
}

function cardsI18n(v: Json): CardsI18n | null {
  if (!isObj(v)) return null;
  const suits: CardsI18n['suits'] = {};
  if (isObj(v.suits)) for (const [k, s] of Object.entries(v.suits)) if (isObj(s)) suits[k] = { name: str(s.name), description: str(s.description) };
  const models: CardsI18n['models'] = {};
  if (isObj(v.models)) {
    for (const [k, m] of Object.entries(v.models)) {
      if (isObj(m)) models[k] = { name: str(m.name), description: str(m.description), cardNames: strMap(m.cardNames) };
    }
  }
  return { family: str(v.family), name: str(v.name), description: str(v.description), suits, models, cards: strMap(v.cards) };
}

function spreadI18n(v: Json): SpreadI18n | null {
  if (!isObj(v)) return null;
  const positions: SpreadI18n['positions'] = {};
  if (isObj(v.positions)) {
    for (const [k, p] of Object.entries(v.positions)) if (isObj(p)) positions[k] = { label: str(p.label), inline: str(p.inline), hint: str(p.hint) };
  }
  return { name: str(v.name), short: str(v.short), description: str(v.description), positions };
}

function meaning(v: Json): Meaning | null {
  if (!isObj(v)) return null;
  return { keywords: strList(v.keywords), upright: listMap(v.upright), reversed: listMap(v.reversed) };
}

function fragment(v: Json): Fragment | null {
  if (!isObj(v) || !str(v.id) || !str(v.slot) || !str(v.text)) return null;
  return { id: v.id as string, slot: v.slot as string, tones: strList(v.tones), weight: num(v.weight), when: when(v.when), text: v.text as string };
}

function interaction(v: Json): InteractionDef | null {
  if (!isObj(v) || !str(v.id) || !isObj(v.branches)) return null;
  const b = v.branches;
  return {
    id: v.id as string, tones: strList(v.tones), weight: num(v.weight), when: when(v.when), prompt: str(v.prompt) ?? '',
    branches: { si: str(b.si) ?? '', no: str(b.no) ?? '', skip: str(b.skip) ?? '' },
  };
}

function sheet(v: Json): ProvinceSheet | null {
  if (!isObj(v) || !str(v.code)) return null;
  return {
    code: v.code as string, nombre: str(v.nombre) ?? '', comunidad: str(v.comunidad) ?? '', gentilicio: str(v.gentilicio) ?? '',
    plato: strList(v.plato), fiesta: strList(v.fiesta), clima: strList(v.clima), chascarrillos: strList(v.chascarrillos),
  };
}

function pendulum(v: Json): PendulumDef {
  const models: Record<string, PendulumModelDef> = {};
  const o = isObj(v) ? v : {};
  if (isObj(o.models)) {
    for (const [k, m] of Object.entries(o.models)) {
      if (isObj(m)) models[k] = { nombre: str(m.nombre), personalidad: str(m.personalidad), lines: listMap(m.lines) };
    }
  }
  const chakras: ChakraDef[] = (Array.isArray(o.chakras) ? o.chakras : []).filter(isObj).map(c => ({
    id: str(c.id) ?? '', nombre: str(c.nombre) ?? '', informes: strList(c.informes),
  }));
  return { lines: listMap(o.lines), models, ouijaWords: strList(o.ouijaWords), chakras };
}

function labels(v: Json): ServerLabels {
  const o = isObj(v) ? v : {};
  const colors: LuckyColor[] = (Array.isArray(o.luckyColors) ? o.luckyColors : [])
    .filter(isObj).filter(c => str(c.name) && str(c.hex)).map(c => ({ name: c.name as string, hex: c.hex as string }));
  return {
    signos: strMap(o.signos), dias: strMap(o.dias), estaciones: strMap(o.estaciones), fasesLunares: strMap(o.fasesLunares),
    tonos: strMap(o.tonos), temas: strMap(o.temas), respuestas: strMap(o.respuestas), luckyColors: colors,
    disclaimer: str(o.disclaimer) ?? null, disclaimerSalud: str(o.disclaimerSalud) ?? null,
    saludFallback: str(o.saludFallback) ?? null, provinciaExtranjero: str(o.provinciaExtranjero) ?? null,
    provinciaDesconocida: str(o.provinciaDesconocida) ?? null,
  };
}

// ---------------------------------------------------------------- helpers de dominio (DeckDef, CardsI18n…)

export function deckModel(d: DeckDef, id: string): DeckModelDef | undefined {
  return d.models.find(m => m.id === id);
}
export function reversedProbabilityFor(d: DeckDef, m: DeckModelDef | undefined): number {
  if (m?.reversedProbability !== undefined) return m.reversedProbability;
  return d.reversedProbability ?? 0;
}
/** Los modelos de 40 cartas excluyen las marcadas only48. */
export function cardsFor(d: DeckDef, m: DeckModelDef | undefined): CardDef[] {
  return m?.deckSize === 40 ? d.cards.filter(c => !c.only48) : d.cards;
}
export function maxCards(s: SpreadDef): number {
  return s.size ?? s.positions.length;
}
export function minCards(s: SpreadDef): number {
  return s.minSize ?? maxCards(s);
}
export function cardName(c: CardsI18n, modelId: string | undefined, cardId: string): string {
  const m = modelId ? c.models[modelId] : undefined;
  if (m?.cardNames && cardId in m.cardNames) return m.cardNames[cardId];
  return c.cards[cardId] ?? cardId;
}
export function suitName(c: CardsI18n, suit: string | undefined): string | null {
  if (suit === undefined) return null;
  return c.suits[suit]?.name ?? suit;
}
export function meaningVariants(m: Meaning, reversed: boolean, tema: string | null): string[] {
  const o = reversed ? m.reversed : m.upright;
  let v = tema === null ? undefined : o[tema];
  if (!v || v.length === 0) v = o.general;
  return v ?? [];
}
/** Frases de una clave para un péndulo: las del modelo sustituyen a las generales. */
export function pendulumLines(p: PendulumDef, model: string | undefined, key: string): string[] {
  const own = model ? p.models[model]?.lines[key] : undefined;
  if (own && own.length) return own;
  return p.lines[key] ?? [];
}

const EMPTY_CARDS: CardsI18n = { suits: {}, models: {}, cards: {} };

// ---------------------------------------------------------------- LangContent

export class LangContent {
  private readonly bySlot = new Map<string, Fragment[]>();

  constructor(
    readonly lang: string,
    private readonly cardsByFamily: Record<string, CardsI18n>,
    private readonly spreads: Record<string, SpreadI18n>,
    private readonly meanings: Record<string, Record<string, Meaning>>,
    readonly fragments: Fragment[],
    /** En orden de fichero (LinkedHashMap en Java). */
    readonly interactions: Map<string, InteractionDef>,
    private readonly sheets: Map<string, ProvinceSheet>,
    readonly titles: Json | null,
    readonly onboarding: Json | null,
    readonly pendulumRaw: Json | null,
    readonly pendulum: PendulumDef,
    readonly labels: ServerLabels,
  ) {
    for (const f of fragments) {
      const l = this.bySlot.get(f.slot);
      if (l) l.push(f);
      else this.bySlot.set(f.slot, [f]);
    }
  }

  cards(family: string): CardsI18n {
    return this.cardsByFamily[family] ?? EMPTY_CARDS;
  }
  spread(id: string): SpreadI18n | undefined {
    return this.spreads[id];
  }
  meaning(family: string, cardId: string): Meaning | undefined {
    return this.meanings[family]?.[cardId];
  }
  fragmentsOf(slot: string): Fragment[] {
    return this.bySlot.get(slot) ?? [];
  }
  province(code: string | undefined | null): ProvinceSheet | undefined {
    return code == null ? undefined : this.sheets.get(code);
  }
}

// ---------------------------------------------------------------- ContentSet (ContentRepository)

export interface ContentSetOptions {
  /** Etiquetas base (equivalente a classpath:arcana-defaults/es.json); content/{lang}/server-labels.json las sobrescribe. */
  defaultLabels?: Json;
  /** Idiomas conocidos aunque aún no estén cargados (carga perezosa). */
  knownLanguages?: Iterable<string>;
}

export class ContentSet {
  private readonly files = new Map<string, Json>();
  private readonly langCache = new Map<string, LangContent>();
  private readonly langs = new Set<string>([DEFAULT_LANG]);
  private decksCache: Map<string, DeckDef> | null = null;
  private spreadsCache: SpreadDef[] | null = null;
  private provincesCache: ProvinceDef[] | null = null;

  constructor(files: Record<string, Json>, private readonly opts: ContentSetOptions = {}) {
    for (const l of opts.knownLanguages ?? []) this.langs.add(l);
    this.addFiles(files);
  }

  /** Añade ficheros (p. ej. al cargar perezosamente otro idioma). Invalida la caché del idioma afectado. */
  addFiles(files: Record<string, Json>): void {
    for (const [path, v] of Object.entries(files)) {
      if (path.startsWith('schemas/') || path.startsWith('tools/')) continue;
      this.files.set(path, v);
      const first = path.split('/')[0];
      if (path.includes('/') && LANG_RE.test(first)) {
        this.langs.add(first);
        this.langCache.delete(first);
        if (first === DEFAULT_LANG) this.langCache.clear();
      } else {
        this.decksCache = null;
        this.spreadsCache = null;
        this.provincesCache = null;
      }
    }
  }

  languages(): Set<string> {
    return this.langs;
  }

  /** Ficheros .json directamente dentro de dir, ordenados (como ContentStore.list). */
  list(dir: string): string[] {
    const prefix = dir.endsWith('/') ? dir : dir + '/';
    return [...this.files.keys()]
      .filter(p => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
      .map(p => p.slice(prefix.length))
      .sort();
  }

  has(path: string): boolean {
    return this.files.has(path);
  }

  decks(): DeckDef[] {
    const m = this.deckMap();
    return FAMILIES.map(f => m.get(f)).filter((d): d is DeckDef => d !== undefined);
  }
  deck(family: string | undefined): DeckDef | undefined {
    return family === undefined ? undefined : this.deckMap().get(family);
  }
  private deckMap(): Map<string, DeckDef> {
    if (!this.decksCache) {
      this.decksCache = new Map();
      for (const f of FAMILIES) {
        const d = deck(this.files.get(`decks/${f}.json`));
        if (d) this.decksCache.set(d.family, d);
      }
    }
    return this.decksCache;
  }

  spreads(): SpreadDef[] {
    if (!this.spreadsCache) {
      const n = this.files.get('spreads.json');
      const raw = isObj(n) && Array.isArray(n.spreads) ? n.spreads : [];
      const out: SpreadDef[] = raw.filter(isObj).filter(s => str(s.id)).map(s => ({
        id: s.id as string, size: num(s.size), minSize: num(s.minSize), families: strList(s.families),
        positions: strList(s.positions), layout: str(s.layout) ?? 'row', order: num(s.order), phase: num(s.phase),
      }));
      // List.sort es estable: mismo orden que el backend
      out.sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
      this.spreadsCache = out;
    }
    return this.spreadsCache;
  }
  spread(id: string): SpreadDef | undefined {
    return this.spreads().find(s => s.id === id);
  }

  provinces(): ProvinceDef[] {
    if (!this.provincesCache) {
      const n = this.files.get('provinces.json');
      const raw = isObj(n) && Array.isArray(n.provinces) ? n.provinces : [];
      this.provincesCache = raw.filter(isObj).filter(p => str(p.code)).map(p => ({
        code: p.code as string, nombre: str(p.nombre) ?? '', nombreOficial: str(p.nombreOficial),
        comunidad: str(p.comunidad) ?? null, capital: str(p.capital) ?? null, zona: str(p.zona),
      }));
    }
    return this.provincesCache;
  }
  province(code: string | undefined | null): ProvinceDef | undefined {
    return code == null ? undefined : this.provinces().find(p => p.code === code);
  }

  /** Idioma con fallback: desconocido → es. */
  lang(lang: string | undefined): LangContent {
    const l = lang && this.langs.has(lang) ? lang : DEFAULT_LANG;
    let c = this.langCache.get(l);
    if (!c) {
      c = this.buildLang(l);
      this.langCache.set(l, c);
    }
    return c;
  }

  private merged(lang: string, rel: string): Json {
    const base = this.files.get(`${DEFAULT_LANG}/${rel}`);
    const own = lang === DEFAULT_LANG ? undefined : this.files.get(`${lang}/${rel}`);
    return mergeJson(base, own);
  }

  private buildLang(lang: string): LangContent {
    const es = lang === DEFAULT_LANG;
    const cards: Record<string, CardsI18n> = {};
    const meanings: Record<string, Record<string, Meaning>> = {};
    for (const f of FAMILIES) {
      const c = cardsI18n(this.merged(lang, `cards/${f}.json`));
      if (c) cards[f] = c;
      meanings[f] = bindMap(this.merged(lang, `meanings/${f}.json`), meaning);
    }
    const sp = this.merged(lang, 'spreads.json');
    const spreads = bindMap(isObj(sp) ? sp.spreads : undefined, spreadI18n);

    const fragments = this.fragmentsFor(lang, es);

    const interactionsFile = !es && this.files.has(`${lang}/interactions.json`) ? lang : DEFAULT_LANG;
    const interactions = new Map<string, InteractionDef>();
    const inode = this.files.get(`${interactionsFile}/interactions.json`);
    for (const i of isObj(inode) && Array.isArray(inode.interactions) ? inode.interactions : []) {
      const x = interaction(i);
      if (x) interactions.set(x.id, x);
    }

    const sheets = new Map<string, ProvinceSheet>();
    const sheetFiles = new Set(this.list(`${DEFAULT_LANG}/provinces`));
    if (!es) for (const f of this.list(`${lang}/provinces`)) sheetFiles.add(f);
    for (const file of [...sheetFiles].sort()) {
      const path = !es && this.files.has(`${lang}/provinces/${file}`) ? `${lang}/provinces/${file}` : `${DEFAULT_LANG}/provinces/${file}`;
      const s = sheet(this.files.get(path));
      if (s) sheets.set(s.code, s);
    }

    const nn = (v: Json) => (v === undefined || v === null ? null : v);
    const pendulumRaw = nn(this.merged(lang, 'pendulum.json'));
    const labelsNode = mergeJson(this.opts.defaultLabels, this.merged(lang, 'server-labels.json'));

    return new LangContent(lang, cards, spreads, meanings, fragments, interactions, sheets,
      nn(this.merged(lang, 'titles.json')), nn(this.merged(lang, 'onboarding.json')), pendulumRaw,
      pendulumRaw === null ? pendulum({}) : pendulum(pendulumRaw), labels(labelsNode));
  }

  /** Fallback por slot: si el idioma tiene algún fragmento de un slot se usan sólo los suyos. */
  private fragmentsFor(lang: string, es: boolean): Fragment[] {
    const base = this.readFragments(DEFAULT_LANG);
    if (es) return base;
    const own = this.readFragments(lang);
    const ownSlots = new Set(own.map(f => f.slot));
    return [...own, ...base.filter(f => !ownSlots.has(f.slot))];
  }

  private readFragments(lang: string): Fragment[] {
    const out: Fragment[] = [];
    const seen = new Set<string>();
    for (const file of this.list(`${lang}/fragments`)) {
      const n = this.files.get(`${lang}/fragments/${file}`);
      for (const f of isObj(n) && Array.isArray(n.fragments) ? n.fragments : []) {
        const x = fragment(f);
        if (x && !seen.has(x.id)) {
          seen.add(x.id);
          out.push(x);
        }
      }
    }
    return out;
  }
}

function bindMap<T>(node: Json, fn: (v: Json) => T | null): Record<string, T> {
  const out: Record<string, T> = {};
  if (isObj(node)) {
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue;
      const x = fn(v);
      if (x !== null) out[k] = x;
    }
  }
  return out;
}
