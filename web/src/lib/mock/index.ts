// Mock del API v1 con la forma exacta del CONTRACTS §6. Se activa con VITE_MOCK_API=1.
import type {
  NextLineRequest, PendulumRequest, PendulumResponse, ReadingCard, ReadingRequest, ReadingResponse,
} from '../types';
import { PROVINCES } from '../provinces';
import { randomInt, pick } from '../random';
import { resolveText } from '../resolve';
import {
  CHAKRAS, COLORS, DECKS, ENTRADAS, GUINOS, INTERACTIONS, NUCLEOS, ONBOARDING, OUIJA_WORDS, PERSONAL, PUENTES,
  SPREADS, TITLES, spanishCards, tarotCards,
} from './data';

const TONES = ['mistica', 'abuela', 'teletienda', 'ironica', 'dramatica', 'coach'];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
function bad(message: string) { return json({ error: 'bad_request', message }, 400); }
const p = <T,>(arr: readonly T[]) => pick(arr)!;

/** Sólo resuelve variables «de servidor»: {nombre}, {inicial}, {edad} quedan intactas. */
function srv(text: string, vars: Record<string, string>) { return resolveText(text, vars); }

function reading(req: ReadingRequest): Response {
  const deck = DECKS.find((d) => d.family === req.deck);
  const model = deck?.models.find((m) => m.id === req.model);
  const spread = SPREADS.find((s) => s.id === req.spread);
  if (!deck || !model || !spread) return bad('deck/model/spread desconocido');
  if (req.picks.length !== spread.size || new Set(req.picks).size !== req.picks.length) return bad('picks inválidos');
  if (![0, 1, 2].includes(req.cutIndex)) return bad('cutIndex inválido');
  const cards = req.deck === 'tarot' ? tarotCards() : spanishCards(model.deckSize === 48 ? 48 : 40);
  // baraja (mock: Math.random vale; el servidor real usa SecureRandom)
  const deckOrder = [...cards];
  for (let i = deckOrder.length - 1; i > 0; i--) { const j = randomInt(i + 1); [deckOrder[i], deckOrder[j]] = [deckOrder[j]!, deckOrder[i]!]; }
  let tone = TONES[req.context.toneSeed % TONES.length]!;
  let interactions = 0;
  const used: string[] = [];
  const out: ReadingCard[] = spread.positions.map((pos, i) => {
    const c = deckOrder[req.picks[i]! % deckOrder.length]!;
    const reversed = randomInt(10) < 3;
    const vars = { posicion: 'tu ' + pos.label.toLowerCase(), carta: c.name, provincia: PROVINCES.find((x) => x.code === req.context.provincia)?.nombre ?? 'tu tierra' };
    const lines = [
      { kind: 'entrada', text: p(ENTRADAS) },
      { kind: 'puente', text: srv(p(PUENTES), vars) },
      { kind: 'nucleo', text: (reversed ? '(Invertida) ' : '') + p(NUCLEOS) + (req.context.tema === 'salud' ? ' Y para eso, mejor tu médico.' : '') },
      { kind: 'personalizacion', text: p(PERSONAL) },
    ];
    if (randomInt(2) === 0) lines.push({ kind: 'guino', text: p(GUINOS) });
    if (i === 1 && randomInt(100) < 15) {
      tone = p(TONES);
      lines.push({ kind: 'cambioHumor', text: 'Perdona, me ha dado un aire. Sigo con otro tono.' });
    }
    used.push(`mock.${i}.${randomInt(1000)}`);
    let interaction = null;
    if (interactions < 3 && randomInt(100) < 35) {
      const it = p(INTERACTIONS);
      interactions++;
      interaction = { id: it.id, prompt: it.prompt, options: ['si', 'no', 'skip'] as const };
    }
    return {
      position: pos.id, cardId: c.id, name: c.name, reversed,
      image: model.imagePattern.replace('{cardId}', c.id), tone, lines,
      interaction: interaction ? { ...interaction, options: [...interaction.options] } : null,
    };
  });
  const body: ReadingResponse = {
    tone: TONES[req.context.toneSeed % TONES.length]!,
    spread: { id: spread.id, name: spread.name, layout: spread.layout, positions: spread.positions },
    intro: 'Bienvenida, {nombre}. Siéntate, que esto va para largo… bueno, para medio.',
    cards: out,
    summary: {
      text: 'En resumen: las cartas te ven con fuerza. Y con hambre, pero eso es cosa mía.',
      luckyNumber: 1 + randomInt(99),
      luckyColor: p(COLORS),
    },
    outro: 'Vuelve cuando quieras, {nombre}. La bola no cierra.',
    disclaimer: 'Entretenimiento, no consejo profesional.',
    usedFragmentIds: used,
  };
  return json(body);
}

