// Corte del mazo: «tres montones» (clic o arrastre; el elegido sube y se coloca encima) o abanico.
import { motion, type TargetAndTransition, type Transition } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties, type JSX, type KeyboardEvent } from 'react';
import { CardImage, CARD_RATIO } from './Card';
import { useElementSize, useLatest, useReducedMotion } from './hooks';
import { playSfx } from './sound';

export interface CutDeckProps {
  backImage: string;
  mode: 'tres' | 'abanico';
  onCut(index: 0 | 1 | 2): void;
  /** Ancho de carta máximo en px (por defecto 96). */
  cardWidth?: number;
  /** Etiquetas accesibles de los montones. */
  pileLabels?: [string, string, string];
  className?: string;
  style?: CSSProperties;
}

type Phase = 'gather' | 'split' | 'merge' | 'done';

export function CutDeck(p: CutDeckProps): JSX.Element {
  return p.mode === 'abanico' ? <FanCut {...p} /> : <ThreePiles {...p} />;
}

function Pile({ src, layers, w, h }: { src: string; layers: number; w: number; h: number }) {
  return (
    <div style={{ position: 'relative', width: w, height: h }}>
      {Array.from({ length: layers }, (_, i) => (
        <CardImage key={i} src={src} style={{ position: 'absolute', width: w, height: h, left: i * 0.6, top: -i * 1.4 }} />
      ))}
    </div>
  );
}

