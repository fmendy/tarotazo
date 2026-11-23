import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_BLOCK_MS, initialData, readBlockedFlag, useSession } from '../state/session';
import { setAppModeForTests } from '../lib/mode';

const st = () => useSession.getState();

function storageDump(): string {
  const out: string[] = [];
  for (const s of [localStorage, sessionStorage]) for (let i = 0; i < s.length; i++) { const k = s.key(i)!; out.push(k + '=' + s.getItem(k)); }
  return out.join('\n') + '\n' + document.cookie;
}

describe('store de sesión (en memoria, sin persistencia)', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); useSession.setState(initialData()); });

  it('no escribe nada en localStorage, sessionStorage ni cookies', () => {
    expect(st().passGate('1990-07-25')).toBe('ok');
    st().setName('Vanesa Secreta');
    st().setProvince('41');
    st().setDeck('tarot', 'rws');
    st().setSpread('ppf');
    st().answer('letra-m', 'si');
    const dump = storageDump();
    expect(dump).not.toContain('Vanesa');
    expect(dump).not.toContain('1990');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
  });

  it('al bloquear sólo guarda el indicador no personal arcana.blocked en sessionStorage', () => {
    st().passGate(null);
    st().setName('Vanesa');
    const y = new Date().getFullYear() - 15;
    expect(st().setBirthDate(`${y}-05-05`)).toBe('minor');
    expect(sessionStorage.length).toBe(1);
    expect(sessionStorage.key(0)).toBe('arcana.blocked');
    expect(sessionStorage.getItem('arcana.blocked')).toBe('1');
    expect(localStorage.length).toBe(0);
    expect(storageDump()).not.toContain(String(y));
    // «recarga»: el estado inicial arranca bloqueado
    expect(initialData()).toMatchObject({ blocked: true, screen: 'blocked' });
  });

  it('con la sesión bloqueada se pueden abrir los textos legales y volver', () => {
    st().block();
    st().openSide('privacy');
    expect(st().screen).toBe('privacy');
    st().back();
    expect(st().screen).toBe('blocked');
    st().go('legal');
    expect(st().screen).toBe('legal');
    st().openSide('pendulum');
    expect(st().screen).toBe('legal');
    st().back();
    expect(st().screen).toBe('blocked');
  });

  it('sólo arcana.muted (localStorage) y arcana.blocked (sessionStorage) están permitidos', () => {
    st().passGate('1990-07-25'); st().setName('Vanesa'); st().setProvince('41');
    st().reset('bye');
    st().block();
    const keys = (s: Storage) => Array.from({ length: s.length }, (_, i) => s.key(i));
    for (const k of keys(localStorage)) expect(['arcana.muted']).toContain(k);
    for (const k of keys(sessionStorage)) expect(['arcana.blocked']).toContain(k);
  });

  it('deriva signo, década y número de vida de la fecha', () => {
    st().passGate('1990-07-25');
    expect(st()).toMatchObject({ adult: true, signo: 'leo', numeroVida: 6, screen: 'name' });
    expect(st().decada! % 10).toBe(0);
  });

  it('bloquea a menores y no deja salir del bloqueo', () => {
    const y = new Date().getFullYear() - 10;
    expect(st().passGate(`${y}-01-01`)).toBe('minor');
    expect(st().screen).toBe('blocked');
    st().go('name');
    expect(st().screen).toBe('blocked');
    st().reset();
    expect(st().screen).toBe('blocked');
    expect(st().adult).toBe(false);
  });

  it('una edad < 18 dada después también corta la sesión y borra lo introducido', () => {
    st().passGate(null);
    st().setName('Ana');
    expect(st().setAgeOnly(16)).toBe('minor');
    expect(st().screen).toBe('blocked');
    expect(st().name).toBe('');
  });

  it('sin puerta +18 no se puede navegar', () => {
    st().go('reading');
    expect(st().screen).toBe('gate');
    st().openSide('pendulum');
    expect(st().screen).toBe('gate');
  });

  it('reset borra todos los datos y renueva la semilla', () => {
    st().passGate('1990-07-25');
    st().setName('Vanesa');
    st().setProvince('28');
    const seed = st().toneSeed;
    st().reset('bye');
    expect(st()).toMatchObject({ name: '', birthDate: null, age: null, province: null, signo: null, adult: false, screen: 'bye', reading: null });
    expect(st().toneSeed).not.toBe(seed);
  });

  it('el contexto no lleva nombre, edad exacta ni fecha; diaSemana ISO', () => {
    st().passGate('1990-07-25');
    st().setName('Vanesa');
    st().setProvince('41');
    const ctx = st().context(new Date(2026, 10, 22, 23), 'es'); // domingo
    const json = JSON.stringify(ctx);
    expect(json).not.toContain('Vanesa');
    expect(json).not.toContain('1990');
    expect(ctx).not.toHaveProperty('edad');
    expect(ctx).toMatchObject({ provincia: '41', signo: 'leo', hora: 23, diaSemana: 7, lang: 'es' });
    expect(st().context(new Date(2026, 10, 23, 9)).diaSemana).toBe(1); // lunes
  });

  it('guarda sólo los ids de las 3 últimas lecturas', () => {
    st().passGate(null);
    const r = (ids: string[]) => ({ usedFragmentIds: ids } as never);
    st().setReading(r(['a'])); st().setReading(r(['b'])); st().setReading(r(['c'])); st().setReading(r(['d']));
    expect(st().flatRecentIds()).toEqual(['b', 'c', 'd']);
  });
});

