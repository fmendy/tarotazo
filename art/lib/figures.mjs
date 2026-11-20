// Figuras estilizadas (grabado coloreado): personas, caballo, perro, león, etc.
// Todo se dibuja con clases de color (ver lib/theme.mjs) para que cada modelo pueda re-teñirlo.
import { pt, path_, circle, ellipse, g, smooth, polar, star, poly } from './svg.mjs';

// ---------- extremidades como formas rellenas ----------
/** Polilínea con grosor → contorno cerrado con extremos redondeados. w puede ser número o array por vértice. */
export function limbD(pts, w) {
  const W = Array.isArray(w) ? w : pts.map(() => w);
  const n = pts.length;
  const L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const hw = W[i] / 2;
    L.push([pts[i][0] - dy * hw, pts[i][1] + dx * hw]);
    R.push([pts[i][0] + dy * hw, pts[i][1] - dx * hw]);
  }
  const end = W[n - 1] / 2, st = W[0] / 2;
  let d = smooth(L).replace(/^M/, 'M');
  d += `A${end} ${end} 0 0 0 ${pt(...R[n - 1])}`;
  d += smooth(R.slice().reverse()).replace(/^M[^C]*/, '');
  d += `A${st} ${st} 0 0 0 ${pt(...L[0])}Z`;
  return d;
}
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const fromAngle = (p, len, a) => polar(p[0], p[1], len, a);

/**
 * Persona estilizada vista de frente.
 * o: { x, y (pies), h (altura px), robe:'r', robe2, garment:'robe'|'tunic'|'dress'|'armor'|'none', seated, riding,
 *      arms:{l:[a1,a2], r:[a1,a2]} (ángulos de pantalla; 90 = abajo),
 *      hair:'h'|'hb'|'hg'|'k', hairStyle:'short'|'long'|'bald'|'bun', beard, head:'crown'|'hood'|'wreath'|'hat'|'helmet'|'mitre'|'veil'|'cap'|'turban'|'laurel'|null,
 *      look: -1..1, eyes:'open'|'closed'|'band', cape, belt, legs:'k'|class, mood:'smile'|'neutral'|'sad', cat:boolean }
 * Devuelve { svg, hands:{l:[x,y], r:[x,y]}, head:[x,y], headR, top, shoulder:{l,r}, lap:[x,y] }
 */
