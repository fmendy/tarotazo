// Composición de una carta: papel, panel ilustrado recortado, marcos y rótulos (texto en curvas).
import { svgDoc, rect, g, path_, text, FONT, circle, pt, star, esc } from './svg.mjs';
import { themeCss, themeDefs } from './theme.mjs';
import { PX0, PX1, PY0, PY1, PW, PH } from './symbols.mjs';

export const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

/** Carta de tarot (marco tipo RWS / Marsella / neón). */
export function tarotCard({ T, title, numeral, name, scene, layout = T.layout ?? 'rws' }) {
  const css = themeCss(T);
  const clip = `<clipPath id="pc-${T.id}"><rect x="${PX0}" y="${PY0}" width="${PW}" height="${PH}" rx="12"/></clipPath>`;
  const defs = themeDefs(T) + clip;
  const parts = [];
  // papel
  parts.push(rect(4, 4, 692, 1192, { rx: 30, fill: T.paper, stroke: T.paperEdge, 'stroke-width': 6 }));
  // panel
  let sceneSvg = scene;
  if (T.watercolor) sceneSvg = `<g filter="url(#wc-${T.id})">${scene}</g>`;
  parts.push(`<g clip-path="url(#pc-${T.id})"><g class="L">${sceneSvg}</g></g>`);
  if (T.pixelate) parts.push(''); // (pixel lo gestiona el post-proceso)

  // marcos
  const lineCol = T.frame;
  if (layout === 'marsella') {
    parts.push(rect(PX0, PY0, PW, PH, { rx: 12, fill: 'none', stroke: lineCol, 'stroke-width': 7 }));
    parts.push(rect(26, 26, 648, 1148, { rx: 22, fill: 'none', stroke: lineCol, 'stroke-width': 5 }));
    // bandas de rótulo con fondo
    parts.push(rect(PX0, 40, PW, 76, { rx: 10, fill: T.labelBg, stroke: lineCol, 'stroke-width': 5 }));
    parts.push(rect(PX0, 1044, PW, 112, { rx: 10, fill: T.labelBg, stroke: lineCol, 'stroke-width': 5 }));
  } else if (layout === 'neon') {
    parts.push(rect(PX0, PY0, PW, PH, { rx: 12, fill: 'none', stroke: T.frame, 'stroke-width': 4, filter: `url(#glow-${T.id})` }));
    parts.push(rect(22, 22, 656, 1156, { rx: 24, fill: 'none', stroke: T.accent, 'stroke-width': 3, filter: `url(#glow-${T.id})` }));
  } else {
    parts.push(rect(PX0, PY0, PW, PH, { rx: 12, fill: 'none', stroke: lineCol, 'stroke-width': 6 }));
    parts.push(rect(24, 24, 652, 1152, { rx: 22, fill: 'none', stroke: T.accent, 'stroke-width': 3 }));
    parts.push(rect(32, 32, 636, 1136, { rx: 18, fill: 'none', stroke: T.accent, 'stroke-width': 1.5 }));
  }

  // rótulos
  const fillLabel = T.label;
  const glow = layout === 'neon' ? { filter: `url(#glow-${T.id})` } : {};
  if (numeral) {
    parts.push(text(numeral, { f: FONT.title(), size: 64, x: 350, y: 106, maxWidth: 400, attr: { fill: fillLabel, ...glow } }).svg);
    if (layout !== 'marsella') {
      parts.push(star(220, 84, 9, 3.5, 4, { fill: T.accent }), star(480, 84, 9, 3.5, 4, { fill: T.accent }));
    }
  }
  if (name) {
    const nm = layout === 'marsella' ? name.toUpperCase() : name;
    parts.push(text(nm, { f: FONT.title(), size: layout === 'marsella' ? 60 : 66, x: 350, y: 1122, maxWidth: 580, attr: { fill: fillLabel, ...glow } }).svg);
  }
  return svgDoc({ title, defs, style: css, body: parts.join(''), extra: { class: `m-${T.id}` } });
}

/** Naipe español: marco con «pintas» (cortes) según el palo e índices en las esquinas. */
export const PINTAS = { oros: 0, copas: 1, espadas: 2, bastos: 3 };
export function spanishCard({ T, title, index, suit, scene, cornerColor }) {
  const css = themeCss(T);
  const x0 = 70, y0 = 70, x1 = 630, y1 = 1130;
  const clip = `<clipPath id="pc-${T.id}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="8"/></clipPath>`;
  const parts = [];
  parts.push(rect(4, 4, 692, 1192, { rx: 34, fill: T.paper, stroke: T.paperEdge, 'stroke-width': 6 }));
  let sceneSvg = scene;
  if (T.watercolor) sceneSvg = `<g filter="url(#wc-${T.id})">${scene}</g>`;
  parts.push(`<g clip-path="url(#pc-${T.id})"><g class="L">${sceneSvg}</g></g>`);
  // marco con pintas: el número de cortes en los lados superior e inferior indica el palo
  const n = PINTAS[suit];
  const col = T.frame;
  const sw = 6;
  const hLine = (y) => {
    if (n === 0) return `M${x0} ${y}H${x1}`;
    const gap = 26, mid = (x0 + x1) / 2, span = n * gap * 2 - gap;
    let d = `M${x0} ${y}H${mid - span / 2}`;
    for (let i = 0; i < n; i++) {
      const gx = mid - span / 2 + i * gap * 2;
      d += `M${gx + gap} ${y}`;
      d += i < n - 1 ? `H${gx + gap * 2}` : '';
    }
    d += `H${x1}`;
    return d;
  };
  parts.push(path_(`${hLine(y0)}${hLine(y1)}M${x0} ${y0}V${y1}M${x1} ${y0}V${y1}`, { fill: 'none', stroke: col, 'stroke-width': sw }));
  // índices (castellano: esquina sup. izq. e inf. der., girado)
  const ix = (x, y, rot) => {
    const t = text(index, { f: FONT.title(), size: 50, x: 0, y: 0, attr: { fill: cornerColor ?? T.label } });
    return `<g transform="translate(${x} ${y})${rot ? ' rotate(180)' : ''}">${t.svg}</g>`;
  };
  parts.push(ix(38, 64, false), ix(662, 1136, true));
  parts.push(ix(662, 64, false).replace('translate(662 64)', 'translate(664 64)'));
  parts.push(ix(38, 1136, true).replace('translate(38 1136)', 'translate(36 1136)'));
  return svgDoc({ title, defs: themeDefs(T) + clip, style: css, body: parts.join(''), extra: { class: `m-${T.id}` } });
}
