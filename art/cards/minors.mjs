// Arcanos menores: escenas simplificadas (RWS) + el número exacto de elementos del palo.
// También los menores «de pips» del Marsella.
import { pt, path_, circle, ellipse, rect, g, poly, star, polar, line, rng, text, FONT } from '../lib/svg.mjs';
import { horse, dog, limbD, bird } from '../lib/figures.mjs';
import * as S from '../lib/symbols.mjs';
const { PX0, PX1, PY0, PY1, PW, PH } = S;

const rot = (svg, a, x, y) => g({ transform: `rotate(${a} ${x} ${y})` }, svg);
const W = (x, y, s = 1, o) => S.SUIT_TAROT.bastos(x, y, s, o);
const Cp = (x, y, s = 1, o) => S.cup(x, y, s, o); // (x,y) = base
const Sw = (x1, y1, x2, y2, w = 14) => S.sword(x1, y1, x2, y2, { w });
const Pn = (x, y, r = 40) => S.pentacle(x, y, r);
const hs = (f) => circle(f.hands.l[0], f.hands.l[1], 3.6 * f.k, { class: f.cat ? 'o' : 's' }) + circle(f.hands.r[0], f.hands.r[1], 3.6 * f.k, { class: 's' });
const handTop = (h) => circle(h[0], h[1], 0, {});

/** Mano saliendo de una nube (ases). */
function cloudHand(x, y, side = -1, s = 1.7) {
  const P = (u, v) => [x + u * s, y + v * s];
  return g({}, path_(limbD([P(side * 80, -4), P(0, 0)], [26 * s, 20 * s]), { class: 'w' }), S.cloud(x + side * 95 * s, y + 4 * s, 1.0 * s), ellipse(x, y - 4 * s, 20 * s, 17 * s, { class: 's' }), path_(`M${pt(...P(-13, -14))}q${pt(13 * s, -7 * s)} ${pt(26 * s, 0)}M${pt(...P(-15, -4))}q${pt(15 * s, -6 * s)} ${pt(30 * s, 0)}M${pt(...P(-13, 6))}q${pt(13 * s, -4 * s)} ${pt(26 * s, 0)}`, { class: 'nf th' }));
}

const BG = {
  bastos: () => [S.sky('sy'), S.mountains(760, 'mt', { peaks: [[130, 120], [520, 150]], snow: false }), S.ground(800, 'gr', { amp: 14, seed: 4 })],
  copas: () => [S.sky('sk'), S.ground(820, 'gr', { amp: 10, seed: 7 })],
  espadas: () => [S.sky('c'), S.cloud(160, 260, 1.3, 'm'), S.cloud(540, 220, 1.1, 'm'), S.ground(840, 'st', { amp: 8, seed: 9 })],
  oros: () => [S.sky('sy'), S.ground(820, 'gr', { amp: 8, seed: 11 })],
};

// Colores de vestido por palo para coherencia
const ROBE = { bastos: ['o', 'r', 'y'], copas: ['b', 'r', 'w'], espadas: ['b', 'm', 'v'], oros: ['r', 'v', 'gn'] };

