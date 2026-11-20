// Librería de símbolos: palos (tarot y españoles) y elementos de escenario.
import { pt, path_, circle, ellipse, rect, g, poly, star, starPts, polar, smooth, rng, line } from './svg.mjs';
import { limbD } from './figures.mjs';

// Panel de ilustración de las cartas
export const PX0 = 48, PX1 = 652, PY0 = 128, PY1 = 1032, PW = PX1 - PX0, PH = PY1 - PY0, CX = 350;

// ===================== PALOS · TAROT =====================
/** Copa (cáliz). (x,y) = centro de la base. s=1 → ~110 de alto. */
export function cup(x, y, s = 1, { cls = 'g', overflow = false, tilt = 0 } = {}) {
  const P = (u, v) => [x + u * s, y + v * s];
  const parts = [];
  if (overflow) {
    parts.push(path_(`M${pt(...P(-26, -104))}C${pt(...P(-40, -90))} ${pt(...P(-44, -60))} ${pt(...P(-50, -30))}M${pt(...P(26, -104))}C${pt(...P(40, -90))} ${pt(...P(46, -60))} ${pt(...P(52, -30))}`, { class: 'nf sw', 'stroke-width': 7 * s }));
  }
  parts.push(path_(`M${pt(...P(-32, 0))}Q${pt(...P(0, -14))} ${pt(...P(32, 0))}Z`, { class: cls }));
  parts.push(path_(`M${pt(...P(-6, -8))}L${pt(...P(-5, -46))}L${pt(...P(5, -46))}L${pt(...P(6, -8))}Z`, { class: cls }));
  parts.push(ellipse(...P(0, -34), 10 * s, 6 * s, { class: cls }));
  parts.push(path_(`M${pt(...P(-36, -100))}C${pt(...P(-36, -64))} ${pt(...P(-20, -48))} ${pt(...P(0, -46))}C${pt(...P(20, -48))} ${pt(...P(36, -64))} ${pt(...P(36, -100))}Z`, { class: cls }));
  parts.push(ellipse(...P(0, -100), 36 * s, 7 * s, { class: overflow ? 'wa' : cls }));
  parts.push(path_(`M${pt(...P(-26, -88))}C${pt(...P(-24, -70))} ${pt(...P(-16, -60))} ${pt(...P(-8, -56))}`, { class: 'nf sw th', opacity: 0.8 }));
  parts.push(path_(`M${pt(...P(-36, -86))}L${pt(...P(36, -86))}`, { class: 'nf th' }));
  return g(tilt ? { transform: `rotate(${tilt} ${x} ${y})` } : {}, ...parts);
}

/** Basto con hojas: de (x1,y1) abajo a (x2,y2) arriba. */
export function wand(x1, y1, x2, y2, { w = 22, leaves = 4, cls = 'wd', seed = 1 } = {}) {
  const r = rng(seed);
  const parts = [path_(limbD([[x1, y1], [x2, y2]], [w, w * 0.8]), { class: cls })];
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  for (let i = 0; i < leaves; i++) {
    const t = 0.25 + (i / Math.max(1, leaves - 1)) * 0.7 + (r() - 0.5) * 0.05;
    const side = i % 2 ? 1 : -1;
    const bx = x1 + dx * t + -uy * side * w * 0.4, by = y1 + dy * t + ux * side * w * 0.4;
    const ang = Math.atan2(uy, ux) * 180 / Math.PI + side * 50;
    const [tx, ty] = polar(bx, by, 26, ang);
    const [cx1, cy1] = polar(bx, by, 16, ang - 30);
    const [cx2, cy2] = polar(bx, by, 16, ang + 30);
    parts.push(path_(`M${pt(bx, by)}Q${pt(cx1, cy1)} ${pt(tx, ty)}Q${pt(cx2, cy2)} ${pt(bx, by)}Z`, { class: 'gr th' }));
  }
  // nudos
  for (const t of [0.4, 0.75]) parts.push(ellipse(x1 + dx * t, y1 + dy * t, w * 0.18, w * 0.1, { class: 'k ns', transform: `rotate(${Math.atan2(dy, dx) * 180 / Math.PI} ${x1 + dx * t} ${y1 + dy * t})` }));
  return g({}, ...parts);
}

