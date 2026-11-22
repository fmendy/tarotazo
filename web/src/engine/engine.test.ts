// Tests portados del backend Java (TextRendererTest, WhenMatcherTest, AstroTest, NarrativeEngineTest, DeckShufflerTest,
// PendulumServiceTest) sobre la misma fixture mínima de contenido.
import { describe, expect, it } from 'vitest';
import { estacion, faseLunar } from './astro';
import { cardName, ContentSet, suitName } from './content';
import { DeckShuffler, cut } from './deck';
import { DEFAULT_OPTIONS, NarrativeEngine, type NarrativeOptions, type ReadingNarrative } from './narrative';
import { PendulumEngine } from './pendulum';
import { SplittableRandom, cryptoRandom } from './random';
import { EMPTY_CTX, Situation, matches, type Ctx, type NarrativeCard } from './situation';
import { SERVER_VARIABLES, gentilicio, render, resolvable, stripUnresolvedServerVariables, type Vars } from './text';
import { FIXED_NOW, fixtureContent } from './testkit';
import type { CardDef, When } from './types';

const content = fixtureContent();
const NO_MOOD: NarrativeOptions = { moodChangeProbability: 0, guinoProbability: 1, interactionProbability: 0, maxInteractions: 3 };

// ---------------------------------------------------------------- TextRenderer

describe('TextRenderer', () => {
  const VARS: Vars = n => (n === 'provincia' ? 'Sevilla' : ['nombre', 'inicial', 'edad'].includes(n) ? '¡FILTRADO!' : undefined);

  it('alternativas: sortea todas las opciones y nada más', () => {
    const seen = new Set<string>();
    for (let s = 0; s < 300; s++) seen.add(render('Mmm… [ojo|cuidado|atención].', new SplittableRandom(s), VARS));
    expect([...seen].sort()).toEqual(['Mmm… atención.', 'Mmm… cuidado.', 'Mmm… ojo.']);
  });
  it('varios grupos y opción única', () => {
    expect(render('[a|b] y [c] y [d|e]', new SplittableRandom(1), VARS)).toMatch(/^[ab] y c y [de]$/);
  });
  it('variables de cliente intactas aunque haya valor', () => {
    expect(render('{nombre} ({inicial}, {edad}) de {provincia} elige {opcion}', new SplittableRandom(1), VARS))
      .toBe('{nombre} ({inicial}, {edad}) de Sevilla elige {opcion}');
  });
  it('desconocidas o sin valor se dejan; $ y barras no rompen', () => {
    expect(render('{inventada} y {plato}', new SplittableRandom(1), VARS)).toBe('{inventada} y {plato}');
    expect(render('Cuesta 5$ \\o/ en {provincia} $1 $&', new SplittableRandom(1), VARS)).toBe('Cuesta 5$ \\o/ en Sevilla $1 $&');
  });
  it('resolvable sólo exige variables de servidor', () => {
    expect(resolvable('{nombre} de {provincia}', SERVER_VARIABLES, VARS)).toBe(true);
    expect(resolvable('{plato}', SERVER_VARIABLES, VARS)).toBe(false);
    expect(resolvable('{desconocida}', SERVER_VARIABLES, VARS)).toBe(true);
  });
  it('quita variables de servidor sin resolver pero no las del navegador', () => {
    expect(stripUnresolvedServerVariables('Hola {nombre}, tu {carta} manda .')).toBe('Hola {nombre}, tu manda.');
    expect(stripUnresolvedServerVariables('{inventada} queda')).toBe('{inventada} queda');
  });
  it('gentilicio en masculino singular', () => {
    expect(gentilicio('sevillano/a')).toBe('sevillano');
    expect(gentilicio('alavés/a')).toBe('alavés');
    expect(gentilicio('ceutí')).toBe('ceutí');
  });
});

// ---------------------------------------------------------------- WhenMatcher

const card = (id: string, arcana: 'major' | 'minor', suit: string | undefined, court: boolean, reversed: boolean, pos: string): NarrativeCard => ({
  def: { id, arcana, number: 0, suit, rank: suit ? '01' : undefined, court, only48: false } as CardDef,
  name: id, suitName: suit ?? null, reversed, positionId: pos, positionLabel: pos, positionInline: `tu ${pos}`,
});

