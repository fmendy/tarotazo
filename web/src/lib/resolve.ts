// Resolutor de la mini‑sintaxis del contenido (CONTRACTS §3.2) en el navegador.
//  {variable}  → sustitución (si no hay valor, se deja intacta)
//  [a|b|c]     → alternativa sorteada (sin anidar)
import { randomInt } from './random';

export type Vars = Record<string, string | number | null | undefined>;
export type Rng = (n: number) => number; // devuelve entero en [0, n)

const ALT = /\[([^[\]]*\|[^[\]]*)\]/g;
const VAR = /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g;

export function resolveAlternatives(text: string, rng: Rng = randomInt): string {
  return text.replace(ALT, (_m, body: string) => {
    const opts = body.split('|');
    return opts[rng(opts.length)] ?? '';
  });
}

export function resolveVars(text: string, vars: Vars): string {
  return text.replace(VAR, (m, key: string) => {
    const v = vars[key];
    return v === undefined || v === null || v === '' ? m : String(v);
  });
}

/** Resuelve alternativas y después variables. */
export function resolveText(text: string, vars: Vars, rng: Rng = randomInt): string {
  return resolveVars(resolveAlternatives(text, rng), vars);
}

/** Variables personales que sólo conoce el navegador. */
export function personalVars(p: { name: string; age: number | null; fallbackName: string }): Vars {
  const nombre = p.name.trim() || p.fallbackName;
  return {
    nombre,
    inicial: nombre.charAt(0).toLocaleUpperCase(),
    edad: p.age ?? undefined,
  };
}

/** Texto del servidor: sólo se rellenan {nombre}, {inicial}, {edad} (y extras como {opcion}). */
export function resolveServerText(text: string, vars: Vars): string {
  // El servidor ya resolvió sus alternativas; por si acaso, resolvemos las que queden.
  return resolveText(text, vars);
}

/** Elimina cualquier {variable} que haya quedado sin resolver (para mostrar en pantalla). */
export function stripUnresolved(text: string): string {
  return text.replace(VAR, '').replace(/\s{2,}/g, ' ').replace(/\s+([,.;:!?…])/g, '$1').trim();
}
