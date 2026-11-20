import { describe, expect, it } from 'vitest';
import { ageReactions, nameReaction, normalizeName, provinceReaction } from '../lib/onboarding';
import { ONBOARDING } from '../lib/mock/data';

const first = () => 0;
const second = (n: number) => (n > 1 ? 1 : 0);

describe('selector de reacciones de onboarding', () => {
  it('normaliza nombres como el contenido (sin tildes, conserva ñ)', () => {
    expect(normalizeName('  José   Luis ')).toBe('jose luis');
    expect(normalizeName('Iñaki')).toBe('iñaki');
    expect(normalizeName('Zoë')).toBe('zoe');
  });
  it('especiales tienen prioridad', () => {
    expect(nameReaction(ONBOARDING, 'Vanesa', second)).toContain('Vanesas');
  });
  it('nombres compuestos', () => {
    expect(nameReaction(ONBOARDING, 'José Luis', second)).toBe('José Luis… nombre compuesto, destino compuesto.');
  });
  it('santoral rellena {santo}', () => {
    expect(nameReaction(ONBOARDING, 'María', second)).toContain('15 de agosto');
  });
  it('terminación más larga, luego inicial', () => {
    expect(nameReaction(ONBOARDING, 'Susana', second)).toContain('Rima con mañana');
    expect(nameReaction(ONBOARDING, 'Marcos', second)).toBe('La M de Marcos… la M de misterio, claro.');
  });
  it('por longitud usa {letras}', () => {
    expect(nameReaction(ONBOARDING, 'Pau', second)).toBe('3 letras nada más. Corto pero intenso.');
  });
  it('encadena dos reacciones con rng 0', () => {
    const r = nameReaction(ONBOARDING, 'Mariana', first)!;
    expect(r).toContain('mañana');
    expect(r).toContain('La M de Mariana');
  });
  it('genéricas si nada casa', () => {
    expect(nameReaction(ONBOARDING, 'Txema', second)).toMatch(/^Txema… /);
  });
  it('sin contenido, null', () => {
    expect(nameReaction(null, 'Ana')).toBeNull();
  });
  it('edad: década + signo + número de vida', () => {
    const r = ageReactions(ONBOARDING, { edad: 25, decada: 20, signo: 'leo', numeroVida: 7, hasDate: true }, first);
    expect(r).toHaveLength(3);
    expect(r[1]).toContain('Leo');
  });
  it('edad sin fecha usa sinFecha', () => {
    const r = ageReactions(ONBOARDING, { edad: 25, decada: 20, signo: null, numeroVida: null, hasDate: false }, first);
    expect(r.join(' ')).toContain('Sin fecha');
  });
  it('provincia y extranjero', () => {
    expect(provinceReaction(ONBOARDING, '28', { provincia: 'Madrid', chascarrillo: 'Chiste.' }, first)).toBe('¡De Madrid! Ya decía yo. Chiste.');
    expect(provinceReaction(ONBOARDING, 'XX', {}, first)).toContain('pasaporte');
  });
});
