import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachSessionGuards, createInactivityTimer, INACTIVITY_MS } from '../state/inactivity';
import { initialData, useSession } from '../state/session';

describe('borrado por inactividad', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('son 30 minutos', () => expect(INACTIVITY_MS).toBe(30 * 60 * 1000));

  it('el temporizador se reinicia con la actividad', () => {
    const cb = vi.fn();
    const t = createInactivityTimer(1000, cb);
    vi.advanceTimersByTime(900); t.touch();
    vi.advanceTimersByTime(900);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(cb).toHaveBeenCalledTimes(1);
    t.stop();
  });

  it('borra la sesión tras 30 min sin actividad', () => {
    const s = useSession.getState();
    useSession.setState(initialData()); s.passGate('1990-07-25'); s.setName('Vanesa'); s.setProvince('28');
    const detach = attachSessionGuards(window);
    vi.advanceTimersByTime(29 * 60 * 1000);
    expect(useSession.getState().name).toBe('Vanesa');
    vi.advanceTimersByTime(2 * 60 * 1000);
    expect(useSession.getState()).toMatchObject({ name: '', province: null, birthDate: null, adult: false, screen: 'gate' });
    detach();
  });

  it('la actividad aplaza el borrado', () => {
    const s = useSession.getState();
    useSession.setState(initialData()); s.passGate(null); s.setName('Ana');
    const detach = attachSessionGuards(window);
    vi.advanceTimersByTime(20 * 60 * 1000);
    window.dispatchEvent(new KeyboardEvent('keydown'));
    vi.advanceTimersByTime(20 * 60 * 1000);
    expect(useSession.getState().name).toBe('Ana');
    vi.advanceTimersByTime(11 * 60 * 1000);
    expect(useSession.getState().name).toBe('');
    detach();
  });

  it('borra al salir de la página (pagehide)', () => {
    const s = useSession.getState();
    useSession.setState(initialData()); s.passGate(null); s.setName('Ana');
    const detach = attachSessionGuards(window);
    window.dispatchEvent(new Event('pagehide'));
    expect(useSession.getState().name).toBe('');
    detach();
  });
});
