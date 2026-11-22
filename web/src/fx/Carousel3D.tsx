// Carrusel 3D genérico en CSS (anillo con rotateY/translateZ): arrastre con inercia, flechas y teclado.
import { useEffect, useRef, useState, type CSSProperties, type JSX, type KeyboardEvent, type ReactNode } from 'react';
import { useLatest, useReducedMotion } from './hooks';
import { playSfx } from './sound';

export interface Carousel3DProps<T> {
  items: T[];
  render(item: T): ReactNode;
  onSelect(item: T): void;
  /** Se llama cuando cambia el elemento de delante. */
  onChange?(item: T, index: number): void;
  /** Ancho de cada elemento en px (por defecto 180). */
  itemWidth?: number;
  /** Alto del carrusel en px (por defecto itemWidth × 1.7). */
  height?: number;
  /** Índice inicial (por defecto 0). */
  initialIndex?: number;
  /** Etiqueta accesible de cada elemento (por defecto, su texto visible). */
  getLabel?(item: T, index: number): string;
  className?: string;
  style?: CSSProperties;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

export function Carousel3D<T>(p: Carousel3DProps<T>): JSX.Element {
  const reduced = useReducedMotion();
  const n = p.items.length;
  const nEff = Math.max(n, 3);
  const theta = 360 / nEff;
  const w = Math.min(p.itemWidth ?? 180, typeof window !== 'undefined' ? window.innerWidth * 0.55 : 180);
  const H = p.height ?? w * 1.7;
  const radius = w / 2 / Math.tan(Math.PI / nEff) + 24;
  const [rot, setRot] = useState(p.initialIndex ?? 0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ x: 0, start: 0, lastX: 0, lastT: 0, v: 0, moved: false });
  const onChange = useLatest(p.onChange);
  const active = n ? mod(Math.round(rot), n) : 0;
  const lastActive = useRef(active);
  const itemEls = useRef<Array<HTMLDivElement | null>>([]);
  const [activeText, setActiveText] = useState('');
  // Nombre por defecto = texto visible del elemento de delante (QA-02).
  useEffect(() => {
    if (p.getLabel || !n) return;
    const el = itemEls.current[active];
    if (!el) return;
    const parts: string[] = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const v = t.textContent?.trim();
      if (v) parts.push(v);
    }
    const txt = parts.join(' ');
    setActiveText(txt.length > 90 ? `${txt.slice(0, 88)}…` : txt);
  });

  const goTo = (raw: number) => {
    // con menos de 3 elementos no se da la vuelta: se limita al rango
    const target = n < 3 ? Math.max(0, Math.min(n - 1, raw)) : raw;
    setRot(target);
    const a = mod(target, n || 1);
    if (a !== lastActive.current && n) {
      lastActive.current = a;
      playSfx('flip', { volume: 0.25, rate: 1.4 });
      onChange.current?.(p.items[a], a);
    }
  };
  const step = (d: number) => goTo(Math.round(rot) + d);
  const focusItem = (i: number) => {
    // camino más corto hasta i
    const cur = Math.round(rot);
    let d = mod(i - cur, n);
    if (d > n / 2) d -= n;
    goTo(cur + d);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (n < 2) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, start: rot, lastX: e.clientX, lastT: performance.now(), v: 0, moved: false };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const d = drag.current;
    const now = performance.now();
    d.v = (e.clientX - d.lastX) / Math.max(1, now - d.lastT);
    d.lastX = e.clientX;
    d.lastT = now;
    if (Math.abs(e.clientX - d.x) > 6) d.moved = true;
    setRot(d.start - (e.clientX - d.x) / (w * 1.1));
  };
  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    const d = drag.current;
    const fling = -d.v * 0.9; // inercia
    goTo(Math.round(rot + fling));
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if ((e.key === 'Enter' || e.key === ' ') && n) { e.preventDefault(); p.onSelect(p.items[active]); }
  };

  const label = (i: number) => p.getLabel?.(p.items[i], i);
  const activeName = (n ? label(active) ?? activeText : '') || (n ? `${active + 1} de ${n}` : 'vacío');
  // Patrón válido (QA-02): región role=group con aria-roledescription, diapositivas role=group
  // y los botones anterior/siguiente fuera del grupo.
  return (
    <div className={['fx-car-wrap', p.className].filter(Boolean).join(' ')} style={{ position: 'relative', width: '100%', ...p.style }}>
      <div
        className="fx-car"
        tabIndex={0}
        role="group"
        aria-roledescription="carrusel"
        aria-label={`Carrusel: ${activeName}. Flechas para girar, Enter para elegir.`}
        onKeyDown={onKey}
        style={{ height: H, width: '100%', overflow: 'hidden' }}
      >
        <div
          className="fx-car__ring"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            transform: `translateZ(${-radius}px) rotateY(${-rot * theta}deg)`,
            transition: dragging || reduced ? 'none' : 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
            cursor: dragging ? 'grabbing' : 'grab',
            touchAction: 'pan-y',
          }}
        >
          {p.items.map((it, i) => {
            // distancia angular al frente (en pasos)
            let d = Math.abs(mod(i - rot, nEff));
            d = Math.min(d, nEff - d);
            const lbl = label(i);
            return (
              <div
                key={i}
                ref={(el) => {
                  itemEls.current[i] = el;
                }}
                role="group"
                aria-roledescription="diapositiva"
                aria-label={lbl}
                aria-current={i === active ? 'true' : undefined}
                aria-hidden={d > 0.5 ? true : undefined}
                className="fx-car__item"
                onClick={() => {
                  if (drag.current.moved) return;
                  if (i === active) p.onSelect(it);
                  else focusItem(i);
                }}
                style={{
                  width: w,
                  marginLeft: -w / 2,
                  transform: `rotateY(${i * theta}deg) translateZ(${radius}px)`,
                  opacity: Math.max(0.15, 1 - d * 0.35),
                  filter: d > 0.5 ? 'brightness(0.6)' : undefined,
                  pointerEvents: d > 1.5 ? 'none' : undefined,
                }}
              >
                {p.render(it)}
              </div>
            );
          })}
        </div>
      </div>
      {n > 1 && (
        <>
          <button type="button" className="fx-car__btn" style={{ left: 8 }} aria-label="Anterior" onClick={() => step(-1)}>‹</button>
          <button type="button" className="fx-car__btn" style={{ right: 8 }} aria-label="Siguiente" onClick={() => step(1)}>›</button>
        </>
      )}
    </div>
  );
}
