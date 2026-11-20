// Generador de cartas: node art/generate-cards.mjs [modelo ...] [--only id1,id2]
// Modelos tarot: rws, marsella, neon, gatos, acuarela, pixel · española: castellana, catalana, ilustrada
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeSvg, text, FONT } from './lib/svg.mjs';
import { THEMES } from './lib/theme.mjs';
import { person } from './lib/figures.mjs';
import { tarotCard, spanishCard, ROMAN } from './lib/card.mjs';
import { MAJORS } from './cards/majors.mjs';
import { minorScene, MARSEILLE_PIPS } from './cards/minors.mjs';
import { spanishScene } from './cards/spanish.mjs';
import { backSvg } from './cards/backs.mjs';
import { pixelate } from './lib/pixel.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(ROOT, 'web/public/art');

const readJson = (p, fb) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8')); } catch { return fb; } };
const tarotNames = readJson('content/es/cards/tarot.json', { cards: {}, models: {} });
const spanishNames = readJson('content/es/cards/spanish.json', { cards: {}, models: {} });

const SUITS = ['bastos', 'copas', 'espadas', 'oros'];
const RANKS_T = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'sota', 'caballo', 'reina', 'rey'];
const RANKS_E = ['01', '02', '03', '04', '05', '06', '07', '08', '09', 'sota', 'caballo', 'rey'];
const NUM_ES = { '01': 'As', '02': 'Dos', '03': 'Tres', '04': 'Cuatro', '05': 'Cinco', '06': 'Seis', '07': 'Siete', '08': 'Ocho', '09': 'Nueve', '10': 'Diez', sota: 'Sota', caballo: 'Caballo', reina: 'Reina', rey: 'Rey' };
const SUIT_ES = { bastos: 'Bastos', copas: 'Copas', espadas: 'Espadas', oros: 'Oros' };

export const TAROT_IDS = [...Array.from({ length: 22 }, (_, i) => `mayor-${String(i).padStart(2, '0')}`), ...SUITS.flatMap((s) => RANKS_T.map((r) => `${s}-${r}`))];
export const SPANISH_IDS = SUITS.flatMap((s) => RANKS_E.map((r) => `${s}-${r}`));

export const TAROT_MODELS = ['rws', 'marsella', 'neon', 'gatos', 'acuarela', 'pixel'];
export const SPANISH_MODELS = ['castellana', 'catalana', 'ilustrada'];

function ctxFor(T, id) {
  return { T, id, cats: !!T.cats, person: (o) => person({ ...o, cat: !!T.cats, fur: o.fur ?? catFur(id, o) }) };
}
// pelaje de gato por carta (estable)
const FURS = ['o', 'hk', 'w', 'hg', 'e', 'hb'];
let furI = 0;
function catFur(id, o) { return FURS[(id.length * 7 + (furI++)) % FURS.length]; }

const pixelPalette = (T) => [...new Set([...Object.values(T.fills), T.line, T.paper, T.frame, T.paperEdge, T.accent])];

function tarotName(model, id) {
  return tarotNames.models?.[model]?.cardNames?.[id] ?? tarotNames.cards?.[id] ?? (id.startsWith('mayor') ? id : `${NUM_ES[id.split('-')[1]]} de ${SUIT_ES[id.split('-')[0]]}`);
}

