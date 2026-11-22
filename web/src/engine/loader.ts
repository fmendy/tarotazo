// Carga perezosa del contenido empaquetado (sin red: import.meta.glob lo mete en el bundle de la app).
// - es + estructura neutra: un chunk propio (bundles/es.ts).
// - otros idiomas: sus ficheros se cargan al pedirlos (fallback a es por fichero/clave, como el backend).
import { ContentSet, DEFAULT_LANG, normalizeGlob } from './content';

const otherLangFiles = import.meta.glob(
  [
    '../../../content/*/**/*.json',
    '!../../../content/es/**',
    '!../../../content/schemas/**',
    '!../../../content/tools/**',
    '!../../../content/decks/**',
  ],
  { import: 'default' },
);

/** Ruta normalizada ("ca/titles.json") → cargador. */
const loaders = new Map<string, () => Promise<unknown>>(
  Object.entries(otherLangFiles).map(([k, load]) => [Object.keys(normalizeGlob({ [k]: null }))[0], load]),
);

/** Idiomas con carpeta de contenido (sin cargarlos todavía). */
export const KNOWN_LANGUAGES: string[] = [
  DEFAULT_LANG,
  ...new Set([...loaders.keys()].map(p => p.split('/')[0]).filter(l => /^[a-z]{2,3}$/.test(l))),
];

/** Fuente de contenido que entiende el motor: el set y cómo asegurar que un idioma está cargado. */
export interface ContentSource {
  get(): Promise<ContentSet>;
  ensure(lang: string): Promise<ContentSet>;
}

export function bundledContent(): ContentSource {
  let base: Promise<ContentSet> | null = null;
  const loaded = new Map<string, Promise<void>>();
  const get = () => (base ??= import('./bundles/es').then(m => new ContentSet(m.default, { knownLanguages: KNOWN_LANGUAGES })));
  return {
    get,
    async ensure(lang: string) {
      const set = await get();
      if (lang === DEFAULT_LANG || !KNOWN_LANGUAGES.includes(lang)) return set;
      let p = loaded.get(lang);
      if (!p) {
        p = (async () => {
          const entries = [...loaders.entries()].filter(([path]) => path.startsWith(`${lang}/`));
          const files: Record<string, unknown> = {};
          await Promise.all(entries.map(async ([path, load]) => { files[path] = await load(); }));
          set.addFiles(files);
        })();
        loaded.set(lang, p);
      }
      await p;
      return set;
    },
  };
}

/** Fuente sobre un conjunto de ficheros ya en memoria (tests, herramientas). */
export function staticContent(set: ContentSet): ContentSource {
  const p = Promise.resolve(set);
  return { get: () => p, ensure: () => p };
}