export function person(o) {
  const k = o.h / 100;
  const X = (u) => o.x + u * k, Y = (v) => o.y + v * k;
  const P = (u, v) => [X(u), Y(v)];
  const robe = o.robe ?? 'r', robe2 = o.robe2 ?? robe, sleeve = o.sleeve ?? robe;
  const seated = !!o.seated, riding = !!o.riding;
  const headC = seated ? [0, -68] : riding ? [0, -70] : [0, -90];
  const hr = 7.6;
  const shY = headC[1] + 12, waistY = headC[1] + 34, hipY = headC[1] + 40;
  const shW = o.shoulders ?? 11;
  const out = [];
  const back = [];

  // capa (detrás)
  if (o.cape) {
    const hem = seated ? -2 : riding ? hipY + 16 : -4;
    back.push(path_(`M${pt(...P(-shW + 1, shY - 1))}C${pt(...P(-shW - 12, shY + 20))} ${pt(...P(-shW - 16, hem - 20))} ${pt(...P(-shW - 18, hem))}L${pt(...P(shW + 18, hem))}C${pt(...P(shW + 16, hem - 20))} ${pt(...P(shW + 12, shY + 20))} ${pt(...P(shW - 1, shY - 1))}Z`, { class: o.cape }));
  }
  // pelo largo (detrás)
  if (o.hairStyle === 'long' && !o.cat) {
    back.push(path_(`M${pt(...P(-hr - 1, headC[1] - 2))}C${pt(...P(-hr - 4, headC[1] + 12))} ${pt(...P(-hr - 5, headC[1] + 18))} ${pt(...P(-hr - 2, headC[1] + 22))}L${pt(...P(hr + 2, headC[1] + 22))}C${pt(...P(hr + 5, headC[1] + 18))} ${pt(...P(hr + 4, headC[1] + 12))} ${pt(...P(hr + 1, headC[1] - 2))}Z`, { class: o.hair ?? 'h' }));
  }

  if (o.head === 'veil' || o.head === 'tiara' && o.veil) {
    const [cx, cy] = P(...headC), r = hr * k;
    back.push(path_(`M${pt(cx - r * 1.3, cy + r * 3.2)}C${pt(cx - r * 1.6, cy - r * 1.5)} ${pt(cx + r * 1.6, cy - r * 1.5)} ${pt(cx + r * 1.3, cy + r * 3.2)}Z`, { class: o.veil ?? o.headC ?? 'b' }));
  }
  // piernas
  const legC = o.legs ?? 'lg';
  if (!seated && !riding && o.garment !== 'robe' && o.garment !== 'dress') {
    const sp = o.stride ?? 0;
    const lf = P(-5 - sp, -1), rf = P(5 + sp * 0.6, -1);
    out.push(path_(limbD([P(-5, hipY), P(-5.5 - sp / 2, -24), lf], [9 * k, 7.5 * k, 6.5 * k]), { class: legC }));
    out.push(path_(limbD([P(5, hipY), P(5.5 + sp / 3, -24), rf], [9 * k, 7.5 * k, 6.5 * k]), { class: legC }));
    out.push(ellipse(lf[0] - 2 * k, lf[1], 5.5 * k, 2.6 * k, { class: 'k' }), ellipse(rf[0] + 2 * k, rf[1], 5.5 * k, 2.6 * k, { class: 'k' }));
  }
  if (riding) {
    // una pierna visible hacia delante, por el costado del caballo
    const s = o.side ?? 1;
    out.push(path_(limbD([P(3 * s, hipY - 2), P(14 * s, hipY + 8), P(12 * s, hipY + 26)], [10 * k, 8 * k, 7 * k]), { class: legC }));
    out.push(ellipse(X(14 * s), Y(hipY + 27), 5.5 * k, 2.8 * k, { class: 'k' }));
  }

  // cuerpo / vestido
  const gmt = o.garment ?? 'robe';
  let bodyD;
  if (seated) {
    bodyD = `M${pt(...P(-shW, shY))}C${pt(...P(-shW - 2, waistY - 6))} ${pt(...P(-10, waistY))} ${pt(...P(-12, hipY - 2))}C${pt(...P(-22, hipY))} ${pt(...P(-23, -18))} ${pt(...P(-21, -3))}L${pt(...P(21, -3))}C${pt(...P(23, -18))} ${pt(...P(22, hipY))} ${pt(...P(12, hipY - 2))}C${pt(...P(10, waistY))} ${pt(...P(shW + 2, waistY - 6))} ${pt(...P(shW, shY))}Z`;
  } else if (riding) {
    bodyD = `M${pt(...P(-shW, shY))}C${pt(...P(-shW - 1, waistY - 8))} ${pt(...P(-9, waistY))} ${pt(...P(-12, hipY + 2))}L${pt(...P(12, hipY + 2))}C${pt(...P(9, waistY))} ${pt(...P(shW + 1, waistY - 8))} ${pt(...P(shW, shY))}Z`;
  } else if (gmt === 'robe' || gmt === 'dress') {
    const flare = gmt === 'dress' ? 19 : 16;
    bodyD = `M${pt(...P(-shW, shY))}C${pt(...P(-shW - 1, shY + 14))} ${pt(...P(-8, waistY - 4))} ${pt(...P(-8.5, waistY))}C${pt(...P(-12, -30))} ${pt(...P(-flare, -12))} ${pt(...P(-flare, -1))}Q${pt(...P(0, 2))} ${pt(...P(flare, -1))}C${pt(...P(flare, -12))} ${pt(...P(12, -30))} ${pt(...P(8.5, waistY))}C${pt(...P(8, waistY - 4))} ${pt(...P(shW + 1, shY + 14))} ${pt(...P(shW, shY))}Z`;
  } else if (gmt === 'tunic' || gmt === 'armor') {
    bodyD = `M${pt(...P(-shW, shY))}C${pt(...P(-shW - 1, shY + 14))} ${pt(...P(-8, waistY - 4))} ${pt(...P(-8.5, waistY))}L${pt(...P(-13, -26))}Q${pt(...P(0, -23))} ${pt(...P(13, -26))}L${pt(...P(8.5, waistY))}C${pt(...P(8, waistY - 4))} ${pt(...P(shW + 1, shY + 14))} ${pt(...P(shW, shY))}Z`;
  }
  if (bodyD) out.push(path_(bodyD, { class: robe }));
  // pliegues
  if (!riding && (gmt === 'robe' || gmt === 'dress' || seated)) {
    const fy = seated ? -3 : -1;
    out.push(path_(`M${pt(...P(-4, waistY + 4))}Q${pt(...P(-6, -20))} ${pt(...P(-8, fy - 1))}M${pt(...P(4, waistY + 4))}Q${pt(...P(6, -20))} ${pt(...P(8, fy - 1))}M${pt(...P(0, waistY + 6))}L${pt(...P(0, fy))}`, { class: 'nf th' }));
    if (!seated) out.push(ellipse(X(-6), Y(0), 4.5 * k, 2.2 * k, { class: 'k' }), ellipse(X(6), Y(0), 4.5 * k, 2.2 * k, { class: 'k' }));
    else out.push(ellipse(X(-8), Y(-1), 5 * k, 2.4 * k, { class: 'k' }), ellipse(X(8), Y(-1), 5 * k, 2.4 * k, { class: 'k' }));
  }
  if (gmt === 'armor') {
    out.push(path_(`M${pt(...P(-shW + 1, shY + 2))}Q${pt(...P(0, shY + 8))} ${pt(...P(shW - 1, shY + 2))}L${pt(...P(8, waistY - 2))}Q${pt(...P(0, waistY + 2))} ${pt(...P(-8, waistY - 2))}Z`, { class: 'm' }));
  }
  // sobrevesta / delantal
  if (o.tabard) out.push(path_(`M${pt(...P(-6, shY + 2))}L${pt(...P(6, shY + 2))}L${pt(...P(7, seated ? -6 : -10))}L${pt(...P(-7, seated ? -6 : -10))}Z`, { class: o.tabard }));
  if (o.belt) out.push(path_(`M${pt(...P(-9, waistY - 1.5))}Q${pt(...P(0, waistY + 1.5))} ${pt(...P(9, waistY - 1.5))}L${pt(...P(9, waistY + 2))}Q${pt(...P(0, waistY + 5))} ${pt(...P(-9, waistY + 2))}Z`, { class: o.belt }));
  if (o.chest) out.push(o.chest(P(0, shY + 10), k));

  // brazos
  const hands = {};
  const arms = o.arms ?? { l: [100, 95], r: [80, 85] };
  for (const side of ['l', 'r']) {
    const s = side === 'l' ? -1 : 1;
    const sh = P(s * (shW - 2), shY + 2);
    const [a1, a2] = arms[side];
    const el = fromAngle(sh, 17 * k, a1);
    const hd = fromAngle(el, 16 * k, a2);
    hands[side] = hd;
    out.push(path_(limbD([sh, el, hd], [8.5 * k, 7 * k, 6 * k]), { class: o.sleeves?.[side] ?? sleeve }));
  }
  const handsSvg = [];
  for (const side of ['l', 'r']) handsSvg.push(circle(hands[side][0], hands[side][1], 3.6 * k, { class: o.cat ? (o.fur ?? 'o') : 's' }));

  // cabeza
  const H = P(...headC);
  const head = [];
  head.push(path_(limbD([P(0, headC[1] + 4), P(0, shY + 1)], 6 * k), { class: o.cat ? (o.fur ?? 'o') : 's' })); // cuello
  if (o.cat) {
    head.push(...catHead(H, hr * k * 1.08, o));
  } else {
    head.push(ellipse(H[0], H[1], hr * k, hr * 1.12 * k, { class: 's' }));
    head.push(...face(H, hr * k, o));
    head.push(...hairFront(H, hr * k, o));
  }
  head.push(...headwear(H, hr * k, o));

  return {
    svg: g({}, back.join(''), out.join(''), head.join(''), handsSvg.join('')),
    back: back.join(''),
    hands, head: H, headR: hr * k, k,
    top: Y(headC[1] - hr * 1.2), lap: P(0, hipY),
    shoulder: { l: P(-shW, shY), r: P(shW, shY) },
  };
}