describe('WhenMatcher', () => {
  const TORRE = card('mayor-16', 'major', undefined, false, true, 'pasado');
  const REINA = card('copas-reina', 'minor', 'copas', true, false, 'presente');
  const AS = card('copas-01', 'minor', 'copas', false, false, 'futuro');
  const CTX: Ctx = { signo: 'leo', decada: 40, numeroVida: 7, provincia: '41', tema: 'amor', toneSeed: 1, hora: 2, diaSemana: 2, lang: 'es' };
  const M = { hora: 2, diaSemana: 2, estacion: 'otono', faseLunar: 'menguante' };
  const reading = () => new Situation('tarot', 'ppf', CTX, M, [TORRE, REINA, AS], null, -1);
  const w = (x: When) => x;

  it('sin when siempre vale', () => {
    expect(matches(null, reading())).toBe(true);
    expect(matches({}, reading().forCard(0))).toBe(true);
  });
  it('condiciones de carta actual', () => {
    const torre = reading().forCard(0), reina = reading().forCard(1);
    expect(matches(w({ cardIds: ['mayor-16'] }), torre)).toBe(true);
    expect(matches(w({ cardIds: ['mayor-16'] }), reina)).toBe(false);
    expect(matches(w({ invertida: true, arcana: 'major' }), torre)).toBe(true);
    expect(matches(w({ invertida: true }), reina)).toBe(false);
    expect(matches(w({ suit: ['copas', 'oros'] }), reina)).toBe(true);
    expect(matches(w({ posicion: ['pasado'], primeraCarta: true }), torre)).toBe(true);
    expect(matches(w({ ultimaCarta: true }), torre)).toBe(false);
    expect(matches(w({ ultimaCarta: true }), reading().forCard(2))).toBe(true);
    expect(matches(w({ primeraCarta: false }), reina)).toBe(true);
  });
  it('sin carta actual miran toda la lectura', () => {
    expect(matches(w({ cardIds: ['copas-01'] }), reading())).toBe(true);
    expect(matches(w({ posicion: ['pasado'] }), reading())).toBe(false);
  });
  it('contexto, AND y datos ausentes', () => {
    const s = reading().forCard(0);
    expect(matches(w({ tema: ['amor'], signo: ['leo'], provincia: ['41', '28'] }), s)).toBe(true);
    expect(matches(w({ tema: ['amor'], signo: ['aries'] }), s)).toBe(false);
    expect(matches(w({ decadaMin: 40, decadaMax: 50 }), s)).toBe(true);
    expect(matches(w({ decadaMin: 50 }), s)).toBe(false);
    expect(matches(w({ family: ['tarot'], spread: ['ppf'] }), s)).toBe(true);
    const empty = new Situation('tarot', 'ppf', EMPTY_CTX, M, [TORRE], null, -1).forCard(0);
    expect(matches(w({ decadaMin: 40 }), empty)).toBe(false);
    expect(matches(w({ tema: ['general'] }), empty)).toBe(true);
  });
  it('horas (cruzando medianoche), día y calendario', () => {
    const s = reading();
    expect(matches(w({ horaMin: 0, horaMax: 6 }), s)).toBe(true);
    expect(matches(w({ horaMin: 22, horaMax: 4 }), s)).toBe(true);
    expect(matches(w({ horaMin: 7, horaMax: 20 }), s)).toBe(false);
    expect(matches(w({ diaSemana: [2] }), s)).toBe(true);
    expect(matches(w({ faseLunar: ['menguante'], estacion: ['otono'] }), s)).toBe(true);
    expect(matches(w({ faseLunar: ['llena'] }), s)).toBe(false);
  });
  it('síntesis: mayores, palo dominante y figuras', () => {
    const s = reading();
    expect(s.mayores()).toBe(1);
    expect(s.suitDominante()).toBe('copas');
    expect(matches(w({ mayoresMin: 1, suitDominante: 'copas', figurasMin: 1 }), s)).toBe(true);
    expect(matches(w({ mayoresMin: 3 }), s)).toBe(false);
    expect(matches(w({ figurasMin: 2 }), s)).toBe(false);
  });
});

