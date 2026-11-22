// Utilidades de test: la fixture mínima del backend como ContentSet.
// __fixtures__/content-fixture es una copia de api/src/test/resources/content-fixture (incluye es/server-labels.json,
// la misma fuente de etiquetas que usa el backend). Es la entrada de la paridad exacta con el motor Java.
import { ContentSet, normalizeGlob } from './content';

const fixtureFiles = import.meta.glob('./__fixtures__/content-fixture/**/*.json', { eager: true, import: 'default' });

export function fixtureContent(): ContentSet {
  return new ContentSet(normalizeGlob(fixtureFiles));
}

/** Viernes 20/11/2026 a mediodía (la fecha basta para estación/fase; la hora llega en el contexto). */
export const FIXED_NOW = () => new Date('2026-11-20T11:00:00Z');
