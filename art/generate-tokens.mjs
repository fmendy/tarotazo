// Copia las fuentes OFL (Fontsource) a web/public/fonts y genera web/src/styles/tokens.css
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { C } from './lib/palette.mjs';
import { FONTS, FONT_DIR } from './lib/fonts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FONTS = path.join(ROOT, 'web/public/fonts');
const OUT_CSS = path.join(ROOT, 'web/src/styles/tokens.css');
fs.mkdirSync(OUT_FONTS, { recursive: true });
fs.mkdirSync(path.dirname(OUT_CSS), { recursive: true });

// ---------- fuentes ----------
const faces = [];
for (const f of FONTS) {
  const dir = path.join(FONT_DIR, f.pkg);
  fs.mkdirSync(path.join(OUT_FONTS, f.pkg), { recursive: true });
  fs.copyFileSync(path.join(dir, 'LICENSE'), path.join(OUT_FONTS, f.pkg, 'OFL.txt'));
  for (const w of f.weights) for (const s of f.styles) {
    const css = fs.readFileSync(path.join(dir, `${w}${s === 'italic' ? '-italic' : ''}.css`), 'utf8');
    for (const subset of ['latin', 'latin-ext']) {
      const re = new RegExp(`/\\* ${f.pkg}-${subset}-${w}-${s} \\*/[\\s\\S]*?unicode-range: ([^;]+);`);
      const m = css.match(re);
      if (!m) continue;
      const file = `${f.pkg}-${subset}-${w}-${s}.woff2`;
      fs.copyFileSync(path.join(dir, 'files', file), path.join(OUT_FONTS, f.pkg, file));
      faces.push(`@font-face {\n  font-family: '${f.family}';\n  font-style: ${s};\n  font-weight: ${w};\n  font-display: swap;\n  src: url('/fonts/${f.pkg}/${file}') format('woff2');\n  unicode-range: ${m[1]};\n}`);
    }
  }
}

// ---------- contraste ----------
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const pairs = [
  ['ink', 'bg'], ['ink', 'velvet'], ['inkMuted', 'bg'], ['inkMuted', 'velvet'], ['gold', 'bg'], ['goldLight', 'velvet'],
  ['accentText', 'bg'], ['paperInk', 'paper'], ['paperInkMuted', 'paper'], ['bg', 'gold'], ['crimson', 'paper'], ['danger', 'bg'], ['ok', 'bg'],
];
const report = pairs.map(([f, b]) => ({ fg: f, bg: b, ratio: +contrast(C[f], C[b]).toFixed(2) }));

const kebab = (k) => k.replace(/([A-Z0-9])/g, (m) => '-' + m.toLowerCase()).replace(/-(\d)/g, '$1');
const colorVars = Object.entries(C).map(([k, v]) => `  --c-${kebab(k)}: ${v};`).join('\n');