export function buildTarot(model, only) {
  const base = THEMES[model === 'pixel' ? 'pixel' : model];
  const T = { ...base, layout: model === 'marsella' ? 'marsella' : model === 'neon' ? 'neon' : 'rws' };
  let bytes = 0, n = 0;
  for (const id of TAROT_IDS) {
    if (only && !only.includes(id)) continue;
    furI = 0;
    const c = ctxFor(T, id);
    let numeral = null, scene;
    if (id.startsWith('mayor')) {
      const num = +id.slice(6);
      numeral = ROMAN[num];
      if (model === 'marsella') numeral = num === 8 ? 'XI' : num === 11 ? 'VIII' : num === 0 ? null : numeral;
      scene = MAJORS[id](c);
    } else {
      const [suit, rank] = id.split('-');
      if (/^\d+$/.test(rank) && model !== 'marsella') numeral = ROMAN[+rank] === 'I' ? null : ROMAN[+rank];
      if (/^\d+$/.test(rank) && model === 'marsella') { numeral = ROMAN[+rank]; scene = MARSEILLE_PIPS(c, suit, +rank); }
      else scene = minorScene(c, suit, rank);
    }
    const name = model === 'marsella' && /-\d\d$/.test(id) && !id.startsWith('mayor') ? null : tarotName(model, id);
    const title = `${tarotName(model, id)} · ${tarotNames.models?.[model]?.name ?? model}`;
    let svg;
    if (model === 'pixel') {
      const raw = tarotCard({ T, title, numeral: null, name: null, scene });
      const lab = (str, y, size) => text(str, { f: FONT.poster(), size, x: 350, y, maxWidth: 580, attr: { fill: T.label } }).svg;
      const overlay = (numeral ? lab(numeral, 104, 60) : '') + (name ? lab(name, 1122, 58) : '');
      svg = pixelate(raw, { title, cols: 90, palette: pixelPalette(T), overlay });
    } else svg = tarotCard({ T, title, numeral, name, scene });
    bytes += writeSvg(path.join(OUT, 'cards', model, `${id}.svg`), svg);
    n++;
  }
  fs.mkdirSync(path.join(OUT, 'backs'), { recursive: true });
  if (!only) bytes += writeSvg(path.join(OUT, 'backs', `${model}.svg`), model === 'pixel' ? pixelate(backSvg(model), { title: 'Reverso · pixel', cols: 70, palette: ['#2a1e3e', '#3a2a5a', '#f7d26a', '#e0433a', '#1b1028'] }) : backSvg(model));
  return { n, bytes };
}

export function buildSpanish(model, only) {
  const T = THEMES[model];
  let bytes = 0, n = 0;
  for (const id of SPANISH_IDS) {
    if (only && !only.includes(id)) continue;
    furI = 0;
    const [suit, rank] = id.split('-');
    const c = ctxFor(T, id);
    const index = { sota: '10', caballo: '11', rey: '12' }[rank] ?? String(+rank);
    const scene = spanishScene(c, suit, rank, model);
    const name = spanishNames.cards?.[id] ?? `${NUM_ES[rank]} de ${SUIT_ES[suit]}`;
    const svg = spanishCard({ T, title: `${name} · ${spanishNames.models?.[model]?.name ?? model}`, index, suit, scene });
    bytes += writeSvg(path.join(OUT, 'cards', model, `${id}.svg`), svg);
    n++;
  }
  if (!only) bytes += writeSvg(path.join(OUT, 'backs', `${model}.svg`), backSvg(model));
  return { n, bytes };
}

// ---- CLI ----
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const oi = args.indexOf('--only');
  const only = oi >= 0 ? args[oi + 1].split(',') : null;
  const models = args.filter((a, i) => !a.startsWith('--') && (oi < 0 || i !== oi + 1));
  const list = models.length ? models : [...TAROT_MODELS, ...SPANISH_MODELS];
  const manifestPath = path.join(OUT, 'cards', 'manifest.json');
  const manifest = readJson(path.relative(ROOT, manifestPath), {});
  for (const m of list) {
    const t0 = Date.now();
    const r = TAROT_MODELS.includes(m) ? buildTarot(m, only) : buildSpanish(m, only);
    console.log(`${m}: ${r.n} cartas, ${(r.bytes / 1024).toFixed(0)} KB (${Date.now() - t0} ms)`);
    if (!only) manifest[m] = r.n === (TAROT_MODELS.includes(m) ? 78 : 48);
  }
  if (!only) {
    const order = [...TAROT_MODELS, ...SPANISH_MODELS];
    const sorted = Object.fromEntries(order.map((k) => [k, !!manifest[k]]));
    fs.writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + '\n');
  }
}
