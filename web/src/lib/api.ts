// Cliente tipado de la API v1 (CONTRACTS §6).
// Regla de oro: nunca se envía nombre, edad exacta, fecha de nacimiento ni la pregunta.
// Los cuerpos se construyen con listas blancas de campos, así que aunque alguien pase
// un objeto con más datos, sólo viaja lo permitido.
import type {
  ArcanaApi, Deck, DeckFamily, PendulumContent, NextLineRequest, NextLineResponse, OnboardingFile, PendulumRequest,
  PendulumResponse, ProvinceInfo, ReadingContext, ReadingRequest, ReadingResponse, Spread, TitlesFile,
} from './types';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const BASE = '/api/v1';
let langProvider: () => string = () => 'es';
let fetchImpl: FetchLike | null = null;

export function setLangProvider(fn: () => string) { langProvider = fn; }
/** Permite inyectar el mock (VITE_MOCK_API=1) o un fetch de pruebas. */
export function setFetch(fn: FetchLike | null) { fetchImpl = fn; }

export class ApiFailure extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

const CONTEXT_KEYS = ['signo', 'decada', 'numeroVida', 'provincia', 'tema', 'toneSeed', 'hora', 'diaSemana', 'lang'] as const;

/** Copia sólo los campos anónimos permitidos del contexto. */
export function sanitizeContext(ctx: ReadingContext): ReadingContext {
  const src = ctx as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of CONTEXT_KEYS) {
    const v = src[k];
    if (v === undefined || v === null) continue;
    if (k === 'decada' && typeof v === 'number') out[k] = Math.floor(v / 10) * 10; // nunca edad exacta
    else out[k] = v;
  }
  return out as unknown as ReadingContext;
}

export function readingBody(r: ReadingRequest): ReadingRequest {
  return {
    deck: r.deck,
    model: r.model,
    spread: r.spread,
    cutIndex: r.cutIndex,
    picks: r.picks.map(Number),
    context: sanitizeContext(r.context),
    recentFragmentIds: (r.recentFragmentIds ?? []).map(String),
  };
}
export function nextLineBody(r: NextLineRequest): NextLineRequest {
  return { interactionId: r.interactionId, answer: r.answer, tone: r.tone, context: sanitizeContext(r.context) };
}
export function pendulumBody(r: PendulumRequest): PendulumRequest {
  const b: PendulumRequest = { mode: r.mode, model: r.model, context: sanitizeContext(r.context) };
  if (typeof r.options === 'number') b.options = r.options;
  return b;
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const lang = langProvider();
  const headers: Record<string, string> = { Accept: 'application/json', 'Accept-Language': lang };
  const init: RequestInit = { method, headers, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const f = fetchImpl ?? ((i: string, n?: RequestInit) => fetch(i, n));
  const res = await f(BASE + path, init);
  if (!res.ok) {
    let code = 'http_' + res.status, message = res.statusText;
    try { const e = await res.json(); code = e.error ?? code; message = e.message ?? message; } catch { /* sin cuerpo */ }
    throw new ApiFailure(res.status, code, message);
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------------------------
// Modo sin conexión (app Android, VITE_OFFLINE=1): el motor local responde sin red.
// El import es dinámico y está dentro de una condición que Vite resuelve en compilación, así que
// la web normal ni descarga ni empaqueta el motor ni el contenido.
// ---------------------------------------------------------------------------------------------
export const OFFLINE = import.meta.env.VITE_OFFLINE === '1';
let localApi: Promise<ArcanaApi> | null = null;
/** Inyecta un motor local (tests) o lo quita (null). */
export function setLocalApi(a: ArcanaApi | null) { localApi = a ? Promise.resolve(a) : null; }

function local(): Promise<ArcanaApi> | null {
  if (localApi) return localApi;
  if (OFFLINE) {
    const mods = import.meta.glob<{ createLocalApi(): ArcanaApi }>('../engine/index.ts');
    const load = mods['../engine/index.ts'];
    if (!load) throw new ApiFailure(500, 'no_engine', 'Motor local no disponible');
    localApi = load().then((m) => m.createLocalApi());
    return localApi;
  }
  return null;
}

/** Copia profunda: el motor local devuelve objetos internos que no deben compartirse con la UI. */
const clone = <T,>(x: T): T => (typeof structuredClone === 'function' ? structuredClone(x) : JSON.parse(JSON.stringify(x)));

async function via<T>(remote: () => Promise<T>, offline: (a: ArcanaApi, lang: string) => Promise<T>): Promise<T> {
  const l = local();
  if (!l) return remote();
  return clone(await offline(await l, langProvider()));
}

export const api = {
  decks: () => via(() => request<Deck[]>('GET', '/decks'), (a, l) => a.getDecks(l)),
  spreads: (deck: DeckFamily) => via(() => request<Spread[]>('GET', `/spreads?deck=${encodeURIComponent(deck)}`), (a, l) => a.getSpreads(l, deck)),
  provinces: () => via(() => request<ProvinceInfo[]>('GET', '/provinces'), (a, l) => a.getProvinces(l)),
  onboarding: () => via(() => request<OnboardingFile>('GET', '/content/onboarding'), (a, l) => a.getOnboarding(l)),
  titles: () => via(() => request<TitlesFile>('GET', '/titles'), (a, l) => a.getTitles(l)),
  /** Sólo el código de provincia (para «chorizo de {provincia}»), nunca más datos. */
  pendulumContent: (provincia?: string | null) => via(
    () => request<PendulumContent>('GET', '/content/pendulum' + (provincia ? `?provincia=${encodeURIComponent(provincia)}` : '')),
    (a, l) => a.getPendulumContent(l, provincia ?? undefined)),
  // También en local se aplican las listas blancas: el motor recibe lo mismo que recibiría el servidor.
  reading: (r: ReadingRequest) => via(() => request<ReadingResponse>('POST', '/readings', readingBody(r)), (a, l) => a.createReading(readingBody(r), l)),
  nextLine: (r: NextLineRequest) => via(() => request<NextLineResponse>('POST', '/readings/next-line', nextLineBody(r)), (a, l) => a.nextLine(nextLineBody(r), l)),
  pendulum: (r: PendulumRequest) => via(() => request<PendulumResponse>('POST', '/pendulum/answer', pendulumBody(r)), (a, l) => a.pendulumAnswer(pendulumBody(r), l)),
};

// Caché en memoria (contenido público, no personal).
const cache = new Map<string, Promise<unknown>>();
export function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const k = langProvider() + ':' + key;
  if (!cache.has(k)) {
    const p = fn().catch((e) => { cache.delete(k); throw e; });
    cache.set(k, p);
  }
  return cache.get(k) as Promise<T>;
}
