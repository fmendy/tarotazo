// Piezas comunes del arte móvil (icono, splash, Play, marcos de capturas).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { path_, circle, ellipse, rect, g, star, polar, pt, text, FONT, rng } from './svg.mjs';
import { C } from './palette.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const svg = (w, h, defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;
export function png(svgStr, file, width) {
  const out = new Resvg(svgStr, { fitTo: width ? { mode: 'width', value: width } : { mode: 'original' }, background: 'rgba(0,0,0,0)' }).render().asPng();
  fs.writeFileSync(file, out);
  return out.length;
}
const stops = (arr) => arr.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
export const LN = '#1a0b22';

// ---------- defs comunes ----------
export const DEFS = `<radialGradient id="ball" cx=".38" cy=".32" r=".75">${stops([[0, '#f2fffd'], [0.3, '#9fe3dc'], [0.75, '#2f8f83'], [1, '#1d5f63']])}</radialGradient>
<radialGradient id="ballGlow" cx=".5" cy=".5" r=".5">${stops([[0, '#9fe3dc', 0.55], [1, '#9fe3dc', 0]])}</radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">${stops([[0, C.goldLight], [0.5, C.gold], [1, C.goldDark]])}</linearGradient>
<linearGradient id="feather" x1="0" y1="1" x2="1" y2="0">${stops([[0, '#1f6f68'], [1, '#56c2b4']])}</linearGradient>
<radialGradient id="velvet" cx=".5" cy=".42" r=".75">${stops([[0, C.velvet2], [0.55, C.velvet], [1, C.plum]])}</radialGradient>
<radialGradient id="velvetDark" cx=".5" cy=".45" r=".75">${stops([[0, '#2a0f3a'], [1, C.bg]])}</radialGradient>`;

/** Motivo: bola de cristal sobre peana dorada, coronada con el broche y la pluma del turbante de Madame Remedios.
 *  Centro geométrico del motivo ≈ (cx, cy); a s=1 ocupa ≈ 430 × 640 px. */
export function motif(cx, cy, s = 1, { mono = false, glow = true } = {}) {
  const P = (u, v) => pt(cx + u * s, cy + v * s);
  const by = 60; // centro de la bola relativo
  const W = mono ? '#fff' : null;
  const lw = 14 * s;
  const st = mono ? {} : { stroke: LN, 'stroke-width': lw, 'stroke-linejoin': 'round' };
  const o = [];
  if (glow && !mono) o.push(circle(cx, cy + by * s, 330 * s, { fill: 'url(#ballGlow)' }));
  // pluma (detrás)
  o.push(path_(`M${P(10, -150)}C${P(40, -300)} ${P(150, -330)} ${P(215, -320)}C${P(150, -280)} ${P(80, -220)} ${P(45, -140)}Z`, { fill: W ?? 'url(#feather)', ...st }));
  if (!mono) o.push(path_(`M${P(26, -150)}C${P(80, -250)} ${P(140, -290)} ${P(205, -316)}`, { fill: 'none', stroke: LN, 'stroke-width': 6 * s }));
  // peana
  o.push(path_(`M${P(-190, 320)}L${P(190, 320)}L${P(140, 240)}L${P(-140, 240)}Z`, { fill: W ?? 'url(#gold)', ...st }));
  o.push(path_(`M${P(-120, 250)}Q${P(0, 220)} ${P(120, 250)}L${P(110, 215)}L${P(-110, 215)}Z`, { fill: W ?? C.goldDark, ...st }));
  // bola
  if (mono) {
    o.push(circle(cx, cy + by * s, 200 * s, { fill: 'none', stroke: '#fff', 'stroke-width': 40 * s }));
    o.push(star(cx + 30 * s, cy + (by + 10) * s, 95 * s, 28 * s, 4, { fill: '#fff' }));
    o.push(circle(cx - 85 * s, cy + (by - 80) * s, 30 * s, { fill: '#fff' }));
  } else {
    o.push(circle(cx, cy + by * s, 205 * s, { fill: 'url(#ball)', ...st }));
    o.push(circle(cx, cy + by * s, 192 * s, { fill: 'none', stroke: C.goldLight, 'stroke-width': 8 * s, opacity: 0.7 }));
    o.push(ellipse(cx - 80 * s, cy + (by - 85) * s, 58 * s, 34 * s, { fill: '#fff', opacity: 0.75, transform: `rotate(-35 ${cx - 80 * s} ${cy + (by - 85) * s})` }));
    o.push(star(cx + 30 * s, cy + (by + 10) * s, 92 * s, 24 * s, 4, { fill: '#fff' }));
    o.push(star(cx - 70 * s, cy + (by + 90) * s, 26 * s, 8 * s, 4, { fill: '#fff', opacity: 0.85 }));
  }
  // broche del turbante sobre la bola
  o.push(mono ? ellipse(cx, cy - 140 * s, 48 * s, 56 * s, { fill: 'none', stroke: '#fff', 'stroke-width': 28 * s }) : ellipse(cx, cy - 140 * s, 62 * s, 70 * s, { fill: 'url(#gold)', ...st }));
  if (!mono) {
    o.push(ellipse(cx, cy - 140 * s, 33 * s, 39 * s, { fill: C.crimson, stroke: LN, 'stroke-width': 6 * s }));
    o.push(ellipse(cx - 9 * s, cy - 153 * s, 9 * s, 12 * s, { fill: '#fff', opacity: 0.75 }));
    for (let i = 0; i < 10; i++) o.push(circle(...polar(cx, cy - 140 * s, 62 * s, i * 36), 9 * s, { fill: C.goldLight, stroke: LN, 'stroke-width': 4 * s }));
  }
  return g({}, ...o);
}