/** Espada recta: pomo (x1,y1) → punta (x2,y2). */
export function sword(x1, y1, x2, y2, { w = 20, blade = 'm', hilt = 'g', crown = false } = {}) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const at = (t, o = 0) => [x1 + dx * t + nx * o, y1 + dy * t + ny * o];
  const gT = 50 / L, bT = gT + 8 / L;
  const parts = [];
  parts.push(path_(`M${pt(...at(bT, -w / 2))}L${pt(...at(0.93, -w / 2))}L${pt(...at(1, 0))}L${pt(...at(0.93, w / 2))}L${pt(...at(bT, w / 2))}Z`, { class: blade }));
  parts.push(path_(`M${pt(...at(bT + 0.02, 0))}L${pt(...at(0.92, 0))}`, { class: 'nf th' }));
  parts.push(path_(limbD([at(gT, -w * 2.2), at(gT, w * 2.2)], w * 0.55), { class: hilt }));
  parts.push(path_(limbD([at(8 / L), at(gT)], w * 0.6), { class: 'e' }));
  parts.push(circle(...at(0), w * 0.55, { class: hilt }));
  if (crown) {
    const [cx, cy] = at(0.82);
    parts.push(path_(`M${pt(cx - 40, cy + 6)}L${pt(cx - 46, cy - 30)}L${pt(cx - 20, cy - 10)}L${pt(cx, cy - 40)}L${pt(cx + 20, cy - 10)}L${pt(cx + 46, cy - 30)}L${pt(cx + 40, cy + 6)}Z`, { class: 'g' }));
  }
  return g({}, ...parts);
}

/** Oro / pentáculo. */
export function pentacle(x, y, r = 50, { cls = 'g' } = {}) {
  const pts = starPts(x, y, r * 0.78, r * 0.3, 5);
  return g({},
    circle(x, y, r, { class: cls }),
    circle(x, y, r * 0.84, { class: 'gl th' }),
    path_(`M${[0, 4, 8, 2, 6].map((i) => pt(...pts[i])).join('L')}Z`, { class: 'nf', 'stroke-width': r * 0.07 }),
  );
}

export const SUIT_TAROT = {
  bastos: (x, y, s = 1, o = {}) => wand(x - 8 * s, y + 60 * s, x + 8 * s, y - 60 * s, { w: 20 * s, ...o }),
  copas: (x, y, s = 1, o = {}) => cup(x, y + 50 * s, s * 0.95, o),
  espadas: (x, y, s = 1, o = {}) => sword(x, y + 75 * s, x, y - 75 * s, { w: 15 * s, ...o }),
  oros: (x, y, s = 1, o = {}) => pentacle(x, y, 40 * s, o),
};

// ===================== PALOS · BARAJA ESPAÑOLA =====================
/** Oro español: moneda con roseta. */
export function oroES(x, y, r = 50, { cls = 'g', face = false } = {}) {
  const parts = [circle(x, y, r, { class: cls }), circle(x, y, r * 0.8, { class: 'nf th' })];
  const petals = [];
  for (let i = 0; i < 8; i++) {
    const [px, py] = polar(x, y, r * 0.45, i * 45);
    petals.push(ellipse(px, py, r * 0.2, r * 0.11, { class: 'r th', transform: `rotate(${i * 45} ${px} ${py})` }));
  }
  if (face) {
    parts.push(circle(x, y, r * 0.55, { class: 'gl th' }));
    parts.push(circle(x - r * 0.18, y - r * 0.1, r * 0.06, { class: 'k ns' }), circle(x + r * 0.18, y - r * 0.1, r * 0.06, { class: 'k ns' }));
    parts.push(path_(`M${pt(x - r * 0.2, y + r * 0.2)}q${pt(r * 0.2, r * 0.15)} ${pt(r * 0.4, 0)}`, { class: 'nf th' }));
  } else {
    parts.push(...petals, circle(x, y, r * 0.2, { class: 'b th' }));
  }
  for (let i = 0; i < 16; i++) parts.push(circle(...polar(x, y, r * 0.9, i * 22.5), r * 0.035, { class: 'k ns' }));
  return g({}, ...parts);
}