function pip(c, suit, n) {
  const P = c.person;
  const out = BG[suit]();
  const F = (o) => { const f = P(o); return f; };
  switch (`${suit}-${n}`) {
    // ------------------------- BASTOS -------------------------
    case 'bastos-1': out.push(S.castle(470, 800, 1.2), S.wand(320, 860, 370, 240, { w: 50, leaves: 8, seed: 2 }), cloudHand(340, 650, -1)); break;
    case 'bastos-2': {
      out.push(S.waves(800, { amp: 6, rows: 2 }), rect(PX0 - 10, 860, PW + 20, 200, { class: 'st' }), path_(`M${PX0} 860v-30h40v30h40v-30h40v30h40v-30h40v30h40v-30h40v30h40v-30h40v30h40v-30h40v30h40v-30h40v30h40v-30`, { class: 'st' }));
      const f = F({ x: 330, y: 900, h: 520, garment: 'tunic', robe: 'o', sleeve: 'r', legs: 'r', head: 'hat', headC: 'r', hair: 'h', beard: 'short', look: 0.6, arms: { l: [130, 60], r: [40, -30] } });
      out.push(W(520, 640, 2.3), f.svg, W(f.hands.r[0] + 6, f.hands.r[1] - 40, 2.0), S.SUIT_TAROT.oros(f.hands.l[0] + 10, f.hands.l[1] - 30, 0.8), hs(f));
      break;
    }
    case 'bastos-3': {
      out.push(S.waves(760, { amp: 6, rows: 2 }), S.boat(260, 760, 80, 'wd'), S.boat(500, 740, 60, 'wd'), path_(`M${PX0 - 10} 880Q350 820 ${PX1 + 10} 860L${PX1 + 10} 1050L${PX0 - 10} 1050Z`, { class: 'e' }));
      const f = F({ x: 330, y: 1000, h: 560, garment: 'robe', robe: 'r', sleeve: 'gn', cape: 'gn', hair: 'h', hairStyle: 'long', eyes: 'closed', look: 0, arms: { l: [130, 90], r: [50, -40] } });
      out.push(W(150, 760, 2.3), W(560, 760, 2.3), f.svg, W(f.hands.r[0], f.hands.r[1] - 50, 2.2), hs(f));
      break;
    }
    case 'bastos-4': {
      out.push(S.castle(350, 760, 1.5, 'st'));
      for (const x of [140, 260, 440, 560]) out.push(W(x, 760, 2.2));
      out.push(path_(`M150 640Q350 720 550 640`, { class: 'nf', 'stroke-width': 26, stroke: '#4f8f3d' }));
      for (let i = 0; i < 8; i++) out.push(S.rose(170 + i * 52, 650 + Math.sin(i / 7 * Math.PI) * 40, 11, i % 2 ? 'r' : 'y'));
      const a = F({ x: 280, y: 1000, h: 330, garment: 'dress', robe: 'r', sleeve: 'r', hair: 'hb', hairStyle: 'long', mood: 'smile', arms: { l: [-120, -110], r: [-60, -70] } });
      const b = F({ x: 420, y: 1000, h: 330, garment: 'dress', robe: 'b', sleeve: 'b', hair: 'h', hairStyle: 'long', mood: 'smile', arms: { l: [-120, -110], r: [-60, -70] } });
      out.push(a.svg, b.svg, S.rose(...a.hands.l, 12, 'r'), S.rose(...b.hands.r, 12, 'y'));
      break;
    }
    case 'bastos-5': {
      const cols = ['r', 'b', 'y', 'gn', 'o'];
      const xs = [130, 240, 350, 460, 570];
      xs.forEach((x, i) => {
        const f = F({ x, y: 1010 - (i % 2) * 30, h: 360, garment: 'tunic', robe: cols[i], sleeve: cols[i], legs: cols[(i + 2) % 5], hair: ['h', 'hb', 'hk', 'h', 'hb'][i], mood: 'o', look: i < 2 ? 0.6 : -0.6, arms: { l: [-140, -120], r: [-40, -60] } });
        out.push(f.svg);
        out.push(S.wand(f.hands.l[0] - 50, f.hands.l[1] + 120, f.hands.r[0] + 60, f.hands.r[1] - 140 - (i % 2) * 40, { w: 16, leaves: 2, seed: i }));
      });
      break;
    }
    case 'bastos-6': {
      for (let i = 0; i < 5; i++) out.push(W(140 + i * 100, 650 - (i % 2) * 20, 2.2));
      const h = horse({ x: 330, y: 1000, w: 440, dir: 1, c: 'w', barding: 'gn' });
      out.push(h.svg);
      const f = F({ x: h.saddle[0], y: h.saddle[1] + 100, h: 320, riding: true, robe: 'r', sleeve: 'r', legs: 'r', head: 'laurel', hair: 'h', mood: 'smile', arms: { l: [-150, -100], r: [30, 60] } });
      out.push(f.svg, S.wand(f.hands.l[0], f.hands.l[1] + 80, f.hands.l[0] + 20, f.hands.l[1] - 200, { w: 18, leaves: 3 }));
      out.push(g({}, ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const [x, y] = polar(f.hands.l[0] + 20, f.hands.l[1] - 200, 30, i * 45); return ellipse(x, y, 10, 6, { class: 'gn th', transform: `rotate(${i * 45 + 90} ${x} ${y})` }); })), hs(f));
      break;
    }
    case 'bastos-7': {
      out.push(path_(`M${PX0 - 10} 1050L${PX0 - 10} 820L300 760L${PX1 + 10} 800L${PX1 + 10} 1050Z`, { class: 'gr2' }));
      for (let i = 0; i < 6; i++) out.push(S.wand(110 + i * 90, 1060, 150 + i * 70, 760 + (i % 2) * 30, { w: 18, leaves: 2, seed: i }));
      const f = F({ x: 340, y: 800, h: 520, garment: 'tunic', robe: 'gn', sleeve: 'gn', legs: 'y', hair: 'h', mood: 'o', look: -0.6, arms: { l: [150, 100], r: [20, -60] } });
      out.push(f.svg, S.wand(f.hands.l[0] - 40, f.hands.l[1] + 20, f.hands.r[0] + 40, f.hands.r[1] - 60, { w: 22, leaves: 3 }), hs(f));
      break;
    }
    case 'bastos-8': {
      out.push(S.waves(860, { amp: 6, rows: 2 }), S.house(500, 800, 1.3));
      for (let i = 0; i < 8; i++) out.push(S.wand(110 + i * 40, 560 + i * 40, 420 + i * 30, 240 + i * 50, { w: 20, leaves: 3, seed: i }));
      break;
    }
    case 'bastos-9': {
      for (let i = 0; i < 8; i++) out.push(W(120 + i * 66, 760, 2.4));
      const f = F({ x: 350, y: 1010, h: 560, garment: 'tunic', robe: 'r', sleeve: 'w', legs: 'w', hair: 'h', beard: 'short', mood: 'neutral', look: 0.8, arms: { l: [120, 90], r: [60, -40] } });
      out.push(f.svg, S.wand(f.hands.r[0], f.hands.r[1] + 160, f.hands.r[0] + 10, f.hands.r[1] - 140, { w: 22 }), hs(f));
      out.push(path_(`M${pt(f.head[0] - f.headR, f.head[1] - f.headR * 0.4)}Q${pt(f.head[0], f.head[1] - f.headR * 1.1)} ${pt(f.head[0] + f.headR, f.head[1] - f.headR * 0.4)}`, { class: 'nf sw', 'stroke-width': 12 }));
      break;
    }
    case 'bastos-10': {
      out.push(S.house(560, 820, 1.6, 'st', 'r'), S.tree(130, 800, 160));
      const f = F({ x: 320, y: 1010, h: 520, garment: 'tunic', robe: 'o', sleeve: 'o', legs: 'b', hair: 'h', mood: 'o', eyes: 'closed', look: 0.6, arms: { l: [-60, 0], r: [-40, 10] } });
      out.push(f.svg);
      for (let i = 0; i < 10; i++) out.push(S.wand(220 + i * 18, 900, 340 + i * 14, 420 - (i % 3) * 20, { w: 16, leaves: 1, seed: i }));
      out.push(hs(f));
      break;
    }
    // ------------------------- COPAS -------------------------
    case 'copas-1': {
      out.push(S.waves(860, { amp: 6, rows: 3 }));
      for (let i = 0; i < 5; i++) out.push(S.lily(200 + i * 70, 890, 1.2));
      out.push(Cp(350, 700, 1.9, { overflow: true }), cloudHand(350, 730, -1));
      out.push(path_(`M350 300c-30-10-60 0-70 20c20 0 40 4 50 14l20-10l20 10c10-10 30-14 50-14c-10-20-40-30-70-20z`, { class: 'w' }), path_(`M350 334l0 40`, { class: 'nf' }));
      break;
    }
    case 'copas-2': {
      out.push(S.house(560, 800, 1.2));
      out.push(path_(`M350 260l0 200`, { class: 'nf', 'stroke-width': 8 }), S.wing(340, 300, 0.4, -1, 'r'), S.wing(360, 300, 0.4, 1, 'r'), S.snake([[350, 460], [330, 420], [370, 380], [330, 340], [350, 300]], 8, 'y'));
      const a = F({ x: 230, y: 1010, h: 540, garment: 'dress', robe: 'w', cape: 'b', sleeve: 'w', hair: 'hb', hairStyle: 'long', head: 'laurel', look: 0.7, mood: 'smile', arms: { l: [110, 80], r: [20, -10] } });
      const b = F({ x: 470, y: 1010, h: 560, garment: 'tunic', robe: 'y', cape: 'r', sleeve: 'y', legs: 'r', hair: 'h', head: 'laurel', look: -0.7, mood: 'smile', arms: { l: [160, 190], r: [70, 100] } });
      out.push(a.svg, b.svg, Cp(a.hands.r[0], a.hands.r[1] + 16, 0.7), Cp(b.hands.l[0], b.hands.l[1] + 16, 0.7), hs(a), hs(b));
      break;
    }
    case 'copas-3': {
      for (let i = 0; i < 6; i++) out.push(S.grapes(100 + i * 100, 960, 1.4, 'v'));
      const cols = ['r', 'w', 'y'];
      [180, 350, 520].forEach((x, i) => {
        const f = F({ x, y: 940, h: 560, garment: 'dress', robe: cols[i], sleeve: cols[i], hair: ['hb', 'h', 'hk'][i], hairStyle: 'long', head: 'wreath', mood: 'smile', look: (1 - i) * 0.6, arms: { l: [-120 - i * 10, -100], r: [-60 + i * 10, -80] } });
        out.push(f.svg, Cp(i === 0 ? f.hands.r[0] : f.hands.l[0], (i === 0 ? f.hands.r[1] : f.hands.l[1]) + 10, 0.65), hs(f));
      });
      break;
    }
    case 'copas-4': {
      out.push(S.tree(470, 960, 460, { leaf: 'gr2' }));
      const f = F({ x: 420, y: 980, h: 560, seated: true, robe: 'b', sleeve: 'b', hair: 'hb', mood: 'neutral', eyes: 'closed', arms: { l: [50, -10], r: [130, 190] } });
      out.push(f.svg);
      for (const [x, y] of [[130, 1000], [220, 1010], [310, 1020]]) out.push(Cp(x, y, 0.75));
      out.push(Cp(200, 500, 0.75), cloudHand(200, 520, 1, 1.2));
      break;
    }
    case 'copas-5': {
      out.push(S.waves(800, { amp: 6, rows: 2 }), path_(`M420 800L420 740L560 740L560 800`, { class: 'nf', 'stroke-width': 18 }), S.castle(580, 720, 0.8));
      const f = F({ x: 330, y: 1000, h: 640, garment: 'robe', robe: 'dk', sleeve: 'dk', head: 'hood', headC: 'dk', hair: 'h', eyes: 'closed', mood: 'sad', arms: { l: [100, 90], r: [80, 90] } });
      out.push(f.svg);
      for (const [x, a] of [[140, 90], [220, 110], [270, -80]]) out.push(rot(Cp(x, 1000, 0.7, { cls: 'g' }), a, x, 980));
      out.push(path_(`M120 1000q-30 10-60 0M250 1010q40 10 70 0`, { class: 'nf', 'stroke-width': 6, stroke: '#c8402f' }));
      out.push(Cp(470, 1010, 0.7), Cp(570, 1010, 0.7));
      break;
    }
    case 'copas-6': {
      out.push(S.house(150, 760, 1.6), S.house(560, 760, 1.4, 'st', 'b'));
      const a = F({ x: 260, y: 960, h: 380, garment: 'tunic', robe: 'r', sleeve: 'r', legs: 'y', hair: 'hb', head: 'hood', headC: 'r', mood: 'smile', look: 0.6, arms: { l: [120, 100], r: [20, -10] } });
      const b = F({ x: 440, y: 970, h: 300, garment: 'dress', robe: 'w', sleeve: 'y', hair: 'hb', hairStyle: 'long', mood: 'smile', look: -0.6, arms: { l: [150, 170], r: [70, 90] } });
      out.push(a.svg, b.svg, Cp(a.hands.r[0], a.hands.r[1] + 10, 0.6), S.lily(a.hands.r[0] - 4, a.hands.r[1] - 50, 0.8), hs(a));
      for (const [x, y] of [[110, 1020], [190, 1030], [530, 1030], [610, 1020]]) out.push(Cp(x, y, 0.55), circle(x, y - 66, 14, { class: 'w th' }));
      out.push(rect(240, 1000, 220, 40, { class: 'st' }), Cp(350, 1000, 0.55));
      break;
    }
    case 'copas-7': {
      out.push(S.sky('sk'));
      const items = [
        (x, y) => circle(x, y - 80, 22, { class: 's' }), (x, y) => path_(`M${pt(x - 20, y - 60)}C${pt(x - 30, y - 120)} ${pt(x + 30, y - 120)} ${pt(x + 20, y - 60)}Z`, { class: 'w' }),
        (x, y) => S.snake([[x - 20, y - 60], [x, y - 90], [x - 10, y - 110], [x + 10, y - 130]], 10, 'gn'), (x, y) => S.castle(x, y - 50, 0.5),
        (x, y) => g({}, ...[0, 1, 2].map((i) => star(x - 16 + i * 16, y - 70, 12, 5, 5, { class: 'y th' }))), (x, y) => S.lily(x, y - 50, 1), (x, y) => path_(`M${pt(x - 20, y - 60)}l20-50l20 50z`, { class: 'r' }),
      ];
      const pos = [[160, 360], [350, 360], [540, 360], [160, 620], [350, 620], [540, 620], [350, 860]];
      for (const [x, y] of pos) out.push(S.cloud(x, y + 30, 1.4));
      pos.forEach(([x, y], i) => out.push(Cp(x, y, 0.85), items[i](x, y - 30)));
      out.push(path_(`M120 1050C120 960 160 930 220 930C280 930 320 960 320 1050Z`, { class: 'dk' }), circle(220, 900, 40, { class: 'dk' }));
      break;
    }
    case 'copas-8': {
      out.push(S.sky('sn'), S.moonFace(350, 270, 70, { cls: 'gl', dir: -1 }), S.mountains(800, 'mt', { peaks: [[200, 260], [480, 300]], snow: false }), S.waves(860, { amp: 6, rows: 3 }));
      const f = F({ x: 470, y: 860, h: 340, garment: 'robe', robe: 'r', sleeve: 'r', head: 'hood', headC: 'r', hair: 'h', look: 0.8, arms: { l: [110, 100], r: [60, 80] } });
      out.push(f.svg, path_(limbD([[f.hands.r[0] + 6, f.hands.r[1] + 60], [f.hands.r[0] - 6, f.hands.r[1] - 160]], 8), { class: 'wd' }));
      const pos = [[120, 1000], [200, 1000], [280, 1000], [360, 1000], [160, 920], [240, 920], [320, 920], [200, 840]];
      for (const [x, y] of pos) out.push(Cp(x, y, 0.6));
      break;
    }
    case 'copas-9': {
      out.push(path_(`M120 570Q350 410 580 570L580 610Q350 450 120 610Z`, { class: 'b' }));
      for (let i = 0; i < 9; i++) { const t = i / 8; const x = 140 + t * 420, y = 560 - Math.sin(t * Math.PI) * 140; out.push(Cp(x, y, 0.6)); }
      out.push(rect(150, 690, 400, 230, { class: 'b', rx: 10 }));
      const f = F({ x: 350, y: 1010, h: 640, seated: true, robe: 'w', sleeve: 'r', head: 'hat', headC: 'r', hair: 'h', beard: 'short', mood: 'smile', look: 0, arms: { l: [50, 0], r: [130, 180] } });
      out.push(f.svg);
      break;
    }
    case 'copas-10': {
      // arcoíris de copas
      ['r', 'o', 'y', 'gn', 'b'].forEach((cl, i) => out.push(path_(`M${pt(90 + i * 18, 640)}A${260 - i * 18} ${300 - i * 18} 0 0 1 ${pt(610 - i * 18, 640)}`, { class: `nf`, 'stroke-width': 18, stroke: { r: '#c8402f', o: '#e8913a', y: '#f2c94c', gn: '#4f8f3d', b: '#3f74b6' }[cl] })));
      for (let i = 0; i < 10; i++) { const a = 180 + (i + 0.5) * 18; const [x, y] = polar(350, 640, 240, a); out.push(Cp(x, y + 30, 0.5)); }
      out.push(S.house(560, 830, 1.1));
      const a = F({ x: 230, y: 1000, h: 400, garment: 'dress', robe: 'b', sleeve: 'b', hair: 'hb', hairStyle: 'long', mood: 'smile', arms: { l: [-130, -120], r: [60, 80] } });
      const b = F({ x: 330, y: 1000, h: 420, garment: 'tunic', robe: 'r', sleeve: 'r', legs: 'b', hair: 'h', mood: 'smile', arms: { l: [120, 100], r: [-50, -60] } });
      const k1 = F({ x: 460, y: 1010, h: 220, garment: 'dress', robe: 'y', sleeve: 'y', hair: 'hb', mood: 'smile', arms: { l: [-150, -150], r: [-30, -30] } });
      const k2 = F({ x: 560, y: 1010, h: 200, garment: 'tunic', robe: 'gn', sleeve: 'gn', legs: 'r', hair: 'h', mood: 'smile', arms: { l: [-150, -150], r: [-30, -30] } });
      out.push(a.svg, b.svg, k1.svg, k2.svg);
      break;
    }
    // ------------------------- ESPADAS -------------------------
    case 'espadas-1': {
      out.push(S.mountains(900, 'mt', { peaks: [[150, 220], [520, 260]] }));
      out.push(S.sword(350, 800, 350, 230, { w: 30, crown: true }), cloudHand(350, 760, -1));
      out.push(path_(`M270 340q-30 30-10 70M430 340q30 30 10 70`, { class: 'nf', 'stroke-width': 5 }));
      for (let i = 0; i < 6; i++) out.push(yodS(200 + i * 60, 520 + (i % 2) * 40));
      break;
    }
    case 'espadas-2': {
      out.push(S.sky('sn'), S.moonFace(560, 230, 40, { cls: 'gl', dir: 1, face: false }), S.waves(760, { amp: 8, rows: 3 }), rect(PX0 - 10, 900, PW + 20, 160, { class: 'st' }));
      out.push(rect(280, 860, 140, 100, { class: 'st' }));
      const f = F({ x: 350, y: 960, h: 560, seated: true, robe: 'w', sleeve: 'w', hair: 'hk', eyes: 'band', mood: 'neutral', arms: { l: [-30, -100], r: [-150, -80] } });
      out.push(f.svg);
      out.push(Sw(f.hands.r[0] - 30, f.hands.r[1] + 30, 610, 260, 16), Sw(f.hands.l[0] + 30, f.hands.l[1] + 30, 90, 260, 16));
      out.push(circle(...f.hands.l, 3.6 * f.k, { class: 's' }), circle(...f.hands.r, 3.6 * f.k, { class: 's' }));
      break;
    }
    case 'espadas-3': {
      out.push(S.cloud(150, 260, 1.6, 'm'), S.cloud(500, 240, 1.8, 'm'), S.cloud(330, 220, 1.4, 'm'));
      let rain = '';
      for (let i = 0; i < 40; i++) { const r = rng(i); const x = PX0 + r() * PW, y = 300 + r() * 700; rain += `M${pt(x, y)}l-14 36`; }
      out.push(path_(rain, { class: 'nf th', opacity: 0.6 }));
      out.push(S.heart(350, 600, 2.4, 'r'));
      out.push(Sw(350, 300, 350, 900, 16), Sw(150, 420, 540, 760, 16), Sw(550, 420, 160, 760, 16));
      break;
    }
    case 'espadas-4': {
      out.push(rect(PX0 - 10, PY0 - 10, PW + 20, 1000, { class: 'st' }));
      out.push(path_(`M250 140h200v260h-200z`, { class: 'b' }), path_(`M350 140v260M250 270h200`, { class: 'nf th' }), circle(350, 220, 40, { class: 'y th' }));
      out.push(Sw(120, 420, 120, 640, 12), Sw(220, 420, 220, 640, 12), Sw(480, 420, 480, 640, 12));
      out.push(rect(100, 800, 500, 180, { class: 'st2' }), Sw(140, 920, 560, 920, 14));
      const f = F({ x: 590, y: 800, h: 460, garment: 'armor', robe: 'y', sleeve: 'm', legs: 'm', hair: 'hb', eyes: 'closed', arms: { l: [-60, -30], r: [-120, -150] } });
      out.push(rot(f.svg, -90, 590, 800));
      break;
    }
    case 'espadas-5': {
      out.push(S.waves(860, { amp: 6, rows: 2 }), S.ground(900, 'st', { amp: 6 }));
      const f = F({ x: 300, y: 1010, h: 600, garment: 'tunic', robe: 'r', sleeve: 'gn', legs: 'r', hair: 'h', mood: 'smile', look: 0.4, arms: { l: [150, 210], r: [70, 100] } });
      out.push(Sw(f.hands.l[0] - 20, f.hands.l[1] - 10, f.hands.l[0] + 40, f.hands.l[1] - 200, 12), Sw(f.hands.l[0] - 10, f.hands.l[1] - 10, f.hands.l[0] - 60, f.hands.l[1] - 190, 12));
      out.push(f.svg, Sw(f.hands.r[0], f.hands.r[1] - 20, f.hands.r[0] + 20, f.hands.r[1] + 180, 12));
      out.push(Sw(120, 1000, 230, 960, 10), Sw(160, 1040, 260, 1010, 10));
      const b = F({ x: 520, y: 900, h: 260, garment: 'tunic', robe: 'b', sleeve: 'b', legs: 'b', hair: 'hb', eyes: 'closed', mood: 'sad', arms: { l: [100, 80], r: [80, 100] } });
      const d = F({ x: 600, y: 890, h: 240, garment: 'tunic', robe: 'v', sleeve: 'v', legs: 'v', hair: 'hk', eyes: 'closed', mood: 'sad', arms: { l: [100, 80], r: [80, 100] } });
      out.push(b.svg, d.svg);
      break;
    }
    case 'espadas-6': {
      out.push(S.sky('sk'), S.ground(720, 'gr', { amp: 4 }), S.waves(760, { amp: 8, rows: 6 }));
      out.push(S.boat(330, 890, 420, 'wd'));
      for (let i = 0; i < 6; i++) out.push(Sw(230 + i * 34, 900, 220 + i * 34, 660, 10));
      const f = F({ x: 520, y: 880, h: 360, garment: 'tunic', robe: 'o', sleeve: 'o', legs: 'b', hair: 'h', look: -0.5, arms: { l: [120, 100], r: [60, 110] } });
      out.push(f.svg, path_(limbD([[f.hands.l[0] + 60, f.hands.l[1] - 160], [f.hands.l[0] - 30, 990]], 8), { class: 'wd' }));
      const p = F({ x: 180, y: 880, h: 260, garment: 'robe', robe: 'b', sleeve: 'b', head: 'hood', headC: 'b', hair: 'h', eyes: 'closed', arms: { l: [100, 80], r: [80, 100] } });
      out.push(p.svg);
      out.push(path_(`M120 860L540 860Q510 900 480 902L180 902Q150 900 120 860Z`, { class: 'wd' }));
      break;
    }
    case 'espadas-7': {
      for (const x of [120, 260, 560]) out.push(path_(`M${x - 60} 820L${x} 700L${x + 60} 820Z`, { class: x === 260 ? 'r' : 'y' }));
      out.push(Sw(600, 1010, 610, 860, 10), Sw(630, 1010, 640, 860, 10));
      const f = F({ x: 350, y: 1010, h: 600, garment: 'tunic', robe: 'r', sleeve: 'y', legs: 'y', head: 'hat', headC: 'r', hair: 'h', mood: 'smile', look: -0.8, stride: 6, arms: { l: [150, 170], r: [50, 30] } });
      out.push(f.svg);
      for (let i = 0; i < 3; i++) out.push(Sw(f.hands.l[0] - 10 + i * 8, f.hands.l[1] + 10, f.hands.l[0] + 80 + i * 20, f.hands.l[1] - 170, 10));
      for (let i = 0; i < 2; i++) out.push(Sw(f.hands.r[0] - 10 + i * 10, f.hands.r[1] + 10, f.hands.r[0] + 120 + i * 20, f.hands.r[1] + 90, 10));
      out.push(hs(f));
      break;
    }
    case 'espadas-8': {
      out.push(S.castle(560, 700, 1.4), S.waves(940, { amp: 4, rows: 2 }));
      const pos = [90, 150, 210, 270, 440, 500, 560, 620];
      for (const x of pos) out.push(Sw(x, 1020, x + (x < 350 ? 8 : -8), 620, 12));
      const f = F({ x: 350, y: 1010, h: 600, garment: 'robe', robe: 'r', sleeve: 'r', hair: 'hk', eyes: 'band', mood: 'sad', arms: { l: [80, 60], r: [100, 120] } });
      out.push(f.svg);
      out.push(path_(`M285 640h130M280 700h140M290 760h120M300 820h100`, { class: 'nf sw', 'stroke-width': 10 }), path_(`M285 640h130M280 700h140M290 760h120M300 820h100`, { class: 'nf th' }));
      break;
    }
    case 'espadas-9': {
      out.push(S.sky('dk'));
      for (let i = 0; i < 9; i++) out.push(Sw(100, 220 + i * 52, 600, 220 + i * 52, 12));
      out.push(rect(PX0 - 10, 820, PW + 20, 240, { class: 'wd' }), rect(PX0 - 10, 760, PW + 20, 80, { class: 'b' }));
      for (let i = 0; i < 12; i++) out.push(rect(PX0 + i * 52, 770, 26, 26, { class: 'r th' }));
      const f = F({ x: 350, y: 860, h: 420, seated: true, robe: 'w', sleeve: 'w', hair: 'hk', mood: 'sad', eyes: 'closed', arms: { l: [-40, -50], r: [-140, -130] } });
      out.push(f.svg, text('zzz?', { f: FONT.hand(), size: 60, x: 520, y: 720, attr: { class: 'w ns' } }).svg);
      break;
    }
    case 'espadas-10': {
      // cambio de ciclo: amanece, y alguien se ha tomado la siesta más larga del mundo
      out.push(S.sky('sy'), S.sunFace(350, 760, 90, { cls: 'su' }), S.waves(800, { amp: 6, rows: 2 }), rect(PX0 - 10, 880, PW + 20, 180, { class: 'gr2' }));
      for (let i = 0; i < 10; i++) out.push(Sw(110 + i * 54, 940, 120 + i * 54, 300 + (i % 2) * 40, 12));
      out.push(path_(`M120 950C200 920 480 920 600 950L600 990L120 990Z`, { class: 'r' }), circle(150, 940, 26, { class: 's' }), path_(`M126 932c10-20 40-20 48 0`, { class: 'h' }));
      out.push(text('zzz', { f: FONT.hand(), size: 64, x: 210, y: 890, attr: { class: 'k ns' } }).svg);
      break;
    }
    // ------------------------- OROS -------------------------
    case 'oros-1': {
      out.push(path_(`M250 1050L250 860Q350 760 450 860L450 1050`, { class: 'nf', 'stroke-width': 36, stroke: '#4d7c37' }), S.flowerRow(830, 10, { cls: 'r' }), S.mountains(880, 'mt', { peaks: [[350, 100]] }));
      out.push(Pn(350, 470, 150), cloudHand(350, 640, -1));
      break;
    }
    case 'oros-2': {
      out.push(S.waves(640, { amp: 40, len: 200, rows: 1, y1: 760 }), S.boat(200, 600, 120), S.boat(500, 640, 90));
      out.push(S.ground(760, 'gr', { amp: 4 }));
      const f = F({ x: 350, y: 1010, h: 640, garment: 'tunic', robe: 'r', sleeve: 'o', legs: 'gn', head: 'hat', headC: 'r', hair: 'h', mood: 'smile', stride: 4, arms: { l: [130, 160], r: [50, 20] } });
      out.push(f.svg, Pn(f.hands.l[0] - 30, f.hands.l[1] - 20, 50), Pn(f.hands.r[0] + 30, f.hands.r[1] - 20, 50));
      out.push(path_(`M${pt(f.hands.l[0] - 30, f.hands.l[1] - 70)}C${pt(250, 360)} ${pt(450, 360)} ${pt(f.hands.r[0] + 30, f.hands.r[1] + 30)}C${pt(450, 860)} ${pt(250, 860)} ${pt(f.hands.l[0] - 30, f.hands.l[1] + 30)}`, { class: 'nf gn', 'stroke-width': 7, stroke: '#4f8f3d' }));
      out.push(hs(f));
      break;
    }
    case 'oros-3': {
      out.push(rect(PX0 - 10, PY0 - 10, PW + 20, 1000, { class: 'st' }));
      out.push(path_(`M200 960V420Q350 220 500 420V960`, { class: 'st2' }), path_(`M230 960V430Q350 260 470 430V960`, { class: 'dk' }));
      for (const [x, y] of [[300, 390], [400, 390], [350, 300]]) out.push(Pn(x, y, 36));
      out.push(rect(400, 760, 120, 30, { class: 'wd' }), rect(410, 790, 16, 170, { class: 'wd' }), rect(494, 790, 16, 170, { class: 'wd' }));
      const f = F({ x: 460, y: 760, h: 300, garment: 'tunic', robe: 'v', sleeve: 'v', legs: 'v', hair: 'h', look: -0.6, arms: { l: [-120, -90], r: [-80, -60] } });
      out.push(f.svg);
      const a = F({ x: 170, y: 1010, h: 480, garment: 'robe', robe: 'y', sleeve: 'y', head: 'hood', headC: 'y', hair: 'h', look: 0.6, arms: { l: [60, 20], r: [100, 140] } });
      const b = F({ x: 310, y: 1010, h: 470, garment: 'robe', robe: 'o', sleeve: 'o', hair: 'hg', beard: 'short', look: 0.6, arms: { l: [40, 0], r: [100, 150] } });
      out.push(a.svg, b.svg, rect(b.hands.l[0] - 10, b.hands.l[1] - 60, 70, 90, { class: 'w', rx: 4 }));
      break;
    }
    case 'oros-4': {
      for (let i = 0; i < 4; i++) out.push(S.castle(110 + i * 160, 860, 0.9));
      const f = F({ x: 350, y: 980, h: 660, seated: true, robe: 'r', sleeve: 'r', cape: 'k', head: 'crown', hair: 'h', beard: 'short', mood: 'neutral', look: 0, arms: { l: [70, -10], r: [110, 190] } });
      out.push(rect(250, 920, 200, 90, { class: 'st' }), f.svg);
      out.push(Pn(350, f.shoulder.l[1] + 70, 60), Pn(f.head[0], f.top - 30, 34), Pn(260, 1000, 40), Pn(440, 1000, 40));
      break;
    }
    case 'oros-5': {
      out.push(S.sky('sn'), rect(PX0 - 10, 820, PW + 20, 240, { class: 'w' }));
      let snow = '';
      for (let i = 0; i < 60; i++) { const r = rng(i + 3); snow += `M${pt(PX0 + r() * PW, PY0 + r() * 900)}h.1`; }
      out.push(path_(snow, { class: 'nf sw', 'stroke-width': 9 }));
      out.push(rect(380, 140, 240, 500, { class: 'dk' }), path_(`M390 640V300Q500 150 610 300V640Z`, { class: 'y' }));
      for (const [x, y] of [[440, 320], [560, 320], [500, 420], [440, 520], [560, 520]]) out.push(Pn(x, y, 40));
      const a = F({ x: 200, y: 990, h: 460, garment: 'robe', robe: 'm', sleeve: 'm', head: 'hood', headC: 'gr2', hair: 'h', mood: 'sad', look: 0.4, arms: { l: [120, 100], r: [60, 80] } });
      const b = F({ x: 380, y: 1000, h: 440, garment: 'tunic', robe: 'e', sleeve: 'e', legs: 'm', hair: 'hg', mood: 'o', look: 0.6, arms: { l: [120, 90], r: [70, 60] } });
      out.push(a.svg, b.svg, path_(limbD([[b.hands.r[0] + 20, b.hands.r[1] - 20], [b.hands.r[0] + 30, 1010]], 8), { class: 'wd' }));
      break;
    }
    case 'oros-6': {
      out.push(S.castle(560, 760, 1));
      const f = F({ x: 350, y: 980, h: 660, garment: 'robe', robe: 'r', sleeve: 'r', cape: 'b', head: 'hat', headC: 'r', hair: 'h', beard: 'short', mood: 'smile', look: 0.3, arms: { l: [130, 170], r: [60, 100] } });
      out.push(f.svg);
      const [lx, ly] = f.hands.l;
      out.push(path_(`M${pt(lx, ly)}v-30M${pt(lx - 60, ly - 30)}h120`, { class: 'nf', 'stroke-width': 5 }), path_(`M${pt(lx - 80, ly)}q20 20 40 0zM${pt(lx + 40, ly)}q20 20 40 0z`, { class: 'g' }));
      out.push(Pn(170, 300, 40), Pn(280, 260, 40), Pn(420, 260, 40), Pn(530, 300, 40), Pn(200, 410, 40), Pn(500, 410, 40));
      for (const x of [170, 540]) { const p = F({ x, y: 1020, h: 260, seated: true, robe: 'm', sleeve: 'm', hair: 'h', mood: 'smile', look: x < 350 ? 0.5 : -0.5, arms: { l: [-40, -60], r: [-140, -120] } }); out.push(p.svg); }
      out.push(path_(`M${pt(f.hands.r[0], f.hands.r[1])}l0 30`, { class: 'nf' }), circle(f.hands.r[0], f.hands.r[1] + 50, 14, { class: 'g' }));
      break;
    }
    case 'oros-7': {
      out.push(path_(limbD([[350, 980], [330, 640]], 18), { class: 'wd' }));
      const bush = [];
      for (let i = 0; i < 12; i++) bush.push(polar(400, 560, i % 2 ? 180 : 220, i * 30));
      out.push(path_(`M${bush.map((p) => pt(...p)).join('L')}Z`, { class: 'gr2' }));
      for (const [x, y] of [[340, 440], [460, 440], [290, 560], [400, 560], [510, 560], [340, 680], [460, 680]]) out.push(Pn(x, y, 40));
      const f = F({ x: 160, y: 1010, h: 560, garment: 'tunic', robe: 'b', sleeve: 'o', legs: 'o', hair: 'h', mood: 'neutral', look: 0.8, arms: { l: [70, 20], r: [40, -30] } });
      out.push(f.svg, path_(limbD([[f.hands.l[0] - 10, 1010], [f.hands.r[0] + 10, f.hands.r[1] - 30]], 10), { class: 'wd' }), hs(f), Pn(260, 1000, 40));
      break;
    }
    case 'oros-8': {
      out.push(S.castle(560, 780, 0.9));
      out.push(path_(limbD([[150, 1020], [150, 300]], 18), { class: 'wd' }));
      for (let i = 0; i < 5; i++) out.push(Pn(150, 340 + i * 110, 38));
      out.push(rect(330, 880, 300, 40, { class: 'wd' }), rect(350, 920, 20, 100, { class: 'wd' }), rect(590, 920, 20, 100, { class: 'wd' }));
      const f = F({ x: 470, y: 1010, h: 560, seated: true, robe: 'b', sleeve: 'b', legs: 'r', hair: 'hk', eyes: 'closed', mood: 'smile', look: -0.3, arms: { l: [130, 60], r: [60, 120] } });
      out.push(f.svg, Pn(440, 860, 38), Pn(270, 990, 38), Pn(240, 900, 38));
      break;
    }
    case 'oros-9': {
      out.push(S.castle(560, 700, 0.8));
      for (let i = 0; i < 4; i++) out.push(S.grapes(110 + (i % 2) * 40, 400 + i * 120, 1.4, 'v'), S.grapes(560 + (i % 2) * 40, 400 + i * 120, 1.4, 'v'));
      const f = F({ x: 350, y: 1010, h: 700, garment: 'dress', robe: 'y', sleeve: 'y', hair: 'hb', hairStyle: 'long', head: 'veil', headC: 'r', mood: 'smile', look: -0.4, arms: { l: [150, 210], r: [70, 100] } });
      out.push(f.svg, bird(f.hands.l[0], f.hands.l[1] - 30, 1.4), path_(`M${pt(f.hands.l[0] - 14, f.hands.l[1] - 6)}c0-30 30-30 30 0z`, { class: 'e' }));
      for (const [x, y] of [[100, 860], [190, 900], [100, 960], [190, 1010], [510, 900], [600, 860], [510, 1010], [600, 960], [280, 1010]]) out.push(Pn(x, y, 32));
      break;
    }
    case 'oros-10': {
      out.push(path_(`M240 1050V500Q350 380 460 500V1050`, { class: 'st' }), path_(`M280 1050V520Q350 440 420 520V1050`, { class: 'sk' }), S.castle(350, 760, 0.7));
      const pos = [[120, 300], [120, 440], [210, 370], [580, 300], [580, 440], [490, 370], [350, 340], [120, 600], [580, 600], [350, 200]];
      for (const [x, y] of pos) out.push(Pn(x, y, 34));
      const old = F({ x: 130, y: 1010, h: 460, seated: true, robe: 'v', sleeve: 'v', hair: 'hg', beard: 'long', mood: 'smile', look: 0.5, arms: { l: [120, 90], r: [60, 30] } });
      out.push(old.svg, dog({ x: 220, y: 1020, s: 1.1, dir: -1, c: 'w' }));
      const a = F({ x: 410, y: 1010, h: 440, garment: 'dress', robe: 'r', sleeve: 'r', hair: 'hb', hairStyle: 'long', mood: 'smile', look: -0.3, arms: { l: [120, 100], r: [70, 80] } });
      const b = F({ x: 540, y: 1010, h: 460, garment: 'tunic', robe: 'b', sleeve: 'b', legs: 'r', hair: 'h', mood: 'smile', look: -0.6, arms: { l: [110, 90], r: [70, 80] } });
      out.push(a.svg, b.svg, F({ x: 470, y: 1020, h: 220, garment: 'tunic', robe: 'y', sleeve: 'y', legs: 'y', hair: 'hb', mood: 'smile', arms: { l: [120, 120], r: [60, 60] } }).svg);
      break;
    }
  }
  return out.join('');
}

