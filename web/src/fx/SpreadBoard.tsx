// Tablero de tirada: coloca los hijos según el layout y los «reparte» desde el mazo.
import { motion } from 'framer-motion';
import { useEffect, useRef, type CSSProperties, type JSX, type ReactNode } from 'react';
import { CARD_H, layoutBounds, layoutPositions, type SpreadLayout } from './layouts';
import { SlotWidthContext } from './FlipCard';
import { useElementSize, useLatest, useReducedMotion } from './hooks';
import { playSfx } from './sound';

export interface SpreadBoardProps {
  layout: SpreadLayout;
  slots: number;
  children: ReactNode[];
  /** Ancho máximo de carta en px (por defecto 150). */
  maxCardWidth?: number;
  /** Desde dónde se reparten las cartas (por defecto 'bottom'). */
  dealFrom?: 'bottom' | 'top' | 'left' | 'right';
  /** Segundos entre carta y carta (por defecto 0.16). */
  stagger?: number;
  /** Etiquetas de posición bajo cada hueco (opcional). */
  labels?: string[];
  /** Se llama cuando todas las cartas presentes han llegado a su sitio. */
  onDealt?(): void;
  className?: string;
  style?: CSSProperties;
}

export function SpreadBoard(p: SpreadBoardProps): JSX.Element {
  const reduced = useReducedMotion();
  const [ref, size] = useElementSize<HTMLDivElement>();
  const pos = layoutPositions(p.layout, p.slots);
  const b = layoutBounds(pos);
  const labelH = p.labels?.length ? 22 : 0;
  const cw = size.width && b.width ? Math.min(p.maxCardWidth ?? 150, (size.width - 4) / b.width) : 0;
  const H = b.height * cw + labelH + 8;
  const stagger = p.stagger ?? 0.16;
  const kids = Array.isArray(p.children) ? p.children : [p.children];
  const dealtCb = useLatest(p.onDealt);
  const present = kids.filter((k) => k != null && k !== false).length;
  const sounded = useRef<Set<number>>(new Set());

  // Origen del reparto (relativo al tablero).
  const from = (() => {
    const W = size.width;
    switch (p.dealFrom ?? 'bottom') {
      case 'top': return { x: W / 2, y: -cw * CARD_H };
      case 'left': return { x: -cw, y: H / 2 };
      case 'right': return { x: W + cw, y: H / 2 };
      default: return { x: W / 2, y: H + cw * CARD_H * 0.6 };
    }
  })();

  useEffect(() => {
    if (!cw || !present) return;
    const total = reduced ? 250 : (present - 1) * stagger * 1000 + 800;
    const t = setTimeout(() => dealtCb.current?.(), total);
    return () => clearTimeout(t);
  }, [present, !!cw, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  // Retardo de reparto: se asigna la primera vez que aparece cada carta, por lotes
  // (si las cartas llegan de una en una, cada una sale sin esperar a las anteriores).
  const delays = useRef<Map<number, number>>(new Map());
  if (cw) {
    let batch = 0;
    kids.forEach((k, i) => {
      if (k != null && k !== false && !delays.current.has(i)) delays.current.set(i, batch++ * stagger);
    });
  }
  useEffect(() => {
    if (!cw || reduced) return;
    const timers: number[] = [];
    delays.current.forEach((d, i) => {
      if (sounded.current.has(i)) return;
      sounded.current.add(i);
      timers.push(window.setTimeout(() => playSfx('flip', { volume: 0.35, rate: 1.3 }), d * 1000 + 60));
    });
    return () => timers.forEach(clearTimeout);
  }, [present, !!cw]); // eslint-disable-line react-hooks/exhaustive-deps

  const offX = (b.width * cw > 0 ? (size.width - b.width * cw) / 2 : 0);
  return (
    <div
      ref={ref}
      className={['fx-spread', p.className].filter(Boolean).join(' ')}
      style={{ position: 'relative', width: '100%', height: cw ? H : 200, ...p.style }}
      role="list"
    >
      {cw > 0 &&
        pos.map((s, i) => {
          const left = offX + (s.x - b.minX - 0.5) * cw;
          const top = (s.y - b.minY - CARD_H / 2) * cw;
          const child = kids[i];
          const has = child != null && child !== false;
          const cx = left + cw / 2;
          const cy = top + (cw * CARD_H) / 2;
          return (
            <div
              key={i}
              role="listitem"
              aria-label={p.labels?.[i]}
              style={{ position: 'absolute', left, top, width: cw, height: cw * CARD_H, zIndex: s.z + 1 }}
            >
              {!has && (
                <div
                  aria-hidden
                  style={{ position: 'absolute', inset: 0, borderRadius: '6% / 3.5%', border: '1px dashed rgba(212,162,76,0.35)', transform: `rotate(${s.rot}deg)` }}
                />
              )}
              {has && (
                <motion.div
                  style={{ position: 'absolute', inset: 0, willChange: 'transform' }}
                  initial={reduced ? { opacity: 0, rotate: s.rot } : { x: from.x - cx, y: from.y - cy, rotate: s.rot - 25 + Math.random() * 10, opacity: 0, scale: 0.85 }}
                  animate={{ x: 0, y: 0, rotate: s.rot, opacity: 1, scale: 1 }}
                  transition={reduced ? { duration: 0.2 } : { type: 'spring', stiffness: 170, damping: 20, mass: 0.8, delay: delays.current.get(i) ?? 0, opacity: { duration: 0.15, delay: delays.current.get(i) ?? 0 } }}
                >
                  <SlotWidthContext.Provider value={cw}>{child}</SlotWidthContext.Provider>
                </motion.div>
              )}
              {p.labels?.[i] && (
                <div
                  style={{ position: 'absolute', top: s.rot === 90 ? '100%' : `calc(100% + 4px)`, left: '-20%', right: '-20%', textAlign: 'center', fontSize: 12, lineHeight: '16px', opacity: s.rot === 90 ? 0 : 0.85, pointerEvents: 'none' }}
                >
                  {p.labels[i]}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
