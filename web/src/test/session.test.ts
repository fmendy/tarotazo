import { beforeEach, describe, expect, it } from 'vitest';
import { initialData, useSession } from '../state/session';

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
