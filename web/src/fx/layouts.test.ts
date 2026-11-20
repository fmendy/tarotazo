import { describe, expect, it } from 'vitest';
import { layoutBounds, layoutPositions, CARD_H, type SpreadLayout } from './layouts';

const overlaps = (a: { x: number; y: number; rot: number }, b: { x: number; y: number; rot: number }) =>
  a.rot % 180 === 0 && b.rot % 180 === 0 ? Math.abs(a.x - b.x) < 0.98 && Math.abs(a.y - b.y) < CARD_H * 0.98 : false;

describe('layouts de tiradas', () => {
  const cases: Array<[SpreadLayout, number]> = [['single', 1], ['row', 3], ['cross', 5], ['horseshoe', 7], ['celtic', 10], ['love', 6]];
  for (const [layout, n] of cases) {
    it(`${layout} coloca ${n} cartas`, () => {
      const pos = layoutPositions(layout, n);
      expect(pos).toHaveLength(n);
      const b = layoutBounds(pos);
      expect(b.width).toBeGreaterThan(0);
      expect(b.height).toBeGreaterThan(0);
    });
  }

  it('la carta 2 de la Cruz Celta va cruzada sobre la 1', () => {
    const [c1, c2] = layoutPositions('celtic', 10);
    expect(c2.x).toBe(c1.x);
    expect(c2.y).toBe(c1.y);
    expect(c2.rot).toBe(90);
    expect(c2.z).toBeGreaterThan(c1.z);
  });

  it('las cartas no se solapan (salvo la cruzada y la columna celta)', () => {
    for (const [layout, n] of [['row', 3], ['row', 7], ['cross', 5], ['horseshoe', 7]] as Array<[SpreadLayout, number]>) {
      const pos = layoutPositions(layout, n);
      for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) expect(overlaps(pos[i], pos[j])).toBe(false);
    }
  });

  it('añade huecos de sobra en una fila extra', () => {
    expect(layoutPositions('single', 3)).toHaveLength(3);
  });
});