function face(H, r, o) {
  const [cx, cy] = H, lk = (o.look ?? 0) * r * 0.25;
  const f = [];
  if (o.eyes === 'band') {
    f.push(path_(`M${pt(cx - r * 1.02, cy - r * 0.35)}L${pt(cx + r * 1.02, cy - r * 0.35)}L${pt(cx + r * 0.98, cy + r * 0.05)}L${pt(cx - r * 0.98, cy + r * 0.05)}Z`, { class: 'w' }));
  } else if (o.eyes === 'closed') {
    f.push(path_(`M${pt(cx - r * 0.55 + lk, cy - r * 0.12)}q${pt(r * 0.2, r * 0.16)} ${pt(r * 0.4, 0)}M${pt(cx + r * 0.15 + lk, cy - r * 0.12)}q${pt(r * 0.2, r * 0.16)} ${pt(r * 0.4, 0)}`, { class: 'nf th' }));
  } else {
    f.push(ellipse(cx - r * 0.36 + lk, cy - r * 0.12, r * 0.12, r * 0.16, { class: 'k ns' }), ellipse(cx + r * 0.36 + lk, cy - r * 0.12, r * 0.12, r * 0.16, { class: 'k ns' }));
  }
  f.push(path_(`M${pt(cx + lk * 1.3, cy - r * 0.02)}l${pt(r * 0.1, r * 0.3)}l${pt(-r * 0.16, 0.02 * r)}`, { class: 'nf th' }));
  const m = o.mood ?? 'neutral';
  if (m === 'smile') f.push(path_(`M${pt(cx - r * 0.3 + lk, cy + r * 0.48)}q${pt(r * 0.3, r * 0.24)} ${pt(r * 0.6, 0)}`, { class: 'nf th' }));
  else if (m === 'sad') f.push(path_(`M${pt(cx - r * 0.25 + lk, cy + r * 0.62)}q${pt(r * 0.25, -r * 0.18)} ${pt(r * 0.5, 0)}`, { class: 'nf th' }));
  else if (m === 'o') f.push(ellipse(cx + lk, cy + r * 0.55, r * 0.13, r * 0.18, { class: 'k ns' }));
  else f.push(path_(`M${pt(cx - r * 0.22 + lk, cy + r * 0.52)}l${pt(r * 0.44, 0)}`, { class: 'nf th' }));
  f.push(circle(cx - r * 0.62, cy + r * 0.3, r * 0.17, { class: 'rs ns', opacity: 0.6 }), circle(cx + r * 0.62, cy + r * 0.3, r * 0.17, { class: 'rs ns', opacity: 0.6 }));
  if (o.beard) {
    f.push(path_(`M${pt(cx - r * 0.95, cy + r * 0.05)}C${pt(cx - r, cy + r * 1.3)} ${pt(cx - r * 0.4, cy + r * (o.beard === 'long' ? 2.6 : 1.7))} ${pt(cx, cy + r * (o.beard === 'long' ? 2.9 : 1.85))}C${pt(cx + r * 0.4, cy + r * (o.beard === 'long' ? 2.6 : 1.7))} ${pt(cx + r, cy + r * 1.3)} ${pt(cx + r * 0.95, cy + r * 0.05)}C${pt(cx + r * 0.6, cy + r * 0.5)} ${pt(cx + r * 0.3, cy + r * 0.3)} ${pt(cx, cy + r * 0.35)}C${pt(cx - r * 0.3, cy + r * 0.3)} ${pt(cx - r * 0.6, cy + r * 0.5)} ${pt(cx - r * 0.95, cy + r * 0.05)}Z`, { class: o.beardC ?? o.hair ?? 'hg' }));
    f.push(path_(`M${pt(cx - r * 0.25, cy + r * 0.62)}q${pt(r * 0.25, r * 0.12)} ${pt(r * 0.5, 0)}`, { class: 'nf th' }));
  }
  return f;
}

