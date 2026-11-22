// Enmarca capturas de teléfono para Google Play: fondo de terciopelo, titular corto y marco de móvil.
// Uso: node art/tools/frame-screenshots.mjs [--in store/screenshots/raw] [--out store/screenshots]
// Titulares: store/screenshots/raw/captions.json → { "01-portada.png": "Tu vidente de bolsillo", … }
// (si falta, se usan los titulares por defecto en orden alfabético de fichero). Salida: PNG 1080×1920.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, png, screenshotFrame } from '../lib/mobile.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? path.resolve(process.argv[i + 1]) : d; };
const IN = arg('--in', path.join(ROOT, 'store/screenshots/raw'));
const OUT = arg('--out', path.join(ROOT, 'store/screenshots'));
const DEFAULTS = [
  'Tu vidente de bolsillo',
  'Baraja, corta y elige',
  'Lecturas que no se repiten',
  'El péndulo que lo sabe todo',
  'Diplomas de dudosa validez',
  'Sin datos, sin conexión',
  'Tarot y baraja española',
  'Pregunta. Oscila. Ríe.',
];

const pngSize = (buf) => ({ w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) });

if (!fs.existsSync(IN)) { console.error(`No existe ${IN}: deja ahí las capturas en PNG.`); process.exit(1); }
const files = fs.readdirSync(IN).filter((f) => /\.png$/i.test(f)).sort();
let captions = {};
try { captions = JSON.parse(fs.readFileSync(path.join(IN, 'captions.json'), 'utf8')); } catch {}
fs.mkdirSync(OUT, { recursive: true });
files.forEach((f, i) => {
  const buf = fs.readFileSync(path.join(IN, f));
  const { w, h } = pngSize(buf);
  const headline = captions[f] ?? DEFAULTS[i % DEFAULTS.length];
  const out = path.join(OUT, f.replace(/\.png$/i, '') + '.png');
  const n = png(screenshotFrame({ headline, image: buf, imgW: w, imgH: h }), out);
  console.log(`${f} (${w}×${h}) → ${path.relative(ROOT, out)} · «${headline}» · ${(n / 1024).toFixed(0)} KB`);
});
