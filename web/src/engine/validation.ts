// Port de las restricciones de Bean Validation de los DTO Java (ReadingDtos, PendulumDtos, ReadingContext).
// Mismo texto de error: "campo: mensaje" ordenados y unidos por "; ", como ApiExceptionHandler.
import { EngineError } from './errors';
import { EMPTY_CTX, type Ctx } from './situation';

const RX = {
  family: /^(tarot|spanish)$/,
  slug: /^[a-z0-9]+(-[a-z0-9]+)*$/,
  tema: /^(general|amor|trabajo|dinero|salud)$/,
  tone: /^(mistica|abuela|teletienda|ironica|dramatica|coach)$/,
  signo: /^(aries|tauro|geminis|cancer|leo|virgo|libra|escorpio|sagitario|capricornio|acuario|piscis)$/,
  province: /^(0[1-9]|[1-4][0-9]|5[0-2]|XX)$/,
  lang: /^[a-z]{2,3}$/,
  pendulumModel: /^(cuarzo|amatista|laton|obsidiana|madera|camara|llave|anillo|chorizo)$/,
  pendulumMode: /^(sino|tablero|porcentaje|ouija|mapa|opciones|chakras)$/,
  answer: /^(si|no|skip)$/,
};
export const PROVINCE_MESSAGE = 'provincia debe ser un código INE "01"…"52" o "XX"';
export const TYPE_MESSAGE = 'JSON mal formado o con tipos incorrectos';

type Obj = Record<string, unknown>;

class Errors {
  readonly list: string[] = [];
  add(field: string, msg: string) {
    this.list.push(`${field}: ${msg}`);
  }
  throwIfAny() {
    if (this.list.length) throw EngineError.badRequest([...this.list].sort().join('; '));
  }
}

const absent = (v: unknown) => v === undefined || v === null;
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

/** Tipos incorrectos = 400 «JSON mal formado…» (Jackson no puede deserializar). */
function typeCheck(cond: boolean): void {
  if (!cond) throw EngineError.badRequest(TYPE_MESSAGE);
}

function optString(o: Obj, k: string): string | null {
  const v = o[k];
  if (absent(v)) return null;
  typeCheck(typeof v === 'string');
  return v as string;
}

function optInt(o: Obj, k: string): number | null {
  const v = o[k];
  if (absent(v)) return null;
  typeCheck(isInt(v));
  return v as number;
}

function pattern(e: Errors, field: string, v: string | null, rx: RegExp, msg: string) {
  if (v !== null && !rx.test(v)) e.add(field, msg);
}

function range(e: Errors, field: string, v: number | null, min: number, max: number, msg: string) {
  if (v !== null && (v < min || v > max)) e.add(field, msg);
}

function notBlank(e: Errors, field: string, v: string | null, msg: string) {
  if (v === null || v.trim() === '') e.add(field, msg);
}

/** ReadingContext (con prefijo de campo "context."). */
function context(raw: unknown, e: Errors): Ctx {
  if (absent(raw)) return EMPTY_CTX;
  typeCheck(typeof raw === 'object' && !Array.isArray(raw));
  const o = raw as Obj;
  const toneSeedRaw = o.toneSeed;
  let toneSeed: number | bigint | null = null;
  if (!absent(toneSeedRaw)) {
    typeCheck(isInt(toneSeedRaw) || typeof toneSeedRaw === 'bigint');
    toneSeed = toneSeedRaw as number | bigint;
  }
  const c: Ctx = {
    signo: optString(o, 'signo'), decada: optInt(o, 'decada'), numeroVida: optInt(o, 'numeroVida'),
    provincia: optString(o, 'provincia'), tema: optString(o, 'tema'), toneSeed, hora: optInt(o, 'hora'),
    diaSemana: optInt(o, 'diaSemana'), lang: optString(o, 'lang'),
  };
  pattern(e, 'context.signo', c.signo, RX.signo, 'signo desconocido');
  range(e, 'context.decada', c.decada, 10, 120, 'decada fuera de rango');
  range(e, 'context.numeroVida', c.numeroVida, 1, 33, 'numeroVida fuera de rango');
  pattern(e, 'context.provincia', c.provincia, RX.province, PROVINCE_MESSAGE);
  pattern(e, 'context.tema', c.tema, RX.tema, 'tema desconocido');
  range(e, 'context.hora', c.hora, 0, 23, 'hora fuera de rango');
  range(e, 'context.diaSemana', c.diaSemana, 1, 7, 'diaSemana debe ser 1 (lunes) … 7 (domingo)');
  pattern(e, 'context.lang', c.lang, RX.lang, 'lang no válido');
  return c;
}

function obj(raw: unknown): Obj {
  typeCheck(typeof raw === 'object' && raw !== null && !Array.isArray(raw));
  return raw as Obj;
}