describe('bloqueo en la app (A-4): localStorage con marca de tiempo, 24 h', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); setAppModeForTests(true); useSession.setState(initialData()); });
  afterEach(() => { setAppModeForTests(null); localStorage.clear(); });

  it('sobrevive a «cerrar y reabrir» y sólo guarda la marca de tiempo', () => {
    useSession.getState().block();
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(1);
    expect(localStorage.key(0)).toBe('arcana.blocked');
    const v = JSON.parse(localStorage.getItem('arcana.blocked')!);
    expect(Object.keys(v)).toEqual(['t']);
    expect(initialData()).toMatchObject({ blocked: true, screen: 'blocked' });
  });

  it('caduca a las 24 h y se borra', () => {
    localStorage.setItem('arcana.blocked', JSON.stringify({ t: Date.now() - APP_BLOCK_MS - 1000 }));
    expect(readBlockedFlag()).toBe(false);
    expect(localStorage.getItem('arcana.blocked')).toBeNull();
    localStorage.setItem('arcana.blocked', JSON.stringify({ t: Date.now() - APP_BLOCK_MS + 60_000 }));
    expect(readBlockedFlag()).toBe(true);
  });

  it('atrasar el reloj no desbloquea (N-3): la marca futura se reinicia a ahora', () => {
    const now = Date.now();
    localStorage.setItem('arcana.blocked', JSON.stringify({ t: now + 3 * APP_BLOCK_MS }));
    expect(readBlockedFlag(now)).toBe(true);
    expect(JSON.parse(localStorage.getItem('arcana.blocked')!).t).toBe(now);
    expect(readBlockedFlag(now + APP_BLOCK_MS + 1)).toBe(false);
  });

  it('en la app sólo arcana.muted y arcana.blocked en localStorage; nada en sessionStorage', () => {
    useSession.getState().passGate('1990-07-25'); useSession.getState().setName('Vanesa');
    useSession.getState().block();
    localStorage.setItem('arcana.muted', '1');
    for (let i = 0; i < localStorage.length; i++) expect(['arcana.muted', 'arcana.blocked']).toContain(localStorage.key(i));
    expect(sessionStorage.length).toBe(0);
    expect(JSON.stringify({ ...localStorage })).not.toContain('Vanesa');
  });
});
