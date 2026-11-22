// Optimiza en sitio los SVG de web/public/art con SVGO (sin cambiar rutas, ids ni clases).
// Uso: node art/optimize.mjs [subcarpeta…]   (por defecto: todo web/public/art)
// Informa del antes/después por carpeta. Es idempotente.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimize } from 'svgo';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = path.join(ROOT, 'web/public/art');

const config = (file) => ({
  path: file,
  multipass: true,
  floatPrecision: 1,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,          // ids estables (mapa, cofres, diploma, clips)
          inlineStyles: false,        // el CSS acotado por modelo se queda en <style>
          minifyStyles: { restructure: false },
          removeUnknownsAndDefaults: { keepDataAttrs: true, keepRoleAttr: true, keepAriaAttrs: true },
          convertPathData: { floatPrecision: 1, transformPrecision: 3 },
          mergePaths: false,          // no fusiona trazos (mantiene clases por pieza)
          collapseGroups: true,
        },
      },
    },
  ],
});

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : d.name.endsWith('.svg') ? [path.join(dir, d.name)] : []));
}

const targets = process.argv.slice(2);
const dirs = targets.length ? targets.map((t) => path.join(BASE, t)) : [BASE];
const report = new Map();
for (const dir of dirs) {
  for (const f of walk(dir)) {
    // el mapa lleva estilos/atributos de interacción hechos a mano: se deja tal cual
    if (f.includes(`${path.sep}map${path.sep}`)) continue;
    const src = fs.readFileSync(f, 'utf8');
    let out;
    try { out = optimize(src, config(f)).data; } catch (e) { console.warn('SVGO falló en', f, e.message); continue; }
    const key = path.relative(BASE, path.dirname(f)).replace(/\\/g, '/') || '.';
    const r = report.get(key) ?? { n: 0, before: 0, after: 0 };
    r.n++; r.before += src.length;
    if (out.length < src.length) { fs.writeFileSync(f, out); r.after += out.length; } else r.after += src.length;
    report.set(key, r);
  }
}
let tb = 0, ta = 0;
for (const [k, r] of [...report].sort()) {
  tb += r.before; ta += r.after;
  console.log(`${k.padEnd(18)} ${String(r.n).padStart(3)} ficheros  ${(r.before / 1024).toFixed(0).padStart(6)} KB → ${(r.after / 1024).toFixed(0).padStart(6)} KB  (${(100 - (100 * r.after) / r.before).toFixed(1)} %)`);
}
console.log(`TOTAL ${(tb / 1024).toFixed(0)} KB → ${(ta / 1024).toFixed(0)} KB (${(100 - (100 * ta) / tb).toFixed(1)} %)`);
