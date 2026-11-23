import { describe, expect, it } from 'vitest';
import { layoutBounds, layoutPositions, CARD_H, LABEL_H, LABEL_SIDE, type SpreadLayout } from './layouts';

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

describe('etiquetas de posición (A-7)', () => {
  type Rect = { x0: number; x1: number; y0: number; y1: number };
  const hit = (a: Rect, b: Rect) => a.x0 < b.x1 - 1e-6 && b.x0 < a.x1 - 1e-6 && a.y0 < b.y1 - 1e-6 && b.y0 < a.y1 - 1e-6;
  const cardRect = (p: { x: number; y: number; rot: number }): Rect => {
    const r = (p.rot * Math.PI) / 180;
    const hw = (Math.abs(Math.cos(r)) + Math.abs(Math.sin(r)) * CARD_H) / 2;
    const hh = (Math.abs(Math.sin(r)) + Math.abs(Math.cos(r)) * CARD_H) / 2;
    return { x0: p.x - hw, x1: p.x + hw, y0: p.y - hh, y1: p.y + hh };
  };
  // La etiqueta cuelga bajo la caja del hueco (sin girar), como la pinta SpreadBoard.
  const labelRect = (p: { x: number; y: number }): Rect => ({
    x0: p.x - 0.5 - LABEL_SIDE, x1: p.x + 0.5 + LABEL_SIDE, y0: p.y + CARD_H / 2, y1: p.y + CARD_H / 2 + LABEL_H,
  });
  const cases: Array<[SpreadLayout, number]> = [['cross', 5], ['celtic', 10], ['horseshoe', 7], ['love', 6], ['row', 7], ['row', 3], ['single', 1]];
  for (const [layout, n] of cases) {
    it(`${layout} (${n}): ninguna carta tapa la etiqueta de otra ni se pisan etiquetas`, () => {
      const pos = layoutPositions(layout, n, LABEL_H);
      const labeled = pos.map((p, i) => ({ p, i })).filter(({ p }) => p.rot !== 90); // la cruzada no muestra etiqueta
      for (const { p, i } of labeled) {
        const lr = labelRect(p);
        pos.forEach((q, j) => {
          if (j !== i) expect(hit(lr, cardRect(q)), `${layout}: carta ${j + 1} tapa la etiqueta ${i + 1}`).toBe(false);
        });
        for (const o of labeled) if (o.i > i) expect(hit(lr, labelRect(o.p)), `${layout}: etiquetas ${i + 1} y ${o.i + 1}`).toBe(false);
      }
    });
  }

  it('Cruz simple: «Resultado» queda por debajo de la etiqueta de «Situación»', () => {
    const [situacion, , , , resultado] = layoutPositions('cross', 5, LABEL_H);
    expect(resultado.y - CARD_H / 2).toBeGreaterThanOrEqual(situacion.y + CARD_H / 2 + LABEL_H);
  });
});
