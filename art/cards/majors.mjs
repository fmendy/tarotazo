// Arcanos mayores: composición propia de cada carta (iconografía tradicional redibujada).
import { pt, path_, circle, ellipse, rect, g, poly, star, polar, smooth, line, text, FONT, rng } from '../lib/svg.mjs';
import { person, horse, dog, lion, bird, howler, limbD } from '../lib/figures.mjs';
import * as S from '../lib/symbols.mjs';
import { MAJORS2 } from './majors2.mjs';
const { PX0, PX1, PY0, PY1, PW, PH, CX } = S;

const GROUND = 880;
const rot = (svg, a, x, y) => g({ transform: `rotate(${a} ${x} ${y})` }, svg);
const letters = (str, x, y, size = 40, cls = 'k ns') => text(str, { f: FONT.title(), size, x, y, attr: { class: cls } }).svg;

export const MAJORS = {
  // 0 · El Loco: al borde del precipicio, con su hatillo, la rosa blanca y el perrillo
  'mayor-00': (c) => {
    const P = c.person;
    const out = [S.sky('sy'), S.sunFace(560, 230, 58, { cls: 'w' })];
    out.push(S.mountains(760, 'mt', { peaks: [[150, 170], [330, 230], [520, 160]] }));
    out.push(path_(`M${PX0 - 20} 830L330 800C400 790 440 800 470 830L520 900L505 960L540 1040L${PX0 - 20} 1050Z`, { class: 'st' }));
    out.push(path_(`M470 830L520 900L505 960L540 1040L560 1050L560 1060`, { class: 'nf' }));
    out.push(path_(`M120 900l40-20M200 950l50-10M330 870l40 10`, { class: 'nf th' }));
    const f = P({ x: 340, y: 830, h: 540, garment: 'tunic', robe: 'w', robe2: 'w', sleeve: 'y', legs: 'y', tabard: 'gn', belt: 'g', head: 'cap', headC: 'gn', hair: 'hb', look: 0.8, mood: 'smile', stride: 6, arms: { l: [160, 215], r: [40, -70] }, cape: 'r' });
    const [hx, hy] = f.hands.r;
    // hatillo al hombro (detrás)
    out.push(path_(limbD([[hx - 20, hy + 20], [hx + 130, hy - 110]], 9), { class: 'wd' }));
    out.push(path_(`M${pt(hx + 112, hy - 96)}c40 0 58 40 36 66c-20 22-56 14-62-12c-4-20 6-50 26-54z`, { class: 'r' }));
    out.push(circle(hx + 120, hy - 50, 7, { class: 'g th' }));
    out.push(f.svg);
    // rosa blanca
    const [lx, ly] = f.hands.l;
    out.push(path_(`M${pt(lx, ly)}l-10-34`, { class: 'nf', 'stroke-width': 3 }), S.rose(lx - 12, ly - 42, 15, 'w'));
    out.push(dog({ x: 170, y: 840, s: 1.9, dir: 1, c: 'w' }));
    return out.join('');
  },

  // I · El Mago: un brazo al cielo, otro a la tierra; los cuatro palos sobre la mesa
  'mayor-01': (c) => {
    const P = c.person;
    const out = [S.sky('sy')];
    // pérgola de rosas arriba
    for (let i = 0; i < 8; i++) out.push(S.rose(PX0 + 30 + i * 80, 160 + (i % 2) * 18, 22, 'r'));
    out.push(S.ground(GROUND + 30, 'gr', { amp: 6 }));
    out.push(S.flowerRow(1000, 8, { cls: 'r' }));
    for (let i = 0; i < 5; i++) out.push(S.lily(110 + i * 120, 1010, 1.3));
    const f = P({ x: 350, y: 940, h: 640, garment: 'robe', robe: 'w', sleeve: 'w', cape: 'r', belt: 'b', hair: 'hk', look: 0, mood: 'neutral', arms: { l: [120, 115], r: [-70, -80] } });
    out.push(f.svg);
    out.push(S.lemniscate(350, f.top - 30, 44, 'nf'));
    // varita
    const [rx, ry] = f.hands.r;
    out.push(path_(limbD([[rx - 6, ry + 24], [rx + 14, ry - 90]], 12), { class: 'w' }));
    out.push(circle(rx, ry, 3.6 * f.k, { class: 's' }));
    const [lx, ly] = f.hands.l;
    out.push(path_(`M${pt(lx, ly)}l-14 40`, { class: 'nf', 'stroke-width': 6 }));
    // mesa
    out.push(rect(110, 820, 480, 40, { class: 'wd' }), rect(130, 860, 30, 160, { class: 'wd' }), rect(540, 860, 30, 160, { class: 'wd' }));
    out.push(S.cup(190, 818, 0.75));
    out.push(S.pentacle(300, 790, 28));
    out.push(S.sword(380, 812, 560, 800, { w: 11 }));
    out.push(S.wand(470, 818, 520, 740, { w: 12, leaves: 0 }));
    return out.join('');
  },

  // II · La Sacerdotisa: entre las columnas B y J, con el rollo y la luna a sus pies
  'mayor-02': (c) => {
    const P = c.person;
    const out = [S.sky('sn')];
    // velo con granadas
    out.push(rect(140, 250, 420, 700, { class: 'gr2' }));
    const r = rng(2);
    for (let i = 0; i < 18; i++) out.push(circle(170 + (i % 6) * 72 + (Math.floor(i / 6) % 2) * 36, 300 + Math.floor(i / 6) * 120, 18, { class: 'r th' }));
    out.push(rect(PX0 - 10, 960, PW + 20, 90, { class: 'st2' }));
    out.push(S.pillar(110, 200, 990, 70, { cls: 'dk', cap: 'dk', letter: letters('B', 110, 600, 54, 'w ns') }));
    out.push(S.pillar(590, 200, 990, 70, { cls: 'w', cap: 'w', letter: letters('J', 590, 600, 54, 'k ns') }));
    const f = P({ x: 350, y: 980, h: 700, seated: true, robe: 'b', sleeve: 'b', head: 'tiara', veil: 'w', hair: 'hk', eyes: 'open', look: 0, mood: 'neutral', arms: { l: [110, 30], r: [70, 150] } });
    out.push(f.svg);
    // cruz en el pecho y rollo
    out.push(rect(338, f.shoulder.l[1] + 20, 24, 70, { class: 'w th' }), rect(318, f.shoulder.l[1] + 42, 64, 24, { class: 'w th' }));
    out.push(rect(270, f.lap[1] - 10, 160, 44, { class: 'w', rx: 18 }));
    out.push(letters('TORA', 350, f.lap[1] + 24, 30));
    out.push(S.moonFace(350, 975, 50, { cls: 'gl', dir: 1, face: false }));
    return out.join('');
  },
};

Object.assign(MAJORS, MAJORS2);