function nextLine(req: NextLineRequest): Response {
  const it = INTERACTIONS.find((i) => i.id === req.interactionId);
  if (!it) return bad('interacción desconocida');
  return json({ text: it.branches[req.answer] });
}

function pendulum(req: PendulumRequest): Response {
  let res: PendulumResponse;
  switch (req.mode) {
    case 'sino': {
      const answer = p(['si', 'no', 'duda'] as const);
      res = { mode: 'sino', result: { answer }, text: answer === 'si' ? 'El péndulo dice que sí. Y con ganas.' : answer === 'no' ? 'Que no, que no y que no.' : 'Da vueltas… reformula, cariño.' };
      break;
    }
    case 'tablero': {
      const sector = randomInt(5);
      res = { mode: 'tablero', result: { sector }, text: ['¡SÍ rotundo!', 'Probable, probable…', 'Quizá. Ni fu ni fa.', 'Poco probable, pero no imposible.', 'NO. Y no insistas.'][sector]! };
      break;
    }
    case 'porcentaje': {
      const value = randomInt(101);
      res = { mode: 'porcentaje', result: { value }, text: `Un ${value} %. ${value > 66 ? 'Ve preparando la celebración.' : value > 33 ? 'Ni tanto ni tan calvo.' : 'Mejor ten un plan B.'}` };
      break;
    }
    case 'ouija': {
      const word = p(OUIJA_WORDS);
      res = { mode: 'ouija', result: { word }, text: `Los espíritus deletrean… ${word}. Ellos sabrán.` };
      break;
    }
    case 'mapa': {
      const prov = p(PROVINCES);
      res = { mode: 'mapa', result: { provincia: prov.code }, text: `El péndulo se para en ${prov.nombre}. Haz la maleta.` };
      break;
    }
    case 'opciones': {
      const n = req.options ?? 0;
      if (n < 2 || n > 6) return bad('options debe estar entre 2 y 6');
      res = { mode: 'opciones', result: { index: randomInt(n) }, text: 'Lo tengo clarísimo: {opcion}. No me preguntes por qué.' };
      break;
    }
    case 'chakras': {
      res = {
        mode: 'chakras',
        result: { levels: CHAKRAS.map(([id, nombre]) => ({ id: id!, nivel: randomInt(101), informe: `${nombre}: ${p(['a tope', 'en modo ahorro', 'pide una siesta', 'vibrando como un móvil', 'regulín'])}.` })) },
        text: 'Informe energético listo. Imprímelo y ponlo en la nevera.',
      };
      break;
    }
    default:
      return bad('modo desconocido');
  }
  return json(res);
}

export async function mockFetch(input: string, init?: RequestInit): Promise<Response> {
  await new Promise((r) => setTimeout(r, 150 + randomInt(250)));
  const url = new URL(input, 'http://mock.local');
  const path = url.pathname.replace(/^\/api\/v1/, '');
  const body = init?.body ? JSON.parse(String(init.body)) : undefined;
  const method = (init?.method ?? 'GET').toUpperCase();
  if (method === 'GET') {
    switch (path) {
      case '/decks': return json(DECKS);
      case '/spreads': {
        const deck = url.searchParams.get('deck');
        return json(SPREADS.filter((s) => deck !== 'spanish' || s.id !== 'celta'));
      }
      case '/provinces':
        return json(PROVINCES.map((pr) => ({ ...pr, gentilicio: `de ${pr.nombre}`, teaser: `En ${pr.nombre} hasta las palomas tienen buen fondo.` })));
      case '/content/onboarding': return json(ONBOARDING);
      case '/titles': return json({ titles: TITLES });
    }
  } else if (method === 'POST') {
    switch (path) {
      case '/readings': return reading(body);
      case '/readings/next-line': return nextLine(body);
      case '/pendulum/answer': return pendulum(body);
    }
  }
  return json({ error: 'not_found', message: path }, 404);
}