const yodS = (x, y) => path_(`M${pt(x, y - 20)}C${pt(x + 10, y - 6)} ${pt(x + 7, y + 6)} ${pt(x, y + 6)}C${pt(x - 7, y + 6)} ${pt(x - 10, y - 6)} ${pt(x, y - 20)}Z`, { class: 'su th' });

// ------------------------- FIGURAS DE CORTE -------------------------
function court(c, suit, rank) {
  const P = c.person;
  const out = BG[suit]();
  const [r1, r2, r3] = ROBE[suit];
  const holdSymbol = (f, side = 'r', big = 1) => {
    const [x, y] = f.hands[side];
    if (suit === 'bastos') return S.wand(x - 10, y + 150 * big, x + 14, y - 190 * big, { w: 22 * big, leaves: 4 });
    if (suit === 'copas') return Cp(x, y + 14, 0.85 * big);
    if (suit === 'espadas') return Sw(x, y + 40, x + (side === 'r' ? 30 : -30), y - 300 * big, 18 * big);
    return Pn(x, y - 30, 50 * big);
  };
  if (suit === 'copas') out.push(S.waves(860, { amp: 6, rows: 3 }));
  if (rank === 'sota') {
    const f = P({ x: 350, y: 1010, h: 700, garment: 'tunic', robe: r1, sleeve: r2, legs: r3, cape: r2, head: suit === 'espadas' ? 'hat' : suit === 'copas' ? 'turban' : 'hat', headC: r2, hair: 'h', mood: 'smile', look: -0.4, stride: 3, arms: { l: [110, 90], r: [40, -40] } });
    out.push(f.svg, holdSymbol(f, 'r'), hs(f));
  } else if (rank === 'caballo') {
    const h = horse({ x: 290, y: 1000, w: 460, dir: 1, c: suit === 'oros' ? 'dk' : suit === 'espadas' ? 'w' : suit === 'bastos' ? 'o' : 'w', mane: 'hg', barding: r2, rear: suit === 'bastos' });
    out.push(h.svg);
    const f = P({ x: h.saddle[0], y: h.saddle[1] + 110, h: 340, riding: true, garment: 'armor', robe: r1, sleeve: 'm', legs: 'm', head: 'helmet', headC: r2, hair: 'h', look: 0.7, arms: { l: [100, 80], r: [20, -40] } });
    out.push(f.svg, holdSymbol(f, 'r', 0.75), hs(f));
  } else {
    const isQ = rank === 'reina';
    out.push(S.throne(350, 1000, 300, 600, { cls: 'st', trim: 'g' }));
    // emblema del trono
    const f = P({ x: 350, y: 1010, h: 760, seated: true, robe: r1, sleeve: r1, cape: r2, head: 'crown', hair: isQ ? 'hb' : 'h', hairStyle: isQ ? 'long' : 'short', beard: isQ ? null : 'short', mood: 'smile', look: 0, arms: { l: [120, 140], r: [60, -60] } });
    out.push(f.svg, holdSymbol(f, 'r'), hs(f));
    if (suit === 'oros') out.push(S.grapes(220, 940, 1.4, 'v'), S.grapes(480, 940, 1.4, 'v'));
    if (suit === 'bastos') out.push(S.sunFace(200, 420, 26, { cls: 'su', face: false }));
  }
  return out.join('');
}

