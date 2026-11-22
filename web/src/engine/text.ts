// Port de es.arcana.narrative.TextRenderer: mini‑sintaxis §3.2 ({variable} y [a|b|c]).
import type { TextRandom } from './random';

/** Variables que resuelve el motor (CONTRACTS §3.2). */
export const SERVER_VARIABLES: ReadonlySet<string> = new Set([
  'provincia', 'comunidad', 'gentilicio', 'plato', 'fiesta', 'clima', 'signo', 'decada', 'numeroVida', 'tema', 'carta',
  'palo', 'posicion', 'cartaAnterior', 'hora', 'diaSemana', 'estacion', 'faseLunar', 'tono',
]);

/** Variables que resuelve sólo el navegador: el motor las deja intactas. */
export const CLIENT_VARIABLES: ReadonlySet<string> = new Set(['nombre', 'inicial', 'edad', 'opcion']);

/** Resolución de variables: `undefined` = sin valor. */
export type Vars = (name: string) => string | undefined;

const ALTERNATIVE = /\[([^[\]]*)]/g;
const VARIABLE = /\{([A-Za-z][A-Za-z0-9_]*)}/g;

const varCache = new Map<string, string[]>();

/** Variables distintas de un texto, en orden de aparición (LinkedHashSet). */
export function variables(text: string | null | undefined): string[] {
  if (!text) return [];
  let v = varCache.get(text);
  if (!v) {
    const set = new Set<string>();
    for (const m of text.matchAll(VARIABLE)) set.add(m[1]);
    v = [...set];
    if (varCache.size < 20_000) varCache.set(text, v);
  }
  return v;
}

/** ¿Tienen valor todas las variables de servidor del texto? (las de navegador y desconocidas no cuentan). */
export function resolvable(text: string | null | undefined, serverVariables: ReadonlySet<string>, vars: Vars): boolean {
  for (const v of variables(text)) {
    if (serverVariables.has(v) && vars(v) === undefined) return false;
  }
  return true;
}

export function chooseAlternatives(text: string, rng: TextRandom): string {
  return text.replace(ALTERNATIVE, (_m, group: string) => {
    const options = group.split('|');
    return options[options.length === 1 ? 0 : rng.nextInt(options.length)];
  });
}

export function render(text: string, rng: TextRandom, vars: Vars): string;
export function render(text: string | null | undefined, rng: TextRandom, vars: Vars): string | null;
export function render(text: string | null | undefined, rng: TextRandom, vars: Vars): string | null {
  if (text === null || text === undefined) return null;
  const withAlternatives = chooseAlternatives(text, rng);
  return withAlternatives.replace(VARIABLE, (whole, name: string) =>
    CLIENT_VARIABLES.has(name) ? whole : (vars(name) ?? whole));
}

/** Elimina las variables de servidor sin valor (ninguna respuesta enseña una plantilla de servidor). */
export function stripUnresolvedServerVariables(text: string | null): string | null {
  if (text === null) return null;
  return text
    .replace(VARIABLE, (whole, name: string) => (SERVER_VARIABLES.has(name) ? '' : whole))
    .replace(/ {2,}/g, ' ')
    .replace(/ ([,.;:!?…])/g, '$1')
    .trim();
}

/** {gentilicio} en masculino singular: «sevillano/a» → «sevillano»; invariables («ceutí») igual. */
export function gentilicio(raw: string | null | undefined): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  const slash = raw.indexOf('/');
  return (slash < 0 ? raw : raw.slice(0, slash)).trim();
}