/** Copa española: cáliz ancho con nudo, rojo y oro. (x,y) = base. */
export function copaES(x, y, s = 1, { cls = 'g', cls2 = 'r' } = {}) {
  const P = (u, v) => [x + u * s, y + v * s];
  return g({},
    path_(`M${pt(...P(-30, 0))}C${pt(...P(-28, -12))} ${pt(...P(-10, -14))} ${pt(...P(-7, -24))}L${pt(...P(7, -24))}C${pt(...P(10, -14))} ${pt(...P(28, -12))} ${pt(...P(30, 0))}Z`, { class: cls }),
    path_(limbD([P(0, -22), P(0, -50)], [11 * s, 9 * s]), { class: cls }),
    ellipse(...P(0, -40), 13 * s, 8 * s, { class: cls2 }),
    path_(`M${pt(...P(-40, -96))}C${pt(...P(-42, -70))} ${pt(...P(-22, -52))} ${pt(...P(0, -52))}C${pt(...P(22, -52))} ${pt(...P(42, -70))} ${pt(...P(40, -96))}Z`, { class: cls2 }),
    path_(`M${pt(...P(-40, -96))}L${pt(...P(40, -96))}L${pt(...P(36, -84))}L${pt(...P(-36, -84))}Z`, { class: cls }),
    path_(`M${pt(...P(-30, -66))}Q${pt(...P(0, -58))} ${pt(...P(30, -66))}`, { class: 'nf th' }),
    ellipse(...P(0, -96), 40 * s, 6 * s, { class: cls }),
    circle(...P(0, -72), 5 * s, { class: 'gl th' }),
  );
}

/** Espada española: pomo (x1,y1) → punta (x2,y2). Hoja azulada con gavilanes curvos. */
export function espadaES(x1, y1, x2, y2, { w = 16 } = {}) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const at = (t, o = 0) => [x1 + dx * t + nx * o, y1 + dy * t + ny * o];
  const gT = 44 / L;
  return g({},
    path_(`M${pt(...at(gT, -w / 2))}L${pt(...at(0.95, -w / 2.4))}L${pt(...at(1, 0))}L${pt(...at(0.95, w / 2.4))}L${pt(...at(gT, w / 2))}Z`, { class: 'b' }),
    path_(`M${pt(...at(gT + 0.02, 0))}L${pt(...at(0.93, 0))}`, { class: 'nf sw th' }),
    path_(`M${pt(...at(gT, -w * 2.6))}Q${pt(...at(gT - 0.06, -w * 1.6))} ${pt(...at(gT, 0))}Q${pt(...at(gT - 0.06, w * 1.6))} ${pt(...at(gT, w * 2.6))}`, { class: 'nf sg', 'stroke-width': w * 0.5 }),
    path_(`M${pt(...at(gT, -w * 2.6))}Q${pt(...at(gT - 0.06, -w * 1.6))} ${pt(...at(gT, 0))}Q${pt(...at(gT - 0.06, w * 1.6))} ${pt(...at(gT, w * 2.6))}`, { class: 'nf th' }),
    path_(limbD([at(10 / L), at(gT)], w * 0.7), { class: 'r' }),
    circle(...at(0.01), w * 0.6, { class: 'g' }),
  );
}

