// Utilidades SVG: documento, minificado, texto convertido a trazados (fuentes OFL incrustadas como curvas).
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';
import { fontFile } from './fonts.mjs';

export const r1 = (n) => {
  const v = Math.round(n * 10) / 10;
  return Object.is(v, -0) ? 0 : v;
};
export const pt = (x, y) => `${r1(x)} ${r1(y)}`;

/** Serializa atributos {a:1} → ' a="1"' (omite null/undefined/false). */
export function attrs(o = {}) {
  let s = '';
  for (const [k, v] of Object.entries(o)) {
    if (v === null || v === undefined || v === false) continue;
    const key = k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()).replace(/^view-box$/, 'viewBox');
    s += ` ${key}="${typeof v === 'number' ? r1(v) : String(v).replace(/"/g, '&quot;')}"`;
  }
  return s;
}
export const el = (tag, a = {}, children = '') =>
  children === null || children === '' ? `<${tag}${attrs(a)}/>` : `<${tag}${attrs(a)}>${Array.isArray(children) ? children.join('') : children}</${tag}>`;
export const g = (a, ...children) => el('g', a, children.flat().join(''));
export const path_ = (d, a = {}) => el('path', { d, ...a });
export const circle = (cx, cy, r, a = {}) => el('circle', { cx, cy, r, ...a });
export const ellipse = (cx, cy, rx, ry, a = {}) => el('ellipse', { cx, cy, rx, ry, ...a });
export const rect = (x, y, width, height, a = {}) => el('rect', { x, y, width, height, ...a });
export const line = (x1, y1, x2, y2, a = {}) => el('line', { x1, y1, x2, y2, ...a });
export const poly = (pts, a = {}) => el('polygon', { points: pts.map(([x, y]) => pt(x, y)).join(' '), ...a });
export const polyline = (pts, a = {}) => el('polyline', { points: pts.map(([x, y]) => pt(x, y)).join(' '), ...a });

/** Redondea todos los números de un atributo d/points a 1 decimal. */
export const roundNums = (s) => s.replace(/-?\d*\.\d+(?:e-?\d+)?|-?\d+e-?\d+/g, (m) => String(r1(parseFloat(m))));

export function minify(svg) {
  return svg
    .replace(/\s*\n\s*/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/ d="([^"]+)"/g, (_, d) => ` d="${roundNums(d).replace(/\s+/g, ' ').replace(/ ?([MLHVCSQTAZmlhvcsqtaz]) ?/g, '$1').replace(/ -/g, '-')}"`)
    .replace(/ points="([^"]+)"/g, (_, d) => ` points="${roundNums(d)}"`)
    .replace(/ transform="([^"]+)"/g, (_, d) => ` transform="${roundNums(d)}"`)
    .trim();
}

export function svgDoc({ viewBox = '0 0 700 1200', width, height, title, desc, defs = '', body, style = '', extra = {} }) {
  const [, , w, h] = viewBox.split(' ').map(Number);
  return minify(
    `<svg xmlns="http://www.w3.org/2000/svg"${attrs({ viewBox, width: width ?? w, height: height ?? h, role: 'img', ...extra })}>` +
      (title ? `<title>${esc(title)}</title>` : '') +
      (desc ? `<desc>${esc(desc)}</desc>` : '') +
      (style ? `<style>${style}</style>` : '') +
      (defs ? `<defs>${defs}</defs>` : '') +
      body +
      `</svg>`,
  );
}
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function writeSvg(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return content.length;
}

// ---------- texto a curvas ----------
export function cmdsToD(cmds) {
  let d = '';
  for (const c of cmds) {
    if (c.type === 'Z') d += 'Z';
    else if (c.type === 'M' || c.type === 'L') d += c.type + pt(c.x, c.y);
    else if (c.type === 'Q') d += 'Q' + pt(c.x1, c.y1) + ' ' + pt(c.x, c.y);
    else if (c.type === 'C') d += 'C' + pt(c.x1, c.y1) + ' ' + pt(c.x2, c.y2) + ' ' + pt(c.x, c.y);
  }
  return d;
}
const fontCache = new Map();
export function font(pkg, weight = 400, style = 'normal') {
  const key = `${pkg}/${weight}/${style}`;
  if (!fontCache.has(key)) {
    const b = fs.readFileSync(fontFile(pkg, 'latin', weight, style, 'woff'));
    fontCache.set(key, opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)));
  }
  return fontCache.get(key);
}
export const FONT = {
  display: () => font('cinzel-decorative', 700),
  title: () => font('cinzel', 700),
  titleReg: () => font('cinzel', 400),
  body: () => font('alegreya', 400),
  bodyBold: () => font('alegreya', 700),
  italic: () => font('alegreya', 400, 'italic'),
  hand: () => font('caveat', 700),
  poster: () => font('rye', 400),
};

/**
 * Convierte texto en un <path>. anchor: start|middle|end. maxWidth reduce el tamaño si no cabe.
 * Devuelve { svg, width, size }.
 */