function hairFront(H, r, o) {
  const [cx, cy] = H, c = o.hair ?? 'h', st = o.hairStyle ?? 'short';
  if (st === 'bald') return [path_(`M${pt(cx - r * 0.98, cy - r * 0.1)}q${pt(-r * 0.1, -r * 0.3)} ${pt(r * 0.05, -r * 0.4)}M${pt(cx + r * 0.98, cy - r * 0.1)}q${pt(r * 0.1, -r * 0.3)} ${pt(-r * 0.05, -r * 0.4)}`, { class: 'nf th' })];
  const top = `M${pt(cx - r * 1.04, cy + r * 0.05)}C${pt(cx - r * 1.15, cy - r * 1.2)} ${pt(cx + r * 1.15, cy - r * 1.2)} ${pt(cx + r * 1.04, cy + r * 0.05)}C${pt(cx + r * 0.9, cy - r * 0.45)} ${pt(cx + r * 0.3, cy - r * 0.6)} ${pt(cx - r * 0.1, cy - r * 0.62)}C${pt(cx - r * 0.5, cy - r * 0.5)} ${pt(cx - r * 0.85, cy - r * 0.4)} ${pt(cx - r * 1.04, cy + r * 0.05)}Z`;
  const res = [path_(top, { class: c })];
  if (st === 'bun') res.push(circle(cx, cy - r * 1.15, r * 0.45, { class: c }));
  return res;
}

