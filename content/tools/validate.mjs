#!/usr/bin/env node
// Validador de contenido de Arcana («Tarotazo»).
// Uso:  node content/tools/validate.mjs [--strict] [--quiet]
//   --strict  los «pendiente» (ficheros que aún no existen) cuentan como error.
//   --quiet   no imprime los OK, sólo avisos y errores.
// Sale con código 1 si hay errores.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SCHEMAS = join(ROOT, 'schemas');
const BASE_LANG = 'es';
const args = new Set(process.argv.slice(2));
const STRICT = args.has('--strict');
const QUIET = args.has('--quiet');

// ---------------------------------------------------------------- informe
const counts = { ok: 0, error: 0, warn: 0, pending: 0 };
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const rel = p => relative(ROOT, p).split('\\').join('/');
const log = {
  ok: m => { counts.ok++; if (!QUIET) console.log(`  ${c(32, 'OK')}        ${m}`); },
  error: m => { counts.error++; console.log(`  ${c(31, 'ERROR')}     ${m}`); },
  warn: m => { counts.warn++; console.log(`  ${c(33, 'AVISO')}     ${m}`); },
  pending: m => {
    if (STRICT) return log.error(`(pendiente) ${m}`);
    counts.pending++; console.log(`  ${c(36, 'PENDIENTE')} ${m}`);
  },
  section: m => console.log(`\n${c(1, m)}`)
};

// ---------------------------------------------------------------- ids del contrato (§1)
const SUITS = ['bastos', 'copas', 'espadas', 'oros'];
const TAROT_RANKS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'sota', 'caballo', 'reina', 'rey'];
const SPANISH_RANKS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', 'sota', 'caballo', 'rey'];
const pad = n => String(n).padStart(2, '0');
const EXPECTED_CARDS = {
  tarot: [...Array.from({ length: 22 }, (_, i) => `mayor-${pad(i)}`), ...SUITS.flatMap(s => TAROT_RANKS.map(r => `${s}-${r}`))],
  spanish: SUITS.flatMap(s => SPANISH_RANKS.map(r => `${s}-${r}`))
};
const EXPECTED_MODELS = {
  tarot: ['rws', 'marsella', 'neon', 'acuarela', 'pixel', 'gatos'],
  spanish: ['castellana', 'catalana', 'ilustrada']
};
const EXPECTED_SPREADS = ['dia', 'ppf', 'sino', 'cruz', 'herradura', 'celta', 'amor'];
const EXPECTED_PROVINCES = [...Array.from({ length: 52 }, (_, i) => pad(i + 1)), 'XX'];
const PENDULUM_MODELS = ['cuarzo', 'amatista', 'laton', 'obsidiana', 'madera', 'camara', 'llave', 'anillo', 'chorizo'];
const REQUIRED_SLOTS = ['entrada', 'puente', 'personalizacion', 'guino', 'cambioHumor', 'sintesis', 'saludo', 'despedida', 'salud'];
const TONES = ['mistica', 'abuela', 'teletienda', 'ironica', 'dramatica', 'coach'];

// Variables permitidas (§3.2 + extras documentados en schemas/README.md)
const VARS_SERVER = ['provincia', 'comunidad', 'gentilicio', 'plato', 'fiesta', 'clima', 'signo', 'decada', 'numeroVida',
  'tema', 'carta', 'palo', 'posicion', 'cartaAnterior', 'hora', 'diaSemana', 'estacion', 'faseLunar', 'tono'];
const VARS_BROWSER = ['nombre', 'inicial', 'edad'];
const VARS = {
  default: new Set([...VARS_SERVER, ...VARS_BROWSER]),
  onboarding: new Set([...VARS_BROWSER, 'santo', 'letras', 'chascarrillo', 'provincia', 'comunidad', 'gentilicio',
    'signo', 'decada', 'numeroVida', 'hora', 'diaSemana', 'estacion', 'faseLunar']),
  pendulum: new Set([...VARS_SERVER, ...VARS_BROWSER, 'palabra', 'opcion', 'porcentaje', 'nivel']),
  none: new Set()
};

