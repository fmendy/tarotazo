// Péndulos: sólo el cuerpo. viewBox 0 0 200 320; punto de enganche en (100, 0) (arriba, centrado).
// La cadena la dibuja la animación. Cada uno incluye una anilla pequeña bajo el enganche.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { svgDoc, path_, circle, ellipse, rect, g, star, polar, pt, writeSvg } from './lib/svg.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const L = { stroke: '#24140f', 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
const lin = (id, stops, x2 = 1, y2 = 0) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
const rad = (id, stops, cx = 0.35, cy = 0.3) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="0.75">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;
const ring = (c = '#c9ccd4', y = 12) => g({}, circle(100, y, 9, { fill: 'none', stroke: '#24140f', 'stroke-width': 7 }), circle(100, y, 9, { fill: 'none', stroke: c, 'stroke-width': 4 }));
const shine = (x, y, h) => path_(`M${x} ${y}q4 ${h / 2} 0 ${h}`, { fill: 'none', stroke: '#fff', 'stroke-width': 5, opacity: 0.7, 'stroke-linecap': 'round' });

function crystal(id, c1, c2, c3) {
  const defs = lin(`${id}-a`, [[0, c1], [0.5, c2], [1, c3]]);
  const capDefs = lin(`${id}-cap`, [[0, '#f4f4f8'], [0.5, '#9aa0ad'], [1, '#e2e4ea']]);
  const body = [
    ring(),
    path_('M84 30h32l6 24h-44z', { fill: `url(#${id}-cap)`, ...L }),
    path_('M72 56L100 48L128 56L128 190L100 290L72 190Z', { fill: `url(#${id}-a)`, ...L }),
    path_('M100 48V290M72 56L100 66L128 56M72 190L100 200L128 190M100 200V290', { fill: 'none', stroke: '#24140f', 'stroke-width': 1.6, opacity: 0.55 }),
    path_('M78 70L92 74L92 186L78 182Z', { fill: '#fff', opacity: 0.45 }),
    star(116, 120, 9, 2.5, 4, { fill: '#fff', opacity: 0.9 }),
  ].join('');
  return { defs: defs + capDefs, body };
}

