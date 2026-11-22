// Utilidades de test: la fixture mínima del backend como ContentSet,
// con las etiquetas de content/es/server-labels.json como base (igual que arcana-defaults en Java).
import { ContentSet, normalizeGlob } from './content';
import labels from '../../../content/es/server-labels.json';

// Copia de api/src/test/resources/content-fixture con UNA sola interacción: en Java el orden de iteración de las
// interacciones (Map.copyOf) cambia entre ejecuciones de la JVM, así que con dos no habría paridad reproducible.
const fixtureFiles = import.meta.glob('./__fixtures__/content-fixture/**/*.json', { eager: true, import: 'default' });

export function fixtureContent(): ContentSet {
  return new ContentSet(normalizeGlob(fixtureFiles), { defaultLabels: labels });
}

/** Viernes 20/11/2026 a mediodía (la fecha basta para estación/fase; la hora llega en el contexto). */
export const FIXED_NOW = () => new Date('2026-11-20T11:00:00Z');

/** Azar determinista para tests (mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
