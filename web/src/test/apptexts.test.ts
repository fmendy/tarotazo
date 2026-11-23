// A-2: en la app no deben aparecer textos de la web (ratón, navegador, servidor, teclado, Tab, descargar…).
import { describe, expect, it } from 'vitest';
import es from '../i18n/es.json';
import esApp from '../i18n/es.app.json';
import i18n, { applyAppTexts } from '../i18n';

type Tree = { [k: string]: unknown };
function flat(o: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof o === 'string') out[prefix] = o;
  else if (Array.isArray(o)) o.forEach((v, i) => Object.assign(out, flat(v, `${prefix}[${i}]`)));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o as Tree)) Object.assign(out, flat(v, prefix ? `${prefix}.${k}` : k));
  return out;
}
const merged = (): Record<string, string> => {
  const base = flat(es);
  const over = flat(esApp);
  // los arrays de la app sustituyen enteros a los de la web
  for (const k of Object.keys(base)) {
    const arr = k.replace(/\[\d+\]$/, '');
    if (arr !== k && Object.keys(over).some((o) => o.startsWith(arr + '['))) delete base[k];
  }
  return { ...base, ...over };
};

// Palabras de la web que no tienen sentido en la app táctil y sin conexión.
const WEB_ONLY = /\b(rat[oó]n|navegador|pestaña|servidor (?:ve|recibe)|al servidor|Usa Tab|Intro para|haz clic|descargar(?! la app))/i;
// Excepciones: la política de la app explica justamente que NO hay servidor.
const ALLOWED = /^(privacy\.body|legal\.body|app\.|languages)/;

describe('textos de la app (A-2)', () => {
  it('cada clave de es.app.json existe en es.json (mismo esquema)', () => {
    const base = flat(es);
    for (const k of Object.keys(flat(esApp))) {
      const root = k.replace(/\[\d+\]$/, '');
      expect(Object.keys(base).some((b) => b === k || b.startsWith(root + '[')), k).toBe(true);
    }
  });

  it('ningún texto visible en la app habla de ratón, navegador, Tab o del servidor', () => {
    const bad = Object.entries(merged()).filter(([k, v]) => !ALLOWED.test(k) && WEB_ONLY.test(v));
    expect(bad).toEqual([]);
  });

  it('la política de la app no habla de IP en tránsito ni de servidor que recibe datos', () => {
    const p = (esApp as { privacy: { body: string[] } }).privacy.body.join(' ');
    expect(p).not.toMatch(/éste ve tu IP|Qué recibe el servidor/);
    expect(p).toMatch(/sin conexión/i);
    expect(p).toMatch(/arcana\.blocked/);
    expect(p).toMatch(/24 horas/);
  });

  it('applyAppTexts superpone las variantes en i18next', () => {
    expect(i18n.t('closing.diploma')).toBe(es.closing.diploma);
    applyAppTexts();
    expect(i18n.t('closing.diploma')).toBe(esApp.closing.diploma);
    expect(i18n.t('name.hint')).not.toMatch(/navegador/);
  });
});
