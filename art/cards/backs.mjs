// Reversos: simétricos por giro de 180° (no delatan si la carta sale invertida).
import { svgDoc, rect, circle, ellipse, path_, g, star, polar, pt, smooth } from '../lib/svg.mjs';

const CFG = {
  rws: { bg: '#3b1450', c1: '#5a1f72', c2: '#d4a24c', c3: '#f0cf7a', edge: '#f6ecd6', pat: 'stars', emblem: 'sunmoon' },
  marsella: { bg: '#c8392b', c1: '#2f63a8', c2: '#eeb631', c3: '#f4ead3', edge: '#efe2c4', pat: 'diamond', emblem: 'rosette' },
  neon: { bg: '#0c0716', c1: '#38f3ff', c2: '#ff4fd8', c3: '#ffe94f', edge: '#0c0716', pat: 'grid', emblem: 'eye', glow: true },
  gatos: { bg: '#3d405b', c1: '#4a4d6b', c2: '#f2cc8f', c3: '#e07a5f', edge: '#fbeede', pat: 'paws', emblem: 'cat' },
  acuarela: { bg: '#b9a0d8', c1: '#c8e0f2', c2: '#fbf7ef', c3: '#e8c27a', edge: '#fbf7ef', pat: 'dots', emblem: 'moon', wc: true },
  pixel: { bg: '#2a1e3e', c1: '#3a2a5a', c2: '#f7d26a', c3: '#e0433a', edge: '#1b1028', pat: 'checker', emblem: 'star' },
  castellana: { bg: '#c9302c', c1: '#a8221f', c2: '#fbf6ea', c3: '#e8b23a', edge: '#fbf6ea', pat: 'diamond', emblem: 'rosette' },
  catalana: { bg: '#2f6b4a', c1: '#25573b', c2: '#f2e6cc', c3: '#d89a2a', edge: '#f2e6cc', pat: 'diamond', emblem: 'rosette' },
  ilustrada: { bg: '#3b1450', c1: '#5a1f72', c2: '#d4a24c', c3: '#f0cf7a', edge: '#f7ecd8', pat: 'stars', emblem: 'ball' },
};

function patternDef(id, c) {
  const P = (w, h, body) => `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${body}</pattern>`;
  switch (c.pat) {
    case 'stars': return P(70, 70, rect(0, 0, 70, 70, { fill: c.bg }) + star(35, 35, 10, 3.5, 4, { fill: c.c2 }) + star(0, 0, 6, 2, 4, { fill: c.c3 }) + star(70, 0, 6, 2, 4, { fill: c.c3 }) + star(0, 70, 6, 2, 4, { fill: c.c3 }) + star(70, 70, 6, 2, 4, { fill: c.c3 }) + path_('M0 35L35 0L70 35L35 70Z', { fill: 'none', stroke: c.c1, 'stroke-width': 2 }));
    case 'diamond': return P(60, 60, rect(0, 0, 60, 60, { fill: c.bg }) + path_('M30 4L56 30L30 56L4 30Z', { fill: c.c1 }) + path_('M0 0L60 60M60 0L0 60', { stroke: c.c2, 'stroke-width': 3 }) + circle(30, 30, 5, { fill: c.c3 }));
    case 'grid': return P(50, 50, rect(0, 0, 50, 50, { fill: c.bg }) + path_('M0 25H50M25 0V50', { stroke: c.c1, 'stroke-width': 1.5, opacity: 0.6 }) + circle(25, 25, 3, { fill: c.c2 }));
    case 'paws': return P(80, 80, rect(0, 0, 80, 80, { fill: c.bg }) + g({ fill: c.c1 }, ellipse(20, 26, 9, 7), circle(12, 16, 3.5), circle(20, 13, 3.5), circle(28, 16, 3.5)) + g({ fill: c.c1 }, ellipse(60, 66, 9, 7), circle(52, 56, 3.5), circle(60, 53, 3.5), circle(68, 56, 3.5)) + star(60, 20, 5, 2, 4, { fill: c.c2 }) + star(20, 60, 5, 2, 4, { fill: c.c2 }));
    case 'dots': return P(60, 60, rect(0, 0, 60, 60, { fill: c.bg }) + circle(15, 15, 9, { fill: c.c1, opacity: 0.7 }) + circle(45, 45, 9, { fill: c.c2, opacity: 0.6 }) + star(45, 15, 5, 2, 4, { fill: c.c3 }));
    case 'checker': return P(40, 40, rect(0, 0, 40, 40, { fill: c.bg }) + rect(0, 0, 20, 20, { fill: c.c1 }) + rect(20, 20, 20, 20, { fill: c.c1 }) + rect(8, 8, 4, 4, { fill: c.c2 }));
  }
  return '';
}

