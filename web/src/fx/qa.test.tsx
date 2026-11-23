// Regresiones de la ronda de QA (QA-02, QA-03, QA-16, QA-19).
import { afterEach, describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { Carousel3D, FlipCard, ScreenTransition, TypewriterText } from './index';
import { CardFan, nextScrollMode } from './CardFan';

if (!window.matchMedia) {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
}
const setHidden = (h: boolean) => Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
afterEach(() => setHidden(false));

describe('QA-19 CardFan', () => {
  it('el cambio tira/abanico tiene histéresis', () => {
    const need = Math.max(640, (78 * 9) / 1.6);
    expect(nextScrollMode(null, 412, 78)).toBe(true);
    // oscilaciones cerca del umbral no cambian el modo
    expect(nextScrollMode(true, need + 10, 78)).toBe(true);
    expect(nextScrollMode(false, need - 10, 78)).toBe(false);
    expect(nextScrollMode(true, need * 1.2, 78)).toBe(false);
    expect(nextScrollMode(false, need * 0.8, 78)).toBe(true);
  });

  it('el envoltorio medido no crece con el contenido y las cartas no se remontan al cambiar de modo', () => {
    const { container, rerender } = render(<CardFan backImage="/b.svg" count={78} pick={3} onPicked={() => {}} scroll />);
    const wrap = container.firstElementChild as HTMLElement;
    expect(wrap.style.minWidth).toBe('0px');
    expect(wrap.style.overflow).toBe('hidden');
    const first = container.querySelector('[role="option"]');
    rerender(<CardFan backImage="/b.svg" count={78} pick={3} onPicked={() => {}} scroll={false} />);
    expect(container.querySelector('[role="option"]')).toBe(first);
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(78);
  });
});

describe('QA-02 Carousel3D', () => {
  it('usa grupos (no listbox), botones fuera y nombre = texto visible', () => {
    const { container } = render(<Carousel3D items={['Catalana', 'Castellana', 'Ilustrada']} render={(m) => <p>{m}</p>} onSelect={() => {}} />);
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    const car = container.querySelector('[aria-roledescription="carrusel"]')!;
    expect(car.getAttribute('role')).toBe('group');
    expect(car.querySelector('button')).toBeNull();
    expect(car.getAttribute('aria-label')).toMatch(/Catalana/);
    expect(container.querySelector('[aria-label^="Opción"]')).toBeNull();
  });
});

describe('QA-03 ARIA', () => {
  it('FlipCard no pone aria-label en un div sin rol', () => {
    const { container } = render(<FlipCard front="/f.svg" back="/b.svg" flipped={false} />);
    const el = container.querySelector('[aria-label]')!;
    expect(el.tagName === 'BUTTON' || el.getAttribute('role') === 'img').toBe(true);
  });
  it('TypewriterText no usa role="text" ni aria-label en un genérico', () => {
    const { container } = render(<TypewriterText text="Hola" />);
    expect(container.querySelector('[role="text"]')).toBeNull();
    expect(container.querySelector('span[aria-label]')).toBeNull();
    expect(container.textContent).toContain('Hola');
  });
});

describe('QA-16 ScreenTransition', () => {
  it('con la pestaña oculta desmonta lo saliente al instante', () => {
    const { container, rerender } = render(<ScreenTransition id="a"><p>Pantalla con Nombre</p></ScreenTransition>);
    setHidden(true);
    rerender(<ScreenTransition id="b"><p>Otra</p></ScreenTransition>);
    expect(container.textContent).not.toContain('Pantalla con Nombre');
    expect(container.textContent).toContain('Otra');
  });
  it('corta una salida en curso si la pestaña se oculta', async () => {
    const { container, rerender } = render(<ScreenTransition id="a"><p>Vieja</p></ScreenTransition>);
    rerender(<ScreenTransition id="b"><p>Nueva</p></ScreenTransition>);
    await act(async () => {
      setHidden(true);
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(container.textContent).not.toContain('Vieja');
  });
});

describe('A-8 CardFan con TalkBack', () => {
  it('cada carta es enfocable, tiene posición y se elige con un clic de accesibilidad (detail 0), también en el abanico', async () => {
    const picked: number[][] = [];
    const { container } = render(<CardFan backImage="/b.svg" count={22} pick={1} scroll={false} onPicked={(ix) => picked.push(ix)} />);
    const cards = container.querySelectorAll<HTMLElement>('[role="option"]');
    expect(cards[5].getAttribute('tabindex')).toBe('-1');
    expect(cards[5].getAttribute('aria-posinset')).toBe('6');
    expect(cards[5].getAttribute('aria-setsize')).toBe('22');
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.click(cards[5], { detail: 0 });
    expect(cards[5].getAttribute('aria-selected')).toBe('true');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 800));
    });
    expect(picked).toEqual([[5]]);
  });
});
