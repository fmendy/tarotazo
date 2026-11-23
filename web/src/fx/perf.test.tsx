// Medidas de coste en reposo (QA Android): fotogramas pintados y degradados creados por fotograma.
// Se usa un contexto 2D falso que cuenta llamadas y temporizadores falsos (rAF a 60 Hz).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { Ambience } from './Ambience';
import { Pendulum } from '../pendulum';

const counts = { clear: 0, gradients: 0 };
function fakeCtx(): CanvasRenderingContext2D {
  const grad = { addColorStop() {} };
  return new Proxy({} as Record<string, unknown>, {
    get(t, k) {
      if (k === 'clearRect') return () => { counts.clear++; };
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => { counts.gradients++; return grad; };
      if (k in t) return t[k as string];
      return () => {};
    },
    set(t, k, v) {
      t[k as string] = v;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

let rectW = 400;
beforeEach(() => {
  counts.clear = 0;
  counts.gradients = 0;
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  HTMLCanvasElement.prototype.getContext = (() => fakeCtx()) as unknown as HTMLCanvasElement['getContext'];
  Element.prototype.getBoundingClientRect = function () {
    return { width: rectW, height: rectW * 1.3, top: 0, left: 0, right: rectW, bottom: rectW * 1.3, x: 0, y: 0, toJSON() {} } as DOMRect;
  };
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
});

const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const framesIn = (ms: number) => {
  const c0 = counts.clear;
  advance(ms);
  return counts.clear - c0;
};

describe('Ambience: cadencia en reposo', () => {
  it('escritorio: ≤30 fps con actividad y ≤20 fps en reposo (antes 60)', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    render(<Ambience variant="estrellas" />);
    const active = framesIn(5000);
    advance(4000);
    const idle = framesIn(5000);
    console.info(`[perf] Ambience escritorio: activo ${active / 5} fps, reposo ${idle / 5} fps`);
    expect(active / 5).toBeLessThanOrEqual(31);
    expect(idle / 5).toBeLessThanOrEqual(21);
    expect(idle).toBeGreaterThan(0);
  });

  it('móvil: ≤20 fps con actividad y ≤15 fps en reposo (antes 30)', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 412 });
    render(<Ambience variant="humo" />);
    const active = framesIn(5000);
    advance(4000);
    const idle = framesIn(5000);
    console.info(`[perf] Ambience móvil: activo ${active / 5} fps, reposo ${idle / 5} fps`);
    expect(active / 5).toBeLessThanOrEqual(21);
    expect(idle / 5).toBeLessThanOrEqual(16);
  });

  it('pausa del todo con la pestaña oculta', () => {
    render(<Ambience variant="polvo" />);
    advance(500);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    const hidden = framesIn(3000);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    expect(hidden).toBe(0);
  });
});

describe('Pendulum: se duerme quieto y no crea degradados por fotograma', () => {
  it('libre: deja de pintar en reposo y despierta al tocar', () => {
    const { container } = render(<Pendulum model="cuarzo" mode="sino" target={null} yesAxis="vertical" sound={false} />);
    advance(1000);
    // coste por fotograma con movimiento: degradados creados tras construir los sprites
    const g0 = counts.gradients;
    const moving = framesIn(2000);
    const gradsPerFrame = (counts.gradients - g0) / Math.max(1, moving);
    advance(30_000);
    const asleep = framesIn(10_000);
    console.info(`[perf] Péndulo: ${moving / 2} fps moviéndose, ${gradsPerFrame.toFixed(2)} degradados/fotograma (antes ~4), ${asleep / 10} fps dormido (antes 60)`);
    expect(gradsPerFrame).toBe(0);
    expect(asleep).toBe(0);
    fireEvent.pointerDown(container.querySelector('canvas')!, { clientX: 200, clientY: 40, pointerId: 1 });
    expect(framesIn(1000)).toBeGreaterThan(30);
  });

  it('con respuesta: oscila, se asienta, se calma tras restAfter y se duerme', () => {
    const onSettled = vi.fn();
    const { rerender } = render(<Pendulum model="laton" mode="sino" target={{ kind: 'axis', axis: 'vertical' }} yesAxis="vertical" sound={false} restAfter={4} onSettled={onSettled} />);
    advance(12_000);
    expect(onSettled).toHaveBeenCalledTimes(1);
    advance(30_000);
    expect(framesIn(5000)).toBe(0);
    // un cambio de objetivo lo despierta
    rerender(<Pendulum model="laton" mode="sino" target={{ kind: 'circle' }} yesAxis="vertical" sound={false} restAfter={4} onSettled={onSettled} />);
    expect(framesIn(1000)).toBeGreaterThan(30);
  });

  it('una inclinación casi igual no lo despierta; una apreciable sí', () => {
    const P = (t: { x: number; y: number }) => <Pendulum model="madera" mode="sino" target={null} yesAxis="vertical" sound={false} tilt={t} />;
    const { rerender } = render(P({ x: 0.2, y: 0 }));
    advance(40_000);
    expect(framesIn(2000)).toBe(0);
    rerender(P({ x: 0.22, y: 0.01 }));
    expect(framesIn(1000)).toBe(0);
    rerender(P({ x: 0.5, y: 0 }));
    expect(framesIn(1000)).toBeGreaterThan(30);
  });
});