/** Basto español: garrote nudoso, más grueso arriba. (x1,y1) mango → (x2,y2) cabeza. */
export function bastoES(x1, y1, x2, y2, { w = 26, cls = 'wd', cls2 = 'gn', seed = 3 } = {}) {
  const r = rng(seed);
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const at = (t, o = 0) => [x1 + dx * t + nx * o, y1 + dy * t + ny * o];
  const parts = [path_(limbD([at(0), at(0.5), at(1)], [w * 0.55, w * 0.85, w * 1.25]), { class: cls })];
  for (const [t, sd] of [[0.3, 1], [0.48, -1], [0.66, 1], [0.82, -1]]) {
    const ww = w * (0.55 + t * 0.7) / 2;
    const b = at(t, sd * ww * 0.7), tip = at(t + 0.04, sd * (ww + 12 + r() * 6));
    parts.push(path_(limbD([b, tip], [12, 9]), { class: cls }));
    parts.push(ellipse(...tip, 4.5, 3, { class: 'e th', transform: `rotate(${Math.atan2(dy, dx) * 180 / Math.PI} ${tip[0]} ${tip[1]})` }));
  }
  parts.push(path_(`M${pt(...at(0.08, -w * 0.25))}L${pt(...at(0.08, w * 0.25))}M${pt(...at(0.14, -w * 0.28))}L${pt(...at(0.14, w * 0.28))}`, { class: 'nf sr', 'stroke-width': 5 }));
  parts.push(path_(`M${pt(...at(0.92, 0))}L${pt(...at(0.6, 0))}`, { class: 'nf th', opacity: 0.6 }));
  if (cls2) parts.push(ellipse(...at(1.0, 0), w * 0.5, w * 0.35, { class: cls2 + ' th', transform: `rotate(${Math.atan2(dy, dx) * 180 / Math.PI} ${at(1)[0]} ${at(1)[1]})` }));
  return g({}, ...parts);
}

// ===================== ESCENARIO =====================
export const panelClip = (id) => `<clipPath id="${id}"><rect x="${PX0}" y="${PY0}" width="${PW}" height="${PH}" rx="14"/></clipPath>`;
export const sky = (cls = 'sk', y1 = PY1) => rect(PX0 - 10, PY0 - 10, PW + 20, y1 - PY0 + 10, { class: cls + ' ns' });

export function ground(y, cls = 'gr', { amp = 14, seed = 2, x0 = PX0 - 20, x1 = PX1 + 20, y1 = PY1 + 20 } = {}) {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i <= 6; i++) pts.push([x0 + ((x1 - x0) * i) / 6, y + (r() - 0.5) * amp * 2]);
  return path_(`${smooth(pts)}L${pt(x1, y1)}L${pt(x0, y1)}Z`, { class: cls });
}

export function mountains(y, cls = 'mt', { peaks = [[120, 180], [260, 240], [420, 200], [580, 260]], snow = true } = {}) {
  let d = `M${pt(PX0 - 20, y)}`;
  const snowParts = [];
  for (const [x, h] of peaks) {
    d += `L${pt(x - h * 0.7, y)}L${pt(x, y - h)}L${pt(x + h * 0.7, y)}`;
    if (snow) snowParts.push(path_(`M${pt(x - h * 0.22, y - h * 0.68)}L${pt(x, y - h)}L${pt(x + h * 0.22, y - h * 0.68)}L${pt(x + h * 0.1, y - h * 0.74)}L${pt(x, y - h * 0.64)}L${pt(x - h * 0.1, y - h * 0.74)}Z`, { class: 'w th' }));
  }
  d += `L${pt(PX1 + 20, y)}L${pt(PX1 + 20, y + 40)}L${pt(PX0 - 20, y + 40)}Z`;
  return g({}, path_(d, { class: cls }), ...snowParts);
}

