// Conversión de resultados del péndulo a objetivos (PendulumTarget) sobre el tablero.
// Todos los tableros se dibujan en un viewBox 0 0 1000 1000 → coords normalizadas 0..1.
export type PendulumTarget =
  | { kind: 'axis'; axis: 'vertical' | 'horizontal' }
  | { kind: 'circle' }
  | { kind: 'point'; x: number; y: number };

export const ARC_CX = 0.5;
export const ARC_CY = 0.78;
export const ARC_R = 0.38;

/** Ángulo (rad) del centro del sector i de n en un semicírculo: el sector 0 a la izquierda. */
export function sectorAngle(i: number, n: number): number {
  return Math.PI - ((i + 0.5) * Math.PI) / n;
}
export function arcPoint(angle: number, r = ARC_R): { x: number; y: number } {
  return { x: ARC_CX + r * Math.cos(angle), y: ARC_CY - r * Math.sin(angle) };
}
export function sectorTarget(i: number, n: number): PendulumTarget {
  return { kind: 'point', ...arcPoint(sectorAngle(i, n)) };
}
/** 0 % a la izquierda, 100 % a la derecha. */
export function percentTarget(value: number): PendulumTarget {
  const v = Math.min(100, Math.max(0, value));
  return { kind: 'point', ...arcPoint(Math.PI - (v / 100) * Math.PI) };
}
export function sinoTarget(answer: 'si' | 'no' | 'duda', yesAxis: 'vertical' | 'horizontal'): PendulumTarget {
  if (answer === 'duda') return { kind: 'circle' };
  const noAxis = yesAxis === 'vertical' ? 'horizontal' : 'vertical';
  return { kind: 'axis', axis: answer === 'si' ? yesAxis : noAxis };
}

// Ouija: 3 filas de letras A–Z, una fila de números 0–9, SÍ / NO arriba.
export const OUIJA_ROWS = ['ABCDEFGHI', 'JKLMNÑOPQ', 'RSTUVWXYZ', '0123456789'];
export function ouijaPoint(ch: string): { x: number; y: number } | null {
  const c = ch.toLocaleUpperCase('es');
  for (let r = 0; r < OUIJA_ROWS.length; r++) {
    const row = OUIJA_ROWS[r]!;
    const i = row.indexOf(c);
    if (i >= 0) return { x: 0.1 + (0.8 * (i + 0.5)) / row.length, y: 0.3 + r * 0.16 };
  }
  return null;
}
export function ouijaTargets(word: string): PendulumTarget[] {
  const w = word.toLocaleUpperCase('es');
  if (w === 'SI' || w === 'SÍ') return [{ kind: 'point', x: 0.2, y: 0.12 }];
  if (w === 'NO') return [{ kind: 'point', x: 0.8, y: 0.12 }];
  return Array.from(w)
    .map(ouijaPoint)
    .filter((p): p is { x: number; y: number } => !!p)
    .map((p) => ({ kind: 'point' as const, ...p }));
}

// Chakras: siete puntos en vertical sobre la silueta (raíz abajo, corona arriba).
export const CHAKRA_IDS = ['raiz', 'sacro', 'plexo', 'corazon', 'garganta', 'tercerOjo', 'corona'];
export function chakraPoint(i: number): { x: number; y: number } {
  return { x: 0.5, y: 0.86 - i * 0.115 };
}

/** Normaliza un rectángulo (bbox SVG) a su centro en coords 0..1 del viewBox. */
export function bboxCenter(
  b: { x: number; y: number; width: number; height: number },
  vb: { x: number; y: number; width: number; height: number },
): { x: number; y: number } {
  return { x: (b.x + b.width / 2 - vb.x) / vb.width, y: (b.y + b.height / 2 - vb.y) / vb.height };
}
