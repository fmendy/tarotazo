// Abanico de cartas boca abajo para elegir `pick` cartas. Ratón, táctil y teclado.
// En pantallas estrechas el abanico se convierte en una tira desplazable.
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties, type JSX, type KeyboardEvent } from 'react';
import { CardImage, CARD_RATIO } from './Card';
import { useElementSize, useLatest, useReducedMotion } from './hooks';
import { playSfx } from './sound';

export interface CardFanProps {
  backImage: string;
  count: number;
  pick: number;
  onPicked(indices: number[]): void;
  /** Forzar modo tira desplazable (por defecto: automático según el ancho). */
  scroll?: boolean;
  /** Mostrar la bandeja de cartas elegidas (por defecto true). */
  showTray?: boolean;
  /** Se llama con cada carta elegida. */
  onPick?(index: number, picked: number[]): void;
  className?: string;
  style?: CSSProperties;
}

export function CardFan(p: CardFanProps): JSX.Element {
  const reduced = useReducedMotion();
  const [ref, size] = useElementSize<HTMLDivElement>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [focus, setFocus] = useState(Math.floor(p.count / 2));
  const [kbd, setKbd] = useState(false);
  const done = picked.length >= p.pick;
  const onPicked = useLatest(p.onPicked);
  const W = size.width || 360;
  const scroll = p.scroll ?? (W < 640 || p.count * 9 > W * 1.6);
  const cw = scroll ? Math.max(58, Math.min(78, W / 5)) : Math.max(56, Math.min(100, W / 9));
  const ch = cw * CARD_RATIO;
  const step = scroll ? Math.max(18, cw * 0.34) : 0;
  const arc = Math.min(120, 20 + p.count * 1.4);
  // Radio del abanico: la cuerda ocupa ~88 % del ancho disponible.
  const half = ((arc / 2) * Math.PI) / 180;
  const R = Math.max(ch * 1.2, (W * 0.88 - cw) / (2 * Math.sin(half)));
  const sag = R * (1 - Math.cos(half));
  const TOP = 30;
  const idBase = useRef(`fx-fan-${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    setPicked([]);
  }, [p.count, p.pick]);

  // Centrar la tira al montar.
  useEffect(() => {
    const s = scrollRef.current;
    if (scroll && s) s.scrollLeft = (s.scrollWidth - s.clientWidth) / 2;
  }, [scroll, size.width > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (i: number) => {
    if (done || picked.includes(i)) return;
    const next = [...picked, i];
    setPicked(next);
    playSfx('flip', { volume: 0.45, rate: 1.1 + Math.random() * 0.2 });
    p.onPick?.(i, next);
    if (next.length >= p.pick) setTimeout(() => onPicked.current(next), reduced ? 150 : 700);
  };

  const moveFocus = (d: number) => {
    let n = focus;
    for (let k = 0; k < p.count; k++) {
      n = (n + d + p.count) % p.count;
      if (!picked.includes(n)) break;
    }
    setFocus(n);
    const s = scrollRef.current;
    if (scroll && s) {
      const x = n * step + cw / 2 - s.clientWidth / 2;
      s.scrollTo({ left: x, behavior: reduced ? 'auto' : 'smooth' });
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (done) return;
    setKbd(true);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); moveFocus(-1); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); moveFocus(1); }
    else if (e.key === 'Home') { e.preventDefault(); setFocus(0); }
    else if (e.key === 'End') { e.preventDefault(); setFocus(p.count - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(focus); }
  };

  const cards = Array.from({ length: p.count }, (_, i) => {
    const isPicked = picked.includes(i);
    const r = scroll ? Math.sin(i * 1.7) * 1.5 : -arc / 2 + (arc * i) / Math.max(1, p.count - 1);
    const left = scroll ? i * step : W / 2 - cw / 2;
    return (
      <div
        key={i}
        id={`${idBase}-${i}`}
        role="option"
        aria-selected={isPicked}
        aria-label={`Carta ${i + 1}`}
        className={['fx-fan__card', isPicked ? 'is-picked' : '', kbd && focus === i ? 'is-focus' : ''].join(' ')}
        onClick={() => {
          setKbd(false);
          setFocus(i);
          choose(i);
        }}
        style={{
          left,
          width: cw,
          height: ch,
          zIndex: i,
          transformOrigin: scroll ? '50% 100%' : `50% ${R.toFixed(1)}px`,
          top: scroll ? undefined : TOP,
          bottom: scroll ? 0 : 'auto',
          ['--r' as string]: `${r.toFixed(2)}deg`,
        } as CSSProperties}
      >
        <CardImage src={p.backImage} style={{ width: '100%', height: '100%' }} />
      </div>
    );
  });

  const listProps = {
    role: 'listbox',
    tabIndex: 0,
    'aria-label': `Elige ${p.pick} carta${p.pick === 1 ? '' : 's'} (flechas para moverte, Enter para elegir). Elegidas: ${picked.length}`,
    'aria-multiselectable': true,
    'aria-activedescendant': `${idBase}-${focus}`,
    onKeyDown: onKey,
    onBlur: () => setKbd(false),
  } as const;

  return (
    <div ref={ref} className={['fx-fan-wrap', reduced ? 'fx-reduced' : '', p.className].filter(Boolean).join(' ')} style={{ width: '100%', ...p.style }}>
      {scroll ? (
        <div ref={scrollRef} className={`fx-fan fx-fan--scroll ${done ? 'fx-fan--done' : ''}`} {...listProps} style={{ height: ch + 40, paddingTop: 30 }}>
          <div style={{ position: 'relative', width: (p.count - 1) * step + cw + W * 0.5, height: ch, marginLeft: W * 0.25 }}>{cards}</div>
        </div>
      ) : (
        <div className={`fx-fan ${done ? 'fx-fan--done' : ''}`} {...listProps} style={{ height: TOP + sag + ch + 16 }}>
          {cards}
        </div>
      )}
      {p.showTray !== false && (
        <div className="fx-fan__tray" aria-live="polite">
          <AnimatePresence>
            {picked.map((i, k) => (
              <motion.div
                key={i}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: -60, scale: 0.6, rotate: -12 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                style={{ width: cw * 0.6, position: 'relative' }}
              >
                <CardImage src={p.backImage} alt={`Carta elegida ${k + 1}`} />
                <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontWeight: 700, color: 'var(--c-gold,#d4a24c)', textShadow: '0 1px 3px #000' }}>{k + 1}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {Array.from({ length: Math.max(0, p.pick - picked.length) }, (_, k) => (
            <div key={`e${k}`} aria-hidden style={{ width: cw * 0.6, aspectRatio: '7 / 12', borderRadius: '6% / 3.5%', border: '1px dashed rgba(212,162,76,.4)' }} />
          ))}
        </div>
      )}
    </div>
  );
}