// ---------------------------------------------------------------- utilidades
function readJson(file) {
  const buf = readFileSync(file);
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) log.warn(`${rel(file)}: tiene BOM UTF-8 (el contrato pide sin BOM)`);
  const txt = buf.toString('utf8').replace(/^\uFEFF/, '');
  if (txt.includes('\uFFFD')) log.warn(`${rel(file)}: contiene caracteres no UTF-8 válidos`);
  try { return JSON.parse(txt); } catch (e) { log.error(`${rel(file)}: JSON inválido — ${e.message}`); return undefined; }
}
const isDir = p => existsSync(p) && statSync(p).isDirectory();
const listJson = dir => (isDir(dir) ? readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => join(dir, f)) : []);
const diff = (a, b) => [...a].filter(x => !new Set(b).has(x));
const short = (arr, n = 8) => (arr.length > n ? `${arr.slice(0, n).join(', ')}… (+${arr.length - n})` : arr.join(', '));

// ---------------------------------------------------------------- ajv
const ajv = new Ajv2020({ allErrors: true, strict: false, allowUnionTypes: true });
addFormats(ajv);
for (const f of listJson(SCHEMAS)) {
  const s = readJson(f);
  if (s) { try { ajv.addSchema(s); } catch (e) { log.error(`${rel(f)}: esquema inválido — ${e.message}`); } }
}
const SID = name => `https://arcana.tarotazo/schemas/${name}.schema.json`;
function validateSchema(file, data, schemaName) {
  const v = ajv.getSchema(SID(schemaName));
  if (!v) { log.error(`falta el esquema ${schemaName}.schema.json`); return false; }
  if (v(data)) return true;
  const errs = v.errors.slice(0, 15).map(e => `${e.instancePath || '/'} ${e.message}${e.params?.additionalProperty ? ` («${e.params.additionalProperty}»)` : ''}${e.params?.allowedValues ? ` [${e.params.allowedValues.join(', ')}]` : ''}`);
  log.error(`${rel(file)}: no cumple ${schemaName}.schema.json\n              - ${errs.join('\n              - ')}${v.errors.length > 15 ? `\n              … y ${v.errors.length - 15} más` : ''}`);
  return false;
}

// ---------------------------------------------------------------- mini-sintaxis
const textIssues = []; // se vuelcan al final de cada fichero
function checkText(where, s, allowed) {
  // {variable}
  let depthB = 0, altHasPipe = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '{') {
      const end = s.indexOf('}', i);
      if (end < 0) { textIssues.push(`${where}: «{» sin cerrar`); break; }
      const name = s.slice(i + 1, end);
      if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) textIssues.push(`${where}: variable mal formada «{${name}}»`);
      else if (!allowed.has(name)) textIssues.push(`${where}: variable no permitida «{${name}}»`);
      i = end; continue;
    }
    if (ch === '}') { textIssues.push(`${where}: «}» sin abrir`); continue; }
    if (ch === '[') {
      if (depthB > 0) textIssues.push(`${where}: alternativas anidadas «[…[»`);
      depthB++; altHasPipe = false; continue;
    }
    if (ch === '|') { if (depthB === 0) textIssues.push(`${where}: «|» fuera de [a|b]`); else altHasPipe = true; continue; }
    if (ch === ']') {
      if (depthB === 0) textIssues.push(`${where}: «]» sin abrir`);
      else { depthB--; if (!altHasPipe) textIssues.push(`${where}: «[…]» sin «|» (¿falta una alternativa?)`); }
      continue;
    }
  }
  if (depthB > 0) textIssues.push(`${where}: «[» sin cerrar`);
  if ((s.match(/\d[\d .-]*\d/g) || []).some(run => run.replace(/\D/g, '').length >= 9)) textIssues.push(`${where}: parece un número de teléfono (§5)`);
}
function walkTexts(node, path, allowed, skipKeys = new Set()) {
  if (typeof node === 'string') return checkText(path, node, allowed);
  if (Array.isArray(node)) return node.forEach((x, i) => walkTexts(x, `${path}[${i}]`, allowed, skipKeys));
  if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) {
    if (skipKeys.has(k)) continue;
    walkTexts(v, `${path}.${k}`, allowed, skipKeys);
  }
}
function flushText(file) {
  if (!textIssues.length) return true;
  log.error(`${rel(file)}: ${textIssues.length} problema(s) de mini-sintaxis\n              - ${textIssues.slice(0, 20).join('\n              - ')}${textIssues.length > 20 ? `\n              … y ${textIssues.length - 20} más` : ''}`);
  textIssues.length = 0;
  return false;
}