export function minorScene(c, suit, rank) {
  if (/^\d+$/.test(rank)) return pip(c, suit, +rank);
  return court(c, suit, rank);
}

// ------------------------- MARSELLA: menores de pips -------------------------
export function pipPositions(n, { x0 = 160, x1 = 540, y0 = 240, y1 = 920 } = {}) {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const col = (k, ys) => ys.map((y) => [k, y]);
  const rows = (m) => Array.from({ length: m }, (_, i) => y0 + ((y1 - y0) * i) / (m - 1));
  switch (n) {
    case 1: return [[cx, cy]];
    case 2: return [[cx, y0 + 80], [cx, y1 - 80]];
    case 3: return [[cx, y0 + 40], [cx, cy], [cx, y1 - 40]];
    case 4: return [...col(x0, [y0 + 60, y1 - 60]), ...col(x1, [y0 + 60, y1 - 60])];
    case 5: return [...col(x0, [y0 + 60, y1 - 60]), ...col(x1, [y0 + 60, y1 - 60]), [cx, cy]];
    case 6: return [...col(x0, rows(3)), ...col(x1, rows(3))];
    case 7: return [...col(x0, rows(3)), ...col(x1, rows(3)), [cx, (y0 + cy) / 2]];
    case 8: return [...col(x0, rows(4)), ...col(x1, rows(4))];
    case 9: return [...col(x0, rows(4)), ...col(x1, rows(4)), [cx, cy]];
    case 10: return [...col(x0, rows(4)), ...col(x1, rows(4)), [cx, (y0 + cy) / 2 - 20], [cx, (cy + y1) / 2 + 20]];
  }
  return [];
}