export function text(str, { f = FONT.title(), size = 60, x = 0, y = 0, anchor = 'middle', maxWidth, letterSpacing = 0, attr = {} } = {}) {
  const measure = (sz) => {
    const glyphs = f.stringToGlyphs(str);
    let w = 0;
    for (let i = 0; i < glyphs.length; i++) {
      w += (glyphs[i].advanceWidth || 0) * (sz / f.unitsPerEm);
      if (i < glyphs.length - 1) w += f.getKerningValue(glyphs[i], glyphs[i + 1]) * (sz / f.unitsPerEm) + letterSpacing * sz;
    }
    return w;
  };
  let sz = size;
  let w = measure(sz);
  if (maxWidth && w > maxWidth) {
    sz = (size * maxWidth) / w;
    w = measure(sz);
  }
  let cx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  let d = '';
  const glyphs = f.stringToGlyphs(str);
  for (let i = 0; i < glyphs.length; i++) {
    d += cmdsToD(glyphs[i].getPath(cx, y, sz).commands);
    cx += (glyphs[i].advanceWidth || 0) * (sz / f.unitsPerEm);
    if (i < glyphs.length - 1) cx += f.getKerningValue(glyphs[i], glyphs[i + 1]) * (sz / f.unitsPerEm) + letterSpacing * sz;
  }
  return { svg: d ? path_(d, attr) : '', width: w, size: sz, d };
}

/** Texto sobre arco (para sellos y medallones). */
export function textOnArc(str, { f = FONT.title(), size = 40, cx, cy, r, start = -90, sweep, attr = {}, letterSpacing = 0.05, inside = false }) {
  const glyphs = f.stringToGlyphs(str);
  const adv = glyphs.map((gl) => (gl.advanceWidth || 0) * (size / f.unitsPerEm) + letterSpacing * size);
  const total = adv.reduce((a, b) => a + b, 0);
  const totalDeg = sweep ?? (total / r) * (180 / Math.PI);
  let a0 = start - (inside ? -totalDeg / 2 : totalDeg / 2);
  let d = '';
  const scale = totalDeg / ((total / r) * (180 / Math.PI));
  for (let i = 0; i < glyphs.length; i++) {
    const deg = ((adv[i] / r) * (180 / Math.PI)) * scale;
    const mid = inside ? a0 - deg / 2 : a0 + deg / 2;
    const rad = (mid * Math.PI) / 180;
    const gx = cx + r * Math.cos(rad), gy = cy + r * Math.sin(rad);
    const gp = glyphs[i].getPath(-adv[i] / 2 + (letterSpacing * size) / 2, 0, size);
    const rot = inside ? mid - 90 : mid + 90;
    const cmds = gp.commands.map((c) => {
      const tr = (px, py) => {
        const rr = (rot * Math.PI) / 180;
        return [gx + px * Math.cos(rr) - py * Math.sin(rr), gy + px * Math.sin(rr) + py * Math.cos(rr)];
      };
      if (c.type === 'Z') return 'Z';
      const p = tr(c.x, c.y);
      if (c.type === 'M' || c.type === 'L') return c.type + pt(...p);
      if (c.type === 'Q') return 'Q' + pt(...tr(c.x1, c.y1)) + ' ' + pt(...p);
      if (c.type === 'C') return 'C' + pt(...tr(c.x1, c.y1)) + ' ' + pt(...tr(c.x2, c.y2)) + ' ' + pt(...p);
      return '';
    });
    d += cmds.join('');
    a0 = inside ? a0 - deg : a0 + deg;
  }
  return path_(d, attr);
}

// ---------- geometría ----------
export const deg = (a) => (a * Math.PI) / 180;
export const polar = (cx, cy, r, aDeg) => [cx + r * Math.cos(deg(aDeg)), cy + r * Math.sin(deg(aDeg))];
export function starPts(cx, cy, rOut, rIn, n = 5, rot = -90) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) pts.push(polar(cx, cy, i % 2 ? rIn : rOut, rot + (i * 180) / n));
  return pts;
}
export const star = (cx, cy, rOut, rIn, n, a = {}, rot) => poly(starPts(cx, cy, rOut, rIn, n, rot), a);

/** PRNG determinista (mulberry32) para que las regeneraciones sean idénticas. */
export function rng(seed) {
  let s = typeof seed === 'string' ? [...seed].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0), 1779033703) : seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Curva suave (Catmull-Rom → Bézier) por una lista de puntos. */
export function smooth(pts, closed = false, t = 0.5) {
  const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${pt(...P[1])}`;
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * t * 2, p1[1] + ((p2[1] - p0[1]) / 6) * t * 2];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * t * 2, p2[1] - ((p3[1] - p1[1]) / 6) * t * 2];
    d += `C${pt(...c1)} ${pt(...c2)} ${pt(...p2)}`;
  }
  return d + (closed ? 'Z' : '');
}