export function sunFace(cx, cy, r, { rays = 16, cls = 'su', face = true, wavy = true } = {}) {
  const parts = [];
  let d = '';
  for (let i = 0; i < rays; i++) {
    const a = (360 / rays) * i;
    if (wavy && i % 2) {
      const p1 = polar(cx, cy, r * 1.05, a - 5), p2 = polar(cx, cy, r * 1.45, a + 6), p3 = polar(cx, cy, r * 1.75, a - 3), p4 = polar(cx, cy, r * 1.05, a + 5);
      d += `M${pt(...p1)}Q${pt(...p2)} ${pt(...p3)}Q${pt(...polar(cx, cy, r * 1.4, a + 12))} ${pt(...p4)}Z`;
    } else {
      d += `M${pt(...polar(cx, cy, r * 1.02, a - 7))}L${pt(...polar(cx, cy, r * 1.6, a))}L${pt(...polar(cx, cy, r * 1.02, a + 7))}Z`;
    }
  }
  parts.push(path_(d, { class: cls }));
  parts.push(circle(cx, cy, r, { class: cls }));
  if (face) {
    parts.push(path_(`M${pt(cx - r * 0.5, cy - r * 0.15)}q${pt(r * 0.15, -r * 0.14)} ${pt(r * 0.3, 0)}M${pt(cx + r * 0.2, cy - r * 0.15)}q${pt(r * 0.15, -r * 0.14)} ${pt(r * 0.3, 0)}`, { class: 'nf th' }));
    parts.push(circle(cx - r * 0.35, cy - r * 0.05, r * 0.06, { class: 'k ns' }), circle(cx + r * 0.35, cy - r * 0.05, r * 0.06, { class: 'k ns' }));
    parts.push(path_(`M${pt(cx, cy - r * 0.05)}l${pt(r * 0.06, r * 0.22)}l${pt(-r * 0.12, 0)}`, { class: 'nf th' }));
    parts.push(path_(`M${pt(cx - r * 0.3, cy + r * 0.38)}q${pt(r * 0.3, r * 0.22)} ${pt(r * 0.6, 0)}`, { class: 'nf th' }));
    parts.push(circle(cx - r * 0.55, cy + r * 0.25, r * 0.12, { class: 'o ns', opacity: 0.6 }), circle(cx + r * 0.55, cy + r * 0.25, r * 0.12, { class: 'o ns', opacity: 0.6 }));
  }
  return g({}, ...parts);
}

/** Luna creciente con perfil. dir 1 = cuernos a la derecha. */
export function moonFace(cx, cy, r, { cls = 'gl', face = true, dir = -1 } = {}) {
  const parts = [];
  const d = `M${pt(cx, cy - r)}A${r} ${r} 0 1 ${dir > 0 ? 0 : 1} ${pt(cx, cy + r)}A${r * 0.75} ${r} 0 1 ${dir > 0 ? 1 : 0} ${pt(cx, cy - r)}Z`;
  parts.push(path_(d, { class: cls }));
  if (face) {
    const fx = cx + dir * -r * 0.02;
    parts.push(path_(`M${pt(fx - dir * r * 0.32, cy - r * 0.25)}q${pt(-dir * r * 0.1, -r * 0.08)} ${pt(-dir * r * 0.22, 0)}`, { class: 'nf th' }));
    parts.push(path_(`M${pt(fx - dir * r * 0.3, cy + r * 0.35)}q${pt(-dir * r * 0.1, r * 0.06)} ${pt(-dir * r * 0.2, 0)}`, { class: 'nf th' }));
  }
  return g({}, ...parts);
}

export function fullMoonFace(cx, cy, r, { cls = 'gl' } = {}) {
  return g({},
    circle(cx, cy, r, { class: cls }),
    path_(`M${pt(cx - r * 0.5, cy - r * 0.1)}q${pt(r * 0.16, r * 0.12)} ${pt(r * 0.32, 0)}M${pt(cx + r * 0.18, cy - r * 0.1)}q${pt(r * 0.16, r * 0.12)} ${pt(r * 0.32, 0)}`, { class: 'nf th' }),
    path_(`M${pt(cx, cy)}l${pt(r * 0.05, r * 0.2)}l${pt(-r * 0.1, 0)}`, { class: 'nf th' }),
    path_(`M${pt(cx - r * 0.2, cy + r * 0.42)}q${pt(r * 0.2, r * 0.08)} ${pt(r * 0.4, 0)}`, { class: 'nf th' }),
    circle(cx + r * 0.45, cy + r * 0.45, r * 0.1, { class: 'sh' }),
    circle(cx - r * 0.5, cy - r * 0.5, r * 0.08, { class: 'sh' }),
  );
}

export function cloud(cx, cy, s = 1, cls = 'c') {
  const P = (u, v) => pt(cx + u * s, cy + v * s);
  return path_(`M${P(-60, 10)}C${P(-80, 10)} ${P(-80, -18)} ${P(-58, -18)}C${P(-56, -42)} ${P(-22, -46)} ${P(-12, -28)}C${P(-2, -56)} ${P(44, -52)} ${P(42, -22)}C${P(70, -26)} ${P(80, 8)} ${P(56, 10)}Z`, { class: cls });
}