// ---------------------------------------------------------------- 1. ficheros neutros
log.section('Ficheros neutros');
const decks = {};
for (const family of ['tarot', 'spanish']) {
  const file = join(ROOT, 'decks', `${family}.json`);
  if (!existsSync(file)) { log.pending(`decks/${family}.json no existe`); continue; }
  const d = readJson(file); if (!d) continue;
  let ok = validateSchema(file, d, 'deck');
  if (d.family !== family) { log.error(`${rel(file)}: family «${d.family}» no coincide con el nombre del fichero`); ok = false; }
  const ids = (d.cards || []).map(x => x.id);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) { log.error(`${rel(file)}: ids de carta repetidos: ${short(dup)}`); ok = false; }
  const missing = diff(EXPECTED_CARDS[family], ids), extra = diff(ids, EXPECTED_CARDS[family]);
  if (missing.length) { log.error(`${rel(file)}: faltan cartas: ${short(missing)}`); ok = false; }
  if (extra.length) { log.error(`${rel(file)}: cartas que no son de la familia ${family}: ${short(extra)}`); ok = false; }
  const modelIds = (d.models || []).map(m => m.id);
  const badModels = diff(modelIds, EXPECTED_MODELS[family]);
  if (badModels.length) { log.error(`${rel(file)}: modelos que no son de ${family}: ${badModels.join(', ')}`); ok = false; }
  const missModels = diff(EXPECTED_MODELS[family], modelIds);
  if (missModels.length) log.warn(`${rel(file)}: faltan modelos del §1: ${missModels.join(', ')}`);
  if (!modelIds.includes(d.defaultModel)) { log.error(`${rel(file)}: defaultModel «${d.defaultModel}» no está en models`); ok = false; }
  for (const card of d.cards || []) {
    if (family === 'tarot' && card.only48) { log.error(`${rel(file)}: ${card.id} lleva only48 en tarot`); ok = false; }
    if (card.arcana === 'minor' && card.id !== `${card.suit}-${card.rank}`) { log.error(`${rel(file)}: ${card.id} no coincide con suit/rank`); ok = false; }
    if (card.arcana === 'major' && card.id !== `mayor-${pad(card.number)}`) { log.error(`${rel(file)}: ${card.id} no coincide con number ${card.number}`); ok = false; }
    if (family === 'spanish') {
      const should = card.rank === '08' || card.rank === '09';
      if (!!card.only48 !== should) { log.error(`${rel(file)}: ${card.id} only48 debería ser ${should}`); ok = false; }
    }
  }
  const total = ids.length, size40 = (d.cards || []).filter(x => !x.only48).length;
  for (const m of d.models || []) {
    const n = m.deckSize === 40 ? size40 : total;
    if (m.deckSize !== n) { log.error(`${rel(file)}: modelo ${m.id} deckSize ${m.deckSize} pero hay ${n} cartas`); ok = false; }
    for (const k of Object.keys(m.numerals || {})) if (!ids.includes(k)) { log.error(`${rel(file)}: numerals de ${m.id} usa carta inexistente ${k}`); ok = false; }
  }
  decks[family] = d;
  if (ok) log.ok(`${rel(file)} (${total} cartas, modelos: ${modelIds.map(id => `${id}/${d.models.find(m => m.id === id).deckSize}`).join(' ')})`);
}

