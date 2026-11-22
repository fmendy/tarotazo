// Integración Android (lógica pura): botón atrás por estado y borrado al volver de segundo plano.
import { beforeEach, describe, expect, it } from 'vitest';
import { handleBack, isNative, onPause, onResume } from '../lib/native';
import { initialData, useSession } from '../state/session';
import { INACTIVITY_MS } from '../state/inactivity';

const st = () => useSession.getState();

describe('app Android', () => {
  beforeEach(() => { sessionStorage.clear(); useSession.setState(initialData()); });

  it('en la web no es nativa', () => expect(isNative()).toBe(false));

  it('atrás en la portada cierra la app', () => {
    expect(handleBack()).toBe('exit');
  });

  it('atrás recorre el flujo hacia la pantalla anterior', () => {
    st().passGate(null);
    st().setName('Ana');
    st().go('province');
    expect(handleBack()).toBe('handled');
    expect(st().screen).toBe('age');
    st().go('cut');
    handleBack();
    expect(st().screen).toBe('shuffle');
  });

  it('atrás desde una pantalla lateral vuelve a donde estabas', () => {
    st().passGate(null);
    st().go('spread');
    st().openSide('pendulum');
    handleBack();
    expect(st().screen).toBe('spread');
  });

  it('atrás desde «nombre» vuelve a la puerta y borra la sesión', () => {
    st().passGate(null);
    st().setName('Ana');
    handleBack();
    expect(st()).toMatchObject({ screen: 'gate', name: '', adult: false });
  });

  it('con la sesión bloqueada, atrás cierra la app', () => {
    st().block();
    expect(handleBack()).toBe('exit');
  });

  it('volver de segundo plano tras más de 30 min borra la sesión', () => {
    st().passGate(null);
    st().setName('Ana');
    onPause(1_000);
    expect(document.documentElement.classList.contains('is-paused')).toBe(true);
    onResume(1_000 + INACTIVITY_MS - 1);
    expect(st().name).toBe('Ana');
    onPause(5_000);
    onResume(5_000 + INACTIVITY_MS + 1);
    expect(st()).toMatchObject({ name: '', screen: 'gate' });
    expect(document.documentElement.classList.contains('is-paused')).toBe(false);
  });
});