export function waves(y, { x0 = PX0 - 10, x1 = PX1 + 10, amp = 10, len = 60, cls = 'wa', rows = 3, gap = 26, y1 = PY1 + 20 } = {}) {
  let d = `M${pt(x0, y)}`;
  for (let x = x0; x < x1; x += len) d += `q${pt(len / 4, -amp)} ${pt(len / 2, 0)}t${pt(len / 2, 0)}`;
  d += `L${pt(x1 + len, y1)}L${pt(x0, y1)}Z`;
  const lines = [];
  for (let i = 1; i < rows; i++) {
    let l = `M${pt(x0 + (i % 2) * len / 2, y + i * gap)}`;
    for (let x = x0; x < x1; x += len) l += `q${pt(len / 4, -amp * 0.7)} ${pt(len / 2, 0)}m${pt(len / 2, 0)}`;
    lines.push(l);
  }
  return g({}, path_(d, { class: cls }), path_(lines.join(''), { class: 'nf th', opacity: 0.7 }));
}

export function tree(x, y, h = 200, { trunk = 'wd', leaf = 'gr2', fruit } = {}) {
  const parts = [path_(limbD([[x, y], [x, y - h * 0.55]], [h * 0.12, h * 0.08]), { class: trunk })];
  const pts = [];
  const c = [x, y - h * 0.7], R = h * 0.33;
  for (let i = 0; i < 14; i++) pts.push(polar(c[0], c[1], R * (i % 2 ? 0.86 : 1.06), i * (360 / 14)));
  parts.push(path_(smooth(pts, true), { class: leaf }));
  if (fruit) for (let i = 0; i < 7; i++) parts.push(circle(...polar(c[0], c[1], R * 0.55, i * 51 + 10), h * 0.035, { class: fruit + ' th' }));
  return g({}, ...parts);
}

export function cypress(x, y, h = 200, cls = 'gr2') {
  return g({}, rect(x - 4, y - h * 0.12, 8, h * 0.12, { class: 'wd th' }), path_(`M${pt(x, y - h)}C${pt(x + h * 0.14, y - h * 0.7)} ${pt(x + h * 0.14, y - h * 0.25)} ${pt(x, y - h * 0.1)}C${pt(x - h * 0.14, y - h * 0.25)} ${pt(x - h * 0.14, y - h * 0.7)} ${pt(x, y - h)}Z`, { class: cls }));
}

export function rose(x, y, r = 14, cls = 'r') {
  return g({}, circle(x, y, r, { class: cls }), path_(`M${pt(x - r * 0.5, y)}a${r * 0.5} ${r * 0.5} 0 1 1 ${pt(r * 0.5, r * 0.45)}M${pt(x - r * 0.15, y - r * 0.1)}a${r * 0.2} ${r * 0.2} 0 1 1 ${pt(r * 0.25, r * 0.2)}`, { class: 'nf th' }));
}
export function lily(x, y, s = 1) {
  const P = (u, v) => pt(x + u * s, y + v * s);
  return g({}, path_(`M${P(0, 0)}L${P(0, -40)}`, { class: 'nf', 'stroke-width': 3 }), path_(`M${P(0, -36)}C${P(-14, -44)} ${P(-14, -62)} ${P(-6, -70)}L${P(0, -56)}L${P(6, -70)}C${P(14, -62)} ${P(14, -44)} ${P(0, -36)}Z`, { class: 'w th' }));
}
export function flowerRow(y, n = 9, { x0 = PX0 + 20, x1 = PX1 - 20, cls = 'r', seed = 5 } = {}) {
  const r = rng(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / (n - 1) + (r() - 0.5) * 20, yy = y + (r() - 0.5) * 16;
    out.push(path_(`M${pt(x, yy + 30)}L${pt(x, yy)}`, { class: 'nf th' }), rose(x, yy, 10 + r() * 4, cls));
  }
  return g({}, ...out);
}

