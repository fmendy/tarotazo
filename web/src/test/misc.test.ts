import { describe, expect, it } from 'vitest';
import { percentTarget, sectorTarget, sinoTarget, ouijaTargets } from '../lib/pendulumGeom';
import { detectLanguage } from '../i18n';
import { loadMuted, saveMuted } from '../lib/prefs';
import es from '../i18n/es.json';

describe('péndulo: resultado → objetivo', () => {
  it('sí/no según el eje calibrado', () => {
    expect(sinoTarget('si', 'horizontal')).toEqual({ kind: 'axis', axis: 'horizontal' });
    expect(sinoTarget('no', 'horizontal')).toEqual({ kind: 'axis', axis: 'vertical' });
    expect(sinoTarget('duda', 'vertical')).toEqual({ kind: 'circle' });
  });
  it('sectores y porcentaje dentro de 0..1, de izquierda a derecha', () => {
    const a = sectorTarget(0, 5), b = sectorTarget(4, 5);
    const p0 = percentTarget(0), p100 = percentTarget(100);
    if (a.kind !== 'point' || b.kind !== 'point' || p0.kind !== 'point' || p100.kind !== 'point') throw new Error('point');
    expect(a.x).toBeLessThan(b.x);
    expect(p0.x).toBeLessThan(p100.x);
    for (const v of [a.x, a.y, b.x, b.y, p0.x, p0.y, p100.x]) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
  });
  it('ouija deletrea letra a letra', () => {
    expect(ouijaTargets('GATO')).toHaveLength(4);
    expect(ouijaTargets('SI')).toHaveLength(1);
  });
});

describe('i18n y preferencias', () => {
  it('idioma inicial con fallback a es', () => {
    expect(detectLanguage({ language: 'fr-FR', languages: ['fr-FR', 'de'] })).toBe('es');
    expect(detectLanguage({ language: 'es-MX' })).toBe('es');
    expect(detectLanguage(undefined)).toBe('es');
  });
  it('es.json tiene las cadenas clave', () => {
    expect(es.app.disclaimer).toMatch(/Entretenimiento/);
    expect(es.legal.pending).toMatch(/revisión legal/);
    expect(es.privacy.pending).toMatch(/revisión legal/);
  });
  it('sólo la preferencia de sonido va a localStorage', () => {
    localStorage.clear();
    saveMuted(true);
    expect(loadMuted()).toBe(true);
    expect(localStorage.length).toBe(1);
    expect(localStorage.key(0)).toBe('arcana.muted');
    localStorage.clear();
  });
});