function headwear(H, r, o) {
  const [cx, cy] = H, w = o.head, c = o.headC;
  const res = [];
  if (!w) return res;
  if (w === 'crown') {
    const b = cy - r * 0.75;
    res.push(path_(`M${pt(cx - r * 0.95, b)}L${pt(cx - r * 1.05, b - r * 0.95)}L${pt(cx - r * 0.5, b - r * 0.45)}L${pt(cx, b - r * 1.15)}L${pt(cx + r * 0.5, b - r * 0.45)}L${pt(cx + r * 1.05, b - r * 0.95)}L${pt(cx + r * 0.95, b)}Z`, { class: c ?? 'g' }));
    res.push(circle(cx, b - r * 0.3, r * 0.14, { class: 'r th' }));
  } else if (w === 'laurel' || w === 'wreath') {
    for (let i = -4; i <= 4; i++) {
      if (i === 0) continue;
      const [lx, ly] = polar(cx, cy + r * 0.1, r * 1.02, -90 + i * 20);
      res.push(ellipse(lx, ly, r * 0.18, r * 0.32, { class: w === 'laurel' ? 'gn th' : 'rs th', transform: `rotate(${i * 20} ${lx} ${ly})` }));
    }
  } else if (w === 'hood') {
    res.unshift(path_(`M${pt(cx - r * 1.35, cy + r * 1.3)}C${pt(cx - r * 1.6, cy - r * 1.6)} ${pt(cx + r * 1.6, cy - r * 1.6)} ${pt(cx + r * 1.35, cy + r * 1.3)}L${pt(cx + r * 0.95, cy + r * 1.1)}C${pt(cx + r * 1.15, cy - r * 1.05)} ${pt(cx - r * 1.15, cy - r * 1.05)} ${pt(cx - r * 0.95, cy + r * 1.1)}Z`, { class: c ?? o.robe ?? 'm' }));
  } else if (w === 'hat') {
    res.push(ellipse(cx, cy - r * 0.7, r * 1.9, r * 0.42, { class: c ?? 'k' }));
    res.push(path_(`M${pt(cx - r * 0.85, cy - r * 0.75)}L${pt(cx - r * 0.7, cy - r * 1.85)}Q${pt(cx, cy - r * 2.1)} ${pt(cx + r * 0.7, cy - r * 1.85)}L${pt(cx + r * 0.85, cy - r * 0.75)}Z`, { class: c ?? 'k' }));
    res.push(path_(`M${pt(cx - r * 0.82, cy - r * 1.0)}L${pt(cx + r * 0.82, cy - r * 1.0)}L${pt(cx + r * 0.8, cy - r * 1.25)}L${pt(cx - r * 0.8, cy - r * 1.25)}Z`, { class: 'r th' }));
  } else if (w === 'helmet') {
    res.push(path_(`M${pt(cx - r * 1.1, cy - r * 0.05)}C${pt(cx - r * 1.2, cy - r * 1.5)} ${pt(cx + r * 1.2, cy - r * 1.5)} ${pt(cx + r * 1.1, cy - r * 0.05)}L${pt(cx + r * 0.95, cy - r * 0.35)}L${pt(cx - r * 0.95, cy - r * 0.35)}Z`, { class: 'm' }));
    res.push(path_(`M${pt(cx, cy - r * 1.1)}C${pt(cx + r * 0.6, cy - r * 2.4)} ${pt(cx + r * 1.8, cy - r * 1.7)} ${pt(cx + r * 2, cy - r * 0.6)}C${pt(cx + r * 1.2, cy - r * 1.3)} ${pt(cx + r * 0.6, cy - r * 1.3)} ${pt(cx, cy - r * 1.1)}Z`, { class: c ?? 'r' }));
  } else if (w === 'mitre') {
    res.push(path_(`M${pt(cx - r * 0.85, cy - r * 0.7)}C${pt(cx - r, cy - r * 2.2)} ${pt(cx - r * 0.3, cy - r * 2.8)} ${pt(cx, cy - r * 3)}C${pt(cx + r * 0.3, cy - r * 2.8)} ${pt(cx + r, cy - r * 2.2)} ${pt(cx + r * 0.85, cy - r * 0.7)}Z`, { class: c ?? 'g' }));
    for (const t of [1.2, 1.75, 2.3]) res.push(path_(`M${pt(cx - r * (1.05 - t * 0.25), cy - r * t)}Q${pt(cx, cy - r * (t - 0.18))} ${pt(cx + r * (1.05 - t * 0.25), cy - r * t)}`, { class: 'nf th' }));
    res.push(star(cx, cy - r * 3.15, r * 0.3, r * 0.12, 4, { class: 'g th' }));
  } else if (w === 'veil') {
    res.push(path_(`M${pt(cx - r * 1.15, cy - r * 0.6)}C${pt(cx - r * 1.1, cy - r * 1.4)} ${pt(cx + r * 1.1, cy - r * 1.4)} ${pt(cx + r * 1.15, cy - r * 0.6)}Q${pt(cx, cy - r * 0.9)} ${pt(cx - r * 1.15, cy - r * 0.6)}Z`, { class: c ?? 'b' }));
  } else if (w === 'tiara') {
    // corona lunar (Sacerdotisa)
    res.push(circle(cx, cy - r * 1.45, r * 0.55, { class: 'w' }));
    res.push(path_(`M${pt(cx - r * 1.4, cy - r * 1.9)}Q${pt(cx - r * 1.1, cy - r * 0.9)} ${pt(cx - r * 0.35, cy - r * 1.05)}Q${pt(cx - r * 0.95, cy - r * 1.3)} ${pt(cx - r * 1.4, cy - r * 1.9)}Z`, { class: 'w' }));
    res.push(path_(`M${pt(cx + r * 1.4, cy - r * 1.9)}Q${pt(cx + r * 1.1, cy - r * 0.9)} ${pt(cx + r * 0.35, cy - r * 1.05)}Q${pt(cx + r * 0.95, cy - r * 1.3)} ${pt(cx + r * 1.4, cy - r * 1.9)}Z`, { class: 'w' }));
  } else if (w === 'cap') {
    // gorro con pluma (El Loco)
    res.push(path_(`M${pt(cx - r * 1.05, cy - r * 0.45)}C${pt(cx - r * 1.1, cy - r * 1.6)} ${pt(cx + r * 1.1, cy - r * 1.6)} ${pt(cx + r * 1.05, cy - r * 0.45)}Q${pt(cx, cy - r * 0.8)} ${pt(cx - r * 1.05, cy - r * 0.45)}Z`, { class: c ?? 'gn' }));
    res.push(path_(`M${pt(cx + r * 0.3, cy - r * 1.2)}C${pt(cx + r * 1.2, cy - r * 3.2)} ${pt(cx + r * 2.6, cy - r * 2.8)} ${pt(cx + r * 3, cy - r * 2.2)}C${pt(cx + r * 2, cy - r * 2.1)} ${pt(cx + r * 1, cy - r * 1.6)} ${pt(cx + r * 0.3, cy - r * 1.2)}Z`, { class: 'r' }));
  } else if (w === 'turban') {
    res.push(path_(`M${pt(cx - r * 1.15, cy - r * 0.3)}C${pt(cx - r * 1.6, cy - r * 2.2)} ${pt(cx + r * 1.6, cy - r * 2.2)} ${pt(cx + r * 1.15, cy - r * 0.3)}Q${pt(cx, cy - r * 0.75)} ${pt(cx - r * 1.15, cy - r * 0.3)}Z`, { class: c ?? 'v' }));
    res.push(path_(`M${pt(cx - r * 1.1, cy - r * 0.6)}Q${pt(cx, cy - r * 1.6)} ${pt(cx + r * 1.2, cy - r * 1.2)}M${pt(cx - r * 1.2, cy - r * 1.1)}Q${pt(cx, cy - r * 2)} ${pt(cx + r * 1, cy - r * 1.7)}`, { class: 'nf th' }));
    res.push(circle(cx, cy - r * 1.05, r * 0.25, { class: 'r th' }));
  }
  return res;
}

