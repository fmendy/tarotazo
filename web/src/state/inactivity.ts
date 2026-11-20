// Borrado de sesión por inactividad (30 min) y al salir de la página.
import { useEffect } from 'react';
import { useSession } from './session';

export const INACTIVITY_MS = 30 * 60 * 1000;
const EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

export interface InactivityTimer { touch(): void; stop(): void }

/** Temporizador reiniciable: llama a onTimeout tras `ms` sin `touch()`. */
export function createInactivityTimer(ms: number, onTimeout: () => void): InactivityTimer {
  let id: ReturnType<typeof setTimeout> | null = null;
  const arm = () => {
    if (id !== null) clearTimeout(id);
    id = setTimeout(() => { id = null; onTimeout(); }, ms);
  };
  arm();
  return {
    touch: arm,
    stop() { if (id !== null) clearTimeout(id); id = null; },
  };
}

/** Engancha el temporizador a la actividad del usuario y borra la sesión al expirar o al cerrar. */
export function attachSessionGuards(target: Window = window, ms = INACTIVITY_MS): () => void {
  const timer = createInactivityTimer(ms, () => useSession.getState().reset('gate'));
  let last = 0;
  const onActivity = () => {
    const now = Date.now();
    if (now - last < 1000) return; // no reiniciar en cada píxel
    last = now;
    timer.touch();
  };
  const onLeave = () => useSession.getState().reset('gate');
  for (const e of EVENTS) target.addEventListener(e, onActivity, { passive: true });
  target.addEventListener('pagehide', onLeave);
  return () => {
    timer.stop();
    for (const e of EVENTS) target.removeEventListener(e, onActivity);
    target.removeEventListener('pagehide', onLeave);
  };
}

export function useSessionGuards() {
  useEffect(() => attachSessionGuards(), []);
}