export interface ValidReading {
  deck: string;
  model: string | null;
  spread: string;
  cutIndex: number;
  picks: number[];
  ctx: Ctx;
  recentFragmentIds: string[];
}

export function validateReading(raw: unknown): ValidReading {
  const o = obj(raw);
  const e = new Errors();
  const deck = optString(o, 'deck');
  const model = optString(o, 'model');
  const spread = optString(o, 'spread');
  const cutIndex = optInt(o, 'cutIndex');
  let picks: number[] | null = null;
  if (!absent(o.picks)) {
    typeCheck(Array.isArray(o.picks));
    for (const p of o.picks as unknown[]) typeCheck(p === null || isInt(p));
    picks = o.picks as number[];
  }
  let recent: string[] = [];
  if (!absent(o.recentFragmentIds)) {
    typeCheck(Array.isArray(o.recentFragmentIds));
    for (const r of o.recentFragmentIds as unknown[]) typeCheck(r === null || typeof r === 'string');
    recent = o.recentFragmentIds as string[];
  }
  const ctx = context(o.context, e);

  notBlank(e, 'deck', deck, 'deck es obligatorio');
  pattern(e, 'deck', deck, RX.family, 'deck debe ser tarot o spanish');
  pattern(e, 'model', model, RX.slug, 'model no válido');
  notBlank(e, 'spread', spread, 'spread es obligatorio');
  pattern(e, 'spread', spread, RX.slug, 'spread no válido');
  if (cutIndex === null) e.add('cutIndex', 'cutIndex es obligatorio');
  range(e, 'cutIndex', cutIndex, 0, 2, 'cutIndex debe ser 0, 1 o 2');
  if (picks === null) e.add('picks', 'picks es obligatorio');
  else {
    if (picks.length < 1 || picks.length > 10) e.add('picks', 'picks debe tener entre 1 y 10 índices');
    picks.forEach((p, i) => {
      if (p === null) e.add(`picks[${i}]`, 'pick nulo');
      else if (p < 0) e.add(`picks[${i}]`, 'pick negativo');
    });
  }
  if (recent.length > 500) e.add('recentFragmentIds', 'recentFragmentIds admite como mucho 500 ids');
  recent.forEach((r, i) => {
    if (r !== null && r.length > 120) e.add(`recentFragmentIds[${i}]`, 'id demasiado largo');
  });
  e.throwIfAny();
  return {
    deck: deck as string, model, spread: spread as string, cutIndex: cutIndex as number, picks: picks as number[], ctx,
    recentFragmentIds: recent.filter((r): r is string => r !== null),
  };
}

export interface ValidNextLine { interactionId: string; answer: string; tone: string | null; ctx: Ctx }

export function validateNextLine(raw: unknown): ValidNextLine {
  const o = obj(raw);
  const e = new Errors();
  const interactionId = optString(o, 'interactionId');
  const answer = optString(o, 'answer');
  const tone = optString(o, 'tone');
  const ctx = context(o.context, e);
  notBlank(e, 'interactionId', interactionId, 'interactionId es obligatorio');
  pattern(e, 'interactionId', interactionId, RX.slug, 'interactionId no válido');
  notBlank(e, 'answer', answer, 'answer es obligatorio');
  pattern(e, 'answer', answer, RX.answer, 'answer debe ser si, no o skip');
  pattern(e, 'tone', tone, RX.tone, 'tone desconocido');
  e.throwIfAny();
  return { interactionId: interactionId as string, answer: answer as string, tone, ctx };
}

export interface ValidPendulum { mode: string; model: string | null; options: number | null; ctx: Ctx }

export function validatePendulum(raw: unknown): ValidPendulum {
  const o = obj(raw);
  const e = new Errors();
  const mode = optString(o, 'mode');
  const model = optString(o, 'model');
  const options = optInt(o, 'options');
  const ctx = context(o.context, e);
  notBlank(e, 'mode', mode, 'mode es obligatorio');
  pattern(e, 'mode', mode, RX.pendulumMode, 'mode desconocido');
  pattern(e, 'model', model, RX.pendulumModel, 'model desconocido');
  range(e, 'options', options, 2, 6, 'options debe estar entre 2 y 6');
  e.throwIfAny();
  return { mode: mode as string, model, options, ctx };
}

/** Parámetros de los GET (@RequestParam con @Pattern): el mensaje va sin prefijo de campo. */
export function validateDeckParam(deck: string | undefined): void {
  if (deck !== undefined && !RX.family.test(deck)) throw EngineError.badRequest('deck debe ser tarot o spanish');
}
export function validateProvinceParam(p: string | undefined): void {
  if (p !== undefined && !RX.province.test(p)) throw EngineError.badRequest(PROVINCE_MESSAGE);
}