function emblem(c, cx = 350, cy = 600) {
  const o = [];
  const ring = (r, f, s, w = 6) => circle(cx, cy, r, { fill: f, stroke: s, 'stroke-width': w });
  o.push(ring(190, c.bg, c.c2, 10), ring(170, 'none', c.c3, 3));
  for (let i = 0; i < 24; i++) o.push(star(...polar(cx, cy, 180, i * 15), 7, 2.5, 4, { fill: c.c3 }));
  switch (c.emblem) {
    case 'sunmoon': {
      // sol arriba / luna abajo, simétrico por giro
      for (let i = 0; i < 16; i++) o.push(path_(`M${pt(...polar(cx, cy, 70, i * 22.5 - 6))}L${pt(...polar(cx, cy, i % 2 ? 120 : 140, i * 22.5))}L${pt(...polar(cx, cy, 70, i * 22.5 + 6))}Z`, { fill: c.c2 }));
      o.push(circle(cx, cy, 72, { fill: c.c3, stroke: c.c2, 'stroke-width': 6 }));
      o.push(path_(`M${cx - 40} ${cy - 20}A44 44 0 1 0 ${cx + 40} ${cy - 20}A34 44 0 1 1 ${cx - 40} ${cy - 20}Z`, { fill: c.bg }));
      o.push(path_(`M${cx + 40} ${cy + 20}A44 44 0 1 0 ${cx - 40} ${cy + 20}A34 44 0 1 1 ${cx + 40} ${cy + 20}Z`, { fill: c.bg }));
      break;
    }
    case 'rosette':
      for (let i = 0; i < 8; i++) { const [x, y] = polar(cx, cy, 80, i * 45); o.push(ellipse(x, y, 52, 24, { fill: i % 2 ? c.c3 : c.c2, stroke: c.c1, 'stroke-width': 4, transform: `rotate(${i * 45} ${x} ${y})` })); }
      o.push(circle(cx, cy, 44, { fill: c.c1, stroke: c.c3, 'stroke-width': 6 }), star(cx, cy, 30, 12, 8, { fill: c.c3 }));
      break;
    case 'eye':
      o.push(path_(`M${cx - 130} ${cy}Q${cx} ${cy - 110} ${cx + 130} ${cy}Q${cx} ${cy + 110} ${cx - 130} ${cy}Z`, { fill: 'none', stroke: c.c1, 'stroke-width': 7 }), circle(cx, cy, 44, { fill: 'none', stroke: c.c2, 'stroke-width': 7 }), circle(cx, cy, 14, { fill: c.c3 }));
      break;
    case 'cat': {
      // dos gatitos (uno del derecho y otro del revés) alrededor de una luna llena
      o.push(circle(cx, cy, 70, { fill: c.c2 }));
      for (const s of [1, -1]) {
        const y = cy - s * 120;
        o.push(path_(`M${cx - 34} ${y + s * 18}L${cx - 30} ${y - s * 26}L${cx - 12} ${y - s * 10}L${cx + 12} ${y - s * 10}L${cx + 30} ${y - s * 26}L${cx + 34} ${y + s * 18}Q${cx} ${y + s * 40} ${cx - 34} ${y + s * 18}Z`, { fill: c.c3 }));
        o.push(circle(cx - 13, y, 5, { fill: c.bg }), circle(cx + 13, y, 5, { fill: c.bg }));
      }
      break;
    }
    case 'moon':
      o.push(circle(cx, cy, 90, { fill: c.c2 }), circle(cx + 30, cy - 10, 80, { fill: c.bg }), circle(cx - 30, cy + 10, 0));
      o.push(star(cx + 40, cy + 40, 22, 8, 5, { fill: c.c3 }), star(cx - 40, cy - 40, 22, 8, 5, { fill: c.c3 }));
      break;
    case 'star':
      o.push(path_(`M${cx} ${cy - 120}h20v40h40v20h40v40h-40v20h-40v40h-20h-20v-40h-40v-20h-40v-40h40v-20h40v-40z`, { fill: c.c2 }), rect(cx - 20, cy - 20, 40, 40, { fill: c.c3 }));
      break;
    case 'ball':
      o.push(circle(cx, cy - 10, 90, { fill: '#7fd1c4', stroke: c.c3, 'stroke-width': 6, opacity: 0.9 }), circle(cx - 30, cy - 40, 22, { fill: '#fff', opacity: 0.5 }), path_(`M${cx - 70} ${cy + 70}h140l-20 50h-100z`, { fill: c.c2 }));
      o.push(path_(`M${cx - 70} ${cy - 150}h140l-20 -40h-100z`, { fill: c.c2 }), circle(cx + 30, cy + 20, 14, { fill: '#fff', opacity: 0.4 }));
      break;
  }
  return o.join('');
}

export function backSvg(model) {
  const c = CFG[model];
  const id = `bk-${model}`;
  let defs = patternDef(id, c);
  if (c.glow) defs += `<filter id="${id}-gl" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  if (c.wc) defs += `<filter id="${id}-wc"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="3"/><feDisplacementMap in="SourceGraphic" scale="14"/></filter>`;
  const body = [
    rect(4, 4, 692, 1192, { rx: 30, fill: c.edge, stroke: c.c2, 'stroke-width': 4 }),
    rect(34, 34, 632, 1132, { rx: 18, fill: `url(#${id})`, stroke: c.c2, 'stroke-width': 8, filter: c.wc ? `url(#${id}-wc)` : null }),
    rect(54, 54, 592, 1092, { rx: 12, fill: 'none', stroke: c.c3, 'stroke-width': 3 }),
    g({ filter: c.glow ? `url(#${id}-gl)` : null }, emblem(c)),
    // esquinas
    ...[[90, 90], [610, 90], [90, 1110], [610, 1110]].map(([x, y]) => star(x, y, 22, 8, 8, { fill: c.c3, stroke: c.c1, 'stroke-width': 2 })),
    // medallones arriba/abajo
    ...[250, 950].map((y) => g({}, ellipse(350, y, 70, 34, { fill: c.bg, stroke: c.c2, 'stroke-width': 5 }), star(350, y, 18, 7, 4, { fill: c.c3 }))),
  ].join('');
  return svgDoc({ title: `Reverso · ${model}`, defs, body, extra: { class: `bk-${model}` } });
}
