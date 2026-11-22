// createLocalApi sobre el contenido REAL empaquetado (content/): formas idénticas a las respuestas reales del API Java
// (__fixtures__/api/*.json, capturadas del jar), errores, idiomas, prueba masiva y rendimiento.
import { describe, expect, it } from 'vitest';
import { EngineError, createLocalApi } from './index';
import { SERVER_VARIABLES } from './text';
import { TONE_WEIGHTS } from './narrative';
import type { ReadingRequest } from './types';

const fx = import.meta.glob('./__fixtures__/api/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const J = (name: string) => fx[`./__fixtures__/api/${name}.json`];

const api = createLocalApi();

/** Mismas claves en cada objeto y mismos tipos (null del lado Java = campo anulable: se acepta cualquier valor). */
function sameShape(ts: unknown, java: unknown, path = '$'): void {
  if (java === null || ts === null) return;
  const kind = (v: unknown) => (Array.isArray(v) ? 'array' : typeof v);
  expect(kind(ts), `${path}: tipo`).toBe(kind(java));
  if (Array.isArray(java) && Array.isArray(ts)) {
    if (ts.length === java.length) {
      ts.forEach((x, i) => sameShape(x, java[i], `${path}[${i}]`));
    } else {
      // longitudes distintas (p. ej. líneas de una lectura aleatoria): cada elemento contra el primero no nulo
      const ref = java.find(x => x !== null);
      if (ref !== undefined) ts.forEach((x, i) => sameShape(x, ref, `${path}[${i}]`));
    }
    return;
  }
  if (typeof java === 'object' && typeof ts === 'object') {
    const jo = java as Record<string, unknown>, to = ts as Record<string, unknown>;
    expect(Object.keys(to).sort(), `${path}: claves`).toEqual(Object.keys(jo).sort());
    for (const k of Object.keys(jo)) sameShape(to[k], jo[k], `${path}.${k}`);
  }
}

const READING: ReadingRequest = {
  deck: 'tarot', model: 'rws', spread: 'herradura', cutIndex: 1, picks: [1, 2, 3, 4, 5, 6, 7],
  context: { signo: 'leo', decada: 30, provincia: '41', tema: 'amor', toneSeed: 3, hora: 23, diaSemana: 5, lang: 'es' },
  recentFragmentIds: [],
};

describe('formas idénticas al API Java (respuestas reales del jar)', () => {
  it('GET de catálogo', async () => {
    sameShape(await api.getDecks('es'), J('decks'));
    sameShape(await api.getSpreads('es', 'tarot'), J('spreads'));
    sameShape(await api.getProvinces('es'), J('provinces'));
    sameShape(await api.getPendulumContent('es', '41'), J('content-pendulum'));
    expect(await api.getPendulumContent('es', '41')).toEqual(J('content-pendulum'));
    const titles = await api.getTitles('es');
    sameShape(titles, J('titles'));
    expect(titles.titles.slice(0, 2)).toEqual((J('titles') as { titles: unknown[] }).titles);
    expect(await api.getDecks('es')).toEqual(J('decks'));
    expect(await api.getSpreads('es', 'tarot')).toEqual(J('spreads'));
    const prov = await api.getProvinces('es');
    expect(prov.map(p => ({ ...p, teaser: null }))).toEqual((J('provinces') as object[]).map(p => ({ ...p, teaser: null })));
  });

  it('POST /readings, next-line y péndulo', async () => {
    let withInteraction = null;
    for (let i = 0; i < 40 && !withInteraction; i++) {
      const r = await api.createReading(READING, 'es');
      if (r.cards.some(c => c.interaction)) withInteraction = r;
    }
    expect(withInteraction).not.toBeNull();
    sameShape(withInteraction, J('reading'));
    const id = withInteraction!.cards.find(c => c.interaction)!.interaction!.id;
    sameShape(await api.nextLine({ interactionId: id, answer: 'si', tone: 'mistica', context: READING.context }, 'es'), J('next-line'));
    for (const mode of ['sino', 'tablero', 'porcentaje', 'ouija', 'mapa', 'opciones', 'chakras'] as const) {
      const r = await api.pendulumAnswer({ mode, model: 'cuarzo', options: 3, context: { toneSeed: 1, hora: 12, diaSemana: 3, lang: 'es' } }, 'es');
      sameShape(r, J(`pendulum-${mode}`));
    }
  });

  it('errores tipados con el mismo mensaje que el 400 del API', async () => {
    const bad = { deck: 'tarot', spread: 'ppf', cutIndex: 5, picks: [1, 1] } as unknown as ReadingRequest;
    const err = await api.createReading(bad, 'es').catch(e => e);
    expect(err).toBeInstanceOf(EngineError);
    expect(err.status).toBe(400);
    expect(err.toJSON()).toEqual(J('error-400'));
  });
});

describe('validación equivalente (400) y 503', () => {
  const base = { deck: 'tarot', spread: 'ppf', cutIndex: 0, picks: [0, 1, 2] };
  const cases: [Record<string, unknown>, string][] = [
    [{ ...base, cutIndex: 3 }, 'cutIndex: cutIndex debe ser 0, 1 o 2'],
    [{ ...base, picks: [0, 1] }, "La tirada 'ppf' necesita 3 picks"],
    [{ ...base, picks: [0, 1, 1] }, 'picks deben ser distintos'],
    [{ ...base, picks: [0, 1, 78] }, 'pick fuera de rango: 78 (el abanico tiene 78 cartas, índices 0..77)'],
    [{ ...base, picks: [0, 1, -1] }, 'picks[2]: pick negativo'],
    [{ ...base, deck: 'uno' }, 'deck: deck debe ser tarot o spanish'],
    [{ ...base, model: 'castellana' }, "El modelo 'castellana' no es de la baraja tarot"],
    [{ ...base, deck: 'spanish', spread: 'celta' }, "La tirada 'celta' no está disponible para la baraja spanish"],
    [{ ...base, spread: 'nada' }, "Tirada desconocida: 'nada'"],
    [{ deck: 'tarot', spread: 'ppf', cutIndex: 0 }, 'picks: picks es obligatorio'],
    [{ ...base, context: { provincia: '99' } }, 'context.provincia: provincia debe ser un código INE "01"…"52" o "XX"'],
    [{ ...base, context: { diaSemana: 0 } }, 'context.diaSemana: diaSemana debe ser 1 (lunes) … 7 (domingo)'],
    [{ ...base, cutIndex: 'dos' }, 'JSON mal formado o con tipos incorrectos'],
  ];
  it.each(cases)('%j → %s', async (req, msg) => {
    const e = await api.createReading(req as unknown as ReadingRequest, 'es').catch(x => x);
    expect(e).toBeInstanceOf(EngineError);
    expect(e.code).toBe('bad_request');
    expect(e.message).toBe(msg);
  });
  it('next-line, péndulo y GET', async () => {
    const ctx = { toneSeed: 1, hora: 1, diaSemana: 1, lang: 'es' };
    await expect(api.nextLine({ interactionId: 'no-existe', answer: 'si', tone: 'mistica', context: ctx }, 'es')).rejects.toThrow("Interacción desconocida: 'no-existe'");
    await expect(api.nextLine({ interactionId: 'x', answer: 'quizas' as never, tone: 'mistica', context: ctx }, 'es')).rejects.toThrow('answer: answer debe ser si, no o skip');
    await expect(api.pendulumAnswer({ mode: 'opciones', model: 'cuarzo', context: ctx }, 'es')).rejects.toThrow('options es obligatorio en modo opciones (2–6)');
    await expect(api.pendulumAnswer({ mode: 'opciones', model: 'cuarzo', options: 9, context: ctx }, 'es')).rejects.toThrow('options: options debe estar entre 2 y 6');
    await expect(api.pendulumAnswer({ mode: 'bailar' as never, model: 'cuarzo', context: ctx }, 'es')).rejects.toThrow('mode: mode desconocido');
    await expect(api.pendulumAnswer({ mode: 'sino', model: 'tostadora', context: ctx }, 'es')).rejects.toThrow('model: model desconocido');
    await expect(api.getSpreads('es', 'uno')).rejects.toThrow('deck debe ser tarot o spanish');
    await expect(api.getPendulumContent('es', '77')).rejects.toThrow(/código INE/);
  });
});

describe('idiomas y {provincia}', () => {
  it('idioma desconocido o con región cae a es', async () => {
    expect(await api.getSpreads('de', 'tarot')).toEqual(await api.getSpreads('es', 'tarot'));
    expect(await api.getSpreads('es-ES', 'tarot')).toEqual(await api.getSpreads('es', 'tarot'));
  });
  it('content/pendulum sin provincia → «la tierra», XX → «tierras lejanas», sin plantillas', async () => {
    const none = await api.getPendulumContent('es');
    const xx = await api.getPendulumContent('es', 'XX');
    expect(JSON.stringify(none)).not.toMatch(/\{(provincia|comunidad|gentilicio)\}/);
    expect(none.models.chorizo.nombre).toContain('la tierra');
    expect(xx.models.chorizo.nombre).toContain('tierras lejanas');
  });
});

describe('prueba masiva: 200 lecturas en todas las tiradas y barajas', () => {
  it('sin variables de servidor ni [a|b], sin fragmentos repetidos, tonos ≈ pesos del §1', async () => {
    const decks = await api.getDecks('es');
    const spreadsBy: Record<string, { id: string; size: number; minSize: number | null }[]> = {};
    for (const d of decks) spreadsBy[d.family] = await api.getSpreads('es', d.family);
    const tones = new Map<string, number>();
    const serverVar = new RegExp(`\\{(${[...SERVER_VARIABLES].join('|')})\\}`);
    let seenSpreads = new Set<string>();
    let moods = 0;
    const N = 200;
    for (let i = 0; i < N; i++) {
      const deck = decks[i % decks.length];
      const sp = spreadsBy[deck.family][Math.floor(i / decks.length) % spreadsBy[deck.family].length];
      seenSpreads.add(`${deck.family}/${sp.id}`);
      const model = deck.models[i % deck.models.length];
      const n = sp.minSize ? sp.minSize + (i % (sp.size - sp.minSize + 1)) : sp.size;
      const picks = [...Array(model.deckSize).keys()].sort(() => Math.random() - 0.5).slice(0, n);
      const r = await api.createReading({
        deck: deck.family, model: model.id, spread: sp.id, cutIndex: (i % 3) as 0 | 1 | 2, picks,
        context: {
          signo: (['leo', 'geminis', 'cancer', 'escorpio'] as const)[i % 4], decada: 20 + (i % 5) * 10, numeroVida: 7,
          provincia: [undefined, '41', '28', 'XX', '51'][i % 5], tema: (['general', 'amor', 'trabajo', 'dinero', 'salud'] as const)[i % 5],
          toneSeed: Math.floor(Math.random() * 2 ** 40), hora: i % 24, diaSemana: 1 + (i % 7), lang: 'es',
        },
        recentFragmentIds: [],
      }, 'es');
      expect(r.cards).toHaveLength(n);
      tones.set(r.tone, (tones.get(r.tone) ?? 0) + 1);
      if (new Set(r.cards.map(c => c.tone)).size > 1) moods++;
      expect(new Set(r.usedFragmentIds).size).toBe(r.usedFragmentIds.length);
      const all = [r.intro, r.outro, r.summary.text, ...r.cards.flatMap(c => [...c.lines.map(l => l.text), c.interaction?.prompt ?? ''])];
      for (const t of all) {
        expect(t, t).not.toMatch(serverVar);
        expect(t, t).not.toMatch(/\[[^\]]*\|/);
      }
      if (i % 5 === 4) expect(r.cards[0].lines.some(l => l.kind === 'salud')).toBe(true);
      expect(r.cards.every(c => c.image.startsWith(`/art/cards/`))).toBe(true);
    }
    expect(seenSpreads.size).toBe(Object.values(spreadsBy).reduce((s, l) => s + l.length, 0));
    const total = TONE_WEIGHTS.reduce((s, [, w]) => s + w, 0);
    for (const [tone, w] of TONE_WEIGHTS) {
      const p = w / total, exp = N * p, sd = Math.sqrt(N * p * (1 - p));
      expect(Math.abs((tones.get(tone) ?? 0) - exp), `${tone}: ${tones.get(tone)} vs ${exp}`).toBeLessThan(4 * sd);
    }
    expect(moods).toBeGreaterThan(5);
  });
});

describe('rendimiento', () => {
  it('una lectura de 10 cartas tarda bastante menos de 10 ms en Node (objetivo < 30 ms en móvil medio)', async () => {
    const req: ReadingRequest = {
      deck: 'tarot', model: 'rws', spread: 'celta', cutIndex: 0, picks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      context: { provincia: '41', tema: 'amor', signo: 'leo', decada: 30, toneSeed: 1, hora: 12, diaSemana: 3, lang: 'es' },
      recentFragmentIds: [],
    };
    for (let i = 0; i < 20; i++) await api.createReading(req, 'es'); // calentamiento
    const runs = 200;
    const t0 = performance.now();
    for (let i = 0; i < runs; i++) await api.createReading(req, 'es');
    const ms = (performance.now() - t0) / runs;
    console.info(`[engine] lectura celta (10 cartas): ${ms.toFixed(2)} ms/lectura en Node`);
    expect(ms).toBeLessThan(10);
  });
});
