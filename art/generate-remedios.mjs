// Madame Remedios: vidente entrañable (turbante, aros, chal, gafas de media luna). 5 poses, fondo transparente.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { svgDoc, path_, circle, ellipse, rect, g, pt, star, polar, writeSvg } from './lib/svg.mjs';
import { limbD } from './lib/figures.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const K = {
  line: '#2b1a12', skin: '#f2c4a0', skinS: '#dfa27e', cheek: '#ef8f8f', hair: '#3a2230', turban: '#6a2a8a', turbanS: '#4e1d68', turbanL: '#8e44b0',
  gold: '#e3b04b', goldL: '#f7da8a', shawl: '#c2307a', shawlS: '#962058', dress: '#3b1450', lips: '#c0303a', white: '#fffaf0', glass: '#bfe8f0',
  ball: '#9fe3dc', ballS: '#5fb8c8', cloth: '#5a1f72', feather: '#2f8f83',
};
const S = { stroke: K.line, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
const F = (fill, extra = {}) => ({ fill, ...S, ...extra });

const HX = 300, HY = 270;

function body() {
  const o = [];
  // vestido / torso
  o.push(path_(`M110 800C110 600 150 470 220 430L380 430C450 470 490 600 490 800Z`, F(K.dress)));
  // collar de cuentas
  for (let i = 0; i < 13; i++) { const [x, y] = polar(HX, 380, 92, 25 + i * 10.8); o.push(circle(x, y, 9, F(i % 3 ? K.gold : K.shawl, { 'stroke-width': 3 }))); }
  o.push(path_(`M${HX} 478l-16 26h32z`, F(K.goldL, { 'stroke-width': 3 })));
  // chal sobre los hombros
  o.push(path_(`M90 640C80 520 140 430 230 410Q300 450 370 410C460 430 520 520 510 640L470 620Q440 520 380 470Q300 560 220 470Q160 520 130 620Z`, F(K.shawl)));
  // estampado del chal
  for (const [x, y] of [[150, 560], [190, 490], [410, 490], [450, 560], [250, 470], [350, 470]]) o.push(star(x, y, 11, 4, 4, { fill: K.goldL, stroke: 'none' }));
  // flecos
  let fr = '';
  for (let i = 0; i < 9; i++) fr += `M${pt(95 + i * 4.5, 640 - i * 2)}l-6 30M${pt(505 - i * 4.5, 640 - i * 2)}l6 30`;
  o.push(path_(fr, { fill: 'none', stroke: K.gold, 'stroke-width': 3 }));
  return o.join('');
}

function head(expr) {
  const o = [];
  const hx = HX, hy = HY;
  // pelo rizado asomando
  for (const [x, y, r] of [[200, 290, 30], [195, 330, 26], [400, 290, 30], [405, 330, 26], [215, 360, 20], [385, 360, 20]]) o.push(circle(x, y, r, F(K.hair)));
  // cuello
  o.push(path_(limbD([[hx, hy + 60], [hx, hy + 150]], 70), F(K.skin)));
  // cara (redondita, mofletes)
  o.push(path_(`M${hx - 92} ${hy - 30}C${hx - 100} ${hy + 50} ${hx - 70} ${hy + 115} ${hx} ${hy + 120}C${hx + 70} ${hy + 115} ${hx + 100} ${hy + 50} ${hx + 92} ${hy - 30}C${hx + 80} ${hy - 110} ${hx - 80} ${hy - 110} ${hx - 92} ${hy - 30}Z`, F(K.skin)));
  // orejas + aros
  for (const s of [-1, 1]) {
    o.push(ellipse(hx + s * 94, hy + 10, 14, 22, F(K.skin)));
    o.push(circle(hx + s * 98, hy + 66, 30, { fill: 'none', stroke: K.line, 'stroke-width': 11 }), circle(hx + s * 98, hy + 66, 30, { fill: 'none', stroke: K.gold, 'stroke-width': 6 }));
  }
  // mofletes
  o.push(ellipse(hx - 55, hy + 45, 20, 13, { fill: K.cheek, opacity: 0.55 }), ellipse(hx + 55, hy + 45, 20, 13, { fill: K.cheek, opacity: 0.55 }));
  // lunar
  o.push(circle(hx + 46, hy + 72, 4, { fill: K.line }));
  // ojos
  const eyeY = hy + 6;
  const brow = (dy, tilt) => path_(`M${hx - 62} ${eyeY - 34 + dy + tilt}Q${hx - 40} ${eyeY - 46 + dy} ${hx - 18} ${eyeY - 36 + dy}M${hx + 18} ${eyeY - 36 + dy}Q${hx + 40} ${eyeY - 46 + dy} ${hx + 62} ${eyeY - 34 + dy + tilt}`, { fill: 'none', stroke: K.hair, 'stroke-width': 7, 'stroke-linecap': 'round' });
  if (expr === 'rie' || expr === 'saludo') {
    o.push(path_(`M${hx - 56} ${eyeY + 4}Q${hx - 40} ${eyeY - 14} ${hx - 24} ${eyeY + 4}M${hx + 24} ${eyeY + 4}Q${hx + 40} ${eyeY - 14} ${hx + 56} ${eyeY + 4}`, { fill: 'none', ...S, 'stroke-width': 6 }));
    o.push(brow(-4, 0));
  } else if (expr === 'sorpresa') {
    for (const s of [-1, 1]) o.push(ellipse(hx + s * 40, eyeY - 2, 16, 20, F(K.white, { 'stroke-width': 4 })), circle(hx + s * 40, eyeY, 7, { fill: K.line }));
    o.push(brow(-16, 6));
  } else if (expr === 'piensa') {
    for (const s of [-1, 1]) o.push(ellipse(hx + s * 40, eyeY, 13, 15, F(K.white, { 'stroke-width': 4 })), circle(hx + s * 40 + 5, eyeY - 6, 6, { fill: K.line }));
    o.push(path_(`M${hx - 62} ${eyeY - 30}Q${hx - 40} ${eyeY - 44} ${hx - 18} ${eyeY - 40}M${hx + 18} ${eyeY - 32}Q${hx + 40} ${eyeY - 36} ${hx + 62} ${eyeY - 26}`, { fill: 'none', stroke: K.hair, 'stroke-width': 7, 'stroke-linecap': 'round' }));
  } else { // bola: mirada baja, párpados entornados
    for (const s of [-1, 1]) o.push(path_(`M${hx + s * 40 - 16} ${eyeY}Q${hx + s * 40} ${eyeY + 14} ${hx + s * 40 + 16} ${eyeY}Z`, F(K.white, { 'stroke-width': 4 })), circle(hx + s * 40, eyeY + 6, 5, { fill: K.line }), path_(`M${hx + s * 40 - 18} ${eyeY}Q${hx + s * 40} ${eyeY - 6} ${hx + s * 40 + 18} ${eyeY}`, { fill: 'none', ...S, 'stroke-width': 5 }));
    o.push(brow(2, 0));
  }
  // pestañas coquetas
  o.push(path_(`M${hx - 58} ${eyeY - 4}l-10-6M${hx + 58} ${eyeY - 4}l10-6`, { fill: 'none', ...S, 'stroke-width': 4 }));
  // nariz
  o.push(path_(`M${hx + 4} ${eyeY + 8}Q${hx + 16} ${eyeY + 34} ${hx + 2} ${eyeY + 40}Q${hx - 6} ${eyeY + 40} ${hx - 10} ${eyeY + 36}`, { fill: 'none', ...S, 'stroke-width': 4.5 }));
  // gafas de media luna (en la punta de la nariz; en «sorpresa» resbalan)
  const gy = expr === 'sorpresa' ? eyeY + 34 : eyeY + 20;
  for (const s of [-1, 1]) o.push(path_(`M${hx + s * 42 - 27} ${gy}H${hx + s * 42 + 27}A27 22 0 0 1 ${hx + s * 42 - 27} ${gy}Z`, { fill: K.glass, 'fill-opacity': 0.45, stroke: K.gold, 'stroke-width': 5 }));
  o.push(path_(`M${hx - 15} ${gy + 2}Q${hx} ${gy - 8} ${hx + 15} ${gy + 2}`, { fill: 'none', stroke: K.gold, 'stroke-width': 4 }));
  o.push(path_(`M${hx - 69} ${gy}C${hx - 90} ${gy + 40} ${hx - 70} ${gy + 110} ${hx - 40} ${gy + 140}M${hx + 69} ${gy}C${hx + 90} ${gy + 40} ${hx + 70} ${gy + 110} ${hx + 40} ${gy + 140}`, { fill: 'none', stroke: K.gold, 'stroke-width': 2, opacity: 0.8 }));
  // boca
  const my = hy + 78;
  if (expr === 'rie') {
    o.push(path_(`M${hx - 36} ${my - 8}Q${hx} ${my - 2} ${hx + 36} ${my - 8}Q${hx + 30} ${my + 40} ${hx} ${my + 42}Q${hx - 30} ${my + 40} ${hx - 36} ${my - 8}Z`, F('#7a1f2a')), path_(`M${hx - 30} ${my - 4}Q${hx} ${my + 4} ${hx + 30} ${my - 4}L${hx + 28} ${my + 4}Q${hx} ${my + 10} ${hx - 28} ${my + 4}Z`, { fill: K.white }), ellipse(hx, my + 30, 16, 8, { fill: '#e8737f' }));
    o.push(path_(`M${hx + 64} ${eyeY + 10}q8 16 0 24q-8-8 0-24z`, { fill: K.glass, stroke: K.line, 'stroke-width': 2.5 }));
  } else if (expr === 'sorpresa') {
    o.push(ellipse(hx, my + 10, 16, 22, F('#7a1f2a')), ellipse(hx, my + 10, 16, 22, { fill: 'none', stroke: K.lips, 'stroke-width': 6 }));
  } else if (expr === 'piensa') {
    o.push(path_(`M${hx - 14} ${my + 4}Q${hx + 4} ${my - 4} ${hx + 22} ${my + 2}Q${hx + 4} ${my + 12} ${hx - 14} ${my + 4}Z`, F(K.lips, { 'stroke-width': 3.5 })));
  } else {
    o.push(path_(`M${hx - 30} ${my}Q${hx} ${my + 26} ${hx + 30} ${my}Q${hx} ${my + 10} ${hx - 30} ${my}Z`, F(K.lips, { 'stroke-width': 3.5 })));
  }
  // turbante
  o.push(path_(`M${hx - 112} ${hy - 20}C${hx - 140} ${hy - 150} ${hx - 60} ${hy - 225} ${hx + 10} ${hy - 225}C${hx + 100} ${hy - 225} ${hx + 150} ${hy - 150} ${hx + 112} ${hy - 20}C${hx + 60} ${hy - 60} ${hx - 60} ${hy - 60} ${hx - 112} ${hy - 20}Z`, F(K.turban)));
  o.push(path_(`M${hx - 105} ${hy - 50}C${hx - 40} ${hy - 150} ${hx + 60} ${hy - 170} ${hx + 120} ${hy - 110}`, { fill: 'none', stroke: K.turbanS, 'stroke-width': 8 }));
  o.push(path_(`M${hx - 118} ${hy - 110}C${hx - 50} ${hy - 200} ${hx + 70} ${hy - 200} ${hx + 105} ${hy - 160}`, { fill: 'none', stroke: K.turbanL, 'stroke-width': 8 }));
  o.push(path_(`M${hx - 112} ${hy - 20}C${hx - 60} ${hy - 60} ${hx + 60} ${hy - 60} ${hx + 112} ${hy - 20}`, { fill: 'none', ...S }));
  // pluma y broche
  o.push(path_(`M${hx + 10} ${hy - 150}C${hx + 30} ${hy - 260} ${hx + 110} ${hy - 300} ${hx + 150} ${hy - 290}C${hx + 110} ${hy - 260} ${hx + 60} ${hy - 200} ${hx + 26} ${hy - 140}Z`, F(K.feather)));
  o.push(path_(`M${hx + 18} ${hy - 150}C${hx + 60} ${hy - 220} ${hx + 100} ${hy - 260} ${hx + 140} ${hy - 285}`, { fill: 'none', stroke: K.line, 'stroke-width': 3 }));
  o.push(ellipse(hx + 14, hy - 132, 34, 40, F(K.gold)), ellipse(hx + 14, hy - 132, 18, 22, F(K.shawl, { 'stroke-width': 3 })), ellipse(hx + 8, hy - 140, 6, 8, { fill: '#fff', opacity: 0.7 }));
  for (let i = 0; i < 8; i++) o.push(circle(...polar(hx + 14, hy - 132, 36, i * 45), 5, F(K.goldL, { 'stroke-width': 2 })));
  return o.join('');
}

const hand = (x, y, r = 26, a = 0) => g({ transform: `rotate(${a} ${x} ${y})` },
  ellipse(x, y, r, r * 1.1, F(K.skin)),
  path_(`M${x - r * 0.6} ${y - r * 0.9}l-4-${r * 0.8}M${x - r * 0.1} ${y - r}l0-${r * 0.9}M${x + r * 0.4} ${y - r * 0.9}l4-${r * 0.8}`, { fill: 'none', stroke: K.line, 'stroke-width': r * 0.62, 'stroke-linecap': 'round' }),
  path_(`M${x - r * 0.6} ${y - r * 0.9}l-4-${r * 0.8}M${x - r * 0.1} ${y - r}l0-${r * 0.9}M${x + r * 0.4} ${y - r * 0.9}l4-${r * 0.8}`, { fill: 'none', stroke: K.skin, 'stroke-width': r * 0.42, 'stroke-linecap': 'round' }),
  path_(`M${x + r * 0.9} ${y}l${r * 0.5}-${r * 0.5}`, { fill: 'none', stroke: K.line, 'stroke-width': r * 0.62, 'stroke-linecap': 'round' }),
  path_(`M${x + r * 0.9} ${y}l${r * 0.5}-${r * 0.5}`, { fill: 'none', stroke: K.skin, 'stroke-width': r * 0.42, 'stroke-linecap': 'round' }),
  circle(x + r * 0.42, y - r * 0.9 - r * 0.8, 6, { fill: K.shawl, stroke: K.line, 'stroke-width': 2 }));

const arm = (pts) => path_(limbD(pts, [62, 52, 44]), F(K.shawl));
const bangles = (x, y, a = 0) => g({ transform: `rotate(${a} ${x} ${y})` }, ...[0, 12, 24].map((d) => ellipse(x, y + d, 26, 8, { fill: 'none', stroke: K.gold, 'stroke-width': 5 })));

function pose(name) {
  const back = [], front = [], extra = [];
  if (name === 'saludo') {
    front.push(arm([[160, 520], [120, 420], [130, 300]]), bangles(130, 320, -10), hand(132, 268, 30, -10));
    front.push(arm([[440, 520], [450, 640], [400, 720]]), hand(392, 730, 26, 120));
    extra.push(path_(`M70 250q-14 20 0 40M50 230q-24 40 0 80`, { fill: 'none', stroke: K.gold, 'stroke-width': 5, 'stroke-linecap': 'round' }));
  } else if (name === 'piensa') {
    front.push(arm([[440, 520], [450, 640], [360, 420]]), bangles(380, 450, 30), hand(345, 365, 24, -30));
    front.push(arm([[160, 520], [150, 640], [300, 640]]), hand(310, 640, 26, 80));
    extra.push(circle(450, 150, 14, F(K.white, { 'stroke-width': 3 })), circle(475, 110, 20, F(K.white, { 'stroke-width': 3 })), path_(`M490 20c30-30 80-10 70 30c30 10 20 60-20 50c-20 30-80 20-80-10c-30-10-20-60 30-70z`, F(K.white, { 'stroke-width': 3 })), star(510, 60, 12, 5, 5, { fill: K.gold, stroke: K.line, 'stroke-width': 2 }));
  } else if (name === 'sorpresa') {
    front.push(arm([[160, 520], [110, 430], [175, 330]]), hand(180, 320, 26, 20));
    front.push(arm([[440, 520], [490, 430], [425, 330]]), hand(420, 320, 26, -20));
    extra.push(path_(`M120 120l20 30M300 30v36M480 120l-20 30M80 220l30 10M520 220l-30 10`, { fill: 'none', stroke: K.gold, 'stroke-width': 7, 'stroke-linecap': 'round' }));
  } else if (name === 'rie') {
    front.push(arm([[160, 520], [150, 650], [260, 680]]), hand(272, 680, 26, 90));
    front.push(arm([[440, 520], [470, 430], [420, 360]]), hand(415, 350, 24, -15));
    extra.push(path_(`M470 180q30-20 50 10M490 230q40-10 50 20`, { fill: 'none', stroke: K.gold, 'stroke-width': 5, 'stroke-linecap': 'round' }));
    extra.push(path_(`M60 160l8 22l22 0l-18 14l7 22l-19-13l-19 13l7-22l-18-14l22 0z`, F(K.goldL, { 'stroke-width': 3 })));
  } else if (name === 'bola') {
    // mesa con tapete, bola de cristal con brillo; manos sobre la bola
    extra.push(path_(`M20 800L40 640L560 640L580 800Z`, F(K.cloth)), path_(`M40 640L60 680L100 650L140 690L180 655L220 695L260 660L300 700L340 660L380 695L420 655L460 690L500 650L540 680L560 640`, { fill: 'none', stroke: K.gold, 'stroke-width': 4 }));
    extra.push(path_(`M230 650L250 600L350 600L370 650Z`, F(K.gold)));
    extra.push(`<defs><radialGradient id="rb-ball" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="${K.ball}"/><stop offset="1" stop-color="${K.ballS}"/></radialGradient><radialGradient id="rb-glow"><stop offset="0" stop-color="${K.ball}" stop-opacity=".7"/><stop offset="1" stop-color="${K.ball}" stop-opacity="0"/></radialGradient></defs>`);
    extra.push(circle(300, 520, 170, { fill: 'url(#rb-glow)' }), circle(300, 520, 92, F('url(#rb-ball)')), ellipse(270, 485, 26, 16, { fill: '#fff', opacity: 0.75, transform: 'rotate(-30 270 485)' }));
    extra.push(path_(`M270 540q30-30 60 0q-30 20-60 0z`, { fill: '#fff', opacity: 0.35 }), star(330, 560, 9, 3, 4, { fill: '#fff' }));
    front.push(arm([[160, 520], [130, 600], [190, 470]]), hand(196, 455, 26, 40));
    front.push(arm([[440, 520], [470, 600], [410, 470]]), hand(404, 455, 26, -40));
  }
  return { back: back.join(''), front: front.join(''), extra: extra.join('') };
}

const EXPR = { saludo: 'saludo', piensa: 'piensa', sorpresa: 'sorpresa', rie: 'rie', bola: 'bola' };
const DESC = {
  saludo: 'Madame Remedios saluda con la mano, encantada de verte.',
  piensa: 'Madame Remedios piensa con la mano en la barbilla.',
  sorpresa: 'Madame Remedios, sorprendidísima, con las gafas resbalando.',
  rie: 'Madame Remedios se ríe a carcajadas.',
  bola: 'Madame Remedios consulta su bola de cristal.',
};

let total = 0;
for (const p of Object.keys(EXPR)) {
  const { back, front, extra } = pose(p);
  const isBola = p === 'bola';
  const body_ = isBola
    ? back + body() + head(EXPR[p]) + extra + front
    : extra + back + body() + head(EXPR[p]) + front;
  const svg = svgDoc({ viewBox: '0 -60 600 860', title: 'Madame Remedios', desc: DESC[p], body: body_ });
  total += writeSvg(path.join(ROOT, 'web/public/art/remedios', `${p}.svg`), svg);
}
console.log(`remedios: 5 poses, ${(total / 1024).toFixed(0)} KB`);
