// Abanico de cartas boca abajo para elegir `pick` cartas. Ratón, táctil y teclado.
// En pantallas estrechas el abanico se convierte en una tira desplazable.
//
// Reglas anti-bucle (QA-19): el ancho medido es el de un envoltorio `width:100%; min-width:0;
// overflow:hidden` cuyo contenido nunca le da tamaño (la tira se desplaza dentro y sus márgenes
// laterales son porcentuales, no derivados de la medida); el cambio tira/abanico tiene histéresis;
// y el árbol de cartas es el mismo en los dos modos (keys estables, nada se remonta).
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties, type JSX, type KeyboardEvent, type MouseEvent } from 'react';
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

/** ¿Tira desplazable? Con histéresis: hay que pasarse ~12 % del umbral para cambiar de modo. */
export function nextScrollMode(prev: boolean | null, width: number, count: number): boolean {
  const need = Math.max(640, count * 9 / 1.6); // ancho mínimo para un abanico cómodo
  if (prev === null) return width < need;
  return prev ? width < need * 1.12 : width < need * 0.88;
}

export function CardFan(p: CardFanProps): JSX.Element {
  const reduced = useReducedMotion();
  const [ref, size] = useElementSize<HTMLDivElement>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [focus, setFocus] = useState(Math.floor(p.count / 2));
  const [kbd, setKbd] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const done = picked.length >= p.pick;
  const onPicked = useLatest(p.onPicked);
  // Ancho redondeado a 8 px: los temblores sub-píxel no provocan re-maquetación.
  const W = size.width ? Math.round(size.width / 8) * 8 : 360;
  const [autoScroll, setAutoScroll] = useState<boolean>(() => nextScrollMode(null, typeof window !== 'undefined' ? window.innerWidth : 360, p.count));
  useEffect(() => {
    if (!size.width) return;
    setAutoScroll((prev) => nextScrollMode(prev, size.width, p.count));
  }, [size.width, p.count]);
  const scroll = p.scroll ?? autoScroll;
  const cw = scroll ? Math.max(58, Math.min(78, W / 5)) : Math.max(56, Math.min(100, W / 9));
  const ch = cw * CARD_RATIO;
  const step = scroll ? Math.max(18, cw * 0.34) : 0;
  const arc = Math.min(120, 20 + p.count * 1.4);
  // Radio del abanico: la cuerda ocupa ~88 % del ancho disponible.
  const half = ((arc / 2) * Math.PI) / 180;
  const R = Math.max(ch * 1.2, (W * 0.88 - cw) / (2 * Math.sin(half)));
  const sag = R * (1 - Math.cos(half));
  const TOP = 30;
  const stripW = (p.count - 1) * step + cw;
  const idBase = useRef(`fx-fan-${Math.random().toString(36).slice(2, 8)}`).current;
  const angleOf = (i: number) => -arc / 2 + (arc * i) / Math.max(1, p.count - 1);

  useEffect(() => {
    setPicked([]);
  }, [p.count, p.pick]);

  // Centrar la tira al entrar en modo tira.
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
      s.scrollTo({ left: n * step, behavior: reduced ? 'auto' : 'smooth' }); // con los márgenes del 50 %, la carta n queda centrada
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

  // QA-17: en el abanico, cada carta recibe toda su cuña angular (desde el pivote hasta por
  // encima del borde), no sólo la franja visible. Cuñas contiguas, sin solapes.
  const hitIndex = (e: MouseEvent<HTMLDivElement>): number | null => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = TOP + R - (e.clientY - r.top);
    if (y <= 0) return null;
    const ang = (Math.atan2(x, y) * 180) / Math.PI;
    const hw = (Math.atan(cw / 2 / R) * 180) / Math.PI; // media carta en el borde superior
    const d = arc / Math.max(1, p.count - 1);
    if (ang < angleOf(0) - hw - 2 || ang > angleOf(p.count - 1) + hw + 2) return null;
    // La franja visible de la carta i va de su borde izquierdo al de la siguiente.
    const i = Math.floor((ang - (angleOf(0) - hw)) / d);
    const k = Math.max(0, Math.min(p.count - 1, i));
    return picked.includes(k) ? null : k;
  };

  const cards = Array.from({ length: p.count }, (_, i) => {
    const isPicked = picked.includes(i);
    const r = scroll ? Math.sin(i * 1.7) * 1.5 : angleOf(i);
    const left = scroll ? i * step : W / 2 - cw / 2;
    return (
      <div
        key={i}
        id={`${idBase}-${i}`}
        role="option"
        aria-selected={isPicked}
        aria-label={`Carta ${i + 1}`}
        className={['fx-fan__card', isPicked ? 'is-picked' : '', (kbd && focus === i) || (!scroll && hover === i) ? 'is-focus' : ''].join(' ')}
        onClick={
          scroll
            ? () => {
                setKbd(false);
                setFocus(i);
                choose(i);
              }
            : undefined
        }
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

  return (
    <div
      ref={ref}
      className={['fx-fan-wrap', reduced ? 'fx-reduced' : '', p.className].filter(Boolean).join(' ')}
      style={{ width: '100%', minWidth: 0, maxWidth: '100%', overflow: 'hidden', ...p.style }}
    >
      <div
        ref={scrollRef}
        className={['fx-fan', scroll ? 'fx-fan--scroll' : 'fx-fan--arc', done ? 'fx-fan--done' : ''].join(' ')}
        role="listbox"
        tabIndex={0}
        aria-label={`Elige ${p.pick} carta${p.pick === 1 ? '' : 's'} (flechas para moverte, Enter para elegir). Elegidas: ${picked.length}`}
        aria-multiselectable
        aria-activedescendant={`${idBase}-${focus}`}
        onKeyDown={onKey}
        onBlur={() => setKbd(false)}
        style={
          scroll
            ? { display: 'flex', width: '100%', minWidth: 0, height: ch + 40, paddingTop: 30, boxSizing: 'border-box' }
            : { display: 'block', width: '100%', minWidth: 0, height: TOP + sag + ch + 16 }
        }
      >
        {/* márgenes porcentuales (relativos al propio contenedor, no a la medida) para poder centrar los extremos */}
        <div aria-hidden style={{ flex: `0 0 calc(50% - ${cw / 2}px)`, display: scroll ? 'block' : 'none' }} />
        <div
          style={scroll ? { position: 'relative', flex: `0 0 ${stripW}px`, height: ch } : { position: 'absolute', inset: 0 }}
          onPointerMove={scroll ? undefined : (e) => {
            if (e.pointerType !== 'mouse') return;
            const k = hitIndex(e);
            if (k !== hover) setHover(k);
          }}
          onPointerLeave={scroll ? undefined : () => setHover(null)}
          onClick={scroll ? undefined : (e) => {
            const k = hitIndex(e);
            if (k === null) return;
            setKbd(false);
            setFocus(k);
            setHover(null);
            choose(k);
          }}
        >
          {cards}
        </div>
        <div aria-hidden style={{ flex: `0 0 calc(50% - ${cw / 2}px)`, display: scroll ? 'block' : 'none' }} />
      </div>
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
                <span aria-hidden style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontWeight: 700, color: 'var(--c-gold,#d4a24c)', textShadow: '0 1px 3px #000' }}>{k + 1}</span>
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
