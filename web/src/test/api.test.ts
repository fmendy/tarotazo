// Auditoría de privacidad: inspecciona el cuerpo, URL y cabeceras de TODAS las peticiones.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api, setFetch, setLangProvider } from '../lib/api';
import { mockFetch } from '../lib/mock';
import { initialData, useSession } from '../state/session';

const NAME = 'Vanesa Pérez';
const QUESTION = '¿Me dejará mi pareja por el vecino?';
const OPTIONS = ['Pizza margarita', 'Sushi del bueno', 'Tortilla con cebolla'];

interface Captured { url: string; init?: RequestInit; body: string }
let calls: Captured[] = [];

beforeEach(() => {
  calls = [];
  setLangProvider(() => 'es');
  setFetch(async (url, init) => {
    calls.push({ url, init, body: typeof init?.body === 'string' ? init.body : '' });
    return mockFetch(url, init);
  });
  const s = useSession.getState();
  useSession.setState(initialData());
  s.passGate('1987-03-14');
  s.setName(NAME);
  s.setProvince('41');
  s.setDeck('tarot', 'rws');
  s.setSpread('ppf');
  s.setTema('amor');
});
afterEach(() => setFetch(null));

function assertNoPersonalData() {
  const age = useSession.getState().age!;
  expect(calls.length).toBeGreaterThan(0);
  for (const c of calls) {
    const all = c.url + '\n' + c.body + '\n' + JSON.stringify(c.init?.headers ?? {});
    for (const bad of ['Vanesa', 'Pérez', QUESTION, 'vecino', '1987', '03-14', ...OPTIONS]) expect(all).not.toContain(bad);
    if (c.body) {
      const b = JSON.parse(c.body);
      const keys = [...Object.keys(b), ...Object.keys(b.context ?? {})];
      for (const k of ['nombre', 'name', 'edad', 'age', 'birthDate', 'pregunta', 'question', 'inicial', 'opciones']) expect(keys).not.toContain(k);
      if (b.context?.decada !== undefined) {
        expect(b.context.decada % 10).toBe(0);
        expect(b.context.decada).not.toBe(age);
      }
    }
  }
}

describe('cliente API: nunca envía datos personales', () => {
  it('POST /readings sólo lleva datos anónimos, aunque el contexto venga contaminado', async () => {
    const s = useSession.getState();
    const dirty = { ...s.context(), nombre: NAME, edad: s.age, pregunta: QUESTION, decada: s.age } as never;
    const r = await api.reading({ deck: 'tarot', model: 'rws', spread: 'ppf', cutIndex: 1, picks: [3, 9, 27], context: dirty, recentFragmentIds: [] });
    expect(r.cards).toHaveLength(3);
    assertNoPersonalData();
    const body = JSON.parse(calls[0]!.body);
    expect(Object.keys(body).sort()).toEqual(['context', 'cutIndex', 'deck', 'model', 'picks', 'recentFragmentIds', 'spread']);
    expect(body.context).toMatchObject({ signo: 'piscis', provincia: '41', tema: 'amor', lang: 'es' });
  });

  it('next-line y péndulo tampoco; al péndulo sólo va el número de opciones', async () => {
    const s = useSession.getState();
    await api.nextLine({ interactionId: 'letra-m', answer: 'si', tone: 'mistica', context: { ...s.context(), nombre: NAME } as never });
    await api.pendulum({ mode: 'opciones', model: 'cuarzo', options: OPTIONS.length, context: { ...s.context(), opciones: OPTIONS, pregunta: QUESTION } as never });
    assertNoPersonalData();
    expect(JSON.parse(calls[1]!.body).options).toBe(3);
  });

  it('los GET no llevan cuerpo ni datos; manda Accept-Language y sin credenciales', async () => {
    await api.decks();
    await api.provinces();
    await api.onboarding();
    await api.titles();
    await api.spreads('spanish');
    await api.pendulumContent('41');
    expect(calls.at(-1)!.url).toBe('/api/v1/content/pendulum?provincia=41');
    assertNoPersonalData();
    const h = calls[0]!.init!.headers as Record<string, string>;
    expect(h['Accept-Language']).toBe('es');
    expect(calls[0]!.init!.credentials).toBe('omit');
  });
});