export function pillar(x, yTop, yBot, w = 56, { cls = 'st', cap = 'st', letter } = {}) {
  const parts = [
    rect(x - w / 2, yTop + 30, w, yBot - yTop - 60, { class: cls }),
    rect(x - w / 2 - 10, yTop, w + 20, 30, { class: cap }),
    rect(x - w / 2 - 10, yBot - 30, w + 20, 30, { class: cap }),
  ];
  for (let i = 1; i < 3; i++) parts.push(line(x - w / 2 + (w * i) / 3, yTop + 34, x - w / 2 + (w * i) / 3, yBot - 34, { class: 'th', opacity: 0.4 }));
  if (letter) parts.push(letter);
  return g({}, ...parts);
}

export function throne(cx, yBase, w = 220, h = 380, { cls = 'st', trim = 'g', carve } = {}) {
  const parts = [
    rect(cx - w / 2, yBase - h, w, h, { class: cls, rx: 10 }),
    rect(cx - w / 2 - 18, yBase - h * 0.42, 28, h * 0.42, { class: cls, rx: 6 }),
    rect(cx + w / 2 - 10, yBase - h * 0.42, 28, h * 0.42, { class: cls, rx: 6 }),
    rect(cx - w / 2 + 14, yBase - h + 14, w - 28, 18, { class: trim + ' th' }),
    circle(cx - w / 2, yBase - h, 14, { class: trim }), circle(cx + w / 2, yBase - h, 14, { class: trim }),
  ];
  if (carve) parts.push(carve);
  return g({}, ...parts);
}

/** Estrella de ocho puntas (RWS Estrella). */
export const star8 = (cx, cy, r, cls = 'su') => g({}, star(cx, cy, r, r * 0.3, 8, { class: cls }), star(cx, cy, r * 0.62, r * 0.22, 8, { class: cls + ' th' }, -67.5));
export const sparkle = (cx, cy, r, cls = 'gl') => star(cx, cy, r, r * 0.25, 4, { class: cls + ' th' });

export function banner(x, y, w, h, cls = 'r') {
  return path_(`M${pt(x, y)}L${pt(x + w, y + h * 0.1)}Q${pt(x + w * 0.8, y + h * 0.5)} ${pt(x + w, y + h * 0.95)}L${pt(x, y + h)}Z`, { class: cls });
}

export function castle(x, y, s = 1, cls = 'st') {
  const P = (u, v) => pt(x + u * s, y + v * s);
  return path_(`M${P(-50, 0)}L${P(-50, -60)}L${P(-56, -60)}L${P(-56, -76)}L${P(-46, -76)}L${P(-46, -68)}L${P(-38, -68)}L${P(-38, -76)}L${P(-28, -76)}L${P(-28, -60)}L${P(-20, -60)}L${P(-20, -100)}L${P(-26, -100)}L${P(-26, -116)}L${P(-16, -116)}L${P(-16, -108)}L${P(-6, -108)}L${P(-6, -116)}L${P(6, -116)}L${P(6, -108)}L${P(16, -108)}L${P(16, -116)}L${P(26, -116)}L${P(26, -100)}L${P(20, -100)}L${P(20, -60)}L${P(28, -60)}L${P(28, -76)}L${P(38, -76)}L${P(38, -68)}L${P(46, -68)}L${P(46, -76)}L${P(56, -76)}L${P(56, -60)}L${P(50, -60)}L${P(50, 0)}Z`, { class: cls }) + path_(`M${P(-6, 0)}L${P(-6, -20)}Q${P(0, -28)} ${P(6, -20)}L${P(6, 0)}Z`, { class: 'k th' });
}

export function grapes(x, y, s = 1, cls = 'v') {
  const out = [];
  const rows = [[-12, 0, 12], [-6, 6], [0]];
  rows.forEach((row, i) => row.forEach((u) => out.push(circle(x + u * s, y + i * 10 * s, 7 * s, { class: cls + ' th' }))));
  out.unshift(ellipse(x + 10 * s, y - 10 * s, 12 * s, 6 * s, { class: 'gr th', transform: `rotate(-20 ${x + 10 * s} ${y - 10 * s})` }));
  return g({}, ...out);
}

export function heart(cx, cy, s = 1, cls = 'r') {
  const P = (u, v) => pt(cx + u * s, cy + v * s);
  return path_(`M${P(0, 60)}C${P(-40, 30)} ${P(-90, -5)} ${P(-70, -45)}C${P(-55, -75)} ${P(-15, -70)} ${P(0, -40)}C${P(15, -70)} ${P(55, -75)} ${P(70, -45)}C${P(90, -5)} ${P(40, 30)} ${P(0, 60)}Z`, { class: cls });
}