// ---------------------------------------------------------------- Astro

describe('Astro', () => {
  it('fases lunares conocidas', () => {
    expect(faseLunar(Date.parse('2024-04-08T18:21:00Z'))).toBe('nueva');
    expect(faseLunar(Date.parse('2024-04-23T23:49:00Z'))).toBe('llena');
    expect(faseLunar(Date.parse('2024-04-15T19:13:00Z'))).toBe('creciente');
    expect(faseLunar(Date.parse('2024-05-01T11:27:00Z'))).toBe('menguante');
  });
  it('estaciones', () => {
    expect(estacion(1, 10)).toBe('invierno');
    expect(estacion(4, 1)).toBe('primavera');
    expect(estacion(8, 15)).toBe('verano');
    expect(estacion(11, 20)).toBe('otono');
    expect(estacion(12, 25)).toBe('invierno');
  });
});

// ---------------------------------------------------------------- NarrativeEngine

function ncard(set: ContentSet, id: string, reversed: boolean, pos: string): NarrativeCard {
  const def = set.deck('tarot')!.cards.find(c => c.id === id)!;
  const names = set.lang('es').cards('tarot');
  return { def, name: cardName(names, 'rws', id), suitName: suitName(names, def.suit), reversed, positionId: pos, positionLabel: pos, positionInline: `tu ${pos}` };
}
const three = () => [ncard(content, 'copas-01', false, 'pasado'), ncard(content, 'espadas-02', false, 'presente'), ncard(content, 'copas-reina', false, 'futuro')];
const ctx = (tema: string | null, provincia: string | null, toneSeed: number): Ctx =>
  ({ signo: 'leo', decada: 30, numeroVida: 7, provincia, tema, toneSeed, hora: 23, diaSemana: 5, lang: 'es' });
const compose = (o: NarrativeOptions, cards: NarrativeCard[], c: Ctx, recent: string[], seed: number, set = content, lang = 'es') =>
  new NarrativeEngine(set, FIXED_NOW, o).compose({ lang, family: 'tarot', spread: 'ppf', cards, ctx: c, recentFragmentIds: recent, textSeed: BigInt(seed) });
const texts = (r: ReadingNarrative) => [r.intro, r.summary, r.outro, ...r.cards.flatMap(c => c.lines.map(l => l.text))].filter((t): t is string => !!t);