const P = {
  cuarzo: () => crystal('pq', '#f6fbff', '#cfe6f2', '#9fc4d8'),
  amatista: () => crystal('pa', '#e6c6f6', '#9a5cc8', '#5a2a84'),
  laton: () => ({
    defs: lin('pl', [[0, '#7a5a1e'], [0.35, '#f3d27a'], [0.55, '#d6a645'], [1, '#6e4f17']]),
    body: [ring('#d6a645'), path_('M76 30h48l-4 22h-40z', { fill: 'url(#pl)', ...L }), path_('M60 52h80l-6 26h-68z', { fill: 'url(#pl)', ...L }), path_('M66 78h68L100 296Z', { fill: 'url(#pl)', ...L }), path_('M72 100h56M80 140h40M88 190h24', { fill: 'none', stroke: '#24140f', 'stroke-width': 2, opacity: 0.6 }), shine(84, 84, 70)].join(''),
  }),
  obsidiana: () => ({
    defs: rad('po', [[0, '#7a7488'], [0.25, '#2a2433'], [1, '#07050a']]),
    body: [ring('#9aa0ad'), path_('M88 28h24l4 18h-32z', { fill: '#9aa0ad', ...L }), path_('M100 44C150 70 150 170 100 296C50 170 50 70 100 44Z', { fill: 'url(#po)', ...L }), path_('M84 80q-8 50 6 110', { fill: 'none', stroke: '#c6b8ff', 'stroke-width': 4, opacity: 0.5, 'stroke-linecap': 'round' }), star(116, 96, 7, 2, 4, { fill: '#fff', opacity: 0.85 })].join(''),
  }),
  madera: () => ({
    defs: lin('pw', [[0, '#6e4320'], [0.4, '#c88a4e'], [1, '#6a3f1c']]),
    body: [ring('#c88a4e'), path_('M90 26h20v20h-20z', { fill: 'url(#pw)', ...L }), path_('M100 46C130 46 140 70 128 86C150 100 150 150 124 170L100 296L76 170C50 150 50 100 72 86C60 70 70 46 100 46Z', { fill: 'url(#pw)', ...L }), path_('M70 92H130M64 126H136M74 164H126', { fill: 'none', stroke: '#3e2410', 'stroke-width': 3 }), path_('M86 100q-6 25 2 50M108 180q-6 40-6 80', { fill: 'none', stroke: '#3e2410', 'stroke-width': 1.5, opacity: 0.5 }), shine(80, 100, 50)].join(''),
  }),
  camara: () => ({
    defs: lin('pc', [[0, '#6e4f17'], [0.4, '#f3d27a'], [0.6, '#d6a645'], [1, '#5e4210']]),
    body: [ring('#d6a645'), path_('M82 28h36v18H82z', { fill: 'url(#pc)', ...L }), rect(70, 46, 60, 170, { fill: 'url(#pc)', rx: 6, ...L }), ...[70, 110, 150].map((y) => rect(78, y, 44, 22, { fill: '#2a1a0a', rx: 3, ...L })), ...[70, 110, 150].map((y) => path_(`M84 ${y + 6}h32`, { stroke: '#f3d27a', 'stroke-width': 2, opacity: 0.6 })), path_('M70 216h60L100 296Z', { fill: 'url(#pc)', ...L }), path_('M88 60h24', { stroke: '#24140f', 'stroke-width': 2 }), path_('M95 196l5-10l5 10z', { fill: '#24140f' }), shine(80, 60, 140)].join(''),
  }),
  llave: () => ({
    defs: lin('pk', [[0, '#6e4f17'], [0.5, '#e6bd62'], [1, '#7a5a1e']]),
    body: [ring('#d6a645'), path_('M100 20C130 20 140 52 120 70C112 78 88 78 80 70C60 52 70 20 100 20ZM100 36C88 36 84 50 92 58C96 62 104 62 108 58C116 50 112 36 100 36Z', { fill: 'url(#pk)', 'fill-rule': 'evenodd', ...L }), rect(92, 72, 16, 190, { fill: 'url(#pk)', ...L }), path_('M84 84h32v10H84zM86 100h28v8H86z', { fill: 'url(#pk)', ...L }), path_('M108 232h30v14h-12v14h-18zM108 268h22v14h-22z', { fill: 'url(#pk)', ...L }), rect(92, 262, 16, 22, { fill: 'url(#pk)', ...L }), shine(97, 120, 120)].join(''),
  }),
  anillo: () => ({
    defs: lin('pr', [[0, '#7a5a1e'], [0.4, '#f7da8a'], [1, '#8a6420']]) + rad('pg', [[0, '#ffd0e0'], [0.4, '#d23a6a'], [1, '#6a0f2e']]),
    body: [ring('#d6a645'), path_('M100 21V44', { stroke: '#24140f', 'stroke-width': 5 }), path_('M100 21V44', { stroke: '#d6a645', 'stroke-width': 2.5 }),
      path_('M100 40C150 40 166 100 150 150C136 194 64 194 50 150C34 100 50 40 100 40ZM100 62C64 62 58 100 66 140C74 170 126 170 134 140C142 100 136 62 100 62Z', { fill: 'url(#pr)', 'fill-rule': 'evenodd', ...L }),
      path_('M76 196L124 196L118 170L82 170Z', { fill: 'url(#pr)', ...L }),
      path_('M100 270L126 222L116 196L84 196L74 222Z', { fill: 'url(#pg)', ...L }), path_('M74 222H126M100 196V270', { fill: 'none', stroke: '#fff', 'stroke-width': 1.5, opacity: 0.5 }), star(110, 214, 6, 1.6, 4, { fill: '#fff' }),
      ...[0, 1, 2, 3, 4, 5].map((i) => circle(...polar(100, 222, 34, 200 + i * 28), 4, { fill: '#fff8e8', stroke: '#24140f', 'stroke-width': 1.5 }))].join(''),
  }),
  chorizo: () => ({
    defs: lin('ps', [[0, '#8a1d1a'], [0.45, '#d0442e'], [1, '#7a1612']], 0, 1),
    body: [ring('#e8dcc0'), path_('M100 20q-6 12 0 26', { fill: 'none', stroke: '#e8dcc0', 'stroke-width': 5 }), path_('M100 20q-6 12 0 26', { fill: 'none', stroke: '#24140f', 'stroke-width': 1.5 }), path_('M92 44q8-6 16 0', { fill: 'none', ...L, 'stroke-width': 6 }), path_('M100 46C140 50 150 110 140 170C132 230 112 286 96 296C70 300 60 270 66 220C72 160 60 100 80 60C86 50 92 46 100 46Z', { fill: 'url(#ps)', ...L }),
      ...[[86, 90], [112, 110], [92, 150], [120, 170], [84, 210], [108, 230], [96, 270], [118, 70]].map(([x, y]) => ellipse(x, y, 6, 4, { fill: '#f4e2c8', opacity: 0.9 })),
      path_('M76 120q30 10 60 0M72 190q30 10 60 0', { fill: 'none', stroke: '#e8dcc0', 'stroke-width': 3 }),
      // carita
      circle(92, 136, 4, { fill: '#24140f' }), circle(114, 136, 4, { fill: '#24140f' }), path_('M94 150q9 8 18 0', { fill: 'none', ...L, 'stroke-width': 2.5 }), ellipse(86, 148, 6, 4, { fill: '#ff9a9a', opacity: 0.6 }), ellipse(120, 148, 6, 4, { fill: '#ff9a9a', opacity: 0.6 }), shine(82, 70, 60)].join(''),
  }),
};

let total = 0;
const NAMES = { cuarzo: 'Péndulo de cuarzo', amatista: 'Péndulo de amatista', laton: 'Péndulo de latón', obsidiana: 'Péndulo de obsidiana', madera: 'Péndulo de madera', camara: 'Péndulo de cámara egipcio', llave: 'La llave del trastero', anillo: 'El anillo de la abuela', chorizo: 'Un chorizo de pueblo' };
for (const [id, fn] of Object.entries(P)) {
  const { defs, body } = fn();
  const svg = svgDoc({ viewBox: '0 0 200 320', title: NAMES[id], defs, body, extra: { 'data-anchor': '100 0' } });
  total += writeSvg(path.join(ROOT, 'web/public/art/pendulums', `${id}.svg`), svg);
}
console.log(`pendulums: ${Object.keys(P).length}, ${(total / 1024).toFixed(1)} KB`);