let spreads = null;
{
  const file = join(ROOT, 'spreads.json');
  if (!existsSync(file)) log.pending('spreads.json no existe');
  else {
    const d = readJson(file);
    if (d) {
      let ok = validateSchema(file, d, 'spreads');
      const ids = (d.spreads || []).map(s => s.id);
      const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      if (dup.length) { log.error(`spreads.json: tiradas repetidas: ${dup.join(', ')}`); ok = false; }
      const miss = diff(EXPECTED_SPREADS, ids);
      if (miss.length) log.warn(`spreads.json: faltan tiradas del §1: ${miss.join(', ')}`);
      for (const s of d.spreads || []) {
        if (s.positions?.length !== s.size) { log.error(`spreads.json: ${s.id} size ${s.size} ≠ ${s.positions?.length} posiciones`); ok = false; }
        if (s.minSize && s.minSize > s.size) { log.error(`spreads.json: ${s.id} minSize > size`); ok = false; }
        for (const f of s.families || []) if (!decks[f] && existsSync(join(ROOT, 'decks'))) log.warn(`spreads.json: ${s.id} usa la familia ${f}, sin decks/${f}.json`);
        if (s.id === 'celta' && s.families?.includes('spanish')) { log.error('spreads.json: celta es sólo tarot (§1)'); ok = false; }
      }
      spreads = d;
      if (ok) log.ok(`spreads.json (${ids.length} tiradas)`);
    }
  }
}
const ALL_POSITIONS = new Set((spreads?.spreads || []).flatMap(s => s.positions));

let provinces = null;
{
  const file = join(ROOT, 'provinces.json');
  if (!existsSync(file)) log.pending('provinces.json no existe');
  else {
    const d = readJson(file);
    if (d) {
      let ok = validateSchema(file, d, 'provinces');
      const codes = (d.provinces || []).map(p => p.code);
      const dup = codes.filter((x, i) => codes.indexOf(x) !== i);
      if (dup.length) { log.error(`provinces.json: códigos repetidos: ${dup.join(', ')}`); ok = false; }
      const miss = diff(EXPECTED_PROVINCES, codes);
      if (miss.length) { log.error(`provinces.json: faltan códigos: ${miss.join(', ')}`); ok = false; }
      provinces = d;
      if (ok) log.ok(`provinces.json (${codes.length} entradas)`);
    }
  }
}
const PROV = new Map((provinces?.provinces || []).map(p => [p.code, p]));

// ---------------------------------------------------------------- 2. carpetas de idioma
const NON_LANG = new Set(['schemas', 'decks', 'tools', 'node_modules']);
const langs = readdirSync(ROOT).filter(n => !NON_LANG.has(n) && isDir(join(ROOT, n)) && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(n));
if (!langs.includes(BASE_LANG)) log.error(`no existe la carpeta de idioma base ${BASE_LANG}/`);
const ordered = [BASE_LANG, ...langs.filter(l => l !== BASE_LANG).sort()].filter(l => langs.includes(l));
const loaded = {}; // lang -> { key: data }

function checkWhen(file, where, when, family) {
  if (!when) return;
  if (when.cardIds) {
    const all = family ? EXPECTED_CARDS[family] : [...EXPECTED_CARDS.tarot, ...EXPECTED_CARDS.spanish];
    for (const id of when.cardIds) if (!all.includes(id)) textIssues.push(`${where}: when.cardIds «${id}» no existe`);
  }
  if (when.posicion && ALL_POSITIONS.size) for (const p of when.posicion) if (!ALL_POSITIONS.has(p)) textIssues.push(`${where}: when.posicion «${p}» no existe en spreads.json`);
  if (when.decadaMin != null && when.decadaMax != null && when.decadaMin > when.decadaMax) textIssues.push(`${where}: decadaMin > decadaMax`);
  if (when.provincia && PROV.size) for (const p of when.provincia) if (!PROV.has(p)) textIssues.push(`${where}: provincia «${p}» desconocida`);
}