function catHead(H, r, o) {
  const [cx, cy] = H, fur = o.fur ?? 'o';
  const res = [];
  res.push(path_(`M${pt(cx - r * 0.95, cy - r * 0.2)}L${pt(cx - r * 0.85, cy - r * 1.5)}L${pt(cx - r * 0.25, cy - r * 0.85)}L${pt(cx + r * 0.25, cy - r * 0.85)}L${pt(cx + r * 0.85, cy - r * 1.5)}L${pt(cx + r * 0.95, cy - r * 0.2)}Z`, { class: fur }));
  res.push(ellipse(cx, cy, r * 1.08, r * 0.95, { class: fur }));
  res.push(path_(`M${pt(cx - r * 0.7, cy - r * 1.15)}L${pt(cx - r * 0.45, cy - r * 0.8)}M${pt(cx + r * 0.7, cy - r * 1.15)}L${pt(cx + r * 0.45, cy - r * 0.8)}`, { class: 'nf th' }));
  if (o.eyes === 'closed') res.push(path_(`M${pt(cx - r * 0.6, cy - r * 0.15)}q${pt(r * 0.2, r * 0.18)} ${pt(r * 0.4, 0)}M${pt(cx + r * 0.2, cy - r * 0.15)}q${pt(r * 0.2, r * 0.18)} ${pt(r * 0.4, 0)}`, { class: 'nf th' }));
  else {
    res.push(ellipse(cx - r * 0.4, cy - r * 0.12, r * 0.24, r * 0.26, { class: 'su th' }), ellipse(cx + r * 0.4, cy - r * 0.12, r * 0.24, r * 0.26, { class: 'su th' }));
    res.push(ellipse(cx - r * 0.4, cy - r * 0.12, r * 0.07, r * 0.2, { class: 'k ns' }), ellipse(cx + r * 0.4, cy - r * 0.12, r * 0.07, r * 0.2, { class: 'k ns' }));
  }
  res.push(path_(`M${pt(cx - r * 0.12, cy + r * 0.2)}L${pt(cx + r * 0.12, cy + r * 0.2)}L${pt(cx, cy + r * 0.35)}Z`, { class: 'rs th' }));
  res.push(path_(`M${pt(cx, cy + r * 0.35)}q${pt(-r * 0.15, r * 0.2)} ${pt(-r * 0.3, r * 0.08)}M${pt(cx, cy + r * 0.35)}q${pt(r * 0.15, r * 0.2)} ${pt(r * 0.3, r * 0.08)}`, { class: 'nf th' }));
  res.push(path_(`M${pt(cx - r * 0.45, cy + r * 0.35)}l${pt(-r * 0.8, -r * 0.1)}M${pt(cx - r * 0.45, cy + r * 0.45)}l${pt(-r * 0.8, r * 0.12)}M${pt(cx + r * 0.45, cy + r * 0.35)}l${pt(r * 0.8, -r * 0.1)}M${pt(cx + r * 0.45, cy + r * 0.45)}l${pt(r * 0.8, r * 0.12)}`, { class: 'nf th' }));
  if (o.stripes !== false) res.push(path_(`M${pt(cx - r * 0.2, cy - r * 0.85)}l${pt(r * 0.05, r * 0.3)}M${pt(cx, cy - r * 0.88)}l${pt(0, r * 0.32)}M${pt(cx + r * 0.2, cy - r * 0.85)}l${pt(-r * 0.05, r * 0.3)}`, { class: 'nf th' }));
  return res;
}

