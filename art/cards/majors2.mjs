// Arcanos mayores III–XXI.
import { pt, path_, circle, ellipse, rect, g, poly, star, polar, smooth, line, text, FONT, rng } from '../lib/svg.mjs';
import { person, horse, dog, lion, bird, howler, limbD } from '../lib/figures.mjs';
import * as S from '../lib/symbols.mjs';
const { PX0, PX1, PY0, PY1, PW, PH, CX } = S;

const rot = (svg, a, x, y) => g({ transform: `rotate(${a} ${x} ${y})` }, svg);
const letters = (str, x, y, size = 40, cls = 'k ns') => text(str, { f: FONT.title(), size, x, y, attr: { class: cls } }).svg;
const ramHead = (x, y, s = 1) => g({}, circle(x, y, 16 * s, { class: 'st' }), path_(`M${pt(x - 10 * s, y - 8 * s)}c-14-6-22 10-10 16c8 4 12-4 6-6M${pt(x + 10 * s, y - 8 * s)}c14-6 22 10 10 16c-8 4-12-4-6-6`, { class: 'nf th' }));
const venus = (x, y, r) => g({}, circle(x, y, r, { class: 'nf', 'stroke-width': 5 }), path_(`M${pt(x, y + r)}v${r}M${pt(x - r * 0.5, y + r * 1.5)}h${r}`, { class: 'nf', 'stroke-width': 5 }));
const ankh = (x, y, s = 1) => g({}, ellipse(x, y - 30 * s, 12 * s, 16 * s, { class: 'nf sg', 'stroke-width': 7 * s }), ellipse(x, y - 30 * s, 12 * s, 16 * s, { class: 'nf th' }), path_(limbD([[x, y - 14 * s], [x, y + 60 * s]], 8 * s), { class: 'g' }), path_(limbD([[x - 20 * s, y - 8 * s], [x + 20 * s, y - 8 * s]], 7 * s), { class: 'g' }));
const orb = (x, y, r = 22) => g({}, circle(x, y, r, { class: 'g' }), path_(`M${pt(x - r, y)}h${r * 2}M${pt(x, y - r)}v${r * 2}`, { class: 'nf th' }), path_(limbD([[x, y - r - 2], [x, y - r - 18]], 5), { class: 'g' }));
const wings = (x, y, s = 1, cls = 'r') => S.wing(x - 14, y, s, -1, cls) + S.wing(x + 14, y, s, 1, cls);
const flame = (x, y, s = 1, cls = 'fl') => path_(`M${pt(x, y - 40 * s)}C${pt(x + 18 * s, y - 20 * s)} ${pt(x + 16 * s, y)} ${pt(x, y)}C${pt(x - 16 * s, y)} ${pt(x - 18 * s, y - 20 * s)} ${pt(x, y - 40 * s)}Z`, { class: cls });
const yod = (x, y, s = 1) => path_(`M${pt(x, y - 20 * s)}C${pt(x + 10 * s, y - 6 * s)} ${pt(x + 7 * s, y + 6 * s)} ${pt(x, y + 6 * s)}C${pt(x - 7 * s, y + 6 * s)} ${pt(x - 10 * s, y - 6 * s)} ${pt(x, y - 20 * s)}Z`, { class: 'su th' });

function sphinx(x, y, s = 1, dir = 1, cls = 'w') {
  const P = (u, v) => pt(x + u * s * dir, y + v * s);
  return g({},
    path_(`M${P(-60, 0)}C${P(-66, -30)} ${P(-40, -40)} ${P(-10, -38)}L${P(20, -40)}L${P(26, -80)}C${P(30, -96)} ${P(58, -96)} ${P(60, -78)}L${P(60, -40)}L${P(70, -6)}L${P(80, 0)}Z`, { class: cls }),
    path_(`M${P(22, -76)}C${P(20, -100)} ${P(64, -104)} ${P(64, -76)}L${P(68, -44)}L${P(56, -48)}L${P(56, -74)}L${P(30, -74)}L${P(28, -46)}L${P(16, -42)}Z`, { class: cls === 'w' ? 'b' : 'y' }),
    circle(x + 36 * s * dir, y - 78 * s, 2.5 * s, { class: 'k ns' }), circle(x + 48 * s * dir, y - 78 * s, 2.5 * s, { class: 'k ns' }),
    path_(`M${P(38, -64)}h${8 * s * dir}`, { class: 'nf th' }),
    path_(`M${P(-60, -4)}c${-20 * s * dir} 0 ${-24 * s * dir} ${-20 * s} ${-16 * s * dir} ${-28 * s}`, { class: 'nf', 'stroke-width': 4 }),
  );
}

