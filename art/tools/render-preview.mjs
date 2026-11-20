// Uso: node tools/render-preview.mjs <salida.png> <ancho_celda> <cols> fichero1.svg fichero2.svg ...
// Compone una hoja de contactos (SVG anidados) y la rasteriza con resvg.
import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const [out, cellW = '200', cols = '6', ...files] = process.argv.slice(2);
const cw = +cellW;
const parsed = files.map((f) => {
  const s = fs.readFileSync(f, 'utf8');
  const vb = s.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  return { s, vb };
});
const ratio = Math.max(...parsed.map(({ vb }) => vb[3] / vb[2]));
const ch = Math.round(cw * ratio);
const nc = Math.min(+cols, files.length);
const rows = Math.ceil(files.length / nc);
const pad = 10;
let body = '';
parsed.forEach(({ s, vb }, i) => {
  const x = pad + (i % nc) * (cw + pad), y = pad + Math.floor(i / nc) * (ch + pad);
  const cls = (s.match(/^<svg[^>]*class="([^"]+)"/) || [])[1] || '';
  const inner = s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  body += `<svg x="${x}" y="${y}" width="${cw}" height="${ch}" viewBox="${vb.join(' ')}"><g class="${cls}">${inner}</g></svg>`;
});
const W = pad + nc * (cw + pad), H = pad + rows * (ch + pad);
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#6b5a73"/>${body}</svg>`;
const png = new Resvg(sheet, { fitTo: { mode: 'original' }, font: { loadSystemFonts: true } }).render().asPng();
fs.writeFileSync(out, png);
console.log(out, W + 'x' + H);
