// Port de es.arcana.pendulum.PendulumService y PendulumContentController.
import { moment, type Moment } from './astro';
import { pendulumLines, type ContentSet, type LangContent } from './content';
import { EngineError } from './errors';
import { provinciaName } from './narrative';
import { SplittableRandom, seed64, type TextRandom } from './random';
import { uniform, type Ctx } from './situation';
import { SERVER_VARIABLES, gentilicio, render, resolvable, variables as textVariables, type Vars } from './text';
import type { PendulumContent, PendulumResponse } from './types';

export const P_SI = 0.45;
export const P_NO = 0.45;

/** Claves de `lines` que expone GET /content/pendulum (sin las de respuesta). */
export const RITUAL_KEYS = ['intro', 'calibrar.intro', 'calibrar.si', 'calibrar.no', 'concentrar', 'repetida', 'enfado', 'medianoche'];
export const PENDULUM_MODEL_IDS = ['cuarzo', 'amatista', 'laton', 'obsidiana', 'madera', 'camara', 'llave', 'anillo', 'chorizo'];

export interface PendulumAsk {
  mode: string;
  model: string | null;
  options: number | null;
  ctx: Ctx;
}

export class PendulumEngine {
  constructor(
    private readonly content: ContentSet,
    private readonly now: () => Date = () => new Date(),
    private readonly random?: () => number,
  ) {}

  answer(req: PendulumAsk, lang: string, rng: TextRandom = new SplittableRandom(seed64(this.random))): PendulumResponse {
    const lc = this.content.lang(lang);
    const pc = lc.pendulum;
    const ctx = req.ctx;
    const extra = new Map<string, string>();
    const result: Record<string, unknown> = {};
    let key: string;
    let provinceCode = ctx.provincia;

    switch (req.mode) {
      case 'sino': {
        const r = rng.nextDouble();
        const a = r < P_SI ? 'si' : r < P_SI + P_NO ? 'no' : 'duda';
        result.answer = a;
        extra.set('respuesta', lc.labels.respuestas[a] ?? a);
        key = `sino.${a}`;
        break;
      }
      case 'tablero': {
        const sector = rng.nextInt(5);
        result.sector = sector;
        extra.set('respuesta', lc.labels.respuestas[`tablero.${sector}`] ?? String(sector));
        key = `tablero.${sector}`;
        break;
      }
      case 'porcentaje': {
        const value = rng.nextInt(101);
        result.value = value;
        extra.set('porcentaje', String(value));
        key = `porcentaje.${value >= 67 ? 'alto' : value >= 34 ? 'medio' : 'bajo'}`;
        break;
      }
      case 'ouija': {
        const word = uniform(pc.ouijaWords, rng) ?? 'SI';
        result.word = word;
        extra.set('palabra', word);
        key = 'ouija';
        break;
      }
      case 'mapa': {
        const real = this.content.provinces().filter(p => p.code !== 'XX');
        const p = uniform(real, rng);
        if (!p) throw EngineError.badRequest('No hay provincias cargadas');
        result.provincia = p.code;
        provinceCode = p.code;
        key = 'mapa';
        break;
      }
      case 'opciones': {
        if (req.options === null) throw EngineError.badRequest('options es obligatorio en modo opciones (2–6)');
        result.index = rng.nextInt(req.options);
        key = 'opciones';
        break;
      }
      case 'chakras': {
        const levels: { id: string; nivel: number; informe: string | null }[] = [];
        for (const c of pc.chakras) {
          const nivel = rng.nextInt(101);
          const t = uniform(c.informes, rng);
          const informe = t === undefined ? null : render(t, rng, v => (v === 'nivel' ? String(nivel) : undefined));
          levels.push({ id: c.id, nivel, informe });
        }
        result.levels = levels;
        key = 'chakras.intro';
        break;
      }
      default:
        throw EngineError.badRequest(`mode desconocido: ${req.mode}`);
    }

    const m = moment(ctx, this.now());
    const vars = this.variables(lc, ctx, m, provinceCode, extra, rng);
    let text = line(lc, req.model, key, vars, rng);
    if (m.hora === 0) {
      const midnight = line(lc, req.model, 'medianoche', vars, rng);
      if (midnight !== '') text = text === '' ? midnight : `${text} ${midnight}`;
    }
    return { mode: req.mode, result, text } as unknown as PendulumResponse;
  }

