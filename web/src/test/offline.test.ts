// Modo sin conexión: con el motor local inyectado, el cliente NUNCA llama a fetch.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, setFetch, setLocalApi } from '../lib/api';
import type { ArcanaApi } from '../lib/types';
import { mockFetch } from '../lib/mock';

/** Motor de pruebas: responde con los mismos datos que el mock, pero sin pasar por fetch. */
function fakeEngine(): ArcanaApi & { calls: { name: string; args: unknown[] }[] } {
  const calls: { name: string; args: unknown[] }[] = [];
  const viaMock = async (name: string, args: unknown[], url: string, body?: unknown) => {
    calls.push({ name, args });
    const r = await mockFetch(url, body ? { method: 'POST', body: JSON.stringify(body) } : undefined);
    return r.json();
  };
  return {
    calls,
    getDecks: (l) => viaMock('getDecks', [l], '/api/v1/decks'),
    getSpreads: (l, d) => viaMock('getSpreads', [l, d], `/api/v1/spreads?deck=${d}`),
    getProvinces: (l) => viaMock('getProvinces', [l], '/api/v1/provinces'),
    getTitles: (l) => viaMock('getTitles', [l], '/api/v1/titles'),
    getOnboarding: (l) => viaMock('getOnboarding', [l], '/api/v1/content/onboarding'),
    getPendulumContent: (l, p) => viaMock('getPendulumContent', [l, p], `/api/v1/content/pendulum?provincia=${p ?? ''}`),
    createReading: (r, l) => viaMock('createReading', [r, l], '/api/v1/readings', r),
    nextLine: (r, l) => viaMock('nextLine', [r, l], '/api/v1/readings/next-line', r),
    pendulumAnswer: (r, l) => viaMock('pendulumAnswer', [r, l], '/api/v1/pendulum/answer', r),
  };
}

const ctx = { toneSeed: 1, hora: 10, diaSemana: 1, lang: 'es', signo: 'leo' as const, decada: 30, provincia: '41', tema: 'amor' as const };

describe('cliente API en modo sin conexión', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let injected: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchSpy = vi.fn(() => Promise.reject(new Error('¡red!')));
    vi.stubGlobal('fetch', fetchSpy);
    injected = vi.fn(() => Promise.reject(new Error('¡red inyectada!')));
    setFetch(injected as never);
  });
  afterEach(() => { setLocalApi(null); setFetch(null); vi.unstubAllGlobals(); });

  it('todas las operaciones van al motor local y ninguna a fetch', async () => {
    const eng = fakeEngine();
    setLocalApi(eng);
    await api.decks();
    await api.spreads('spanish');
    await api.provinces();
    await api.titles();
    await api.onboarding();
    await api.pendulumContent('41');
    const r = await api.reading({ deck: 'tarot', model: 'rws', spread: 'ppf', cutIndex: 0, picks: [1, 2, 3], context: ctx, recentFragmentIds: [] });
    expect(r.cards).toHaveLength(3);
    await api.nextLine({ interactionId: 'letra-m', answer: 'si', tone: 'mistica', context: ctx });
    await api.pendulum({ mode: 'opciones', model: 'cuarzo', options: 3, context: ctx });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(injected).not.toHaveBeenCalled();
    expect(eng.calls.map((c) => c.name)).toEqual([
      'getDecks', 'getSpreads', 'getProvinces', 'getTitles', 'getOnboarding', 'getPendulumContent',
      'createReading', 'nextLine', 'pendulumAnswer',
    ]);
  });

  it('el motor local recibe los cuerpos ya filtrados (sin datos personales)', async () => {
    const eng = fakeEngine();
    setLocalApi(eng);
    await api.reading({
      deck: 'tarot', model: 'rws', spread: 'ppf', cutIndex: 0, picks: [1, 2, 3],
      context: { ...ctx, nombre: 'Vanesa', edad: 37, pregunta: '¿…?' } as never, recentFragmentIds: [],
    });
    const sent = JSON.stringify(eng.calls[0]!.args[0]);
    expect(sent).not.toContain('Vanesa');
    expect(sent).not.toContain('37');
    expect(sent).not.toContain('pregunta');
  });

  it('el motor real (si existe) responde sin red', async () => {
    const mods = import.meta.glob<{ createLocalApi(): ArcanaApi }>('../engine/index.ts');
    const load = mods['../engine/index.ts'];
    if (!load) return; // el motor lo porta el backend en paralelo
    setLocalApi((await load()).createLocalApi());
    const decks = await api.decks();
    expect(decks.length).toBeGreaterThan(0);
    const r = await api.reading({ deck: 'tarot', model: decks[0]!.defaultModel, spread: 'ppf', cutIndex: 1, picks: [4, 8, 15], context: ctx, recentFragmentIds: [] });
    expect(r.cards).toHaveLength(3);
    await api.pendulum({ mode: 'sino', model: 'cuarzo', context: ctx });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(injected).not.toHaveBeenCalled();
  });
});