export function stars(w, h, n, seed, { color = C.goldLight, min = 6, max = 16, avoid } = {}) {
  const r = rng(seed);
  const o = [];
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, s = min + r() * (max - min);
    if (avoid && Math.hypot(x - avoid[0], y - avoid[1]) < avoid[2]) continue;
    o.push(star(x, y, s, s * 0.3, 4, { fill: color, opacity: 0.35 + r() * 0.5 }));
  }
  return o.join('');
}

export const bg = (w, h, fill = 'url(#velvet)', seed = 1) => rect(0, 0, w, h, { fill }) + stars(w, h, Math.round((w * h) / 30000), seed, { avoid: [w / 2, h / 2, Math.min(w, h) * 0.36] });


// plantilla de marco de capturas (1080×1920, hueco transparente para la pantalla)
export const SHOT = { W: 1080, H: 1920, sx: 150, sy: 430, sw: 780, sh: 1386, r: 46 };
export function screenshotFrame({ headline = '', image, imgW, imgH }) {
  const { W, H, sx, sy, sw, sh, r } = SHOT;
  // titular: hasta 2 líneas, centrado
  const words = headline.split(/\s+/).filter(Boolean);
  const f = FONT.display();
  const lines = [];
  let cur = '';
  const width = (t, size) => text(t, { f, size }).width;
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (width(t, 84) > 940 && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  const head = lines.slice(0, 2).map((l, i) => text(l, { f, size: 84, x: W / 2, y: (lines.length > 1 ? 190 : 250) + i * 110, maxWidth: 960, attr: { fill: C.goldLight } }).svg).join('');
  let img = '';
  if (image) {
    // ajusta la captura cubriendo el hueco (recorte centrado)
    const k = Math.max(sw / imgW, sh / imgH), w = imgW * k, h = imgH * k;
    img = `<clipPath id="scr"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${r}"/></clipPath><image clip-path="url(#scr)" x="${sx + (sw - w) / 2}" y="${sy + (sh - h) / 2}" width="${w}" height="${h}" preserveAspectRatio="none" href="data:image/png;base64,${image.toString('base64')}"/>`;
  }
  const body = [
    bg(W, H, 'url(#velvet)', 7),
    head,
    // teléfono
    rect(sx - 26, sy - 26, sw + 52, sh + 52, { rx: r + 24, fill: '#0c0716', stroke: C.gold, 'stroke-width': 5 }),
    rect(sx - 14, sy - 14, sw + 28, sh + 28, { rx: r + 12, fill: 'none', stroke: '#2a1a3a', 'stroke-width': 3 }),
    image ? img : rect(sx, sy, sw, sh, { rx: r, fill: '#000', 'fill-opacity': 0 }),
    circle(W / 2, sy - 2, 7, { fill: '#2a1a3a' }),
  ].join('');
  return svg(W, H, DEFS, body);
}