function tetramorph(x, y, kind, s = 1) {
  const out = [S.cloud(x, y + 30 * s, 1.1 * s)];
  if (kind === 'angel') out.push(wings(x, y - 4 * s, 0.32 * s, 'r'), ellipse(x, y, 22 * s, 25 * s, { class: 's' }), path_(`M${pt(x - 23 * s, y - 2 * s)}C${pt(x - 26 * s, y - 34 * s)} ${pt(x + 26 * s, y - 34 * s)} ${pt(x + 23 * s, y - 2 * s)}Q${pt(x, y - 18 * s)} ${pt(x - 23 * s, y - 2 * s)}Z`, { class: 'hb' }), circle(x - 8 * s, y + 2 * s, 2.5 * s, { class: 'k ns' }), circle(x + 8 * s, y + 2 * s, 2.5 * s, { class: 'k ns' }));
  if (kind === 'eagle') out.push(path_(`M${pt(x - 20 * s, y + 20 * s)}C${pt(x - 30 * s, y - 20 * s)} ${pt(x + 10 * s, y - 36 * s)} ${pt(x + 22 * s, y - 10 * s)}L${pt(x + 38 * s, y)}L${pt(x + 18 * s, y + 6 * s)}C${pt(x + 14 * s, y + 20 * s)} ${pt(x, y + 24 * s)} ${pt(x - 20 * s, y + 20 * s)}Z`, { class: 'e' }), path_(`M${pt(x + 22 * s, y - 10 * s)}L${pt(x + 38 * s, y)}L${pt(x + 20 * s, y + 4 * s)}Z`, { class: 'y th' }), circle(x + 10 * s, y - 12 * s, 3 * s, { class: 'k ns' }));
  if (kind === 'lion') {
    const pts = [];
    for (let i = 0; i < 16; i++) pts.push(polar(x, y, (i % 2 ? 24 : 32) * s, i * 22.5));
    out.push(path_(smooth(pts, true), { class: 'e' }), circle(x, y, 20 * s, { class: 'o' }), circle(x - 7 * s, y - 4 * s, 2.5 * s, { class: 'k ns' }), circle(x + 7 * s, y - 4 * s, 2.5 * s, { class: 'k ns' }), path_(`M${pt(x - 4 * s, y + 5 * s)}h${8 * s}l${-4 * s} ${4 * s}z`, { class: 'k th' }));
  }
  if (kind === 'bull') out.push(path_(`M${pt(x - 18 * s, y - 14 * s)}C${pt(x - 40 * s, y - 16 * s)} ${pt(x - 44 * s, y - 34 * s)} ${pt(x - 34 * s, y - 40 * s)}C${pt(x - 34 * s, y - 28 * s)} ${pt(x - 26 * s, y - 24 * s)} ${pt(x - 14 * s, y - 22 * s)}ZM${pt(x + 18 * s, y - 14 * s)}C${pt(x + 40 * s, y - 16 * s)} ${pt(x + 44 * s, y - 34 * s)} ${pt(x + 34 * s, y - 40 * s)}C${pt(x + 34 * s, y - 28 * s)} ${pt(x + 26 * s, y - 24 * s)} ${pt(x + 14 * s, y - 22 * s)}Z`, { class: 'w' }), path_(`M${pt(x - 22 * s, y - 20 * s)}C${pt(x - 24 * s, y + 10 * s)} ${pt(x - 14 * s, y + 26 * s)} ${pt(x, y + 26 * s)}C${pt(x + 14 * s, y + 26 * s)} ${pt(x + 24 * s, y + 10 * s)} ${pt(x + 22 * s, y - 20 * s)}Z`, { class: 'e' }), ellipse(x, y + 16 * s, 12 * s, 8 * s, { class: 'rs' }), circle(x - 9 * s, y - 6 * s, 2.5 * s, { class: 'k ns' }), circle(x + 9 * s, y - 6 * s, 2.5 * s, { class: 'k ns' }));
  out.push(rect(x - 16 * s, y + 30 * s, 32 * s, 20 * s, { class: 'w th', rx: 3 }));
  return g({}, ...out);
}