// ---------- animales ----------
/** Caballo de perfil. x,y = pezuñas traseras-delanteras centro en suelo; dir 1 = mira a la derecha. */
export function horse({ x, y, w = 330, dir = 1, c = 'w', mane = 'hg', rear = false, barding }) {
  const k = w / 100;
  const X = (u) => x + u * k * dir, Y = (v) => y + v * k;
  const P = (u, v) => [X(u), Y(v)];
  const parts = [];
  // patas traseras (lejanas)
  const leg = (hx, hy, fx, fy, kx, cl) => path_(limbD([P(hx, hy), P(kx, (hy + fy) / 2 + 2), P(fx, fy)], [8 * k, 5 * k, 4.6 * k]), { class: cl });
  parts.push(leg(-28, -40, -34, -2, -36, c));
  parts.push(rear ? leg(26, -44, 46, -40, 44, c) : leg(26, -42, 30, -2, 27, c));
  // cuerpo
  parts.push(path_(`M${pt(...P(-36, -52))}C${pt(...P(-44, -50))} ${pt(...P(-44, -30))} ${pt(...P(-30, -30))}C${pt(...P(-10, -26))} ${pt(...P(14, -27))} ${pt(...P(28, -32))}C${pt(...P(36, -36))} ${pt(...P(36, -48))} ${pt(...P(34, -54))}L${pt(...P(42, -72))}C${pt(...P(44, -78))} ${pt(...P(50, -82))} ${pt(...P(56, -80))}L${pt(...P(66, -66))}C${pt(...P(68, -62))} ${pt(...P(64, -58))} ${pt(...P(60, -60))}L${pt(...P(52, -66))}C${pt(...P(46, -58))} ${pt(...P(40, -54))} ${pt(...P(30, -56))}C${pt(...P(10, -60))} ${pt(...P(-20, -58))} ${pt(...P(-36, -52))}Z`, { class: c }));
  // cola
  parts.push(path_(`M${pt(...P(-38, -50))}C${pt(...P(-54, -50))} ${pt(...P(-56, -30))} ${pt(...P(-50, -16))}C${pt(...P(-48, -28))} ${pt(...P(-46, -40))} ${pt(...P(-38, -46))}Z`, { class: mane }));
  // crin
  parts.push(path_(`M${pt(...P(52, -80))}C${pt(...P(44, -78))} ${pt(...P(36, -64))} ${pt(...P(32, -55))}L${pt(...P(38, -56))}C${pt(...P(42, -64))} ${pt(...P(46, -72))} ${pt(...P(53, -76))}Z`, { class: mane }));
  // patas delanteras (cercanas)
  parts.push(rear ? leg(30, -40, 52, -46, 48, c) : leg(30, -38, 36, -2, 34, c));
  parts.push(leg(-24, -38, -22, -2, -26, c));
  // pezuñas
  for (const [fx, fy] of rear ? [[-22, -2], [-34, -2]] : [[-22, -2], [-34, -2], [36, -2], [30, -2]]) parts.push(ellipse(X(fx), Y(fy + 1), 3.2 * k, 1.6 * k, { class: 'k' }));
  // ojo, oreja, bridas
  parts.push(path_(`M${pt(...P(52, -80))}L${pt(...P(54, -88))}L${pt(...P(57, -80))}Z`, { class: c }));
  parts.push(circle(X(56), Y(-74), 1.3 * k, { class: 'k ns' }));
  parts.push(path_(`M${pt(...P(48, -76))}L${pt(...P(62, -63))}M${pt(...P(56, -75))}L${pt(...P(36, -54))}`, { class: 'nf sr th' }));
  if (barding) parts.push(path_(`M${pt(...P(-30, -54))}C${pt(...P(-10, -60))} ${pt(...P(10, -60))} ${pt(...P(30, -56))}L${pt(...P(28, -36))}Q${pt(...P(0, -28))} ${pt(...P(-30, -34))}Z`, { class: barding }));
  return { svg: g({}, ...parts), saddle: P(0, -58), k };
}

