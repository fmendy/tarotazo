// i18n de la interfaz con react-i18next. Añadir un idioma = añadir su JSON y registrarlo aquí.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './es.json';
import { setLangProvider } from '../lib/api';
import { setSessionLang } from '../state/session';

export const resources = { es: { translation: es } } as const;
export const SUPPORTED = Object.keys(resources) as (keyof typeof resources)[];
export const FALLBACK = 'es';

export function detectLanguage(nav: { language?: string; languages?: readonly string[] } | undefined = globalThis.navigator): string {
  const cands = [...(nav?.languages ?? []), nav?.language ?? ''].filter(Boolean);
  for (const c of cands) {
    const base = c.toLowerCase().split('-')[0]!;
    if ((SUPPORTED as string[]).includes(base)) return base;
  }
  return FALLBACK;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: FALLBACK,
  interpolation: { escapeValue: false },
});

const apply = (lng: string) => {
  setSessionLang(lng);
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
};
apply(i18n.language || FALLBACK);
i18n.on('languageChanged', apply);
setLangProvider(() => i18n.language || FALLBACK);

export default i18n;