export const MAJORS2 = {
  // III · La Emperatriz
  'mayor-03': (c) => {
    const out = [S.sky('sy')];
    for (const [x, h] of [[90, 380], [160, 440], [520, 460], [600, 380]]) out.push(S.cypress(x, 760, h, 'gr2'));
    out.push(path_(`M560 420C570 560 560 700 600 780L640 780C610 700 620 560 620 420Z`, { class: 'wa' }));
    out.push(S.ground(760, 'gr', { amp: 8 }));
    // trigal
    const r = rng(3);
    out.push(path_(`M${PX0 - 10} 900Q350 860 ${PX1 + 10} 900L${PX1 + 10} 1050L${PX0 - 10} 1050Z`, { class: 'y' }));
    let wheat = '';
    for (let i = 0; i < 40; i++) { const x = 60 + r() * 580, y = 920 + r() * 110; wheat += `M${pt(x, y)}q${pt(4, -20)} ${pt(2, -38)}`; }
    out.push(path_(wheat, { class: 'nf th' }));
    // diván
    out.push(rect(170, 640, 360, 290, { class: 'r', rx: 50 }), rect(150, 760, 400, 170, { class: 'o', rx: 40 }));
    const f = c.person({ x: 350, y: 960, h: 660, seated: true, robe: 'w', sleeve: 'w', hair: 'hb', hairStyle: 'long', head: 'laurel', look: -0.4, mood: 'smile', arms: { l: [120, 160], r: [60, -60] } });
    out.push(f.svg);
    // granadas en el vestido
    for (let i = 0; i < 9; i++) out.push(circle(300 + (i % 3) * 50, f.lap[1] - 60 + Math.floor(i / 3) * 70, 9, { class: 'r th' }));
    for (let i = 0; i < 12; i++) out.push(star(...polar(f.head[0], f.head[1] - 6, f.headR * 1.9, -180 + i * 16.4), 10, 4, 6, { class: 'su th' }));
    const [rx, ry] = f.hands.r;
    out.push(path_(limbD([[rx, ry + 20], [rx + 6, ry - 100]], 9), { class: 'g' }), circle(rx + 6, ry - 110, 15, { class: 'g' }), circle(rx, ry, 3.6 * f.k, { class: 's' }));
    out.push(S.heart(205, 900, 0.75, 'g'), venus(205, 892, 18));
    return out.join('');
  },

  // IV · El Emperador
  'mayor-04': (c) => {
    const out = [S.sky('o')];
    out.push(S.mountains(860, 'e', { peaks: [[110, 300], [300, 380], [500, 330], [640, 260]], snow: false }));
    out.push(S.ground(900, 'st2', { amp: 4 }));
    out.push(S.throne(350, 1000, 400, 700, { cls: 'st', trim: 'g' }));
    out.push(ramHead(170, 300), ramHead(530, 300), ramHead(150, 650, 1.1), ramHead(550, 650, 1.1), ramHead(350, 330, 1.2));
    const f = c.person({ x: 350, y: 1000, h: 760, seated: true, robe: 'r', sleeve: 'r', garment: 'armor', cape: 'r', head: 'crown', hair: 'hg', beard: 'long', look: 0, arms: { l: [130, 60], r: [60, -70] }, legs: 'm' });
    out.push(f.svg);
    out.push(ankh(f.hands.r[0], f.hands.r[1] - 20, 1.2), circle(...f.hands.r, 3.6 * f.k, { class: 's' }));
    out.push(orb(f.hands.l[0] - 6, f.hands.l[1] - 22, 26), circle(...f.hands.l, 3.6 * f.k, { class: 's' }));
    return out.join('');
  },

  // V · El Hierofante
  'mayor-05': (c) => {
    const out = [S.sky('st2')];
    out.push(rect(PX0, 960, PW, 100, { class: 'st' }));
    for (let i = 0; i < 7; i++) out.push(line(PX0 + i * 100, 960, PX0 + i * 100 - 40, 1040, { class: 'th' }));
    out.push(S.pillar(115, 200, 880, 80, { cls: 'm', cap: 'st' }), S.pillar(585, 200, 880, 80, { cls: 'm', cap: 'st' }));
    out.push(rect(200, 340, 300, 540, { class: 'st', rx: 12 }));
    const f = c.person({ x: 350, y: 900, h: 700, seated: true, robe: 'r', robe2: 'r', sleeve: 'r', cape: 'r', tabard: 'w', head: 'mitre', hair: 'hg', look: 0, arms: { l: [120, 200], r: [60, -60] } });
    out.push(f.svg);
    const [lx, ly] = f.hands.l;
    out.push(path_(limbD([[lx, ly + 120], [lx, ly - 220]], 9), { class: 'g' }));
    for (const [yy, ww] of [[-200, 50], [-170, 64], [-140, 78]]) out.push(path_(limbD([[lx - ww / 2, ly + yy], [lx + ww / 2, ly + yy]], 8), { class: 'g' }));
    out.push(circle(lx, ly, 3.6 * f.k, { class: 's' }));
    const [rx, ry] = f.hands.r;
    out.push(path_(`M${pt(rx - 4, ry - 6)}l-2-22M${pt(rx + 3, ry - 6)}l2-22`, { class: 'nf', 'stroke-width': 7 }));
    // llaves cruzadas
    const key = (a) => rot(g({}, circle(350, 830, 16, { class: 'nf sg', 'stroke-width': 8 }), path_(limbD([[350, 846], [350, 930]], 8), { class: 'g' }), rect(350, 910, 18, 8, { class: 'g th' }), rect(350, 922, 14, 8, { class: 'g th' })), a, 350, 880);
    out.push(key(-30), key(30));
    // acólitos de espaldas
    const acolyte = (x, cls, emb) => g({}, path_(`M${pt(x - 70, 1040)}C${pt(x - 70, 960)} ${pt(x - 50, 930)} ${pt(x, 930)}C${pt(x + 50, 930)} ${pt(x + 70, 960)} ${pt(x + 70, 1040)}Z`, { class: cls }), circle(x, 910, 30, { class: 'h' }), circle(x, 902, 12, { class: 's th' }), emb);
    out.push(acolyte(210, 'r', g({}, S.rose(190, 980, 12, 'w'), S.rose(230, 1000, 12, 'w'))), acolyte(490, 'w', g({}, S.lily(480, 1010, 0.8), S.lily(510, 1020, 0.8))));
    return out.join('');
  },

  // VI · Los Enamorados
  'mayor-06': (c) => {
    const out = [S.sky('sk')];
    out.push(S.sunFace(350, 230, 70, { cls: 'su' }));
    out.push(S.cloud(350, 470, 2.6));
    out.push(path_(`M250 880L350 560L450 880Z`, { class: 'mt' }));
    out.push(S.ground(860, 'gr', { amp: 8 }));
    // ángel
    out.push(wings(350, 380, 0.85, 'r'));
    const a = c.person({ x: 350, y: 560, h: 260, garment: 'robe', robe: 'v', sleeve: 'v', hair: 'v', hairStyle: 'long', eyes: 'closed', mood: 'smile', arms: { l: [200, 210], r: [-20, -30] } });
    out.push(a.svg);
    out.push(S.cloud(350, 520, 2.2), S.cloud(260, 540, 1.3), S.cloud(450, 540, 1.3));
    // árboles
    out.push(S.tree(150, 880, 360, { leaf: 'gr2', fruit: 'r' }));
    out.push(S.snake([[130, 860], [110, 800], [150, 760], [120, 700], [140, 650]], 12, 'gn'));
    const flameTree = g({}, path_(limbD([[560, 880], [560, 620]], [30, 18]), { class: 'wd' }), ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => flame(500 + (i % 4) * 40, 560 + Math.floor(i / 4) * 40, 0.7)));
    out.push(flameTree);
    const w = c.person({ x: 200, y: 990, h: 440, garment: 'dress', robe: 'rs', sleeve: 's', hair: 'hb', hairStyle: 'long', look: 0.6, mood: 'smile', arms: { l: [110, 100], r: [-40, -30] } });
    const m = c.person({ x: 500, y: 990, h: 460, garment: 'tunic', robe: 'b', sleeve: 's', legs: 's', hair: 'h', look: -0.8, mood: 'smile', arms: { l: [150, 170], r: [80, 90] } });
    out.push(w.svg, m.svg);
    return out.join('');
  },

  // VII · El Carro
  'mayor-07': (c) => {
    const out = [S.sky('sy')];
    out.push(S.castle(150, 640, 1.4), S.castle(470, 640, 1.2), S.castle(590, 650, 1));
    out.push(rect(PX0 - 10, 640, PW + 20, 50, { class: 'wa' }));
    out.push(S.ground(690, 'gr', { amp: 4 }));
    // dosel de estrellas
    out.push(rect(170, 240, 360, 60, { class: 'b' }));
    for (let i = 0; i < 6; i++) out.push(star(200 + i * 60, 270, 12, 5, 6, { class: 'su th' }));
    out.push(rect(176, 300, 18, 430, { class: 'st' }), rect(506, 300, 18, 430, { class: 'st' }));
    const f = c.person({ x: 350, y: 880, h: 600, garment: 'armor', robe: 'b', sleeve: 'm', head: 'crown', hair: 'hb', look: 0, arms: { l: [120, 100], r: [60, -70] } });
    out.push(f.svg);
    out.push(path_(limbD([[f.hands.r[0], f.hands.r[1] + 30], [f.hands.r[0] + 10, f.hands.r[1] - 120]], 10), { class: 'wd' }), circle(...f.hands.r, 3.6 * f.k, { class: 's' }));
    // caja del carro
    out.push(rect(150, 700, 400, 220, { class: 'st' }), rect(170, 720, 360, 60, { class: 'r' }));
    out.push(path_(`M330 750c0-20 40-20 40 0M350 740l-60 10M350 740l60 10`, { class: 'nf', 'stroke-width': 5 }), circle(350, 750, 12, { class: 'su th' }));
    out.push(circle(180, 930, 40, { class: 'wd' }), circle(520, 930, 40, { class: 'wd' }), circle(180, 930, 10, { class: 'g' }), circle(520, 930, 10, { class: 'g' }));
    out.push(sphinx(200, 1020, 1.5, 1, 'k'), sphinx(500, 1020, 1.5, -1, 'w'));
    return out.join('');
  },

  // VIII · La Fuerza
  'mayor-08': (c) => {
    const out = [S.sky('sy')];
    out.push(path_(`M${PX0 - 10} 760L240 600L420 760Z`, { class: 'b' }));
    out.push(S.ground(760, 'gr', { amp: 10 }));
    const f = c.person({ x: 260, y: 1010, h: 700, garment: 'dress', robe: 'w', sleeve: 'w', hair: 'hb', hairStyle: 'long', head: 'wreath', look: 0.7, mood: 'smile', belt: 'r', arms: { l: [40, 20], r: [30, 10] } });
    out.push(f.svg);
    out.push(S.lemniscate(f.head[0], f.top - 30, 42));
    out.push(g({ transform: 'translate(0 0)' }, lion({ x: 360, y: 1010, s: 3.3, dir: 1, c: 'o', mane: 'e' })));
    out.push(circle(...f.hands.l, 3.6 * f.k, { class: 's' }), circle(...f.hands.r, 3.6 * f.k, { class: 's' }));
    return out.join('');
  },

  // IX · El Ermitaño
  'mayor-09': (c) => {
    const out = [S.sky('sn')];
    for (let i = 0; i < 14; i++) { const r = rng(i + 9); out.push(S.sparkle(PX0 + r() * PW, PY0 + r() * 400, 6 + r() * 6, 'w')); }
    out.push(path_(`M${PX0 - 10} 1050L${PX0 - 10} 900L250 800L420 860L${PX1 + 10} 780L${PX1 + 10} 1050Z`, { class: 'mt' }));
    out.push(path_(`M250 800L300 830L270 850M420 860L470 840`, { class: 'nf th' }));
    const f = c.person({ x: 330, y: 960, h: 760, garment: 'robe', robe: 'm', sleeve: 'm', head: 'hood', headC: 'm', hair: 'hg', beard: 'long', look: 0.6, eyes: 'closed', arms: { l: [100, 140], r: [30, -40] } });
    out.push(f.svg);
    const [lx, ly] = f.hands.l;
    out.push(path_(limbD([[lx + 6, ly - 140], [lx - 20, 980]], 10), { class: 'wd' }), circle(lx, ly, 3.6 * f.k, { class: 's' }));
    out.push(path_(`M${pt(...f.hands.r)}v26`, { class: 'nf' }), S.lantern(f.hands.r[0], f.hands.r[1] + 70, 1.8), circle(...f.hands.r, 3.6 * f.k, { class: 's' }));
    return out.join('');
  },

  // X · La Rueda de la Fortuna
  'mayor-10': (c) => {
    const out = [S.sky('sk')];
    out.push(tetramorph(130, 210, 'angel', 1.4), tetramorph(570, 210, 'eagle', 1.4), tetramorph(130, 910, 'bull', 1.4), tetramorph(570, 910, 'lion', 1.4));
    const cx = 350, cy = 590, R = 220;
    out.push(circle(cx, cy, R, { class: 'o' }), circle(cx, cy, R * 0.72, { class: 'gl' }), circle(cx, cy, R * 0.3, { class: 'o' }));
    for (let i = 0; i < 8; i++) out.push(line(...polar(cx, cy, R * 0.3, i * 45), ...polar(cx, cy, R * 0.72, i * 45)));
    'TARO'.split('').forEach((ch, i) => { const [x, y] = polar(cx, cy, R * 0.86, -90 + i * 90); out.push(rot(letters(ch, x, y + 16, 44), i * 90, x, y)); });
    for (let i = 0; i < 4; i++) { const [x, y] = polar(cx, cy, R * 0.86, -45 + i * 90); out.push(circle(x, y, 9, { class: 'k ns' })); }
    for (let i = 0; i < 4; i++) { const [x, y] = polar(cx, cy, R * 0.52, -45 + i * 90); out.push(S.sparkle(x, y, 18, 'g')); }
    // serpiente y Anubis
    out.push(S.snake([[150, 340], [120, 450], [160, 560], [130, 680], [170, 780]], 16, 'y'));
    out.push(path_(`M560 860C600 800 610 720 580 660L600 620L590 600L570 618L555 600L560 640C520 700 520 800 560 860Z`, { class: 'r' }));
    out.push(sphinx(330, 380, 0.95, 1, 'b'));
    out.push(S.sword(400, 350, 400, 230, { w: 9 }));
    return out.join('');
  },

  // XI · La Justicia
  'mayor-11': (c) => {
    const out = [S.sky('y')];
    out.push(rect(140, 160, 420, 860, { class: 'v' }));
    for (let i = 0; i < 5; i++) out.push(line(180 + i * 85, 170, 180 + i * 85, 1010, { class: 'th', opacity: 0.5 }));
    out.push(S.pillar(110, 200, 960, 70, { cls: 'st' }), S.pillar(590, 200, 960, 70, { cls: 'st' }));
    out.push(rect(PX0, 960, PW, 100, { class: 'st2' }));
    const f = c.person({ x: 350, y: 980, h: 760, seated: true, robe: 'r', sleeve: 'r', cape: 'gn', head: 'crown', hair: 'hb', look: 0, arms: { l: [120, 200], r: [60, -80] } });
    out.push(f.svg);
    out.push(S.sword(f.hands.r[0], f.hands.r[1] + 40, f.hands.r[0], f.hands.r[1] - 300, { w: 18 }), circle(...f.hands.r, 3.6 * f.k, { class: 's' }));
    const [lx, ly] = f.hands.l;
    out.push(path_(`M${pt(lx, ly)}V${ly - 60}M${pt(lx - 70, ly - 50)}H${lx + 70}`, { class: 'nf sg', 'stroke-width': 8 }), path_(`M${pt(lx, ly)}V${ly - 60}M${pt(lx - 70, ly - 50)}H${lx + 70}`, { class: 'nf th' }));
    for (const dx of [-70, 70]) out.push(path_(`M${pt(lx + dx, ly - 50)}L${pt(lx + dx - 26, ly + 10)}M${pt(lx + dx, ly - 50)}L${pt(lx + dx + 26, ly + 10)}`, { class: 'nf th' }), path_(`M${pt(lx + dx - 30, ly + 10)}Q${pt(lx + dx, ly + 40)} ${pt(lx + dx + 30, ly + 10)}Z`, { class: 'g' }));
    out.push(circle(lx, ly, 3.6 * f.k, { class: 's' }));
    return out.join('');
  },

  // XII · El Colgado
  'mayor-12': (c) => {
    const out = [S.sky('c')];
    out.push(path_(limbD([[180, 1040], [180, 220]], [40, 34]), { class: 'wd' }), path_(limbD([[520, 1040], [520, 220]], [40, 34]), { class: 'wd' }), path_(limbD([[140, 220], [560, 220]], 38), { class: 'wd' }));
    for (const [x, y] of [[180, 600], [520, 500], [300, 200], [440, 240], [180, 380], [520, 800]]) out.push(ellipse(x + 26, y, 18, 9, { class: 'gr th', transform: `rotate(-30 ${x + 26} ${y})` }));
    // halo
    out.push(circle(350, 860, 70, { class: 'su' }));
    for (let i = 0; i < 16; i++) out.push(line(...polar(350, 860, 76, i * 22.5), ...polar(350, 860, 96, i * 22.5), { class: 'th' }));
    const f = c.person({ x: 350, y: 860, h: 620, garment: 'tunic', robe: 'b', sleeve: 'b', legs: 'r', belt: 'y', hair: 'hb', eyes: 'closed', mood: 'smile', arms: { l: [60, 20], r: [120, 160] } });
    out.push(path_(`M350 200V250`, { class: 'nf', 'stroke-width': 6 }));
    out.push(rot(f.svg, 180, 350, 550));
    return out.join('');
  },

  // XIII · La Muerte (cambio, cierre: con humor y sin dramas)
  'mayor-13': (c) => {
    const out = [S.sky('c')];
    out.push(S.sunFace(560, 700, 60, { cls: 'su' }));
    out.push(path_(`M490 700L490 600L520 600L520 700ZM600 700L600 590L630 590L630 700Z`, { class: 'st' }));
    out.push(S.ground(720, 'gr', { amp: 4 }), S.waves(760, { amp: 6, rows: 2 }), S.ground(840, 'gr2', { amp: 16 }));
    const h = horse({ x: 280, y: 960, w: 520, dir: 1, c: 'w', mane: 'hg', barding: 'dk' });
    out.push(h.svg);
    const f = c.person({ x: h.saddle[0] - 10, y: h.saddle[1] + 100, h: 330, riding: true, garment: 'armor', robe: 'dk', sleeve: 'dk', legs: 'dk', head: 'helmet', headC: 'r', hair: 'w', look: 0.6, arms: { l: [100, 80], r: [20, -60] } });
    out.push(f.svg);
    // calavera simpática
    const [hx, hy] = f.head, r = f.headR;
    out.push(ellipse(hx, hy, r * 1.02, r * 1.08, { class: 'w' }), ellipse(hx - r * 0.38, hy - r * 0.05, r * 0.26, r * 0.3, { class: 'k ns' }), ellipse(hx + r * 0.38, hy - r * 0.05, r * 0.26, r * 0.3, { class: 'k ns' }), path_(`M${pt(hx - r * 0.35, hy + r * 0.6)}h${r * 0.7}M${pt(hx - r * 0.15, hy + r * 0.5)}v${r * 0.22}M${pt(hx + r * 0.15, hy + r * 0.5)}v${r * 0.22}`, { class: 'nf th' }));
    // estandarte negro con rosa blanca
    const [rx, ry] = f.hands.r;
    out.push(path_(limbD([[rx - 6, ry + 60], [rx + 8, ry - 220]], 9), { class: 'wd' }));
    out.push(path_(`M${pt(rx + 10, ry - 210)}L${pt(rx + 170, ry - 190)}L${pt(rx + 150, ry - 120)}L${pt(rx + 170, ry - 50)}L${pt(rx + 8, ry - 70)}Z`, { class: 'dk' }));
    const fc = [rx + 85, ry - 130];
    for (let i = 0; i < 5; i++) out.push(circle(...polar(fc[0], fc[1], 18, -90 + i * 72), 15, { class: 'w th' }));
    out.push(circle(...fc, 10, { class: 'y th' }), circle(rx, ry, 3.6 * f.k, { class: 's' }));
    // obispo y niña con flores
    const b = c.person({ x: 560, y: 1020, h: 330, garment: 'robe', robe: 'y', sleeve: 'y', head: 'mitre', hair: 'hg', beard: 'short', look: -0.7, eyes: 'closed', arms: { l: [60, -10], r: [120, 190] } });
    const k = c.person({ x: 150, y: 1030, h: 200, garment: 'dress', robe: 'w', sleeve: 'w', hair: 'hb', hairStyle: 'long', look: 0.8, mood: 'smile', arms: { l: [120, 120], r: [-10, -30] } });
    out.push(b.svg, k.svg, S.rose(k.hands.r[0] + 6, k.hands.r[1] - 10, 10, 'r'));
    return out.join('');
  },

  // XIV · La Templanza
  'mayor-14': (c) => {
    const out = [S.sky('sk')];
    out.push(path_(`M${PX1 + 10} 700L560 700Q500 820 450 1050L${PX1 + 10} 1050Z`, { class: 'gr' }));
    out.push(S.mountains(700, 'mt', { peaks: [[600, 160]], snow: false }));
    out.push(S.sunFace(600, 500, 40, { cls: 'su', face: false }), S.ground(800, 'gr', { amp: 6, x1: 470 }));
    out.push(path_(`M${PX0 - 10} 900Q250 860 380 900L380 1050L${PX0 - 10} 1050Z`, { class: 'wa' }));
    out.push(path_(`M480 860Q540 820 590 700`, { class: 'nf', 'stroke-width': 18, stroke: '#e8dfc8' }));
    out.push(wings(350, 300, 0.95, 'r'));
    const f = c.person({ x: 350, y: 990, h: 760, garment: 'robe', robe: 'w', sleeve: 'w', hair: 'hb', hairStyle: 'long', eyes: 'closed', mood: 'smile', arms: { l: [130, 60], r: [50, 120] } });
    out.push(f.svg);
    out.push(circle(f.head[0], f.head[1] - f.headR * 0.7, 9, { class: 'su th' }));
    out.push(rect(330, f.shoulder.l[1] + 30, 40, 40, { class: 'w th' }), poly([[350, f.shoulder.l[1] + 36], [364, f.shoulder.l[1] + 62], [336, f.shoulder.l[1] + 62]], { class: 'o th' }));
    const [lx, ly] = f.hands.l, [rx, ry] = f.hands.r;
    out.push(path_(`M${pt(lx + 30, ly - 30)}Q${pt((lx + rx) / 2, ly - 40)} ${pt(rx - 20, ry + 20)}`, { class: 'nf', 'stroke-width': 10, stroke: '#8fc4e6' }));
    out.push(S.cup(lx + 20, ly + 10, 0.55, { tilt: 30 }), S.cup(rx, ry + 40, 0.55));
    out.push(circle(lx, ly, 3.6 * f.k, { class: 's' }), circle(rx, ry, 3.6 * f.k, { class: 's' }));
    for (const x of [90, 130]) out.push(path_(`M${x} 900L${x} 820`, { class: 'nf th' }), ellipse(x, 810, 14, 20, { class: 'y th' }));
    return out.join('');
  },

  // XV · El Diablo (de feria, más cuernos que miedo)
  'mayor-15': (c) => {
    const out = [S.sky('dk')];
    out.push(rect(250, 760, 200, 280, { class: 'st2' }));
    out.push(S.wing(320, 380, 1.35, -1, 'v'), S.wing(380, 380, 1.35, 1, 'v'));
    const f = c.person({ x: 350, y: 770, h: 560, seated: true, robe: 'e', sleeve: 'e', hair: 'hk', beard: 'short', beardC: 'hk', look: 0, mood: 'smile', arms: { l: [130, 120], r: [10, -80] } });
    out.push(f.svg);
    const [hx, hy] = f.head, r = f.headR;
    out.push(path_(`M${pt(hx - r * 0.7, hy - r * 0.7)}C${pt(hx - r * 1.6, hy - r * 1.2)} ${pt(hx - r * 1.9, hy - r * 2.4)} ${pt(hx - r * 1.2, hy - r * 2.9)}C${pt(hx - r * 1.3, hy - r * 2)} ${pt(hx - r * 0.8, hy - r * 1.5)} ${pt(hx - r * 0.2, hy - r * 1)}Z`, { class: 'w' }));
    out.push(path_(`M${pt(hx + r * 0.7, hy - r * 0.7)}C${pt(hx + r * 1.6, hy - r * 1.2)} ${pt(hx + r * 1.9, hy - r * 2.4)} ${pt(hx + r * 1.2, hy - r * 2.9)}C${pt(hx + r * 1.3, hy - r * 2)} ${pt(hx + r * 0.8, hy - r * 1.5)} ${pt(hx + r * 0.2, hy - r * 1)}Z`, { class: 'w' }));
    out.push(star(hx, hy - r * 2.9, r * 0.9, r * 0.36, 5, { class: 'nf sw th' }, 90));
    const [lx, ly] = f.hands.l;
    out.push(path_(limbD([[lx + 20, ly - 30], [lx - 40, ly + 110]], 10), { class: 'wd' }), flame(lx - 46, ly + 160, 1.4), circle(lx, ly, 3.6 * f.k, { class: 's' }));
    out.push(path_(`M${pt(...f.hands.r)}m-12-8v-24m8 22v-28m8 28v-26m8 26v-20`, { class: 'nf', 'stroke-width': 6 }));
    // diablillos encadenados (con colita y cara de «¿y ahora qué?»)
    for (const [x, d] of [[170, -1], [530, 1]]) {
      const p = c.person({ x, y: 1020, h: 300, garment: 'tunic', robe: 'r', sleeve: 's', legs: 's', hair: d < 0 ? 'hb' : 'h', look: -d * 0.6, mood: 'o', arms: { l: [110, 100], r: [70, 80] } });
      out.push(path_(`M${x} 900q${d * 60} 10 ${d * 50} 70`, { class: 'nf', 'stroke-width': 5 }), p.svg);
      out.push(S.chain(x, p.head[1] + 40, 300 + (d > 0 ? 100 : 0), 800, 8));
      out.push(path_(`M${pt(p.head[0] - 10, p.top + 6)}l-6-16l12 8zM${pt(p.head[0] + 10, p.top + 6)}l6-16l-12 8z`, { class: 'w th' }));
    }
    return out.join('');
  },

  // XVI · La Torre
  'mayor-16': (c) => {
    const out = [S.sky('dk')];
    for (let i = 0; i < 12; i++) { const r = rng(i + 30); out.push(yod(PX0 + 40 + r() * (PW - 80), 220 + r() * 600, 1.2)); }
    out.push(path_(`M120 1050C140 940 200 900 260 880L440 880C500 900 560 940 580 1050Z`, { class: 'st2' }));
    out.push(rect(260, 360, 180, 530, { class: 'st' }));
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) out.push(line(260, 420 + i * 80, 440, 420 + i * 80, { class: 'th', opacity: 0.4 }));
    for (const [x, y] of [[300, 460], [400, 560], [300, 680], [380, 770]]) out.push(rect(x - 14, y - 30, 28, 50, { class: 'k', rx: 12 }), flame(x, y + 20, 0.9));
    out.push(path_(`M250 360L250 320L280 320L280 340L310 340L310 320L340 320L340 340L370 340L370 320L400 320L400 340L430 340L430 320L450 320L450 360Z`, { class: 'st' }));
    // corona saltando
    out.push(rot(g({}, path_(`M380 290L370 230L410 260L440 210L470 260L510 230L500 290Z`, { class: 'g' })), 25, 440, 260));
    // rayo
    out.push(path_(`M110 160L250 300L210 310L330 380L300 390L380 450L250 370L285 360L170 290L205 280Z`, { class: 'su' }));
    for (const [x, y] of [[270, 330], [430, 330], [460, 460], [240, 520]]) out.push(flame(x, y, 1.2));
    // caídos
    out.push(rot(c.person({ x: 170, y: 760, h: 300, garment: 'robe', robe: 'b', sleeve: 'b', head: 'crown', hair: 'h', mood: 'o', arms: { l: [-150, -120], r: [-30, -60] } }).svg, 160, 170, 620));
    out.push(rot(c.person({ x: 540, y: 820, h: 300, garment: 'tunic', robe: 'r', sleeve: 'r', legs: 'b', hair: 'hb', mood: 'o', arms: { l: [-160, -130], r: [-20, -50] } }).svg, -150, 540, 680));
    return out.join('');
  },

  // XVII · La Estrella
  'mayor-17': (c) => {
    const out = [S.sky('sn')];
    out.push(S.star8(350, 300, 120, 'su'));
    for (const [x, y] of [[120, 200], [580, 200], [100, 360], [600, 360], [140, 520], [560, 520], [350, 520]]) out.push(S.star8(x, y, 34, 'w'));
    out.push(S.ground(780, 'gr', { amp: 12 }));
    out.push(S.tree(580, 790, 220, { leaf: 'gr2' }), path_(`M575 620q20-30 40-10q-10 10-20 5l-20 25z`, { class: 'r' }));
    out.push(path_(`M${PX0 - 10} 870Q200 840 330 880Q360 960 300 1050L${PX0 - 10} 1050Z`, { class: 'wa' }));
    const f = c.person({ x: 390, y: 960, h: 560, seated: true, robe: 'w', sleeve: 's', hair: 'hb', hairStyle: 'long', look: -0.6, mood: 'smile', arms: { l: [150, 120], r: [40, 80] } });
    out.push(f.svg);
    const jug = (x, y, a) => rot(g({}, path_(`M${pt(x - 20, y)}C${pt(x - 34, y - 30)} ${pt(x - 20, y - 50)} ${pt(x - 8, y - 56)}L${pt(x + 8, y - 56)}C${pt(x + 20, y - 50)} ${pt(x + 34, y - 30)} ${pt(x + 20, y)}Z`, { class: 'o' })), a, x, y);
    const [lx, ly] = f.hands.l, [rx, ry] = f.hands.r;
    out.push(path_(`M${pt(lx - 50, ly - 10)}Q${pt(lx - 90, ly + 40)} ${pt(lx - 100, ly + 140)}`, { class: 'nf', 'stroke-width': 9, stroke: '#a8d4f0' }));
    out.push(path_(`M${pt(rx + 50, ry - 10)}Q${pt(rx + 90, ry + 40)} ${pt(rx + 110, ry + 120)}`, { class: 'nf', 'stroke-width': 9, stroke: '#a8d4f0' }));
    out.push(jug(lx - 26, ly + 10, 110), jug(rx + 26, ry + 10, -110));
    out.push(circle(lx, ly, 3.6 * f.k, { class: 's' }), circle(rx, ry, 3.6 * f.k, { class: 's' }));
    return out.join('');
  },

  // XVIII · La Luna
  'mayor-18': (c) => {
    const out = [S.sky('sn')];
    const mc = [350, 300];
    for (let i = 0; i < 32; i++) out.push(line(...polar(...mc, 120, i * 11.25), ...polar(...mc, i % 2 ? 150 : 175, i * 11.25), { class: 'th', stroke: '#f3d68a' }));
    out.push(S.fullMoonFace(...mc, 115, { cls: 'gl' }));
    out.push(S.moonFace(mc[0] + 20, mc[1], 105, { cls: 'su', face: false, dir: 1 }));
    for (let i = 0; i < 9; i++) { const r = rng(i + 50); out.push(yod(170 + r() * 360, 470 + r() * 160, 0.9)); }
    out.push(S.mountains(720, 'b', { peaks: [[350, 120]], snow: false }));
    out.push(S.ground(760, 'gr', { amp: 6 }));
    out.push(rect(70, 470, 70, 300, { class: 'st' }), rect(560, 470, 70, 300, { class: 'st' }));
    out.push(path_(`M60 470h90v-30h-90zM550 470h90v-30h-90z`, { class: 'st' }), rect(92, 520, 26, 40, { class: 'k', rx: 12 }), rect(582, 520, 26, 40, { class: 'k', rx: 12 }));
    out.push(path_(`M330 720C350 780 300 820 340 870C370 910 320 940 350 960L370 960C340 940 390 910 360 870C320 820 370 780 350 720Z`, { class: 'y' }));
    out.push(howler({ x: 200, y: 880, s: 1.9, dir: 1, c: 'o' }), howler({ x: 520, y: 880, s: 1.9, dir: -1, c: 'm' }));
    out.push(path_(`M${PX0 - 10} 940Q350 900 ${PX1 + 10} 940L${PX1 + 10} 1050L${PX0 - 10} 1050Z`, { class: 'wa' }));
    // cangrejo de río
    out.push(ellipse(350, 960, 34, 22, { class: 'r' }), path_(`M320 950l-30-30l10 -6M380 950l30-30l-10 -6M330 975l-20 14M370 975l20 14`, { class: 'nf', 'stroke-width': 6 }));
    out.push(ellipse(286, 912, 12, 8, { class: 'r th' }), ellipse(414, 912, 12, 8, { class: 'r th' }));
    return out.join('');
  },

  // XIX · El Sol
  'mayor-19': (c) => {
    const out = [S.sky('sk')];
    out.push(S.sunFace(350, 290, 120, { cls: 'su', rays: 20 }));
    out.push(rect(PX0 - 10, 640, PW + 20, 170, { class: 'st' }));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) out.push(rect(PX0 + j * 90 - (i % 2) * 45, 640 + i * 42, 90, 42, { class: 'nf th' }));
    for (let i = 0; i < 5; i++) { const x = 100 + i * 125; out.push(path_(`M${x} 640v-50`, { class: 'nf', 'stroke-width': 4 }), S.sunFace(x, 570, 22, { cls: 'y', face: false, rays: 12, wavy: false }), circle(x, 570, 12, { class: 'e th' })); }
    out.push(S.ground(800, 'gr', { amp: 4 }));
    const h = horse({ x: 300, y: 1010, w: 520, dir: 1, c: 'w', mane: 'hb' });
    out.push(h.svg);
    const f = c.person({ x: h.saddle[0] + 20, y: h.saddle[1] + 110, h: 300, riding: true, garment: 'tunic', robe: 's', sleeve: 's', legs: 's', hair: 'hb', head: 'wreath', mood: 'smile', look: 0, arms: { l: [-150, -140], r: [-30, -40] } });
    out.push(f.svg);
    const [lx, ly] = f.hands.l;
    out.push(path_(limbD([[lx + 10, ly + 30], [lx - 50, ly - 150]], 7), { class: 'wd' }));
    out.push(path_(`M${pt(lx - 46, ly - 140)}C${pt(lx - 120, ly - 160)} ${pt(lx - 160, ly - 60)} ${pt(lx - 220, ly - 80)}C${pt(lx - 180, ly)} ${pt(lx - 110, ly - 60)} ${pt(lx - 30, ly - 80)}Z`, { class: 'r' }));
    out.push(circle(lx, ly, 3.6 * f.k, { class: 's' }));
    return out.join('');
  },

  // XX · El Juicio
  'mayor-20': (c) => {
    const out = [S.sky('sk')];
    out.push(S.mountains(800, 'w', { peaks: [[120, 260], [600, 280]], snow: false }));
    out.push(S.waves(820, { amp: 8, rows: 3 }));
    out.push(wings(350, 300, 1, 'r'));
    out.push(S.cloud(350, 470, 3.2));
    const a = c.person({ x: 350, y: 640, h: 380, garment: 'robe', robe: 'b', sleeve: 'b', hair: 'hb', hairStyle: 'long', mood: 'o', look: 0.4, arms: { l: [150, 180], r: [30, 10] } });
    out.push(a.svg.replace(/^<g>/, '<g>'));
    out.push(S.cloud(350, 520, 3.2), S.cloud(220, 500, 1.6), S.cloud(480, 500, 1.6));
    // trompeta con bandera
    out.push(path_(`M${pt(a.head[0] + 10, a.head[1] + 30)}L${pt(560, 340)}L${pt(600, 300)}L${pt(610, 380)}Z`, { class: 'g' }));
    out.push(rect(440, 370, 90, 70, { class: 'w' }), path_(`M485 375v60M445 405h80`, { class: 'nf sr', 'stroke-width': 10 }));
    for (const [x, col, hc] of [[170, 'st', 'hb'], [350, 'st', 'h'], [530, 'st', 'hk']]) {
      out.push(rect(x - 80, 900, 160, 60, { class: 'st2' }));
      const p = c.person({ x, y: 960, h: 260, garment: 'tunic', robe: 'm', sleeve: 'm', legs: 'm', hair: hc, mood: 'o', arms: { l: [-130, -110], r: [-50, -70] } });
      out.push(p.svg);
      out.push(rect(x - 80, 930, 160, 40, { class: 'st2' }));
    }
    return out.join('');
  },

  // XXI · El Mundo
  'mayor-21': (c) => {
    const out = [S.sky('sk')];
    out.push(tetramorph(130, 210, 'angel', 1.4), tetramorph(570, 210, 'eagle', 1.4), tetramorph(130, 910, 'bull', 1.4), tetramorph(570, 910, 'lion', 1.4));
    const cx = 350, cy = 580, rx = 170, ry = 330;
    // corona de laurel
    for (let i = 0; i < 44; i++) {
      const a = i * (360 / 44);
      const [x, y] = [cx + rx * Math.cos(a * Math.PI / 180), cy + ry * Math.sin(a * Math.PI / 180)];
      out.push(ellipse(x, y, 13, 24, { class: 'gn th', transform: `rotate(${a + (i % 2 ? 30 : -30)} ${x} ${y})` }));
    }
    for (const yy of [cy - ry, cy + ry]) out.push(path_(`M${cx} ${yy}c-40-30-60 20-20 20c10 0 20-10 20-20c0 10 10 20 20 20c40 0 20-50-20-20z`, { class: 'r' }));
    const f = c.person({ x: 350, y: 860, h: 560, garment: 'tunic', robe: 'v', sleeve: 's', legs: 's', hair: 'hb', hairStyle: 'long', mood: 'smile', look: 0.3, stride: 4, arms: { l: [160, 120], r: [20, 60] } });
    out.push(f.svg);
    out.push(path_(`M${pt(f.shoulder.l[0] - 10, f.shoulder.l[1])}C${pt(260, 600)} ${pt(460, 640)} ${pt(400, 820)}`, { class: 'nf', 'stroke-width': 18, stroke: '#a873c8' }));
    for (const hd of [f.hands.l, f.hands.r]) out.push(path_(limbD([[hd[0], hd[1] - 60], [hd[0], hd[1] + 60]], 9), { class: 'wd' }), circle(...hd, 3.6 * f.k, { class: 's' }));
    return out.join('');
  },
};