export function lemniscate(cx, cy, w = 40, cls = 'nf') {
  return path_(`M${pt(cx, cy)}C${pt(cx + w * 0.5, cy - w * 0.6)} ${pt(cx + w, cy - w * 0.3)} ${pt(cx + w, cy)}C${pt(cx + w, cy + w * 0.3)} ${pt(cx + w * 0.5, cy + w * 0.6)} ${pt(cx, cy)}C${pt(cx - w * 0.5, cy - w * 0.6)} ${pt(cx - w, cy - w * 0.3)} ${pt(cx - w, cy)}C${pt(cx - w, cy + w * 0.3)} ${pt(cx - w * 0.5, cy + w * 0.6)} ${pt(cx, cy)}Z`, { class: cls, 'stroke-width': 6 });
}

export function wing(x, y, s = 1, dir = -1, cls = 'r') {
  const P = (u, v) => pt(x + u * s * dir, y + v * s);
  const feathers = [];
  for (let i = 0; i < 5; i++) feathers.push(`M${P(20 + i * 18, 10 + i * 18)}Q${P(60 + i * 22, 20 + i * 30)} ${P(110 + i * 10, 40 + i * 30)}`);
  return g({}, path_(`M${P(0, 0)}C${P(60, -60)} ${P(160, -40)} ${P(200, 40)}C${P(170, 90)} ${P(150, 140)} ${P(130, 170)}C${P(90, 140)} ${P(30, 80)} ${P(0, 0)}Z`, { class: cls }), path_(feathers.join(''), { class: 'nf th' }));
}

export function lantern(x, y, s = 1) {
  const P = (u, v) => pt(x + u * s, y + v * s);
  return g({},
    path_(`M${P(0, -46)}L${P(0, -36)}`, { class: 'nf' }),
    path_(`M${P(-18, -36)}L${P(18, -36)}L${P(12, -28)}L${P(-12, -28)}Z`, { class: 'g' }),
    path_(`M${P(-12, -28)}L${P(12, -28)}L${P(14, 10)}L${P(-14, 10)}Z`, { class: 'gl' }),
    star(x, y - 9 * s, 12 * s, 4 * s, 6, { class: 'su th' }),
    path_(`M${P(-16, 10)}L${P(16, 10)}L${P(10, 20)}L${P(-10, 20)}Z`, { class: 'g' }),
  );
}

export function snake(pts, w = 14, cls = 'gn') {
  return g({}, path_(limbD(pts, pts.map((_, i) => w * (1 - (i / pts.length) * 0.6))), { class: cls }));
}

export function chain(x1, y1, x2, y2, n = 6) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push(ellipse(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 6, 9, { class: 'nf', transform: `rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI + 90 + (i % 2) * 90} ${x1 + (x2 - x1) * t} ${y1 + (y2 - y1) * t})`, 'stroke-width': 3.5 }));
  }
  return g({}, ...out);
}

export function boat(cx, y, w = 220, cls = 'wd') {
  return path_(`M${pt(cx - w / 2, y - 30)}L${pt(cx + w / 2, y - 30)}Q${pt(cx + w * 0.4, y + 10)} ${pt(cx + w * 0.3, y + 12)}L${pt(cx - w * 0.3, y + 12)}Q${pt(cx - w * 0.4, y + 10)} ${pt(cx - w / 2, y - 30)}Z`, { class: cls });
}

export function house(x, y, s = 1, cls = 'st', roof = 'r') {
  const P = (u, v) => pt(x + u * s, y + v * s);
  return g({}, path_(`M${P(-30, 0)}L${P(-30, -40)}L${P(30, -40)}L${P(30, 0)}Z`, { class: cls }), path_(`M${P(-38, -38)}L${P(0, -70)}L${P(38, -38)}Z`, { class: roof }), path_(`M${P(-6, 0)}L${P(-6, -18)}L${P(6, -18)}L${P(6, 0)}Z`, { class: 'k th' }));
}
