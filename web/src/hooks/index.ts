import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

const RM = '(prefers-reduced-motion: reduce)';
function subRM(cb: () => void) {
  const q = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(RM) : null;
  q?.addEventListener?.('change', cb);
  return () => q?.removeEventListener?.('change', cb);
}
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subRM,
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(RM).matches : false),
    () => false,
  );
}

export interface AsyncState<T> { data: T | null; error: unknown; loading: boolean; reload(): void }

/** Ejecuta una promesa al montar (o al cambiar deps) con estado de carga/error. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<{ data: T | null; error: unknown; loading: boolean }>({ data: null, error: null, loading: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn().then(
      (data) => alive && setState({ data, error: null, loading: false }),
      (error) => alive && setState({ data: null, error, loading: false }),
    );
    return () => { alive = false; };
  }, [...deps, n]); // eslint-disable-line react-hooks/exhaustive-deps
  const reload = useCallback(() => setN((x) => x + 1), []);
  return { ...state, reload };
}

/** Valor con retardo (para reaccionar cuando el usuario deja de teclear). */
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

/** Mueve el foco al encabezado principal al cambiar de pantalla (accesibilidad). */
export function useFocusHeading<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => { ref.current?.focus({ preventScroll: false }); }, []);
  return ref;
}
