// Hooks y utilidades compartidas del equipo de animación.
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

/* ---------- prefers-reduced-motion (+ override global «modo ligero») ---------- */
let override: boolean | null = null;
const listeners = new Set<() => void>();
const mql = (): MediaQueryList | null =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  const q = mql();
  q?.addEventListener?.('change', cb);
  return () => {
    listeners.delete(cb);
    q?.removeEventListener?.('change', cb);
  };
}
function getSnapshot(): boolean {
  if (override !== null) return override;
  return !!mql()?.matches;
}

/** Fuerza (true/false) o libera (null) el modo de movimiento reducido para toda la app. */
export function setReducedMotion(value: boolean | null): void {
  override = value;
  listeners.forEach((l) => l());
}
/** Valor actual sin React (para código imperativo). */
export function prefersReducedMotion(): boolean {
  return getSnapshot();
}
/** true si el usuario pide menos movimiento (media query o override global). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/* ---------- dispositivo modesto: presupuesto bajo ---------- */
export function isLowPowerDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const cores = navigator.hardwareConcurrency ?? 8;
  return coarse || cores <= 4 || window.innerWidth < 700;
}

/* ---------- ¿existe la imagen? (con caché) ---------- */
const imgCache = new Map<string, boolean | Promise<boolean>>();
export function probeImage(src: string): Promise<boolean> {
  const c = imgCache.get(src);
  if (typeof c === 'boolean') return Promise.resolve(c);
  if (c) return c;
  if (typeof Image === 'undefined') return Promise.resolve(false);
  const p = new Promise<boolean>((res) => {
    const im = new Image();
    im.onload = () => { imgCache.set(src, true); res(true); };
    im.onerror = () => { imgCache.set(src, false); res(false); };
    im.src = src;
  });
  imgCache.set(src, p);
  return p;
}
/** null = comprobando; true/false = existe o no. */
export function useImageAvailable(src: string | undefined): boolean | null {
  const cached = src ? imgCache.get(src) : false;
  const [ok, setOk] = useState<boolean | null>(typeof cached === 'boolean' ? cached : null);
  useEffect(() => {
    if (!src) { setOk(false); return; }
    let alive = true;
    probeImage(src).then((v) => alive && setOk(v));
    return () => { alive = false; };
  }, [src]);
  return ok;
}

/* ---------- tamaño de un elemento ---------- */
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
export function useElementSize<T extends HTMLElement>(): [React.RefObject<T | null>, { width: number; height: number }] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (Math.abs(s.width - r.width) < 0.5 && Math.abs(s.height - r.height) < 0.5 ? s : { width: r.width, height: r.height }));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

/** Ref siempre actualizada (para callbacks dentro de efectos/timelines). */
export function useLatest<T>(v: T) {
  const r = useRef(v);
  r.current = v;
  return r;
}

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
