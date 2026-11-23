// Estado de sesión en MEMORIA (Zustand sin middleware de persistencia).
// Ningún dato personal se escribe en cookies, localStorage ni sessionStorage. La única
// excepción (QA-09, decisión del JP) es el indicador NO personal `arcana.blocked`: en la web, `=1` en
// sessionStorage (sobrevive a recargar la pestaña); en la app (A-4), `{"t": <ms>}` en localStorage
// durante 24 h (sobrevive a cerrar y reabrir la app).
import { create } from 'zustand';
import type {
  Answer, DeckFamily, ReadingContext, ReadingResponse, Signo, Tema, PendulumModel,
} from '../lib/types';
import { newToneSeed, randomInt } from '../lib/random';
import { derive, parseIsoDate } from '../lib/astro';
import { isApp } from '../lib/mode';

export type Screen =
  | 'gate' | 'name' | 'age' | 'province' | 'deck' | 'spread' | 'shuffle' | 'cut' | 'reading' | 'closing'
  | 'pendulum' | 'titles' | 'legal' | 'privacy' | 'blocked' | 'bye';

export const FLOW: Screen[] = ['gate', 'name', 'age', 'province', 'deck', 'spread', 'shuffle', 'cut', 'reading', 'closing'];

const BLOCK_KEY = 'arcana.blocked';
/** En la app (A-4) el bloqueo sobrevive a cerrar y reabrir: localStorage con marca de tiempo, 24 h. */
export const APP_BLOCK_MS = 24 * 60 * 60 * 1000;
export function readBlockedFlag(now = Date.now()): boolean {
  try {
    if (isApp()) {
      const raw = globalThis.localStorage?.getItem(BLOCK_KEY);
      if (!raw) return false;
      const t = Number(JSON.parse(raw)?.t);
      if (Number.isFinite(t) && t > now) { // reloj atrasado (N-3): no desbloquea; se reinicia a ahora (máx. 24 h)
        globalThis.localStorage?.setItem(BLOCK_KEY, JSON.stringify({ t: now }));
        return true;
      }
      if (Number.isFinite(t) && now - t < APP_BLOCK_MS) return true;
      globalThis.localStorage?.removeItem(BLOCK_KEY); // caducado o corrupto
      return false;
    }
    return globalThis.sessionStorage?.getItem(BLOCK_KEY) === '1';
  } catch { return false; }
}
function writeBlockedFlag(now = Date.now()) {
  try {
    if (isApp()) globalThis.localStorage?.setItem(BLOCK_KEY, JSON.stringify({ t: now }));
    else globalThis.sessionStorage?.setItem(BLOCK_KEY, '1');
  } catch { /* sin almacenamiento: sólo en memoria */ }
}

export interface SessionData {
  screen: Screen;
  blocked: boolean;          // menor de edad: sesión cortada
  epoch: number;             // cambia en cada borrado: la App desmonta todo (QA-16)
  returnTo: Screen | null;
  adult: boolean;            // pasó la puerta +18
  name: string;
  birthDate: string | null;  // ISO AAAA-MM-DD, sólo en memoria
  age: number | null;
  signo: Signo | null;
  decada: number | null;
  numeroVida: number | null;
  province: string | null;   // código INE o "XX"
  deck: DeckFamily | null;
  model: string | null;
  spread: string | null;
  tema: Tema;
  cutIndex: 0 | 1 | 2 | null;
  picks: number[];
  toneSeed: number;
  yesAxis: 'vertical' | 'horizontal';
  recentFragmentIds: string[][]; // ids usados en las 3 últimas lecturas
  answers: Record<string, Answer>; // respuestas Sí/No de la lectura (por id de interacción)
  reading: ReadingResponse | null;
  readingsDone: number;
  pendulumModel: PendulumModel;
}

export interface SessionActions {
  go(screen: Screen): void;
  openSide(screen: 'pendulum' | 'titles' | 'legal' | 'privacy'): void;
  back(): void;
  passGate(birthDate: string | null): 'ok' | 'minor' | 'invalid';
  setName(name: string): void;
  setBirthDate(iso: string): 'ok' | 'minor' | 'invalid';
  setAgeOnly(age: number): 'ok' | 'minor' | 'invalid';
  setProvince(code: string): void;
  setDeck(deck: DeckFamily, model?: string | null): void;
  setModel(model: string): void;
  setSpread(spread: string): void;
  setTema(tema: Tema): void;
  setCut(i: 0 | 1 | 2): void;
  setPicks(p: number[]): void;
  setReading(r: ReadingResponse): void;
  answer(interactionId: string, a: Answer): void;
  newReading(): void;
  setPendulumModel(m: PendulumModel): void;
  block(): void;
  /** Borra todos los datos de sesión. Si la sesión estaba bloqueada (menor), sigue bloqueada. */
  reset(to?: Screen): void;
  context(now?: Date, lang?: string): ReadingContext;
  flatRecentIds(): string[];
}

export type SessionStore = SessionData & SessionActions;