export function dog({ x, y, s = 1, dir = 1, c = 'w' }) {
  const X = (u) => x + u * s * dir, Y = (v) => y + v * s;
  const P = (u, v) => [X(u), Y(v)];
  return g({},
    path_(limbD([P(-22, -30), P(-30, -12), P(-28, 0)], [11 * s, 8 * s, 7 * s]), { class: c }),
    path_(limbD([P(20, -30), P(30, -14), P(34, 0)], [11 * s, 8 * s, 7 * s]), { class: c }),
    path_(`M${pt(...P(-32, -30))}C${pt(...P(-40, -50))} ${pt(...P(-20, -46))} ${pt(...P(0, -44))}C${pt(...P(18, -46))} ${pt(...P(30, -60))} ${pt(...P(36, -66))}C${pt(...P(44, -74))} ${pt(...P(60, -72))} ${pt(...P(62, -62))}L${pt(...P(58, -56))}C${pt(...P(50, -54))} ${pt(...P(44, -46))} ${pt(...P(34, -30))}C${pt(...P(20, -22))} ${pt(...P(-20, -20))} ${pt(...P(-32, -30))}Z`, { class: c }),
    path_(`M${pt(...P(-34, -34))}C${pt(...P(-46, -44))} ${pt(...P(-50, -58))} ${pt(...P(-44, -66))}`, { class: 'nf', 'stroke-width': 6 * s, 'stroke-linecap': 'round' }),
    path_(`M${pt(...P(42, -70))}C${pt(...P(40, -60))} ${pt(...P(44, -52))} ${pt(...P(48, -54))}C${pt(...P(50, -60))} ${pt(...P(48, -68))} ${pt(...P(42, -70))}Z`, { class: 'e' }),
    circle(X(52), Y(-66), 2.4 * s, { class: 'k ns' }),
    circle(X(62), Y(-61), 2.6 * s, { class: 'k ns' }),
    path_(`M${pt(...P(56, -56))}q${pt(2 * s * dir, 6 * s)} ${pt(6 * s * dir, 4 * s)}`, { class: 'r th' }),
  );
}

export function lion({ x, y, s = 1, dir = 1, c = 'o', mane = 'e', lying = false }) {
  const X = (u) => x + u * s * dir, Y = (v) => y + v * s;
  const P = (u, v) => [X(u), Y(v)];
  const parts = [];
  parts.push(path_(limbD([P(-40, -28), P(-44, -12), P(-40, 0)], [14 * s, 11 * s, 10 * s]), { class: c }));
  parts.push(path_(limbD([P(28, -28), P(32, -12), P(36, 0)], [14 * s, 11 * s, 10 * s]), { class: c }));
  parts.push(path_(`M${pt(...P(-50, -30))}C${pt(...P(-56, -54))} ${pt(...P(-30, -54))} ${pt(...P(0, -52))}C${pt(...P(30, -54))} ${pt(...P(40, -40))} ${pt(...P(40, -24))}C${pt(...P(20, -18))} ${pt(...P(-30, -16))} ${pt(...P(-50, -30))}Z`, { class: c }));
  parts.push(path_(`M${pt(...P(-50, -36))}C${pt(...P(-70, -40))} ${pt(...P(-72, -60))} ${pt(...P(-62, -66))}`, { class: 'nf', 'stroke-width': 5 * s, 'stroke-linecap': 'round' }));
  parts.push(circle(X(-63), Y(-67), 5 * s, { class: mane }));
  // melena
  const mc = P(42, -52);
  const pts = [];
  for (let i = 0; i < 18; i++) pts.push(polar(mc[0], mc[1], (i % 2 ? 26 : 32) * s, i * 20));
  parts.push(path_(smooth(pts, true), { class: mane }));
  parts.push(circle(mc[0], mc[1], 19 * s, { class: c }));
  parts.push(circle(mc[0] - 7 * s, mc[1] - 4 * s, 2.4 * s, { class: 'k ns' }), circle(mc[0] + 7 * s, mc[1] - 4 * s, 2.4 * s, { class: 'k ns' }));
  parts.push(path_(`M${pt(mc[0] - 4 * s, mc[1] + 4 * s)}L${pt(mc[0] + 4 * s, mc[1] + 4 * s)}L${pt(mc[0], mc[1] + 8 * s)}Z`, { class: 'k th' }));
  parts.push(path_(`M${pt(mc[0], mc[1] + 8 * s)}q${pt(-5 * s, 6 * s)} ${pt(-9 * s, 2 * s)}M${pt(mc[0], mc[1] + 8 * s)}q${pt(5 * s, 6 * s)} ${pt(9 * s, 2 * s)}`, { class: 'nf th' }));
  return g({}, ...parts);
}

/** Pájaro sencillo en vuelo (V curva). */
export const bird = (x, y, s = 1) => path_(`M${pt(x - 14 * s, y)}q${pt(7 * s, -8 * s)} ${pt(14 * s, 0)}q${pt(7 * s, -8 * s)} ${pt(14 * s, 0)}`, { class: 'nf th' });

/** Lobo/perro aullando (silueta sentada). */
export function howler({ x, y, s = 1, dir = 1, c = 'm' }) {
  const X = (u) => x + u * s * dir, Y = (v) => y + v * s;
  const P = (u, v) => [X(u), Y(v)];
  return path_(`M${pt(...P(-26, 0))}C${pt(...P(-30, -20))} ${pt(...P(-22, -44))} ${pt(...P(-8, -56))}L${pt(...P(-4, -72))}L${pt(...P(8, -92))}L${pt(...P(10, -84))}L${pt(...P(22, -96))}L${pt(...P(18, -78))}C${pt(...P(10, -66))} ${pt(...P(10, -50))} ${pt(...P(14, -36))}C${pt(...P(18, -20))} ${pt(...P(14, -8))} ${pt(...P(16, 0))}Z`, { class: c });
}