const css = `/* =========================================================================
   Tarotazo · tokens de diseño (generado por art/generate-tokens.mjs — no editar a mano)
   Paleta: gabinete de vidente — terciopelo morado, dorados, velas y humo.
   Fuentes OFL autoalojadas en /fonts (licencias en /fonts/<familia>/OFL.txt).
   ========================================================================= */

${faces.join('\n\n')}

:root {
  /* ---------- color ---------- */
${colorVars}

  /* alias semánticos */
  --c-surface: var(--c-velvet);
  --c-surface-2: var(--c-velvet2);
  --c-text: var(--c-ink);
  --c-text-muted: var(--c-ink-muted);
  --c-link: var(--c-gold-light);
  --c-focus: var(--c-flame);
  --c-border: color-mix(in srgb, var(--c-gold) 55%, transparent);

  /* degradados */
  --g-velvet: radial-gradient(120% 90% at 50% 0%, ${C.velvet2} 0%, ${C.velvet} 45%, ${C.plum} 80%, ${C.bg} 100%);
  --g-gold: linear-gradient(180deg, ${C.goldLight} 0%, ${C.gold} 45%, ${C.goldDark} 100%);
  --g-candle: radial-gradient(circle, ${C.flame} 0%, ${C.candle}aa 30%, ${C.ember}33 60%, transparent 75%);
  --g-paper: linear-gradient(160deg, ${C.paper} 0%, ${C.paper2} 100%);

  /* ---------- tipografía ---------- */
  --f-display: 'Cinzel Decorative', 'Cinzel', 'Trajan Pro', Georgia, serif;
  --f-title: 'Cinzel', 'Trajan Pro', Georgia, serif;
  --f-body: 'Alegreya', 'Palatino Linotype', 'Book Antiqua', Georgia, serif;
  --f-hand: 'Caveat', 'Segoe Print', 'Comic Sans MS', cursive;
  --f-poster: 'Rye', 'Cinzel Decorative', Georgia, serif;

  --fs-xs: 0.8125rem;
  --fs-sm: 0.9375rem;
  --fs-md: 1.0625rem;
  --fs-lg: 1.375rem;
  --fs-xl: 1.875rem;
  --fs-2xl: 2.625rem;
  --fs-3xl: clamp(2.5rem, 6vw, 4.25rem);
  --lh-tight: 1.15;
  --lh-body: 1.55;
  --ls-caps: 0.08em;

  /* ---------- radios ---------- */
  --r-xs: 3px;
  --r-sm: 6px;
  --r-md: 12px;
  --r-lg: 20px;
  --r-xl: 32px;
  --r-card: 4.2%;  /* radio de carta relativo al ancho (700 → 30px) */
  --r-pill: 999px;
  --r-round: 50%;

  /* ---------- espaciado (escala 4px) ---------- */
  --s-0: 0;
  --s-1: 4px;
  --s-2: 8px;
  --s-3: 12px;
  --s-4: 16px;
  --s-5: 24px;
  --s-6: 32px;
  --s-7: 48px;
  --s-8: 64px;
  --s-9: 96px;

  /* ---------- sombras y brillos ---------- */
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.45);
  --shadow-md: 0 4px 12px rgb(8 2 14 / 0.55);
  --shadow-lg: 0 14px 40px rgb(8 2 14 / 0.7);
  --shadow-card: 0 2px 0 ${C.goldDark}, 0 10px 26px rgb(8 2 14 / 0.65);
  --shadow-inset: inset 0 2px 8px rgb(0 0 0 / 0.5);
  --shadow-text: 0 2px 6px rgb(0 0 0 / 0.65);
  --glow-gold: 0 0 6px ${C.goldLight}aa, 0 0 22px ${C.gold}88;
  --glow-candle: 0 0 10px ${C.flame}cc, 0 0 36px ${C.candle}88, 0 0 80px ${C.ember}44;
  --glow-magic: 0 0 8px ${C.accentText}aa, 0 0 30px ${C.accent}99;
  --glow-teal: 0 0 8px ${C.tealLight}aa, 0 0 28px ${C.teal}88;
  --glow-text: 0 0 12px ${C.goldLight}88;

  /* filtros SVG/CSS para hover en mapa y marcos */
  --filter-glow: drop-shadow(0 0 4px ${C.goldLight}) drop-shadow(0 0 12px ${C.gold});

  /* ---------- movimiento ---------- */
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --t-fast: 140ms;
  --t-med: 320ms;
  --t-slow: 700ms;

  /* ---------- capas ---------- */
  --z-ambience: 0;
  --z-content: 10;
  --z-overlay: 100;
  --z-modal: 1000;

  /* ---------- carta ---------- */
  --card-ratio: 7 / 12;
}

@media (prefers-reduced-motion: reduce) {
  :root { --t-fast: 0ms; --t-med: 0ms; --t-slow: 0ms; }
}
`;
fs.writeFileSync(OUT_CSS, css);
console.log(`tokens.css: ${faces.length} @font-face, ${Object.keys(C).length} colores`);
for (const r of report) console.log(`  contraste ${r.fg} / ${r.bg}: ${r.ratio}`);

