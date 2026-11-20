// Marcos de diplomas, papel pintado, sello, cofres, diploma de usuario, globo, favicon e imagen social.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { svgDoc, path_, circle, ellipse, rect, g, star, polar, pt, writeSvg, text, textOnArc, FONT, rng, smooth } from './lib/svg.mjs';
import { C } from './lib/palette.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'web/public/art');
const L = (w = 3) => ({ stroke: C.line, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const stops = (arr) => arr.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
const lin = (id, arr, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(arr)}</linearGradient>`;
const rad = (id, arr, cx = 0.5, cy = 0.5, r = 0.5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(arr)}</radialGradient>`;
let total = 0;
const save = (rel, svg) => { total += writeSvg(path.join(OUT, rel), svg); };

// ====================== MARCOS ======================
// viewBox 0 0 800 600 · hueco interior (papel) en x=110 y=100 w=580 h=400 → data-inner
const FW = 800, FH = 600, IN = { x: 110, y: 100, w: 580, h: 400 };
const ring = (o, i, fill, extra = {}) => path_(`M${o.x} ${o.y}h${o.w}v${o.h}h-${o.w}zM${i.x} ${i.y}v${i.h}h${i.w}v-${i.h}z`, { fill, 'fill-rule': 'evenodd', ...extra });
const box = (m) => ({ x: m, y: m, w: FW - 2 * m, h: FH - 2 * m });
const paper = (id, fill = `url(#${id}-paper)`) => g({ id: 'paper' }, rect(IN.x, IN.y, IN.w, IN.h, { fill }), rect(IN.x + 16, IN.y + 16, IN.w - 32, IN.h - 32, { fill: 'none', stroke: C.goldDark, 'stroke-width': 1.5, opacity: 0.6 }), rect(IN.x + 24, IN.y + 24, IN.w - 48, IN.h - 48, { id: 'text-area', fill: 'none' }));
const paperDef = (id) => rad(`${id}-paper`, [[0, '#fbf4e2'], [0.7, C.paper], [1, C.paper2]], 0.5, 0.45, 0.75);

function scroll(x, y, s, a) {
  return g({ transform: `translate(${x} ${y}) rotate(${a}) scale(${s})` },
    path_('M0 0C20-30 60-30 70 0C76 20 56 34 42 24C32 16 40 4 50 8', { fill: 'none', stroke: C.goldDark, 'stroke-width': 9 }),
    path_('M0 0C20-30 60-30 70 0C76 20 56 34 42 24C32 16 40 4 50 8', { fill: 'none', stroke: C.goldLight, 'stroke-width': 4.5 }),
    path_('M0 0C-20 30-60 30-70 0C-76-20-56-34-42-24C-32-16-40-4-50-8', { fill: 'none', stroke: C.goldDark, 'stroke-width': 9 }),
    path_('M0 0C-20 30-60 30-70 0C-76-20-56-34-42-24C-32-16-40-4-50-8', { fill: 'none', stroke: C.goldLight, 'stroke-width': 4.5 }));
}

const FRAMES = {
  barroco: () => {
    const defs = lin('fb-g', [[0, C.goldLight], [0.5, C.gold], [1, C.goldDark]], 1, 1) + paperDef('fb');
    const b = [paper('fb'), ring(box(18), { x: IN.x - 12, y: IN.y - 12, w: IN.w + 24, h: IN.h + 24 }, 'url(#fb-g)', L(4)),
      ring(box(44), { x: IN.x - 26, y: IN.y - 26, w: IN.w + 52, h: IN.h + 52 }, C.goldDark, { opacity: 0.35 }),
      rect(IN.x - 12, IN.y - 12, IN.w + 24, IN.h + 24, { fill: 'none', ...L(4) })];
    // cuentas
    for (let x = 60; x <= 740; x += 28) b.push(circle(x, 34, 5, { fill: C.goldLight, ...L(1.5) }), circle(x, 566, 5, { fill: C.goldLight, ...L(1.5) }));
    for (let y = 62; y <= 538; y += 28) b.push(circle(34, y, 5, { fill: C.goldLight, ...L(1.5) }), circle(766, y, 5, { fill: C.goldLight, ...L(1.5) }));
    // volutas y rosetas en esquinas
    for (const [x, y, a] of [[70, 70, 45], [730, 70, 135], [730, 530, 225], [70, 530, 315]]) b.push(scroll(x, y, 0.8, a), circle(x, y, 22, { fill: 'url(#fb-g)', ...L(3) }), star(x, y, 14, 6, 8, { fill: C.crimson, ...L(1.5) }));
    // copete superior y medallón inferior
    b.push(path_('M300 22C330-6 370 30 400 4C430 30 470-6 500 22C470 40 440 30 400 60C360 30 330 40 300 22Z', { fill: 'url(#fb-g)', ...L(3) }), circle(400, 34, 16, { fill: C.crimson, ...L(2.5) }));
    b.push(scroll(340, 566, 0.6, 0), scroll(460, 566, 0.6, 180), ellipse(400, 566, 30, 18, { fill: 'url(#fb-g)', ...L(3) }));
    for (const x of [200, 600]) b.push(scroll(x, 32, 0.45, 0), scroll(x, 568, 0.45, 0));
    for (const y of [200, 400]) b.push(scroll(32, y, 0.45, 90), scroll(768, y, 0.45, 90));
    return { defs, body: b.join('') };
  },
  dorado: () => {
    const defs = lin('fd-t', [[0, C.goldLight], [1, C.goldDark]]) + lin('fd-l', [[0, C.goldLight], [1, C.goldDark]], 1, 0) + paperDef('fd');
    const o = box(30), i = { x: IN.x - 10, y: IN.y - 10, w: IN.w + 20, h: IN.h + 20 };
    const b = [paper('fd'),
      path_(`M${o.x} ${o.y}H${o.x + o.w}L${i.x + i.w} ${i.y}H${i.x}Z`, { fill: 'url(#fd-t)', ...L(3) }),
      path_(`M${o.x} ${o.y + o.h}H${o.x + o.w}L${i.x + i.w} ${i.y + i.h}H${i.x}Z`, { fill: C.goldDark, ...L(3) }),
      path_(`M${o.x} ${o.y}V${o.y + o.h}L${i.x} ${i.y + i.h}V${i.y}Z`, { fill: 'url(#fd-l)', ...L(3) }),
      path_(`M${o.x + o.w} ${o.y}V${o.y + o.h}L${i.x + i.w} ${i.y + i.h}V${i.y}Z`, { fill: C.gold, ...L(3) }),
      rect(o.x + 14, o.y + 14, o.w - 28, o.h - 28, { fill: 'none', stroke: C.goldLight, 'stroke-width': 3, opacity: 0.8 }),
      rect(i.x, i.y, i.w, i.h, { fill: 'none', ...L(3) }),
    ];
    for (let k = 0; k < 4; k++) { const [x, y] = [[o.x + 30, o.y + 30], [o.x + o.w - 30, o.y + 30], [o.x + o.w - 30, o.y + o.h - 30], [o.x + 30, o.y + o.h - 30]][k]; b.push(star(x, y, 14, 5, 4, { fill: C.goldLight, ...L(1.5) })); }
    return { defs, body: b.join('') };
  },
  madera: () => {
    const defs = lin('fm-w', [[0, '#8a5a2e'], [0.5, '#b07a42'], [1, '#6a3f1c']], 1, 1) + paperDef('fm');
    const b = [paper('fm'), ring(box(30), { x: IN.x - 8, y: IN.y - 8, w: IN.w + 16, h: IN.h + 16 }, 'url(#fm-w)', L(3))];
    const r = rng('madera');
    let grain = '';
    for (let k = 0; k < 14; k++) { for (const yb of [36, 508]) { const y = yb + 6 + r() * 44, x = 50 + r() * 560; grain += `M${pt(x, y)}q${pt(60, r() * 6 - 3)} ${pt(120 + r() * 60, r() * 6 - 3)}`; } for (const xb of [36, 698]) { const x = xb + 6 + r() * 54, y = 80 + r() * 330; grain += `M${pt(x, y)}q${pt(r() * 6 - 3, 50)} ${pt(r() * 6 - 3, 110)}`; } }
    b.push(path_(grain, { fill: 'none', stroke: '#4a2a10', 'stroke-width': 1.5, opacity: 0.45 }));
    b.push(path_('M30 30L102 92M770 30L698 92M770 570L698 508M30 570L102 508', { stroke: '#4a2a10', 'stroke-width': 2 }));
    for (const [x, y] of [[50, 50], [750, 50], [750, 550], [50, 550]]) b.push(circle(x, y, 5, { fill: '#c9ccd4', ...L(1.5) }));
    // placa de latón
    b.push(rect(330, 532, 140, 36, { rx: 6, fill: C.brass, ...L(2.5) }), rect(338, 540, 124, 20, { rx: 3, fill: 'none', stroke: C.goldLight, 'stroke-width': 1.5 }));
    return { defs, body: b.join('') };
  },
  moderno: () => {
    const defs = paperDef('fo');
    const b = [ring(box(40), { x: IN.x - 40, y: IN.y - 40, w: IN.w + 80, h: IN.h + 80 }, '#1a1420'),
      ring({ x: IN.x - 40, y: IN.y - 40, w: IN.w + 80, h: IN.h + 80 }, IN, '#fbf8f2'),
      g({ id: 'paper' }, rect(IN.x, IN.y, IN.w, IN.h, { fill: '#fffdf8', stroke: '#d8d0c4', 'stroke-width': 1 }), rect(IN.x + 24, IN.y + 24, IN.w - 48, IN.h - 48, { id: 'text-area', fill: 'none' })),
      rect(40, 40, 720, 520, { fill: 'none', stroke: '#3a3044', 'stroke-width': 2 }),
      path_('M40 40l30 30', { stroke: '#4a4054', 'stroke-width': 2 })];
    return { defs, body: b.join('') };
  },
  pergamino: () => {
    const defs = lin('fp-r', [[0, '#c8a36a'], [0.5, C.paper], [1, '#a88250']]) + paperDef('fp');
    const r = rng('perg');
    // borde rasgado
    const pts = [];
    const n = 18;
    for (let k = 0; k <= n; k++) pts.push([60 + (680 * k) / n, 80 + (r() - 0.5) * 10]);
    for (let k = 1; k <= 10; k++) pts.push([740 + (r() - 0.5) * 10, 80 + (440 * k) / 10]);
    for (let k = n - 1; k >= 0; k--) pts.push([60 + (680 * k) / n, 520 + (r() - 0.5) * 10]);
    for (let k = 9; k >= 1; k--) pts.push([60 + (r() - 0.5) * 10, 80 + (440 * k) / 10]);
    const b = [path_(`M${pts.map((p) => pt(...p)).join('L')}Z`, { fill: 'url(#fp-paper)', ...L(2.5) }),
      g({ id: 'paper' }, rect(IN.x, IN.y, IN.w, IN.h, { fill: 'none' }), rect(IN.x + 24, IN.y + 24, IN.w - 48, IN.h - 48, { id: 'text-area', fill: 'none' })),
      // rollos
      rect(40, 46, 720, 40, { rx: 20, fill: 'url(#fp-r)', ...L(3) }), rect(40, 514, 720, 40, { rx: 20, fill: 'url(#fp-r)', ...L(3) }),
      ...[46, 514].flatMap((y) => [ellipse(40, y + 20, 12, 20, { fill: '#a88250', ...L(3) }), ellipse(760, y + 20, 12, 20, { fill: '#a88250', ...L(3) }), ellipse(760, y + 20, 5, 9, { fill: '#6a4a20' })]),
      // cinta y lacre
      path_('M640 520l-20 70l20-14l20 14l-20-70z', { fill: C.crimson, ...L(2) }), circle(640, 520, 26, { fill: C.crimson, ...L(2.5) }), star(640, 520, 13, 5, 5, { fill: '#7a1626' })];
    return { defs, body: b.join('') };
  },
};
for (const [id, fn] of Object.entries(FRAMES)) {
  const { defs, body } = fn();
  save(`frames/${id}.svg`, svgDoc({ viewBox: `0 0 ${FW} ${FH}`, title: `Marco ${id}`, defs, body, extra: { 'data-inner': `${IN.x} ${IN.y} ${IN.w} ${IN.h}`, 'data-text-area': `${IN.x + 24} ${IN.y + 24} ${IN.w - 48} ${IN.h - 48}` } }));
}

// ====================== PAPEL PINTADO (mosaico 200×200) ======================
{
  const T = 200;
  const motif = (x, y, s = 1) => {
    const P = (u, v) => pt(x + u * s, y + v * s);
    return g({},
      path_(`M${P(0, -70)}C${P(18, -50)} ${P(40, -40)} ${P(40, -10)}C${P(40, 20)} ${P(16, 30)} ${P(0, 70)}C${P(-16, 30)} ${P(-40, 20)} ${P(-40, -10)}C${P(-40, -40)} ${P(-18, -50)} ${P(0, -70)}Z`, { fill: '#4a1a62' }),
      path_(`M${P(0, -52)}C${P(10, -36)} ${P(24, -26)} ${P(24, -8)}C${P(24, 12)} ${P(8, 20)} ${P(0, 48)}C${P(-8, 20)} ${P(-24, 12)} ${P(-24, -8)}C${P(-24, -26)} ${P(-10, -36)} ${P(0, -52)}Z`, { fill: 'none', stroke: '#8a6420', 'stroke-width': 2, opacity: 0.8 }),
      path_(`M${P(0, -30)}C${P(-14, -14)} ${P(-14, 6)} ${P(0, 20)}C${P(14, 6)} ${P(14, -14)} ${P(0, -30)}Z`, { fill: '#6a2a8a' }),
      path_(`M${P(-40, -10)}C${P(-60, -24)} ${P(-70, -4)} ${P(-58, 6)}M${P(40, -10)}C${P(60, -24)} ${P(70, -4)} ${P(58, 6)}`, { fill: 'none', stroke: '#8a6420', 'stroke-width': 2.5 }),
      circle(x, y - 8 * s, 4 * s, { fill: '#b8893a' }));
  };
  const body = [rect(0, 0, T, T, { fill: '#2a0f3a' }), motif(100, 100), motif(0, 0, 0.7), motif(200, 0, 0.7), motif(0, 200, 0.7), motif(200, 200, 0.7),
    ...[[50, 50], [150, 150], [150, 50], [50, 150]].map(([x, y]) => star(x, y, 6, 2, 4, { fill: '#8a6420', opacity: 0.8 }))].join('');
  save('wallpaper.svg', svgDoc({ viewBox: `0 0 ${T} ${T}`, title: 'Papel pintado barroco', body }));
}

// ====================== SELLO «COMPULSADO» ======================
{
  const red = '#b3122e';
  const defs = `<filter id="st-ink" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.2 1.6" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="c"/><feDisplacementMap in="c" in2="n" scale="3"/></filter>`;
  const body = g({ filter: 'url(#st-ink)', transform: 'rotate(-12 200 200)' },
    circle(200, 200, 180, { fill: 'none', stroke: red, 'stroke-width': 12 }),
    circle(200, 200, 160, { fill: 'none', stroke: red, 'stroke-width': 4 }),
    circle(200, 200, 98, { fill: 'none', stroke: red, 'stroke-width': 3 }), star(200, 140, 14, 5, 5, { fill: red }), star(200, 262, 14, 5, 5, { fill: red }),
    textOnArc('CONFORME AL ORIGINAL', { f: FONT.title(), size: 26, cx: 200, cy: 200, r: 128, start: -90, sweep: 130, attr: { fill: red } }),
    textOnArc('MADAME REMEDIOS', { f: FONT.title(), size: 26, cx: 200, cy: 200, r: 128, start: 90, sweep: 110, inside: true, attr: { fill: red } }),
    rect(30, 168, 340, 64, { fill: '#fff', 'fill-opacity': 0, stroke: red, 'stroke-width': 6 }),
    text('COMPULSADO', { f: FONT.poster(), size: 48, x: 200, y: 217, maxWidth: 310, attr: { fill: red } }).svg,
    star(80, 200, 0, 0, 5, { fill: red }),
  );
  save('stamps/compulsado.svg', svgDoc({ viewBox: '0 0 400 400', title: 'Sello: compulsado', defs, body }));
}

// ====================== COFRES ======================
function chest(kind) {
  const tarot = kind === 'tarot';
  const wood = tarot ? ['#5a1f72', '#3b1450', '#2a0f3a'] : ['#b07a42', '#8a5a2e', '#5e3a18'];
  const band = tarot ? [C.goldLight, C.gold, C.goldDark] : ['#f2c94c', '#c9302c', '#7a1612'];
  const defs = lin(`ch-${kind}-w`, wood.map((c, i) => [i / 2, c])) + lin(`ch-${kind}-b`, band.map((c, i) => [i / 2, c]), 1, 0) + rad(`ch-${kind}-glow`, [[0, C.flame, 0.95], [0.5, C.candle, 0.5], [1, C.candle, 0]]);
  const W_ = `url(#ch-${kind}-w)`, B = `url(#ch-${kind}-b)`;
  const box_ = [
    ellipse(200, 345, 170, 14, { fill: '#000', opacity: 0.35 }),
    // interior visible al abrir
    path_('M40 180L360 180L350 200L50 200Z', { fill: '#120818' }),
    g({ id: 'glow', opacity: 0 }, ellipse(200, 170, 190, 120, { fill: `url(#ch-${kind}-glow)` })),
    rect(40, 180, 320, 160, { rx: 10, fill: W_, ...L(4) }),
    rect(40, 180, 320, 26, { fill: B, ...L(3) }), rect(40, 314, 320, 26, { rx: 8, fill: B, ...L(3) }),
    rect(80, 180, 26, 160, { fill: B, ...L(3) }), rect(294, 180, 26, 160, { fill: B, ...L(3) }),
    // cerradura
    path_('M176 196h48v52q-24 18-48 0z', { fill: B, ...L(3) }), circle(200, 218, 7, { fill: C.line }), path_('M197 222h6l2 14h-10z', { fill: C.line }),
  ];
  // emblema frontal
  if (tarot) box_.push(star(200, 290, 26, 10, 8, { fill: C.goldLight, ...L(2.5) }), path_('M140 280a16 16 0 1 0 16 22a12 12 0 1 1-16-22z', { fill: C.goldLight, ...L(2) }), star(258, 290, 12, 5, 5, { fill: C.goldLight, ...L(2) }));
  else {
    const sm = 0.32;
    box_.push(circle(140, 290, 18, { fill: '#f2c94c', ...L(2.5) }), circle(140, 290, 8, { fill: '#c9302c', ...L(1.5) }));
    box_.push(path_('M178 274h22l-4 18h-14zM186 292h6v12h-6zM178 306h22', { fill: '#c9302c', ...L(2) }));
    box_.push(path_('M226 306l34-36M232 296l10 10', { stroke: C.line, 'stroke-width': 6, fill: 'none' }), path_('M226 306l34-36', { stroke: '#7fb1c9', 'stroke-width': 3, fill: 'none' }));
    box_.push(path_('M270 310l10-44', { stroke: C.line, 'stroke-width': 10, 'stroke-linecap': 'round' }), path_('M270 310l10-44', { stroke: '#b07a42', 'stroke-width': 6, 'stroke-linecap': 'round' }));
    void sm;
  }
  const lid = g({ id: 'lid', 'data-pivot': '200 180', style: 'transform-origin:200px 180px;transform-box:view-box' },
    path_('M36 182L36 120C36 60 364 60 364 120L364 182Z', { fill: W_, ...L(4) }),
    path_('M36 160L364 160L364 182L36 182Z', { fill: B, ...L(3) }),
    path_('M80 182L80 84Q93 78 106 76L106 182Z', { fill: B, ...L(3) }), path_('M294 182L294 76Q307 78 320 84L320 182Z', { fill: B, ...L(3) }),
    path_('M60 110C120 76 280 76 340 110', { fill: 'none', stroke: '#fff', 'stroke-width': 4, opacity: 0.25 }),
    tarot ? g({}, star(200, 118, 20, 8, 4, { fill: C.goldLight, ...L(2) }), ...[150, 250].map((x) => star(x, 124, 9, 3.5, 4, { fill: C.goldLight }))) : g({}, ...[150, 200, 250].map((x, i) => circle(x, 120, 9, { fill: ['#f2c94c', '#c9302c', '#f2c94c'][i], ...L(2) }))),
  );
  const label = tarot ? 'Cofre del tarot' : 'Cofre de la baraja española';
  return svgDoc({ viewBox: '0 0 400 360', title: label, defs, body: box_.join('') + lid });
}
save('chests/tarot.svg', chest('tarot'));
save('chests/spanish.svg', chest('spanish'));

// ====================== DIPLOMA DE USUARIO (plantilla) ======================
{
  const W = 1400, H = 1000;
  const defs = rad('du-p', [[0, '#fdf7e8'], [0.75, C.paper], [1, C.paper2]], 0.5, 0.45, 0.8) + lin('du-g', [[0, C.goldLight], [0.5, C.gold], [1, C.goldDark]], 1, 1);
  const ink = C.paperInk;
  const b = [rect(0, 0, W, H, { fill: 'url(#du-p)' }),
    rect(30, 30, W - 60, H - 60, { fill: 'none', stroke: 'url(#du-g)', 'stroke-width': 18 }),
    rect(62, 62, W - 124, H - 124, { fill: 'none', stroke: C.goldDark, 'stroke-width': 3 }),
    rect(74, 74, W - 148, H - 148, { fill: 'none', stroke: C.goldDark, 'stroke-width': 1.2 }),
    ...[[100, 100], [W - 100, 100], [W - 100, H - 100], [100, H - 100]].map(([x, y]) => g({}, circle(x, y, 26, { fill: 'url(#du-g)', ...L(2) }), star(x, y, 18, 7, 8, { fill: C.crimson }))),
    text('Academia Tarotazo de Artes Adivinatorias', { f: FONT.title(), size: 34, x: W / 2, y: 170, attr: { fill: C.paperInkMuted } }).svg,
    text('Diploma', { f: FONT.display(), size: 120, x: W / 2, y: 300, attr: { fill: ink } }).svg,
    text('Se certifica solemnemente (y sin validez oficial) que', { f: FONT.italic(), size: 36, x: W / 2, y: 380, attr: { fill: C.paperInkMuted } }).svg,
    rect(250, 410, 900, 110, { id: 'slot-nombre', fill: 'none' }),
    path_(`M300 530H1100`, { stroke: C.goldDark, 'stroke-width': 2 }),
    text('ha superado con aprovechamiento la lectura de cartas y obtiene el título de', { f: FONT.italic(), size: 32, x: W / 2, y: 590, attr: { fill: C.paperInkMuted } }).svg,
    rect(200, 615, 1000, 100, { id: 'slot-titulo', fill: 'none' }),
    path_(`M200 830H560M840 830H1200`, { stroke: ink, 'stroke-width': 2 }),
    text('Madame Remedios', { f: FONT.hand(), size: 64, x: 380, y: 815, attr: { fill: '#2b2a6a' } }).svg,
    text('Directora (y única profesora)', { f: FONT.body(), size: 24, x: 380, y: 862, attr: { fill: C.paperInkMuted } }).svg,
    rect(840, 760, 360, 60, { id: 'slot-fecha', fill: 'none' }),
    text('Fecha astral', { f: FONT.body(), size: 24, x: 1020, y: 862, attr: { fill: C.paperInkMuted } }).svg,
    // sello de lacre
    g({ id: 'seal' }, circle(700, 830, 70, { fill: C.crimson, ...L(3) }), circle(700, 830, 54, { fill: 'none', stroke: '#7a1626', 'stroke-width': 4 }), star(700, 830, 34, 14, 8, { fill: '#7a1626' }), path_('M650 880l-20 80l30-18l20 22l10-70zM750 880l20 80l-30-18l-20 22l-10-70z', { fill: C.crimson, ...L(2) })),
    text('Entretenimiento, no consejo profesional', { f: FONT.body(), size: 20, x: 1200, y: 905, anchor: 'end', attr: { fill: C.paperInkMuted } }).svg,
  ];
  save('diploma-usuario.svg', svgDoc({ viewBox: `0 0 ${W} ${H}`, title: 'Diploma de Tarotazo', desc: 'Plantilla: rellena #slot-nombre, #slot-titulo y #slot-fecha.', defs, body: b.join(''), extra: { 'data-slot-nombre': '700 490 900 110', 'data-slot-titulo': '700 685 1000 100', 'data-slot-fecha': '1020 800 360 60' } }));
}

// ====================== GLOBO TERRÁQUEO CÓMICO ======================
{
  const defs = rad('gl-s', [[0, '#9fd8f0'], [0.7, '#3f84c4'], [1, '#22508a']], 0.38, 0.32, 0.75);
  const land = '#6fbf5a';
  const b = [
    ellipse(150, 345, 80, 10, { fill: '#000', opacity: 0.3 }),
    path_('M100 340h100l-12-30h-76z', { fill: C.gold, ...L(3) }), rect(140, 260, 20, 52, { fill: C.goldDark, ...L(3) }),
    path_('M150 30A130 130 0 0 1 150 290', { fill: 'none', stroke: C.goldDark, 'stroke-width': 14 }), path_('M150 30A130 130 0 0 1 150 290', { fill: 'none', stroke: C.gold, 'stroke-width': 7 }),
    circle(150, 160, 115, { fill: 'url(#gl-s)', ...L(4) }),
    path_('M70 90C90 70 130 70 140 92C150 110 120 120 112 140C104 160 80 160 70 140C60 120 56 104 70 90Z', { fill: land, ...L(3) }),
    path_('M170 60C200 56 236 74 240 100C230 110 210 100 196 110C180 116 166 100 170 60Z', { fill: land, ...L(3) }),
    path_('M180 180C210 170 240 186 236 214C230 240 200 250 186 236C172 220 160 192 180 180Z', { fill: land, ...L(3) }),
    path_('M90 210C104 204 120 214 118 230C112 246 94 244 88 232C82 222 82 214 90 210Z', { fill: land, ...L(3) }),
    // cara: ceja levantada, sonrisa de medio lado
    ellipse(124, 150, 13, 16, { fill: '#fff', ...L(3) }), ellipse(176, 150, 13, 16, { fill: '#fff', ...L(3) }),
    circle(128, 154, 6, { fill: C.line }), circle(180, 154, 6, { fill: C.line }),
    path_('M106 122q18-12 34-2M160 128q18-6 32 2', { fill: 'none', ...L(5) }),
    path_('M128 196q26 18 52-4', { fill: 'none', ...L(5) }), path_('M176 190l8 4', { fill: 'none', ...L(4) }),
    ellipse(106, 180, 12, 7, { fill: '#ff9a9a', opacity: 0.6 }), ellipse(196, 180, 12, 7, { fill: '#ff9a9a', opacity: 0.6 }),
    path_('M84 92a80 80 0 0 1 40-36', { fill: 'none', stroke: '#fff', 'stroke-width': 8, opacity: 0.5, 'stroke-linecap': 'round' }),
    // pegatina de maleta
    g({ transform: 'rotate(-14 236 252)' }, rect(204, 236, 64, 34, { rx: 6, fill: C.paper, ...L(2.5) }), text('¡OLÉ!', { f: FONT.poster(), size: 20, x: 236, y: 261, attr: { fill: C.crimson } }).svg),
  ];
  save('globe.svg', svgDoc({ viewBox: '0 0 300 360', title: 'Nací fuera de España', defs, body: b.join('') }));
}

// ====================== FAVICON ======================
{
  const defs = rad('fv-b', [[0, '#e6fbff'], [0.4, '#7fd1c4'], [1, '#2f8f83']], 0.38, 0.32, 0.7);
  const b = [rect(0, 0, 64, 64, { rx: 14, fill: C.velvet }), path_('M18 54h28l-4-8H22z', { fill: C.gold, stroke: C.goldDark, 'stroke-width': 1.5 }), circle(32, 28, 19, { fill: 'url(#fv-b)', stroke: C.goldLight, 'stroke-width': 2.5 }), star(36, 25, 7, 2.5, 4, { fill: '#fff' }), circle(25, 21, 4, { fill: '#fff', opacity: 0.7 })];
  total += writeSvg(path.join(ROOT, 'web/public/favicon.svg'), svgDoc({ viewBox: '0 0 64 64', title: 'Tarotazo', defs, body: b.join('') }));
}

// ====================== IMAGEN SOCIAL (og) ======================
{
  const W = 1200, H = 630;
  const read = (p) => fs.readFileSync(path.join(OUT, p), 'utf8');
  const nest = (file, x, y, w, h, extra = '') => {
    const s = read(file);
    const vb = s.match(/viewBox="([^"]+)"/)[1];
    const cls = (s.match(/^<svg[^>]*class="([^"]+)"/) || [])[1] || '';
    return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" overflow="visible"><g class="${cls}"${extra}>${s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>.*?<\/title>/, '')}</g></svg>`;
  };
  const defs = rad('og-bg', [[0, C.velvet2], [0.55, C.velvet], [1, C.bg]], 0.3, 0.4, 0.9) + `<pattern id="og-wp" width="200" height="200" patternUnits="userSpaceOnUse">${read('wallpaper.svg').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>.*?<\/title>/, '')}</pattern>`;
  const cards = ['cards/rws/mayor-17.svg', 'cards/rws/mayor-00.svg', 'cards/castellana/oros-01.svg'];
  const b = [rect(0, 0, W, H, { fill: 'url(#og-wp)' }), rect(0, 0, W, H, { fill: 'url(#og-bg)', opacity: 0.88 }),
    g({ transform: 'rotate(-12 900 480)' }, nest(cards[0], 830, 250, 175, 300)),
    g({ transform: 'rotate(10 1080 480)' }, nest(cards[2], 990, 240, 175, 300)),
    g({ transform: 'rotate(-2 990 450)' }, nest(cards[1], 905, 200, 185, 317)),
    nest('remedios/saludo.svg', 30, 140, 330, 473),
    text('Tarotazo', { f: FONT.display(), size: 110, x: 380, y: 200, anchor: 'start', maxWidth: 440, attr: { fill: C.goldLight } }).svg,
    text('Tarot y péndulo con Madame Remedios', { f: FONT.title(), size: 34, x: 384, y: 262, anchor: 'start', maxWidth: 400, attr: { fill: C.ink } }).svg,
    text('la vidente con más diplomas que aciertos', { f: FONT.hand(), size: 44, x: 384, y: 330, anchor: 'start', maxWidth: 380, attr: { fill: C.accentText } }).svg,
    text('Entretenimiento, no consejo profesional · +18', { f: FONT.body(), size: 24, x: 384, y: 600, anchor: 'start', attr: { fill: C.inkMuted } }).svg,
  ];
  save('og.svg', svgDoc({ viewBox: `0 0 ${W} ${H}`, title: 'Tarotazo', defs, body: b.join('') }));
}
console.log(`misc: ${(total / 1024).toFixed(0)} KB`);
