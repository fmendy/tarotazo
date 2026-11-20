// Baraja española: pintas, palos tradicionales redibujados y figuras (sota, caballo, rey).
// Modelos: castellana (fondo limpio), catalana (suelo ajedrezado y orlas), ilustrada (escenas de la casa).
import { pt, path_, circle, ellipse, rect, g, star, polar, rng } from '../lib/svg.mjs';
import { horse, limbD } from '../lib/figures.mjs';
import * as S from '../lib/symbols.mjs';
import { pipPositions } from './minors.mjs';

const rot = (svg, a, x, y) => g({ transform: `rotate(${a} ${x} ${y})` }, svg);

const ROBES = {
  castellana: { oros: ['r', 'b', 'y'], copas: ['b', 'r', 'y'], espadas: ['gn', 'r', 'b'], bastos: ['r', 'gn', 'y'] },
  catalana: { oros: ['gn', 'r', 'y'], copas: ['r', 'b', 'y'], espadas: ['b', 'gn', 'r'], bastos: ['y', 'r', 'gn'] },
  ilustrada: { oros: ['v', 'g', 'r'], copas: ['r', 'v', 'gl'], espadas: ['b', 'v', 'g'], bastos: ['gn', 'r', 'g'] },
};

function background(model, suit, figure) {
  if (model === 'castellana') return figure ? [ellipse(350, 1080, 210, 26, { class: 'sh' })] : [];
  if (model === 'catalana') {
    const out = [];
    if (figure) {
      out.push(rect(60, 980, 580, 160, { class: 'st' }));
      for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) out.push(rect(60 + i * 50, 980 + j * 50, 50, 50, { class: 'st2 ns' }));
    }
    // orlas en las esquinas
    for (const [x, y, a] of [[70, 70, 0], [630, 70, 90], [630, 1130, 180], [70, 1130, 270]]) out.push(rot(path_(`M${x} ${y + 70}Q${x} ${y} ${x + 70} ${y}Q${x + 30} ${y + 10} ${x + 20} ${y + 30}Q${x + 10} ${y + 40} ${x} ${y + 70}Z`, { class: 'gn th' }), a, x, y));
    return out;
  }
  // ilustrada
  const out = [rect(60, 60, 580, 1080, { class: { oros: 'sy', copas: 'sk', espadas: 'c', bastos: 'sy' }[suit] + ' ns' })];
  if (figure) {
    out.push(S.mountains(900, 'mt', { peaks: [[180, 160], [520, 200]], snow: suit === 'espadas' }));
    out.push(S.ground(930, suit === 'espadas' ? 'st' : 'gr', { amp: 10, x0: 40, x1: 660, y1: 1160 }));
  } else {
    // marco interior ornamental con estrellitas
    for (let i = 0; i < 8; i++) out.push(S.sparkle(110 + (i % 2) * 480, 140 + Math.floor(i / 2) * 300, 14, 'g'));
  }
  return out;
}

function symbol(suit, x, y, s = 1, model) {
  if (suit === 'oros') return S.oroES(x, y, 62 * s, { cls: 'g' });
  if (suit === 'copas') return S.copaES(x, y + 50 * s, 1.0 * s, { cls: 'g', cls2: model === 'catalana' ? 'b' : 'r' });
  if (suit === 'espadas') return S.espadaES(x, y + 90 * s, x, y - 90 * s, { w: 14 * s });
  return S.bastoES(x, y + 90 * s, x, y - 90 * s, { w: 26 * s, cls2: model === 'catalana' ? null : 'gn' });
}

