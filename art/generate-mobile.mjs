// App Android: fuentes de icono/splash para @capacitor/assets (web/resources/) y gráficos de Google Play (store/graphics/).
// node art/generate-mobile.mjs
import fs from 'node:fs';
import path from 'node:path';
import { rect, g, text, FONT } from './lib/svg.mjs';
import { C } from './lib/palette.mjs';
import { ROOT, svg, png, DEFS, motif, bg, LN, SHOT, screenshotFrame } from './lib/mobile.mjs';

const RES = path.join(ROOT, 'web/resources');
const STORE = path.join(ROOT, 'store/graphics');
fs.mkdirSync(RES, { recursive: true });
fs.mkdirSync(STORE, { recursive: true });

const sizes = {};
const put = (file, s, width) => { sizes[path.relative(ROOT, file).replace(/\\/g, '/')] = png(s, file, width); };

// ---------- @capacitor/assets ----------
// icono adaptativo: lienzo 1024 (=108 dp); zona segura ≈ 66 % central (≈ 676 px). El motivo mide ≈ 430×640 → s=0.92 ⇒ ≈ 400×590.
const CX = 512, CY = 512 + 22;
put(path.join(RES, 'icon-foreground.png'), svg(1024, 1024, DEFS, motif(CX, CY, 0.8)));
put(path.join(RES, 'icon-background.png'), svg(1024, 1024, DEFS, bg(1024, 1024)));
put(path.join(RES, 'icon-monochrome.png'), svg(1024, 1024, DEFS, motif(CX, CY, 0.8, { mono: true })));
// icono «legacy» a sangre: más grande que en el adaptativo
const iconOnly = svg(1024, 1024, DEFS, bg(1024, 1024) + motif(512, 512 + 28, 1.18));
put(path.join(RES, 'icon-only.png'), iconOnly);
// splash 2732² (motivo pequeño centrado; Android 12+ recorta a un círculo central)
put(path.join(RES, 'splash.png'), svg(2732, 2732, DEFS, bg(2732, 2732, 'url(#velvet)', 3) + motif(1366, 1366 + 30, 1.05)));
put(path.join(RES, 'splash-dark.png'), svg(2732, 2732, DEFS, bg(2732, 2732, 'url(#velvetDark)', 4) + motif(1366, 1366 + 30, 1.05)));

// ---------- Google Play ----------
put(path.join(STORE, 'icon-512.png'), iconOnly, 512);

// gráfico de funciones 1024×500: sin texto pequeño (sólo la marca)
{
  const read = (p) => fs.readFileSync(path.join(ROOT, 'web/public/art', p), 'utf8');
  const nest = (file, x, y, w, h) => {
    const s = read(file);
    const vb = s.match(/viewBox="([^"]+)"/)[1];
    const cls = (s.match(/^<svg[^>]*class="([^"]+)"/) || [])[1] || '';
    return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" overflow="visible"><g class="${cls}">${s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>.*?<\/title>/, '')}</g></svg>`;
  };
  const wp = read('wallpaper.svg').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>.*?<\/title>/, '');
  const defs = DEFS + `<pattern id="wp" width="200" height="200" patternUnits="userSpaceOnUse">${wp}</pattern>`;
  const body = [
    rect(0, 0, 1024, 500, { fill: 'url(#wp)' }), rect(0, 0, 1024, 500, { fill: 'url(#velvet)', opacity: 0.85 }),
    nest('remedios/bola.svg', 10, 40, 330, 473),
    g({ transform: 'rotate(-12 720 330)' }, nest('cards/rws/mayor-17.svg', 650, 215, 150, 257)),
    g({ transform: 'rotate(12 880 330)' }, nest('cards/castellana/oros-01.svg', 810, 205, 150, 257)),
    g({ transform: 'rotate(-1 800 300)' }, nest('cards/rws/mayor-00.svg', 725, 180, 160, 274)),
    text('Tarotazo', { f: FONT.display(), size: 118, x: 520, y: 150, maxWidth: 520, attr: { fill: C.goldLight, stroke: LN, 'stroke-width': 3 } }).svg,
  ].join('');
  put(path.join(STORE, 'feature-graphic.png'), svg(1024, 500, defs, body));
}

// plantilla de ejemplo (sin captura): hueco transparente
{
  const tpl = screenshotFrame({ headline: 'Tu titular aquí' });
  // perfora el hueco de la pantalla para usarla como capa en otros editores
  const holed = tpl.replace('</defs>', `<mask id="hole"><rect width="1080" height="1920" fill="#fff"/><rect x="${SHOT.sx}" y="${SHOT.sy}" width="${SHOT.sw}" height="${SHOT.sh}" rx="${SHOT.r}" fill="#000"/></mask></defs><g mask="url(#hole)">`).replace(/<\/svg>$/, '</g></svg>');
  fs.writeFileSync(path.join(STORE, 'screenshot-frame.svg'), holed);
  put(path.join(STORE, 'screenshot-frame.png'), holed);
}

for (const [f, n] of Object.entries(sizes)) console.log(`${f.padEnd(42)} ${(n / 1024).toFixed(0).padStart(5)} KB`);