  private variables(lc: LangContent, ctx: Ctx, m: Moment, provinceCode: string | null, extra: Map<string, string>,
    rng: TextRandom): Vars {
    const labels = lc.labels;
    const sheet = lc.province(provinceCode);
    const prov = this.content.province(provinceCode);
    return (name: string) => {
      if (extra.has(name)) return extra.get(name);
      switch (name) {
        case 'provincia': return provinciaName(labels, provinceCode, sheet?.nombre, prov?.nombre);
        case 'comunidad': return sheet ? sheet.comunidad : (prov?.comunidad ?? undefined);
        case 'gentilicio': return sheet ? gentilicio(sheet.gentilicio) : undefined;
        case 'plato': return sheet ? uniform(sheet.plato, rng) : undefined;
        case 'fiesta': return sheet ? uniform(sheet.fiesta, rng) : undefined;
        case 'clima': return sheet ? uniform(sheet.clima, rng) : undefined;
        case 'signo': return ctx.signo === null ? undefined : (labels.signos[ctx.signo] ?? ctx.signo);
        case 'decada': return ctx.decada === null ? undefined : String(ctx.decada);
        case 'numeroVida': return ctx.numeroVida === null ? undefined : String(ctx.numeroVida);
        case 'hora': return String(m.hora);
        case 'diaSemana': return labels.dias[String(m.diaSemana)] ?? String(m.diaSemana);
        case 'estacion': return labels.estaciones[m.estacion] ?? m.estacion;
        case 'faseLunar': return labels.fasesLunares[m.faseLunar] ?? m.faseLunar;
        default: return undefined;
      }
    };
  }

  /** GET /content/pendulum: modelos (nombre, personalidad, líneas de ritual) y líneas de ritual. */
  content_(lang: string, provincia: string | null): PendulumContent {
    const lc = this.content.lang(lang);
    if (lc.pendulumRaw === null) throw EngineError.unavailable('Contenido no disponible: pendulum.json');
    const pc = lc.pendulum;
    const sheet = lc.province(provincia);
    const prov = this.content.province(provincia);
    const vars: Vars = name => {
      switch (name) {
        case 'provincia': return provinciaName(lc.labels, provincia, sheet?.nombre, prov?.nombre);
        case 'comunidad': return sheet ? sheet.comunidad : (prov?.comunidad ?? undefined);
        case 'gentilicio': return sheet ? gentilicio(sheet.gentilicio) : undefined;
        default: return undefined;
      }
    };
    const models: PendulumContent['models'] = {};
    for (const id of PENDULUM_MODEL_IDS) {
      const m = pc.models[id];
      if (m) {
        models[id] = {
          nombre: resolveLiteral(m.nombre ?? null, vars) as string,
          personalidad: resolveLiteral(m.personalidad ?? null, vars) as string,
          lines: ritualLines(m.lines, vars),
        };
      }
    }
    return { models, lines: ritualLines(pc.lines, vars) };
  }
}

function line(lc: LangContent, model: string | null, key: string, vars: Vars, rng: TextRandom): string {
  const candidates = pendulumLines(lc.pendulum, model ?? undefined, key).filter(t => resolvable(t, SERVER_VARIABLES, vars));
  const t = uniform(candidates, rng);
  return t === undefined ? '' : render(t, rng, vars);
}

function ritualLines(lines: Record<string, string[]>, vars: Vars): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const k of RITUAL_KEYS) {
    const l = (lines[k] ?? []).filter(t => resolvable(t, SERVER_VARIABLES, vars)).map(t => resolveLiteral(t, vars) as string);
    if (l.length) out[k] = l;
  }
  return out;
}

/**
 * Sustituye variables de servidor con valor; deja literal el resto (variables del navegador y alternativas [a|b],
 * que sortea el navegador). Una variable de servidor sin valor se elimina.
 */
function resolveLiteral(text: string | null, vars: Vars): string | null {
  if (text === null) return null;
  let out = text;
  for (const v of textVariables(text)) {
    const value = vars(v);
    if (value !== undefined) out = out.split(`{${v}}`).join(value);
    else if (SERVER_VARIABLES.has(v)) out = out.split(`{${v}}`).join('').replace(/\s{2,}/g, ' ').trim();
  }
  return out;
}