for (const lang of ordered) {
  const L = join(ROOT, lang);
  const isBase = lang === BASE_LANG;
  const missing = m => (isBase ? log.pending(m) : log.warn(`${m} (se usará ${BASE_LANG})`));
  const store = (loaded[lang] = {});
  log.section(`Idioma ${lang}/`);
  const KNOWN = new Set(['cards', 'meanings', 'fragments', 'provinces', 'spreads.json', 'interactions.json', 'titles.json', 'onboarding.json', 'pendulum.json']);
  const unknown = readdirSync(L).filter(n => !KNOWN.has(n) && !n.startsWith('.'));
  if (unknown.length) log.warn(`${lang}/: entradas no reconocidas (no se validan): ${unknown.join(', ')}`);

  // cards
  for (const family of ['tarot', 'spanish']) {
    const file = join(L, 'cards', `${family}.json`);
    if (!existsSync(file)) { missing(`${lang}/cards/${family}.json no existe`); continue; }
    const d = readJson(file); if (!d) continue;
    let ok = validateSchema(file, d, 'cards-i18n');
    const exp = EXPECTED_CARDS[family];
    const keys = Object.keys(d.cards || {});
    const miss = diff(exp, keys), extra = diff(keys, exp);
    if (miss.length) { log.error(`${rel(file)}: faltan nombres de carta: ${short(miss)}`); ok = false; }
    if (extra.length) { log.error(`${rel(file)}: cartas que no existen en ${family}: ${short(extra)}`); ok = false; }
    const deckModels = decks[family]?.models.map(m => m.id) || EXPECTED_MODELS[family];
    const mm = diff(deckModels, Object.keys(d.models || {}));
    if (mm.length) { log.error(`${rel(file)}: faltan modelos: ${mm.join(', ')}`); ok = false; }
    const xm = diff(Object.keys(d.models || {}), deckModels);
    if (xm.length) { log.error(`${rel(file)}: modelos que no están en decks/${family}.json: ${xm.join(', ')}`); ok = false; }
    const ms = diff(SUITS, Object.keys(d.suits || {}));
    if (ms.length) { log.error(`${rel(file)}: faltan palos: ${ms.join(', ')}`); ok = false; }
    for (const [mid, m] of Object.entries(d.models || {})) for (const k of Object.keys(m.cardNames || {}))
      if (!exp.includes(k)) { log.error(`${rel(file)}: cardNames de ${mid} usa carta inexistente ${k}`); ok = false; }
    store[`cards/${family}`] = d;
    if (ok) log.ok(`${rel(file)}`);
  }

  // spreads
  {
    const file = join(L, 'spreads.json');
    if (!existsSync(file)) missing(`${lang}/spreads.json no existe`);
    else {
      const d = readJson(file);
      if (d) {
        let ok = validateSchema(file, d, 'spreads-i18n');
        for (const s of spreads?.spreads || []) {
          const t = d.spreads?.[s.id];
          if (!t) { log.error(`${rel(file)}: falta la tirada ${s.id}`); ok = false; continue; }
          const mp = diff(s.positions, Object.keys(t.positions || {})), xp = diff(Object.keys(t.positions || {}), s.positions);
          if (mp.length) { log.error(`${rel(file)}: ${s.id} sin etiqueta para: ${mp.join(', ')}`); ok = false; }
          if (xp.length) { log.error(`${rel(file)}: ${s.id} etiquetas sobrantes: ${xp.join(', ')}`); ok = false; }
        }
        if (spreads) {
          const xs = diff(Object.keys(d.spreads || {}), spreads.spreads.map(s => s.id));
          if (xs.length) { log.error(`${rel(file)}: tiradas que no están en spreads.json: ${xs.join(', ')}`); ok = false; }
        }
        walkTexts(d, 'spreads', VARS.none);
        ok = flushText(file) && ok;
        store.spreads = d;
        if (ok) log.ok(rel(file));
      }
    }
  }

  // meanings
  for (const family of ['tarot', 'spanish']) {
    const file = join(L, 'meanings', `${family}.json`);
    if (!existsSync(file)) { missing(`${lang}/meanings/${family}.json no existe`); continue; }
    const d = readJson(file); if (!d) continue;
    let ok = validateSchema(file, d, 'meanings');
    const keys = Object.keys(d);
    const miss = diff(EXPECTED_CARDS[family], keys), extra = diff(keys, EXPECTED_CARDS[family]);
    if (miss.length) { log.error(`${rel(file)}: faltan significados de ${miss.length} carta(s): ${short(miss)}`); ok = false; }
    if (extra.length) { log.error(`${rel(file)}: cartas que no son de ${family}: ${short(extra)}`); ok = false; }
    walkTexts(d, family, VARS.default, new Set(['keywords']));
    ok = flushText(file) && ok;
    store[`meanings/${family}`] = d;
    if (ok) log.ok(`${rel(file)} (${keys.length} cartas)`);
  }

  // fragments
  {
    const dir = join(L, 'fragments');
    const files = listJson(dir);
    if (!files.length) missing(`${lang}/fragments/*.json no existe`);
    const seen = new Map();
    const slots = new Map();
    const tonesBySlot = {};
    const all = [];
    for (const file of files) {
      const d = readJson(file); if (!d) continue;
      let ok = validateSchema(file, d, 'fragments');
      for (const [i, f] of (d.fragments || []).entries()) {
        const where = `fragments[${i}] ${f.id ?? ''}`;
        if (f.id) {
          if (seen.has(f.id)) textIssues.push(`${where}: id repetido (ya en ${seen.get(f.id)})`);
          else seen.set(f.id, basename(file));
        }
        if (f.slot) {
          slots.set(f.slot, (slots.get(f.slot) || 0) + 1);
          tonesBySlot[f.slot] ??= new Set();
          for (const t of f.tones?.length ? f.tones : TONES) tonesBySlot[f.slot].add(t);
        }
        if (typeof f.text === 'string') checkText(`${where}.text`, f.text, VARS.default);
        checkWhen(file, where, f.when);
        all.push(f);
      }
      ok = flushText(file) && ok;
      if (ok) log.ok(`${rel(file)} (${d.fragments?.length ?? 0} fragmentos)`);
    }
    if (files.length) {
      const ms = REQUIRED_SLOTS.filter(s => !slots.has(s));
      if (ms.length) (isBase ? log.pending : log.warn)(`${lang}/fragments: aún no hay fragmentos de slot: ${ms.join(', ')}`);
      if (isBase) {
        const gaps = REQUIRED_SLOTS.filter(s => slots.has(s))
          .map(slot => [slot, diff(TONES, [...tonesBySlot[slot]])])
          .filter(([, mt]) => mt.length);
        if (gaps.length) log.warn(`${lang}/fragments: slots sin cobertura de algún tono (se caerá a otro tono):\n              - ${gaps.map(([s, mt]) => `${s}: ${mt.join(', ')}`).join('\n              - ')}`);
      }
      log.ok(`${lang}/fragments: ${seen.size} ids únicos; por slot: ${REQUIRED_SLOTS.map(s => `${s}=${slots.get(s) || 0}`).join(' ')}`);
    }
    store.fragments = all;
  }

  // interactions
  {
    const file = join(L, 'interactions.json');
    if (!existsSync(file)) missing(`${lang}/interactions.json no existe`);
    else {
      const d = readJson(file);
      if (d) {
        let ok = validateSchema(file, d, 'interactions');
        const ids = (d.interactions || []).map(x => x.id);
        const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
        if (dup.length) textIssues.push(`ids repetidos: ${[...new Set(dup)].join(', ')}`);
        (d.interactions || []).forEach((x, i) => {
          checkWhen(file, `interactions[${i}] ${x.id}`, x.when);
          walkTexts({ prompt: x.prompt, branches: x.branches }, `interactions[${i}] ${x.id}`, VARS.default);
        });
        ok = flushText(file) && ok;
        store.interactions = d;
        if (ok) log.ok(`${rel(file)} (${ids.length} interacciones)`);
      }
    }
  }

  // provinces
  {
    const dir = join(L, 'provinces');
    const files = listJson(dir);
    const sheets = {};
    if (!files.length) missing(`${lang}/provinces/*.json no existe (0 de ${EXPECTED_PROVINCES.length} fichas)`);
    let okCount = 0;
    for (const file of files) {
      const code = basename(file, '.json');
      const d = readJson(file); if (!d) continue;
      let ok = validateSchema(file, d, 'province-sheet');
      if (!EXPECTED_PROVINCES.includes(code)) { log.error(`${rel(file)}: nombre de fichero no es un código de provincia`); ok = false; }
      if (d.code !== code) { log.error(`${rel(file)}: code «${d.code}» no coincide con el fichero`); ok = false; }
      const p = PROV.get(code);
      if (p && isBase && p.comunidad && d.comunidad !== p.comunidad) log.warn(`${rel(file)}: comunidad «${d.comunidad}» ≠ provinces.json «${p.comunidad}»`);
      walkTexts(d.chascarrillos, `${code}.chascarrillos`, VARS.default);
      ok = flushText(file) && ok;
      sheets[code] = d;
      if (ok) okCount++;
    }
    if (files.length) {
      if (okCount === files.length) log.ok(`${lang}/provinces/ (${okCount} fichas válidas)`);
      const codes = provinces ? provinces.provinces.map(p => p.code) : EXPECTED_PROVINCES;
      const miss = diff(codes, Object.keys(sheets));
      if (miss.length) missing(`${lang}/provinces: faltan ${miss.length} ficha(s): ${short(miss, 12)}`);
    }
    store.provinces = sheets;
  }

  // titles
  {
    const file = join(L, 'titles.json');
    if (!existsSync(file)) missing(`${lang}/titles.json no existe`);
    else {
      const d = readJson(file);
      if (d) {
        let ok = validateSchema(file, d, 'titles');
        const ids = (d.titles || []).map(x => x.id);
        const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
        if (dup.length) textIssues.push(`ids repetidos: ${[...new Set(dup)].join(', ')}`);
        walkTexts(d, 'titles', VARS.default, new Set(['id', 'frame']));
        ok = flushText(file) && ok;
        store.titles = d;
        if (ok) log.ok(`${rel(file)} (${ids.length} diplomas)`);
      }
    }
  }

  // onboarding
  {
    const file = join(L, 'onboarding.json');
    if (!existsSync(file)) missing(`${lang}/onboarding.json no existe`);
    else {
      const d = readJson(file);
      if (d) {
        let ok = validateSchema(file, d, 'onboarding');
        walkTexts(d, 'onboarding', VARS.onboarding, new Set(['santoral']));
        ok = flushText(file) && ok;
        for (const r of d?.nombre?.porLongitud || []) if (r.min > r.max) { log.error(`${rel(file)}: porLongitud min > max`); ok = false; }
        store.onboarding = d;
        if (ok) log.ok(rel(file));
      }
    }
  }

  // pendulum
  {
    const file = join(L, 'pendulum.json');
    if (!existsSync(file)) missing(`${lang}/pendulum.json no existe`);
    else {
      const d = readJson(file);
      if (d) {
        let ok = validateSchema(file, d, 'pendulum');
        walkTexts({ lines: d.lines, models: d.models, chakras: d.chakras }, 'pendulum', VARS.pendulum, new Set(['id']));
        ok = flushText(file) && ok;
        const mm = diff(PENDULUM_MODELS, Object.keys(d.models || {}));
        if (mm.length) log.warn(`${rel(file)}: péndulos sin personalidad: ${mm.join(', ')}`);
        const cids = (d.chakras || []).map(x => x.id);
        if (new Set(cids).size !== cids.length) { log.error(`${rel(file)}: chakras repetidos`); ok = false; }
        store.pendulum = d;
        if (ok) log.ok(rel(file));
      }
    }
  }
}

