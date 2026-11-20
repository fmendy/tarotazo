import { describe, expect, it } from 'vitest';
import { personalVars, resolveAlternatives, resolveText, resolveVars, stripUnresolved } from '../lib/resolve';

describe('resolutor de mini-sintaxis', () => {
  it('sustituye variables conocidas y deja intactas las desconocidas', () => {
    expect(resolveVars('Hola {nombre}, de {provincia}', { nombre: 'Vanesa' })).toBe('Hola Vanesa, de {provincia}');
  });
  it('no sustituye valores vacíos o nulos', () => {
    expect(resolveVars('{edad} años', { edad: null })).toBe('{edad} años');
    expect(resolveVars('{nombre}', { nombre: '' })).toBe('{nombre}');
  });
  it('resuelve alternativas [a|b|c] con el rng dado', () => {
    expect(resolveAlternatives('[ojo|cuidado|atención], ya', () => 1)).toBe('cuidado, ya');
    expect(resolveAlternatives('[a|b] y [c|d]', () => 0)).toBe('a y c');
  });
  it('siempre elige una de las opciones', () => {
    for (let i = 0; i < 50; i++) expect(['x', 'y', 'z']).toContain(resolveText('[x|y|z]', {}));
  });
  it('no toca corchetes sin barra', () => {
    expect(resolveAlternatives('[nota] fin')).toBe('[nota] fin');
  });
  it('resuelve alternativas y luego variables', () => {
    expect(resolveText('[Hola|Hola] {nombre} ({inicial})', personalVars({ name: 'maría', age: 33, fallbackName: 'x' }))).toBe('Hola maría (M)');
  });
  it('usa el nombre de respaldo si no hay nombre', () => {
    expect(personalVars({ name: '  ', age: null, fallbackName: 'alma viajera' })).toMatchObject({ nombre: 'alma viajera', inicial: 'A' });
  });
  it('limpia huecos sin resolver', () => {
    expect(stripUnresolved('Hola {nombre} , qué tal')).toBe('Hola, qué tal');
  });
});
