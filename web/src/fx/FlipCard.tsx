// Giro 3D de carta con CSS 3D (preserve-3d) + Web Animations API: elevación, brillo que
// recorre la superficie y sombra que se separa de la mesa. Barato: sólo transform/opacity.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, type CSSProperties, type JSX } from 'react';
import { CardImage } from './Card';
import { useLatest, useReducedMotion } from './hooks';
import { playSfx } from './sound';

/** Ancho de carta sugerido por el contenedor (lo pone SpreadBoard). */
export const SlotWidthContext = createContext<number | null>(null);

export interface FlipCardProps {
  front: string;
  back: string;
  flipped: boolean;
  reversed?: boolean;
  width?: number;
  onFlipped?(): void;
  /** Texto alternativo de la cara (nombre de la carta). */
  alt?: string;
  /** Inclinación con el ratón y brillo al pasar (por defecto true). */
  tilt?: boolean;
  /** Sonido al girar (por defecto true). */
  sound?: boolean;
  /** Duración del giro en ms (por defecto 750). */
  duration?: number;
  onClick?(): void;
  className?: string;
  style?: CSSProperties;
}

const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function FlipCard(p: FlipCardProps): JSX.Element {
  const reduced = useReducedMotion();
  const ctxW = useContext(SlotWidthContext);
  const width = p.width ?? ctxW ?? undefined;
  const inner = useRef<HTMLDivElement>(null);
  const shine = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const tiltEl = useRef<HTMLDivElement>(null);
  const prev = useRef<boolean | null>(null);
  const cb = useLatest(p.onFlipped);
  const dur = p.duration ?? 750;

  useIso(() => {
    const el = inner.current;
    if (!el) return;
    const to = p.flipped ? 180 : 0;
    const from = 180 - to;
    const first = prev.current === null;
    prev.current = p.flipped;
    el.style.transform = reduced ? 'none' : `rotateY(${to}deg)`;
    if (first) return;
    if (reduced || typeof el.animate !== 'function') {
      if (p.flipped) {
        const t = setTimeout(() => cb.current?.(), reduced ? 200 : 0);
        return () => clearTimeout(t);
      }
      return;
    }
    if (p.sound !== false) playSfx('flip');
    const lift = Math.max(40, (width ?? 160) * 0.45);
    const anim = el.animate(
      [
        { transform: `translateZ(0px) rotateY(${from}deg)`, easing: 'cubic-bezier(0.3,0,0.6,1)' },
        { transform: `translateZ(${lift}px) rotateY(${(from + to) / 2}deg) rotateX(6deg)`, offset: 0.45, easing: 'cubic-bezier(0.2,0,0.2,1)' },
        { transform: `translateZ(0px) rotateY(${to}deg)` },
      ],
      { duration: dur },
    );
    shine.current?.animate(
      [
        { backgroundPosition: '120% 0', opacity: 0 },
        { opacity: 0.9, offset: 0.4 },
        { backgroundPosition: '-30% 0', opacity: 0 },
      ],
      { duration: dur * 1.1, easing: 'ease-out' },
    );
    shadow.current?.animate(
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(0.75) translateY(18%)', opacity: 0.45, offset: 0.45 },
        { transform: 'scale(1.04)', opacity: 1, offset: 0.85 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      { duration: dur },
    );
    let done = false;
    anim.onfinish = () => {
      done = true;
      if (p.flipped) cb.current?.();
    };
    return () => {
      if (!done) anim.cancel();
    };
  }, [p.flipped, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMove = (e: React.PointerEvent) => {
    if (p.tilt === false || reduced || e.pointerType !== 'mouse') return;
    const el = tiltEl.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--fx-rx', `${(-y * 10).toFixed(2)}deg`);
    el.style.setProperty('--fx-ry', `${(x * 12).toFixed(2)}deg`);
    el.style.setProperty('--fx-shine', `${(50 - x * 120).toFixed(1)}%`);
    el.style.setProperty('--fx-shine-o', '0.35');
  };
  const onLeave = () => {
    const el = tiltEl.current;
    if (!el) return;
    el.style.setProperty('--fx-rx', '0deg');
    el.style.setProperty('--fx-ry', '0deg');
    el.style.setProperty('--fx-shine-o', '0');
  };

  const label = p.flipped ? (p.alt ? `${p.alt}${p.reversed ? ' (invertida)' : ''}` : 'Carta descubierta') : 'Carta boca abajo';
  const Tag = p.onClick ? 'button' : 'div';

  if (reduced) {
    return (
      <Tag
        className={['fx-flip', p.onClick ? 'fx-unbutton' : '', p.className ?? ''].join(' ')}
        style={{ width: width ?? '100%', display: 'block', ...p.style }}
        onClick={p.onClick}
        role={p.onClick ? undefined : 'img'}
        aria-label={label}
        type={p.onClick ? 'button' : undefined}
      >
        <div ref={inner} style={{ position: 'relative' }}>
          <CardImage src={p.back} style={{ opacity: p.flipped ? 0 : 1, transition: 'opacity .2s' }} />
          <div className={`fx-flip__face fx-flip__face--front ${p.reversed ? 'is-reversed' : ''}`} style={{ transform: 'none', opacity: p.flipped ? 1 : 0, transition: 'opacity .2s' }}>
            <CardImage src={p.front} front className="fx-flip__img" />
          </div>
        </div>
      </Tag>
    );
  }

  return (
    <Tag
      className={['fx-flip', p.onClick ? 'fx-unbutton' : '', p.className ?? ''].join(' ')}
      style={{ width: width ?? '100%', display: 'block', ...p.style }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={p.onClick}
      role={p.onClick ? undefined : 'img'}
      aria-label={label}
      type={p.onClick ? 'button' : undefined}
    >
      <div ref={shadow} className="fx-flip__shadow" />
      <div ref={tiltEl} className="fx-flip__tilt">
        <div ref={inner} className="fx-flip__inner">
          <CardImage src={p.back} />
          <div className={`fx-flip__face fx-flip__face--front ${p.reversed ? 'is-reversed' : ''}`} style={{ borderRadius: '6% / 3.5%' }}>
            <CardImage src={p.front} front className="fx-flip__img" />
            <div ref={shine} className="fx-flip__shine" />
          </div>
        </div>
      </div>
    </Tag>
  );
}