// ---------------------------------------------------------------- 3. paridad de claves entre idiomas
function keyPaths(node, prefix = '', out = new Set()) {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    for (const [k, v] of Object.entries(node)) { const p = prefix ? `${prefix}.${k}` : k; out.add(p); keyPaths(v, p, out); }
  }
  return out;
}
const others = ordered.filter(l => l !== BASE_LANG);
if (others.length) {
  log.section(`Paridad de claves frente a ${BASE_LANG}/`);
  const base = loaded[BASE_LANG] || {};
  for (const lang of others) {
    const cur = loaded[lang];
    let gaps = 0;
    const objectKeys = ['cards/tarot', 'cards/spanish', 'spreads', 'meanings/tarot', 'meanings/spanish', 'onboarding', 'pendulum'];
    for (const k of objectKeys) {
      if (!base[k] || !cur[k]) continue;
      const a = keyPaths(base[k]), b = keyPaths(cur[k]);
      const miss = diff(a, b);
      if (miss.length) { gaps++; log.warn(`${lang}/${k}: faltan ${miss.length} clave(s) de ${BASE_LANG}: ${short(miss, 6)}`); }
      const extra = diff(b, a);
      if (extra.length) log.warn(`${lang}/${k}: ${extra.length} clave(s) que no están en ${BASE_LANG}: ${short(extra, 6)}`);
    }
    const idSets = {
      fragments: [base.fragments?.map(f => f.id), cur.fragments?.map(f => f.id)],
      interactions: [base.interactions?.interactions.map(f => f.id), cur.interactions?.interactions.map(f => f.id)],
      titles: [base.titles?.titles.map(f => f.id), cur.titles?.titles.map(f => f.id)],
      provinces: [base.provinces && Object.keys(base.provinces), cur.provinces && Object.keys(cur.provinces)]
    };
    for (const [k, [a, b]] of Object.entries(idSets)) {
      if (!a?.length || !b) continue;
      const miss = diff(a, b);
      if (miss.length) { gaps++; log.warn(`${lang}/${k}: faltan ${miss.length} de ${a.length} ids de ${BASE_LANG} (fallback a ${BASE_LANG}): ${short(miss, 6)}`); }
    }
    if (!gaps) log.ok(`${lang}/ tiene las mismas claves que ${BASE_LANG}/`);
  }
}

// ---------------------------------------------------------------- 4. ejemplos de esquemas
log.section('Ejemplos de schemas/examples/');
for (const file of listJson(join(SCHEMAS, 'examples'))) {
  const name = basename(file, '.json').replace(/\.example$/, '');
  const d = readJson(file);
  if (d && validateSchema(file, d, name)) {
    walkTexts(d, name, VARS[name] || VARS.default, new Set(['santoral']));
    if (flushText(file)) log.ok(rel(file));
  }
}

// ---------------------------------------------------------------- resumen
console.log(`\n${c(1, 'Resumen')}: ${c(32, `${counts.ok} OK`)} · ${c(31, `${counts.error} errores`)} · ${c(33, `${counts.warn} avisos`)} · ${c(36, `${counts.pending} pendientes`)}${STRICT ? ' (modo --strict)' : ''}`);
process.exit(counts.error ? 1 : 0);
