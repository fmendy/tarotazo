// Fuentes OFL autoalojadas (Fontsource). Fuente única para tokens.css y para el texto en SVG.
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
export const FONT_DIR = path.dirname(require.resolve('@fontsource/cinzel/package.json')).replace(/cinzel$/, '');

export const FONTS = [
  { pkg: 'cinzel-decorative', family: 'Cinzel Decorative', weights: [700, 900], styles: ['normal'] },
  { pkg: 'cinzel', family: 'Cinzel', weights: [400, 700], styles: ['normal'] },
  { pkg: 'alegreya', family: 'Alegreya', weights: [400, 700], styles: ['normal', 'italic'] },
  { pkg: 'caveat', family: 'Caveat', weights: [500, 700], styles: ['normal'] },
  { pkg: 'rye', family: 'Rye', weights: [400], styles: ['normal'] },
];

export function fontFile(pkg, subset, weight, style = 'normal', ext = 'woff') {
  return path.join(FONT_DIR, pkg, 'files', `${pkg}-${subset}-${weight}-${style}.${ext}`);
}