export function MARSEILLE_PIPS(c, suit, n) {
  const out = [S.sky('p')];
  // follaje ornamental de las esquinas
  const leaf = (x, y, a) => rot(g({}, path_(`M${pt(x, y)}c30-40 80-40 100 0c-30 20-70 20-100 0z`, { class: 'gn' }), path_(`M${pt(x, y)}c20 30 60 50 90 40`, { class: 'nf th' })), a, x, y);
  if (suit === 'oros' || suit === 'copas') out.push(leaf(110, 180, 30), leaf(590, 180, 150), leaf(110, 980, -30), leaf(590, 980, -150));
  if (suit === 'espadas') {
    // espadas curvas entrelazadas (óvalo) + espada central si es impar
    const pairs = Math.floor(n / 2);
    for (let i = 0; i < pairs; i++) {
      const dx = 60 + i * 40;
      out.push(path_(`M${350 - dx} 960C${150 - i * 20} 760 ${150 - i * 20} 400 ${350 - dx * 0.2} 200`, { class: 'nf', 'stroke-width': 22, stroke: '#7fb1c9' }), path_(`M${350 - dx} 960C${150 - i * 20} 760 ${150 - i * 20} 400 ${350 - dx * 0.2} 200`, { class: 'nf th' }));
      out.push(path_(`M${350 + dx} 960C${550 + i * 20} 760 ${550 + i * 20} 400 ${350 + dx * 0.2} 200`, { class: 'nf', 'stroke-width': 22, stroke: '#7fb1c9' }), path_(`M${350 + dx} 960C${550 + i * 20} 760 ${550 + i * 20} 400 ${350 + dx * 0.2} 200`, { class: 'nf th' }));
      out.push(path_(limbD([[350 - dx - 30, 960], [350 - dx + 30, 960]], 14), { class: 'y' }), path_(limbD([[350 + dx - 30, 960], [350 + dx + 30, 960]], 14), { class: 'y' }));
    }
    if (n % 2) out.push(S.sword(350, 1000, 350, 170, { w: 22, blade: 'm', hilt: 'y' }));
    out.push(leaf(350, 580, -90), leaf(350, 580, 90));
    return out.join('');
  }
  if (suit === 'bastos') {
    // bastos largos cruzados en celosía
    const k = Math.floor(n / 2);
    for (let i = 0; i < k; i++) {
      const off = (i - (k - 1) / 2) * 90;
      out.push(rot(g({}, path_(limbD([[350 + off, 1000], [350 + off, 180]], [26, 30]), { class: 'wd' }), path_(`M${350 + off - 13} 590h26`, { class: 'nf sr', 'stroke-width': 8 })), 22, 350 + off, 590));
      out.push(rot(g({}, path_(limbD([[350 - off, 1000], [350 - off, 180]], [26, 30]), { class: 'wd' }), path_(`M${350 - off - 13} 590h26`, { class: 'nf sr', 'stroke-width': 8 })), -22, 350 - off, 590));
    }
    if (n % 2) out.push(path_(limbD([[350, 1000], [350, 180]], [28, 32]), { class: 'y' }));
    out.push(leaf(130, 590, 0), leaf(570, 590, 180));
    return out.join('');
  }
  const pos = pipPositions(n);
  for (const [x, y] of pos) out.push(suit === 'oros' ? S.pentacle(x, y, n === 1 ? 160 : 62, { cls: 'y' }) : S.cup(x, y + 60 * (n === 1 ? 2.6 : n <= 3 ? 1.6 : 1.2), n === 1 ? 2.6 : n <= 3 ? 1.6 : 1.2, { cls: 'y' }));
  return out.join('');
}
