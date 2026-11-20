// Geometría pura de las tiradas. Unidades: ancho de carta = 1, alto = 12/7.
export type SpreadLayout = 'single' | 'row' | 'cross' | 'horseshoe' | 'celtic' | 'love';

export interface SlotPos {
  /** Centro de la carta (unidades de ancho de carta). */
  x: number;
  y: number;
  /** Rotación en grados (Cruz Celta: la carta 2 va cruzada). */
  rot: number;
  /** Orden de apilado. */
  z: number;
}

const CH = 12 / 7;
const GAP = 0.18;

function rowPositions(n: number): SlotPos[] {
  const step = 1 + GAP;
  return Array.from({ length: n }, (_, i) => ({ x: (i - (n - 1) / 2) * step, y: 0, rot: 0, z: i }));
}

/** Posiciones de cada hueco para un layout y número de cartas. */
export function layoutPositions(layout: SpreadLayout, slots: number): SlotPos[] {
  const n = Math.max(0, Math.floor(slots));
  if (n === 0) return [];
  let pos: SlotPos[];
  switch (layout) {
    case 'single':
      pos = [{ x: 0, y: 0, rot: 0, z: 0 }];
      break;
    case 'row':
      // Más de 5 en fila: dos filas.
      if (n > 5) {
        const a = Math.ceil(n / 2);
        pos = [
          ...rowPositions(a).map((p) => ({ ...p, y: -(CH + GAP) / 2 })),
          ...rowPositions(n - a).map((p, i) => ({ ...p, y: (CH + GAP) / 2, z: a + i })),
        ];
      } else pos = rowPositions(n);
      break;
    case 'cross': {
      // 1 centro (situación), 2 arriba (obstáculo), 3 izquierda (pasado), 4 derecha (futuro), 5 abajo (resultado)
      const dx = 1 + GAP * 2;
      const dy = CH + GAP;
      pos = [
        { x: 0, y: 0, rot: 0, z: 0 },
        { x: 0, y: -dy, rot: 0, z: 1 },
        { x: -dx, y: 0, rot: 0, z: 2 },
        { x: dx, y: 0, rot: 0, z: 3 },
        { x: 0, y: dy, rot: 0, z: 4 },
      ];
      break;
    }
    case 'horseshoe': {
      // Herradura en U: de arriba a la izquierda, baja al centro y sube a la derecha.
      const m = Math.max(n, 1);
      const half = (m - 1) / 2 || 1;
      pos = Array.from({ length: m }, (_, i) => {
        const d = (i - (m - 1) / 2) / half; // -1..1
        return { x: (i - (m - 1) / 2) * (1 + GAP), y: CH * 1.3 * (1 - d * d) - CH * 0.65, rot: d * -14, z: i };
      });
      break;
    }
    case 'celtic': {
      // Waite: 1 presente, 2 cruzada sobre 1, 3 abajo, 4 izquierda (pasado), 5 arriba, 6 derecha (futuro),
      // 7–10 en columna a la derecha de abajo a arriba.
      const dx = 1.55;
      const dy = CH + GAP;
      const sx = 3.4;
      const s = CH * 0.98;
      pos = [
        { x: 0, y: 0, rot: 0, z: 0 },
        { x: 0, y: 0, rot: 90, z: 1 },
        { x: 0, y: dy, rot: 0, z: 2 },
        { x: -dx - 0.15, y: 0, rot: 0, z: 3 },
        { x: 0, y: -dy, rot: 0, z: 4 },
        { x: dx + 0.15, y: 0, rot: 0, z: 5 },
        { x: sx, y: 1.5 * s, rot: 0, z: 6 },
        { x: sx, y: 0.5 * s, rot: 0, z: 7 },
        { x: sx, y: -0.5 * s, rot: 0, z: 8 },
        { x: sx, y: -1.5 * s, rot: 0, z: 9 },
      ];
      break;
    }
    case 'love': {
      // Corazón: tú, la otra persona, lo que os une (centro), lo que os separa, consejo, futuro (punta).
      pos = [
        { x: -1.2, y: -CH * 0.6, rot: -6, z: 0 },
        { x: 1.2, y: -CH * 0.6, rot: 6, z: 1 },
        { x: 0, y: -CH * 0.25, rot: 0, z: 2 },
        { x: -1.12, y: CH * 0.62, rot: -10, z: 3 },
        { x: 1.12, y: CH * 0.62, rot: 10, z: 4 },
        { x: 0, y: CH * 1.55, rot: 0, z: 5 },
      ];
      break;
    }
    default:
      pos = rowPositions(n);
  }
  if (pos.length < n) {
    // Huecos de sobra: fila adicional debajo.
    const extra = rowPositions(n - pos.length);
    const maxY = Math.max(...pos.map((p) => p.y)) + CH + GAP * 2;
    pos = [...pos, ...extra.map((p, i) => ({ ...p, y: maxY, z: pos.length + i }))];
  }
  return pos.slice(0, n);
}

/** Caja que envuelve todas las cartas (teniendo en cuenta las giradas 90°). */
export function layoutBounds(pos: SlotPos[]): { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pos) {
    const r = (p.rot * Math.PI) / 180;
    const hw = (Math.abs(Math.cos(r)) * 1 + Math.abs(Math.sin(r)) * CH) / 2;
    const hh = (Math.abs(Math.sin(r)) * 1 + Math.abs(Math.cos(r)) * CH) / 2;
    minX = Math.min(minX, p.x - hw);
    maxX = Math.max(maxX, p.x + hw);
    minY = Math.min(minY, p.y - hh);
    maxY = Math.max(maxY, p.y + hh);
  }
  if (!pos.length) return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

export const CARD_H = CH;