export function initialData(): SessionData {
  const blocked = readBlockedFlag();
  return {
    screen: blocked ? 'blocked' : 'gate',
    blocked,
    epoch: 0,
    returnTo: null,
    adult: false,
    name: '',
    birthDate: null,
    age: null,
    signo: null,
    decada: null,
    numeroVida: null,
    province: null,
    deck: null,
    model: null,
    spread: null,
    tema: 'general',
    cutIndex: null,
    picks: [],
    toneSeed: newToneSeed(),
    yesAxis: randomInt(2) === 0 ? 'vertical' : 'horizontal',
    recentFragmentIds: [],
    answers: {},
    reading: null,
    readingsDone: 0,
    pendulumModel: 'cuarzo',
  };
}

let currentLang = 'es';
export function setSessionLang(lang: string) { currentLang = lang; }

export const useSession = create<SessionStore>()((set, get) => ({
  ...initialData(),

  go(screen) {
    const s = get();
    if (s.blocked) {
      if (screen === 'legal' || screen === 'privacy' || screen === 'blocked') set({ screen });
      return;
    }
    if (!s.adult && screen !== 'gate' && screen !== 'legal' && screen !== 'privacy' && screen !== 'bye') {
      set({ screen: 'gate' });
      return;
    }
    set({ screen });
  },
  openSide(screen) {
    const s = get();
    if (s.blocked) {
      // Con la sesión bloqueada sólo se pueden leer los textos legales (QA-08).
      if (screen === 'legal' || screen === 'privacy') set({ screen, returnTo: 'blocked' });
      return;
    }
    if (!s.adult && (screen === 'pendulum' || screen === 'titles')) { set({ screen: 'gate' }); return; }
    const side: Screen[] = ['pendulum', 'titles', 'legal', 'privacy'];
    set({ returnTo: side.includes(s.screen) ? s.returnTo : s.screen, screen });
  },
  back() {
    const s = get();
    if (s.blocked) { set({ screen: 'blocked', returnTo: null }); return; }
    set({ screen: s.returnTo ?? (s.adult ? 'name' : 'gate'), returnTo: null });
  },

  passGate(birthDate) {
    if (birthDate) {
      const r = get().setBirthDate(birthDate);
      if (r !== 'ok') return r;
    }
    set({ adult: true, screen: 'name' });
    return 'ok';
  },
  setName(name) { set({ name: name.slice(0, 40) }); },
  setBirthDate(iso) {
    const b = parseIsoDate(iso);
    if (!b) return 'invalid';
    const d = derive(b);
    if (d.age > 120 || d.age < 0) return 'invalid';
    if (d.age < 18) { get().block(); return 'minor'; }
    set({ birthDate: iso, age: d.age, decada: d.decada, signo: d.signo, numeroVida: d.numeroVida });
    return 'ok';
  },
  setAgeOnly(age) {
    if (!Number.isInteger(age) || age < 0 || age > 120) return 'invalid';
    if (age < 18) { get().block(); return 'minor'; }
    set({ age, decada: Math.floor(age / 10) * 10, birthDate: null, signo: null, numeroVida: null });
    return 'ok';
  },
  setProvince(code) { set({ province: code }); },
  setDeck(deck, model = null) { set({ deck, model, spread: null }); },
  setModel(model) { set({ model }); },
  setSpread(spread) { set({ spread }); },
  setTema(tema) { set({ tema }); },
  setCut(i) { set({ cutIndex: i }); },
  setPicks(p) { set({ picks: p }); },
  setReading(r) {
    const recent = [...get().recentFragmentIds, r.usedFragmentIds ?? []].slice(-3);
    set({ reading: r, recentFragmentIds: recent, answers: {}, readingsDone: get().readingsDone + 1 });
  },
  answer(id, a) { set({ answers: { ...get().answers, [id]: a } }); },
  newReading() { set({ reading: null, cutIndex: null, picks: [], answers: {}, screen: 'deck' }); },
  setPendulumModel(m) { set({ pendulumModel: m }); },
  block() {
    // Se bloquea y se borra cualquier dato introducido.
    writeBlockedFlag();
    set({ ...initialData(), blocked: true, screen: 'blocked', epoch: get().epoch + 1 });
  },
  reset(to = 'bye') {
    const wasBlocked = get().blocked || readBlockedFlag();
    set({ ...initialData(), blocked: wasBlocked, screen: wasBlocked ? 'blocked' : to, epoch: get().epoch + 1 });
  },

  context(now = new Date(), lang = currentLang) {
    const s = get();
    const ctx: ReadingContext = {
      toneSeed: s.toneSeed,
      hora: now.getHours(),
      diaSemana: now.getDay() === 0 ? 7 : now.getDay(), // 1 = lunes … 7 = domingo
      lang,
      tema: s.tema,
    };
    if (s.signo) ctx.signo = s.signo;
    if (s.decada !== null) ctx.decada = s.decada;
    if (s.numeroVida !== null) ctx.numeroVida = s.numeroVida;
    if (s.province) ctx.provincia = s.province;
    return ctx;
  },
  flatRecentIds() { return Array.from(new Set(get().recentFragmentIds.flat())); },
}));