describe('NarrativeEngine', () => {
  it('estructura por carta y núcleo por tema', () => {
    const r = compose(NO_MOOD, three(), ctx('amor', '28', 1), [], 7);
    expect(r.cards).toHaveLength(3);
    for (const c of r.cards) expect(c.lines.map(l => l.kind)).toEqual(['entrada', 'puente', 'nucleo', 'personalizacion', 'guino']);
    expect(r.cards[0].lines[2].text).toBe('copas-01 derecha amor');
    expect(r.disclaimer).toBe('Entretenimiento, no consejo profesional.');
    expect(r.luckyNumber).toBeGreaterThanOrEqual(1);
    expect(r.luckyNumber).toBeLessThanOrEqual(99);
  });
  it('determinista con la misma semilla', () => {
    expect(compose(DEFAULT_OPTIONS, three(), ctx('amor', '28', 5), [], 99)).toEqual(compose(DEFAULT_OPTIONS, three(), ctx('amor', '28', 5), [], 99));
  });
  it('variables de cliente intactas y de servidor sustituidas', () => {
    const t = texts(compose(NO_MOOD, three(), ctx('general', '28', 1), [], 3));
    expect(t.some(x => x.includes('{nombre}'))).toBe(true);
    expect(t.filter(x => x.startsWith('Perso ')).every(x => x.includes('{nombre}, {inicial}, {edad}'))).toBe(true);
    expect(t.filter(x => x.startsWith('Puente')).every(x => x.includes('en tu ') && !x.includes('{posicion}'))).toBe(true);
    expect(t.some(x => /\[|\{posicion\}|\{provincia\}/.test(x))).toBe(false);
  });
  it('when.provincia elegido con plato sustituido', () => {
    expect(texts(compose(NO_MOOD, three(), ctx('general', '41', 1), [], 3))).toContain('Desde Sevilla (Andalucía) huele a el salmorejo.');
    expect(compose(NO_MOOD, three(), ctx('general', '28', 1), [], 3).usedFragmentIds).not.toContain('personalizacion.comun.provincia');
  });
  it('carta concreta e invertida', () => {
    const r = compose(NO_MOOD, [ncard(content, 'mayor-16', false, 'pasado'), ncard(content, 'copas-01', true, 'presente')], ctx('general', null, 1), [], 1);
    expect(r.cards[0].lines[0].text).toBe('¡La Torre! Tranquilidad: es cambio.');
    expect(r.cards[1].lines[0].text).toBe('Uy, al revés.');
    expect(r.cards[1].lines[2].text.startsWith('copas-01 invertida general')).toBe(true);
  });
  it('no repite dentro de la lectura ni los recientes', () => {
    for (let s = 0; s < 50; s++) {
      const first = compose(NO_MOOD, three(), ctx('general', null, 1), [], s);
      expect(new Set(first.usedFragmentIds).size).toBe(first.usedFragmentIds.length);
      const recent = first.usedFragmentIds.filter(id => id.startsWith('entrada.') || id.startsWith('puente.'));
      const second = compose(NO_MOOD, three(), ctx('general', null, 1), recent, s + 1000);
      for (const id of recent) expect(second.usedFragmentIds).not.toContain(id);
    }
  });
  it('si se agotan los recientes se reutilizan antes que quedarse sin texto', () => {
    const all = content.lang('es').fragmentsOf('saludo').map(f => f.id);
    expect(compose(NO_MOOD, three(), ctx('general', null, 1), all, 1).intro).toBeTruthy();
  });
  it('tema salud añade descargo', () => {
    const r = compose(NO_MOOD, three(), ctx('salud', null, 1), [], 1);
    expect(r.cards[0].lines.map(l => l.kind)).toContain('salud');
    expect(r.disclaimer).toContain('médico');
  });
  it('cambio de humor a mitad de lectura, con frase del tono nuevo', () => {
    const r = compose({ moodChangeProbability: 1, guinoProbability: 0, interactionProbability: 0, maxInteractions: 3 }, three(), ctx('general', null, 1), [], 1);
    expect(r.cards[0].tone).toBe(r.tone);
    expect(r.cards[0].lines.at(-1)!.kind).toBe('cambioHumor');
    expect(r.cards[1].tone).not.toBe(r.tone);
    expect(r.cards[2].tone).toBe(r.cards[1].tone);
    expect(r.cards[0].lines.at(-1)!.text).toContain(`(${r.cards[1].tone === 'mistica' ? 'mística' : 'abuela'})`);
  });
  it('tono inicial por toneSeed y sólo tonos con contenido', () => {
    const tones = new Set<string>();
    for (let s = 0; s < 200; s++) tones.add(compose(NO_MOOD, three(), ctx('general', null, s), [], 1).tone);
    expect([...tones].sort()).toEqual(['abuela', 'mistica']);
    expect(compose(NO_MOOD, three(), ctx('general', null, 42), [], 1).tone).toBe(compose(NO_MOOD, three(), ctx('general', null, 42), [], 2).tone);
  });
  it('síntesis con mayores y palo dominante', () => {
    const majors = [ncard(content, 'mayor-00', false, 'pasado'), ncard(content, 'mayor-01', false, 'presente'), ncard(content, 'mayor-16', false, 'futuro')];
    expect(compose(NO_MOOD, majors, ctx('general', null, 1), [], 1).summary).toBe('Muchos arcanos mayores: momento trascendente.');
    const copas = [ncard(content, 'copas-01', false, 'pasado'), ncard(content, 'copas-reina', false, 'presente'), ncard(content, 'mayor-00', false, 'futuro')];
    expect(compose(NO_MOOD, copas, ctx('general', null, 1), [], 1).summary).toBe('Las copas mandan.');
  });
  it('interacciones: como máximo 3 y sin repetir', () => {
    const set = fixtureContent();
    const many = Array.from({ length: 6 }, (_, i) => ({ id: `extra-${i}`, prompt: `¿Pregunta ${i}?`, branches: { si: 'Sí.', no: 'No.', skip: 'Vale.' } }));
    set.addFiles({ 'es/interactions.json': { interactions: many } });
    const cards = ['mayor-00', 'mayor-01', 'mayor-16', 'copas-01', 'copas-reina', 'espadas-02'].map(id => ncard(set, id, false, 'pasado'));
    const r = compose({ moodChangeProbability: 0, guinoProbability: 0, interactionProbability: 1, maxInteractions: 3 }, cards, ctx('general', null, 1), [], 1, set);
    const ids = r.cards.map(c => c.interaction?.id).filter(Boolean);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(r.cards[0].interaction!.options).toEqual(['si', 'no', 'skip']);
  });
  it('next-line: rama con variables, XX → tierras lejanas, sin provincia → la tierra', () => {
    const e = new NarrativeEngine(content, FIXED_NOW, NO_MOOD);
    expect(e.nextLine('es', 'letra-m', 'si', 'mistica', ctx('amor', '41', 1))).toBe('Lo sabía, desde Sevilla se nota.');
    expect(e.nextLine('es', 'letra-m', 'si', 'mistica', ctx('amor', 'XX', 1))).toBe('Lo sabía, desde tierras lejanas se nota.');
    expect(e.nextLine('es', 'letra-m', 'si', 'mistica', EMPTY_CTX)).toBe('Lo sabía, desde la tierra se nota.');
    expect(e.nextLine('es', 'letra-m', 'no', null, EMPTY_CTX)).toBe('Pues aparecerá, {nombre}.');
    expect(e.nextLine('es', 'no-existe', 'si', null, EMPTY_CTX)).toBeNull();
  });
  it('fallback de idioma por slot', () => {
    const r = compose(NO_MOOD, three(), ctx('general', null, 1), [], 1, content, 'ca');
    expect(r.intro).toBe('Bon dia.');
    expect(r.cards[0].lines[0].text.startsWith('Entrada ')).toBe(true);
  });
});

// ---------------------------------------------------------------- DeckShuffler

describe('DeckShuffler', () => {
  const sh = new DeckShuffler(cryptoRandom);
  const range = (n: number) => Array.from({ length: n }, (_, i) => i);

  it('barajar es una permutación y no muta', () => {
    const d = range(78);
    expect([...sh.shuffle(d)].sort((a, b) => a - b)).toEqual(d);
    expect(d).toEqual(range(78));
  });
  it('distribución uniforme de la primera carta (chi²)', () => {
    const n = 6, trials = 60_000, counts = new Array(n).fill(0);
    for (let i = 0; i < trials; i++) counts[sh.shuffle(range(n))[0]]++;
    const exp = trials / n;
    const chi2 = counts.reduce((s, c) => s + (c - exp) ** 2 / exp, 0);
    for (const c of counts) expect(Math.abs(c - exp) / exp).toBeLessThan(0.07);
    expect(chi2).toBeLessThan(20.5);
  });
  it('corte en tres montones', () => {
    const d = range(10);
    expect(cut(d, 0)).toEqual(d);
    expect(cut(d, 1)).toEqual([4, 5, 6, 0, 1, 2, 3, 7, 8, 9]);
    expect(cut(d, 2)).toEqual([7, 8, 9, 0, 1, 2, 3, 4, 5, 6]);
    expect(() => cut(d, 3)).toThrow();
  });
  it('picks distintos y orientación según probabilidad', () => {
    const fan = range(40);
    expect(sh.draw(fan, [5, 17, 39], 0).map(d => d.card)).toEqual([5, 17, 39]);
    expect(sh.draw(fan, [1, 2], 1).every(d => d.reversed)).toBe(true);
    let rev = 0;
    for (let i = 0; i < 10_000; i++) rev += sh.draw(fan, [0, 1, 2], 0.3).filter(d => d.reversed).length;
    expect(rev / 30_000).toBeGreaterThan(0.28);
    expect(rev / 30_000).toBeLessThan(0.32);
    expect(() => sh.draw(fan, [1, 1], 0.3)).toThrow();
    expect(() => sh.draw(fan, [40], 0.3)).toThrow();
  });
});

// ---------------------------------------------------------------- Péndulo

describe('PendulumEngine', () => {
  const p = new PendulumEngine(content, FIXED_NOW);
  const AFTERNOON: Ctx = { ...EMPTY_CTX, hora: 17, diaSemana: 3 };
  const ask = (mode: string, model: string | null, options: number | null, seed: number, c = AFTERNOON) =>
    p.answer({ mode, model, options, ctx: c }, 'es', new SplittableRandom(seed));
  const res = (r: { result: unknown }) => r.result as Record<string, unknown>;

  it('sino reparte sí, no y duda; el modelo sustituye las líneas generales', () => {
    const answers = new Set<unknown>();
    for (let s = 0; s < 300; s++) {
      answers.add(res(ask('sino', null, null, s)).answer);
      const r = ask('sino', 'chorizo', null, s);
      if (res(r).answer === 'si') expect(r.text).toBe('El chorizo dice que sí.');
      const g = ask('sino', 'cuarzo', null, s);
      if (res(g).answer === 'si') expect(g.text).toBe('Sí: SÍ.');
    }
    expect([...answers].sort()).toEqual(['duda', 'no', 'si']);
  });
  it('tablero, porcentaje y ouija', () => {
    for (let s = 0; s < 200; s++) {
      expect(res(ask('tablero', null, null, s)).sector).toBeLessThanOrEqual(4);
      const pc = ask('porcentaje', null, null, s);
      expect(pc.text).toBe(`Un ${res(pc).value} %.`);
      const o = ask('ouija', null, null, s);
      expect(['AMOR', 'PIZZA']).toContain(res(o).word);
    }
  });
  it('mapa nunca elige extranjero', () => {
    for (let s = 0; s < 100; s++) {
      const r = ask('mapa', null, null, s);
      expect(['28', '41']).toContain(res(r).provincia);
      expect(r.text).toMatch(/^Tus llaves están en (Madrid|Sevilla)\.$/);
    }
  });
  it('opciones deja {opcion} y exige options', () => {
    for (let s = 0; s < 50; s++) expect(ask('opciones', null, 4, s).text).toBe('Elige {opcion}.');
    expect(() => ask('opciones', null, null, 1)).toThrow(/options es obligatorio/);
  });
  it('chakras con nivel e informe', () => {
    const r = ask('chakras', null, null, 1);
    const levels = res(r).levels as { id: string; nivel: number; informe: string }[];
    expect(levels.map(l => l.id)).toEqual(['raiz', 'corona']);
    for (const l of levels) expect(l.informe.endsWith(`al ${l.nivel} %.`)).toBe(true);
  });
  it('a medianoche brilla más', () => {
    expect(ask('tablero', null, null, 1, { ...EMPTY_CTX, hora: 0, diaSemana: 3 }).text.endsWith('Es medianoche y brillo.')).toBe(true);
  });
  it('content/pendulum: provincia, XX y sin provincia; sólo claves de ritual', () => {
    const c41 = p.content_('es', '41');
    expect(c41.models.chorizo.nombre).toBe('Chorizo de Sevilla');
    expect(c41.models.chorizo.personalidad).toBe('Grasiento y sevillano');
    expect(c41.models.chorizo.lines!.enfado).toEqual(['El chorizo se enrolla.']);
    expect(c41.models.chorizo.lines!['sino.si']).toBeUndefined();
    expect(c41.lines.concentrar).toEqual(['Concéntrate, que se te nota.']);
    expect(c41.lines['sino.si']).toBeUndefined();
    expect(p.content_('es', null).models.chorizo.nombre).toBe('Chorizo de la tierra');
    expect(p.content_('es', null).models.chorizo.personalidad).toBe('Grasiento y');
    expect(p.content_('es', 'XX').models.chorizo.nombre).toBe('Chorizo de tierras lejanas');
  });
});