function ThreePiles(p: CutDeckProps): JSX.Element {
  const reduced = useReducedMotion();
  const [ref, size] = useElementSize<HTMLDivElement>();
  const [phase, setPhase] = useState<Phase>('gather');
  const [chosen, setChosen] = useState<0 | 1 | 2 | null>(null);
  const [focus, setFocus] = useState(1);
  const btns = useRef<Array<HTMLButtonElement | null>>([]);
  const onCut = useLatest(p.onCut);
  const cw = Math.max(48, Math.min(p.cardWidth ?? 96, (size.width || 360) / 3.8));
  const ch = cw * CARD_RATIO;
  const spread = cw * 1.35;
  const labels = p.pileLabels ?? ['Montón izquierdo', 'Montón central', 'Montón derecho'];

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('split');
      playSfx('flip', { volume: 0.4, rate: 0.8 });
    }, reduced ? 0 : 250);
    return () => clearTimeout(t);
  }, [reduced]);

  const choose = (i: 0 | 1 | 2) => {
    if (phase !== 'split') return;
    setChosen(i);
    setPhase('merge');
    playSfx('flip', { volume: 0.5 });
    setTimeout(() => playSfx('flip', { volume: 0.4, rate: 0.7 }), reduced ? 0 : 650);
    setTimeout(() => {
      setPhase('done');
      onCut.current(i);
    }, reduced ? 200 : 1050);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const n = Math.max(0, Math.min(2, focus + (e.key === 'ArrowLeft' ? -1 : 1)));
      setFocus(n);
      btns.current[n]?.focus();
    }
  };

  return (
    <div
      ref={ref}
      className={['fx-cut', p.className].filter(Boolean).join(' ')}
      role="group"
      aria-label="Corta el mazo: elige un montón"
      onKeyDown={onKey}
      style={{ position: 'relative', width: '100%', height: ch * 1.9, ...p.style }}
    >
      {([0, 1, 2] as const).map((i) => {
        const baseX = (i - 1) * spread;
        const isChosen = chosen === i;
        let animate: TargetAndTransition;
        let transition: Transition = reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 220, damping: 22 };
        if (phase === 'gather') animate = { x: 0, y: 0, scale: 1 };
        else if (phase === 'split') animate = { x: baseX, y: 0, scale: 1 };
        else if (isChosen)
          animate = reduced ? { x: 0, y: -4, scale: 1 } : { x: [baseX, baseX * 0.6, 0, 0], y: [0, -ch * 0.75, -ch * 0.5, -4], scale: [1, 1.1, 1.06, 1], rotate: [0, -4, 2, 0] };
        else animate = { x: 0, y: 0, scale: 1 };
        if (phase === 'merge' && isChosen && !reduced) transition = { duration: 0.95, times: [0, 0.35, 0.7, 1], ease: 'easeInOut' };
        if (phase === 'merge' && !isChosen && !reduced) transition = { duration: 0.4, ease: 'easeInOut' };
        return (
          <motion.div
            key={i}
            style={{ position: 'absolute', left: '50%', top: '55%', marginLeft: -cw / 2, marginTop: -ch / 2, zIndex: isChosen ? 10 : 1 + i, touchAction: 'none' }}
            animate={animate}
            transition={transition}
            drag={phase === 'split' && !reduced}
            dragSnapToOrigin
            dragElastic={0.6}
            whileHover={phase === 'split' && !reduced ? { y: -10 } : undefined}
            onDragEnd={(_, info) => {
              if (Math.hypot(info.offset.x, info.offset.y) > 30) choose(i);
            }}
          >
            <button
              ref={(b) => {
                btns.current[i] = b;
              }}
              type="button"
              className="fx-unbutton"
              aria-label={labels[i]}
              disabled={phase !== 'split'}
              onFocus={() => setFocus(i)}
              onClick={() => choose(i)}
              style={{ display: 'block' }}
            >
              <Pile src={p.backImage} layers={5} w={cw} h={ch} />
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ------------------------------ corte en abanico ------------------------------ */
function FanCut(p: CutDeckProps): JSX.Element {
  const reduced = useReducedMotion();
  const [ref, size] = useElementSize<HTMLDivElement>();
  const N = 24;
  const [hover, setHover] = useState<number | null>(null);
  const [cut, setCut] = useState<number | null>(null);
  const [closed, setClosed] = useState(false);
  const [open, setOpen] = useState(false);
  const onCut = useLatest(p.onCut);
  const cw = Math.max(44, Math.min(p.cardWidth ?? 80, (size.width || 360) / 5.5));
  const ch = cw * CARD_RATIO;
  const arc = 80; // grados

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), reduced ? 0 : 150);
    if (!reduced) playSfx('shuffle', { rate: 1.6, volume: 0.35 });
    return () => clearTimeout(t);
  }, [reduced]);

  const choose = (k: number) => {
    if (cut !== null) return;
    const kk = Math.max(1, Math.min(N - 1, k));
    setCut(kk);
    playSfx('flip', { volume: 0.5 });
    setTimeout(() => setClosed(true), reduced ? 0 : 650);
    const idx = (kk < N / 3 ? 0 : kk < (2 * N) / 3 ? 1 : 2) as 0 | 1 | 2;
    setTimeout(() => onCut.current(idx), reduced ? 200 : 1250);
  };

  const onKey = (e: KeyboardEvent) => {
    if (cut !== null) return;
    const h = hover ?? Math.floor(N / 2);
    if (e.key === 'ArrowLeft') { e.preventDefault(); setHover(Math.max(1, h - 1)); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setHover(Math.min(N - 1, h + 1)); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(h); }
  };

  return (
    <div
      ref={ref}
      className={['fx-cut fx-cut--fan', p.className].filter(Boolean).join(' ')}
      tabIndex={0}
      role="slider"
      aria-label="Corta el abanico: elige por dónde cortar (flechas y Enter)"
      aria-valuemin={1}
      aria-valuemax={N - 1}
      aria-valuenow={hover ?? Math.floor(N / 2)}
      onKeyDown={onKey}
      onPointerLeave={() => cut === null && setHover(null)}
      style={{ position: 'relative', width: '100%', height: ch * 2.1, outline: 'none', ...p.style }}
    >
      {Array.from({ length: N }, (_, i) => {
        const ang = open && !closed ? -arc / 2 + (arc * i) / (N - 1) : 0;
        const isTop = cut !== null && i >= cut;
        const lifted = cut === null && hover !== null && i >= hover;
        let y = lifted ? -12 : 0;
        let x = 0;
        let rot = ang;
        if (cut !== null && !closed && isTop) { y = -ch * 0.35; x = cw * 0.4; }
        if (closed) {
          // la parte de arriba pasa debajo → se reordena: las de abajo quedan encima
          rot = 0;
          y = -((isTop ? i - cut! : i + (N - cut!)) * 0.6);
          x = 0;
        }
        const z = closed ? (isTop ? i - cut! : i + N) : i;
        return (
          <motion.div
            key={i}
            onPointerEnter={() => cut === null && setHover(i)}
            onClick={() => choose(i)}
            animate={{ rotate: rot, y, x }}
            transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 26, delay: closed ? 0 : open && cut === null ? i * 0.012 : 0 }}
            style={{ position: 'absolute', left: '50%', bottom: ch * 0.15, marginLeft: -cw / 2, width: cw, height: ch, transformOrigin: '50% 260%', zIndex: z, cursor: cut === null ? 'pointer' : 'default' }}
          >
            <CardImage src={p.backImage} style={{ width: '100%', height: '100%', boxShadow: hover === i && cut === null ? '0 0 0 2px var(--c-gold,#d4a24c), 0 6px 14px rgba(0,0,0,.5)' : undefined }} />
          </motion.div>
        );
      })}
    </div>
  );
}
