// Selector de reacciones de onboarding (content/schemas/onboarding.schema.json).
// Se resuelve en el NAVEGADOR: el nombre nunca sale del dispositivo.
import { randomInt } from './random';
import { resolveText, type Rng, type Vars } from './resolve';

type Lines = string[];
export interface OnboardingContent {
  puerta?: { titulo?: string; pregunta?: string; aviso?: string; si?: string; no?: string; fecha?: string; bienvenida?: Lines };
  menor?: Lines;
  nombre?: {
    pregunta?: Lines;
    especiales?: Record<string, Lines>;
    santoral?: Record<string, string>;
    santoralLines?: Lines;
    porTerminacion?: Record<string, Lines>;
    porInicial?: Record<string, Lines>;
    porLongitud?: { min: number; max: number; lines: Lines }[];
    genericas?: Lines;
  };
  edad?: {
    pregunta?: Lines;
    porDecada?: Record<string, Lines>;
    signo?: Record<string, Lines>;
    numeroVida?: Record<string, Lines>;
    sinFecha?: Lines;
    genericas?: Lines;
  };
  provincia?: { pregunta?: Lines; genericas?: Lines; extranjero?: Lines };
}

/** Minúsculas, sin tildes ni diéresis (se conserva la ñ), espacios simples. */
export function normalizeName(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase('es')
    .replace(/ñ/g, '\u0000')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u0000/g, 'ñ')
    .replace(/\s+/g, ' ');
}

function one(lines: Lines | undefined, rng: Rng): string | null {
  if (!lines || !lines.length) return null;
  return lines[rng(lines.length)] ?? null;
}
function lookupName<T>(map: Record<string, T> | undefined, key: string): T | undefined {
  if (!map) return undefined;
  return map[key] ?? map[key.split(' ')[0] ?? ''];
}

export function nameVars(name: string): Vars {
  const clean = name.trim();
  return { nombre: clean, inicial: clean.charAt(0).toLocaleUpperCase('es'), letras: clean.replace(/\s+/g, '').length };
}

/**
 * Reacción al nombre. Prioridad: especiales > santoral > porTerminacion (la más larga) >
 * porInicial > porLongitud > genericas. Encadena como mucho dos (la 2.ª, con 50 %).
 */
export function nameReaction(file: OnboardingContent | null | undefined, name: string, rng: Rng = randomInt, extra: Vars = {}): string | null {
  const n = file?.nombre;
  const clean = name.trim();
  if (!clean) return null;
  const key = normalizeName(clean);
  const vars: Vars = { ...extra, ...nameVars(clean) };
  const tiers: (string | null)[] = [];

  tiers.push(one(lookupName(n?.especiales, key), rng));
  const santo = lookupName(n?.santoral, key);
  tiers.push(santo ? one(n?.santoralLines, rng)?.replace(/\{santo\}/g, santo) ?? null : null);
  let term: Lines | undefined;
  if (n?.porTerminacion) {
    const compact = key.replace(/[\s-]/g, '');
    const best = Object.keys(n.porTerminacion).filter((t) => compact.endsWith(t)).sort((a, b) => b.length - a.length)[0];
    term = best ? n.porTerminacion[best] : undefined;
  }
  tiers.push(one(term, rng));
  const ini = normalizeName(clean.charAt(0)).toLocaleUpperCase('es');
  tiers.push(one(n?.porInicial?.[ini], rng));
  const len = Number(vars.letras);
  tiers.push(one(n?.porLongitud?.find((r) => len >= r.min && len <= r.max)?.lines, rng));

  const found = tiers.filter((t): t is string => !!t);
  let out: string[];
  if (found.length) {
    out = [found[0]!];
    if (found.length > 1 && rng(2) === 0) out.push(found[1]!);
  } else {
    const g = one(n?.genericas, rng);
    out = g ? [g] : [];
  }
  if (!out.length) return null;
  return out.map((t) => resolveText(t, vars, rng)).join(' ');
}

export interface AgeInput { edad: number | null; decada: number | null; signo: string | null; numeroVida: number | null; hasDate: boolean }

/** Reacciones a la edad: década + signo (o sinFecha) + número de vida. Devuelve varias líneas. */
export function ageReactions(file: OnboardingContent | null | undefined, inp: AgeInput, rng: Rng = randomInt, extra: Vars = {}): string[] {
  const e = file?.edad;
  const vars: Vars = { ...extra, edad: inp.edad ?? undefined, decada: inp.decada ?? undefined, numeroVida: inp.numeroVida ?? undefined };
  const out: (string | null)[] = [];
  if (inp.decada !== null) out.push(one(e?.porDecada?.[String(inp.decada)], rng));
  if (inp.hasDate && inp.signo) out.push(one(e?.signo?.[inp.signo], rng));
  else out.push(one(e?.sinFecha, rng));
  if (inp.numeroVida !== null) out.push(one(e?.numeroVida?.[String(inp.numeroVida)], rng));
  let lines = out.filter((t): t is string => !!t);
  if (!lines.length) { const g = one(e?.genericas, rng); lines = g ? [g] : []; }
  return lines.map((t) => resolveText(t, vars, rng));
}

export function provinceReaction(
  file: OnboardingContent | null | undefined,
  code: string,
  vars: Vars,
  rng: Rng = randomInt,
): string | null {
  const p = file?.provincia;
  const t = code === 'XX' ? one(p?.extranjero, rng) : one(p?.genericas, rng);
  return t ? resolveText(t, vars, rng) : null;
}

export function linesOf(lines: Lines | undefined, vars: Vars = {}, rng: Rng = randomInt): string | null {
  const t = one(lines, rng);
  return t ? resolveText(t, vars, rng) : null;
}
