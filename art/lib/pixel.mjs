// Modelo «pixel»: rasteriza la ilustración a baja resolución con resvg, cuantiza a la paleta del tema
// y la reconvierte en SVG de píxeles (un <path> por color con tramos horizontales).
import { Resvg } from '@resvg/resvg-js';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

export function pixelate(svg, { cols = 100, palette, title = '', overlay = '' } = {}) {
  const vb = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const W = vb[2], H = vb[3];
  const rows = Math.round((cols * H) / W);
  const cls = (svg.match(/^<svg[^>]*class="([^"]+)"/) || [])[1];
  const img = new Resvg(svg, { fitTo: { mode: 'width', value: cols }, font: { loadSystemFonts: false } }).render();
  const px = img.pixels; // RGBA
  const pal = (palette ?? []).map((h) => ({ h, c: hex(h) }));
  const nearest = (r, gg, b) => {
    let best = pal[0], bd = 1e9;
    for (const p of pal) {
      const d = (p.c[0] - r) ** 2 * 0.3 + (p.c[1] - gg) ** 2 * 0.59 + (p.c[2] - b) ** 2 * 0.11;
      if (d < bd) { bd = d; best = p; }
    }
    return best.h;
  };
  const byColor = new Map();
  const w = img.width, h = Math.min(img.height, rows);
  let open = new Map(); // clave x:n:color -> rect {x,y,n,h,c}
  const done = [];
  for (let y = 0; y < h; y++) {
    const next = new Map();
    let run = null;
    const flush = () => {
      const key = `${run.x}:${run.n}:${run.c}`;
      const prev = open.get(key);
      if (prev) { prev.h++; next.set(key, prev); open.delete(key); } else next.set(key, { x: run.x, y, n: run.n, h: 1, c: run.c });
    };
    for (let x = 0; x <= w; x++) {
      let col = null;
      if (x < w) {
        const i = (y * w + x) * 4;
        if (px[i + 3] > 127) col = nearest(px[i], px[i + 1], px[i + 2]);
      }
      if (run && col === run.c) { run.n++; continue; }
      if (run) flush();
      run = col ? { c: col, x, n: 1 } : null;
    }
    for (const r of open.values()) done.push(r);
    open = next;
  }
  for (const r of open.values()) done.push(r);
  for (const r of done) { const a = byColor.get(r.c) ?? []; a.push(`M${r.x} ${r.y}h${r.n}v${r.h}h-${r.n}z`); byColor.set(r.c, a); }
  const s = W / w;
  let body = `<g transform="scale(${+s.toFixed(4)})" shape-rendering="crispEdges">`;
  for (const [c, ds] of byColor) body += `<path fill="${c}" d="${ds.join('')}"/>`;
  body += '</g>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"${cls ? ` class="${cls}"` : ''}><title>${title}</title>${body}${overlay}</svg>`;
}