function pips(suit, n, model) {
  const out = [];
  if (suit === 'oros' || suit === 'copas') {
    let pos = pipPositions(n, { x0: 205, x1: 495, y0: 230, y1: 970 });
    if (n === 9) pos = [178, 350, 522].flatMap((x) => [260, 600, 940].map((y) => [x, y]));
    const s = n === 1 ? 2.6 : n <= 3 ? 1.9 : n <= 6 ? 1.6 : n === 9 ? 1.12 : 1.3;
    if (n === 1 && suit === 'oros') {
      out.push(S.oroES(350, 600, 200, { cls: 'g', face: true }));
      for (let i = 0; i < 12; i++) out.push(S.sparkle(...polar(350, 600, 245, i * 30), 14, 'r'));
      return out.join('');
    }
    for (const [x, y] of pos) out.push(symbol(suit, x, y, s, model));
    return out.join('');
  }
  // espadas y bastos: cruzados en celosía (los pares en aspa, el impar centrado)
  const fn = suit === 'espadas' ? (x1, y1, x2, y2, w) => S.espadaES(x1, y1, x2, y2, { w }) : (x1, y1, x2, y2, w) => S.bastoES(x1, y1, x2, y2, { w: w * 2, cls2: model === 'catalana' ? null : 'gn', seed: Math.round(x1) });
  if (n === 1) {
    out.push(rot(fn(350, 1060, 350, 150, suit === 'espadas' ? 34 : 34), suit === 'espadas' ? 0 : 0, 350, 600));
    if (suit === 'espadas') out.push(path_(`M250 360Q350 300 450 360Q430 420 450 470Q350 420 250 470Q270 420 250 360Z`, { class: 'r' }), path_(`M300 395h100`, { class: 'nf th' }));
    if (suit === 'bastos') out.push(path_(`M240 620Q350 560 460 620Q440 680 460 720Q350 670 240 720Q260 680 240 620Z`, { class: 'r' }));
    return out.join('');
  }
  if (n <= 3) {
    const k = Math.floor(n / 2);
    for (let i = 0; i < k; i++) {
      out.push(rot(fn(350, 1060, 350, 140, 18), 22, 350, 600));
      out.push(rot(fn(350, 1060, 350, 140, 18), -22, 350, 600));
    }
    if (n % 2) out.push(fn(350, 1070, 350, 130, 18));
    out.push(circle(350, 600, 22, { class: 'r' }), circle(350, 600, 9, { class: 'g' }));
    return out.join('');
  }
  const pos = pipPositions(n, { x0: 200, x1: 500, y0: 250, y1: 950 });
  const L = n <= 5 ? 200 : n <= 7 ? 160 : 118;
  pos.forEach(([x, y], i) => {
    const a = (i % 2 ? 1 : -1) * 12;
    out.push(rot(fn(x, y + L, x, y - L, n >= 8 ? 15 : 19), a, x, y));
  });
  return out.join('');
}

function figure(c, suit, rank, model) {
  const [r1, r2, r3] = ROBES[model][suit];
  const out = [];
  const P = c.person;
  const hold = (f, side = 'r', s = 1) => {
    const [x, y] = f.hands[side];
    if (suit === 'oros') return S.oroES(x + (side === 'r' ? 10 : -10), y - 20, 52 * s, { cls: 'g' });
    if (suit === 'copas') return S.copaES(x, y + 16, 0.9 * s, { cls: 'g', cls2: model === 'catalana' ? 'b' : 'r' });
    if (suit === 'espadas') return S.espadaES(x, y + 40, x + (side === 'r' ? 20 : -20), y - 330 * s, { w: 16 * s });
    return S.bastoES(x - 6, y + 70, x + 10, y - 260 * s, { w: 30 * s, cls2: model === 'catalana' ? null : 'gn' });
  };
  if (rank === 'sota') {
    const f = P({ x: 320, y: 1080, h: 860, garment: 'tunic', robe: r1, sleeve: r2, legs: r3, cape: r2, tabard: r3, belt: 'g', head: 'hat', headC: r2, hair: model === 'ilustrada' ? 'hk' : 'hb', hairStyle: 'long', mood: 'smile', look: -0.4, stride: 3, arms: suit === 'oros' ? { l: [120, 90], r: [60, -60] } : { l: [120, 90], r: [70, -40] } });
    out.push(f.svg, hold(f, 'r'));
    out.push(circle(...f.hands.r, 3.6 * f.k, { class: 's' }));
  } else if (rank === 'caballo') {
    const h = horse({ x: 245, y: 1090, w: 540, dir: 1, c: { oros: 'w', copas: 'e', espadas: 'w', bastos: 'o' }[suit], mane: 'hg', barding: r2, rear: suit === 'espadas' || suit === 'bastos' });
    out.push(h.svg);
    const f = P({ x: h.saddle[0], y: h.saddle[1] + 170, h: 520, riding: true, garment: 'armor', robe: r1, sleeve: r1, legs: r3, cape: r2, head: suit === 'oros' ? 'hat' : 'helmet', headC: r2, hair: 'h', look: 0.6, mood: 'smile', arms: { l: [100, 70], r: [10, -50] } });
    out.push(f.svg, hold(f, 'r', 0.8), circle(...f.hands.r, 3.6 * f.k, { class: 's' }));
  } else {
    const f = P({ x: 320, y: 1080, h: 880, garment: 'robe', robe: r1, sleeve: r1, cape: r2, tabard: model === 'catalana' ? r3 : null, belt: 'g', head: 'crown', hair: 'h', beard: 'long', beardC: model === 'ilustrada' ? 'hg' : 'h', mood: 'smile', look: 0, arms: { l: [120, 120], r: [70, -40] } });
    out.push(f.svg, hold(f, 'r'), circle(...f.hands.r, 3.6 * f.k, { class: 's' }));
    // armiño en la capa
    for (let i = 0; i < 6; i++) out.push(path_(`M${pt(f.shoulder.l[0] - 30 + i * 22, f.shoulder.l[1] + 8)}v12`, { class: 'nf', 'stroke-width': 4 }));
  }
  return out.join('');
}

export function spanishScene(c, suit, rank, model) {
  const fig = !/^\d+$/.test(rank);
  const out = background(model, suit, fig);
  out.push(fig ? figure(c, suit, rank, model) : pips(suit, +rank, model));
  return out.join('');
}
