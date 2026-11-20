// Dos cofres (tarot / baraja española) que se entreabren al pasar y se abren del todo al elegir.
// Usa /art/chests/{familia}.svg si existe; si no, un cofre procedural en CSS 3D.
import { motion } from 'framer-motion';
import { useState, type CSSProperties, type JSX } from 'react';
import { useImageAvailable, useLatest, useReducedMotion } from './hooks';
import { playSfx } from './sound';

type Family = 'tarot' | 'spanish';

export interface ChestsProps {
  onChoose(family: Family): void;
  labels?: { tarot: string; spanish: string };
  /** Ancho de cada cofre en px (por defecto 200). */
  size?: number;
  className?: string;
  style?: CSSProperties;
}

const PALETTE: Record<Family, { wood: [string, string]; metal: string; light: string }> = {
  tarot: { wood: ['#5b2a6e', '#2a0f36'], metal: '#d4a24c', light: 'rgba(200,150,255,0.9)' },
  spanish: { wood: ['#8a3b1c', '#3d160a'], metal: '#e0b04a', light: 'rgba(255,200,110,0.9)' },
};

function Chest({ family, state, size, label }: { family: Family; state: 'closed' | 'peek' | 'open'; size: number; label: string }) {
  const reduced = useReducedMotion();
  const img = `/art/chests/${family}.svg`;
  const hasImg = useImageAvailable(img);
  const c = PALETTE[family];
  const lidAngle = state === 'open' ? -115 : state === 'peek' ? -22 : 0;
  const glow = state === 'open' ? 1 : state === 'peek' ? 0.45 : 0;
  const w = size;
  const h = size * 0.62;
  return (
    <div style={{ position: 'relative', width: w, height: h + size * 0.35, perspective: 700 }}>
      {/* luz que sale del cofre */}
      <motion.div
        aria-hidden
        animate={{ opacity: glow, scaleY: state === 'open' ? 1 : 0.4 }}
        transition={{ duration: reduced ? 0 : 0.5 }}
        style={{
          position: 'absolute', left: '12%', right: '12%', bottom: h * 0.6, height: size * 0.9, transformOrigin: '50% 100%',
          background: `linear-gradient(to top, ${c.light}, transparent)`, clipPath: 'polygon(15% 100%, 85% 100%, 100% 0, 0 0)', filter: 'blur(2px)', pointerEvents: 'none',
        }}
      />
      {hasImg ? (
        <motion.img
          src={img}
          alt={label}
          animate={{ y: state === 'closed' ? 0 : -6, scale: state === 'open' ? 1.06 : 1, filter: `drop-shadow(0 0 ${glow * 24}px ${c.light})` }}
          transition={{ duration: reduced ? 0 : 0.35 }}
          style={{ position: 'absolute', bottom: 0, left: 0, width: w, height: h * 1.35, objectFit: 'contain' }}
        />
      ) : (
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: w, height: h, transformStyle: 'preserve-3d' }}>
          {/* cuerpo */}
          <div
            style={{
              position: 'absolute', inset: 0, top: h * 0.35, borderRadius: 8,
              background: `repeating-linear-gradient(90deg, rgba(0,0,0,.12) 0 2px, transparent 2px 22px), linear-gradient(${c.wood[0]}, ${c.wood[1]})`,
              boxShadow: `inset 0 0 0 3px ${c.metal}, 0 12px 20px rgba(0,0,0,.5)`,
            }}
          >
            <div style={{ position: 'absolute', left: '18%', top: 0, bottom: 0, width: 10, background: c.metal, opacity: 0.85 }} />
            <div style={{ position: 'absolute', right: '18%', top: 0, bottom: 0, width: 10, background: c.metal, opacity: 0.85 }} />
            <div style={{ position: 'absolute', left: '50%', top: -6, width: 22, height: 28, marginLeft: -11, borderRadius: 4, background: c.metal, boxShadow: 'inset 0 -6px 0 rgba(0,0,0,.25)' }} />
            {/* interior iluminado */}
            <motion.div animate={{ opacity: glow }} style={{ position: 'absolute', left: 6, right: 6, top: 0, height: 10, background: c.light, filter: 'blur(4px)' }} />
          </div>
          {/* tapa con bisagra atrás */}
          <motion.div
            animate={{ rotateX: lidAngle }}
            transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: state === 'open' ? 120 : 220, damping: state === 'open' ? 11 : 18 }}
            style={{
              position: 'absolute', left: -4, right: -4, top: 0, height: h * 0.4, transformOrigin: '50% 0%',
              borderRadius: `${w * 0.5}px ${w * 0.5}px 6px 6px / ${h * 0.35}px ${h * 0.35}px 6px 6px`,
              background: `repeating-linear-gradient(90deg, rgba(0,0,0,.12) 0 2px, transparent 2px 22px), linear-gradient(${c.wood[0]}, ${c.wood[1]})`,
              boxShadow: `inset 0 0 0 3px ${c.metal}`,
            }}
          >
            <div style={{ position: 'absolute', left: '18%', top: 0, bottom: 0, width: 10, background: c.metal, opacity: 0.85 }} />
            <div style={{ position: 'absolute', right: '18%', top: 0, bottom: 0, width: 10, background: c.metal, opacity: 0.85 }} />
          </motion.div>
        </div>
      )}
      {/* chispas */}
      {state === 'open' && !reduced &&
        Array.from({ length: 12 }, (_, i) => (
          <motion.span
            key={i}
            aria-hidden
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{ x: (Math.random() - 0.5) * w, y: -size * (0.4 + Math.random() * 0.6), opacity: 0, scale: 1.2 }}
            transition={{ duration: 1 + Math.random() * 0.5, ease: 'easeOut', delay: Math.random() * 0.2 }}
            style={{ position: 'absolute', left: '50%', bottom: h * 0.7, width: 6, height: 6, borderRadius: '50%', background: c.light, boxShadow: `0 0 8px ${c.light}` }}
          />
        ))}
    </div>
  );
}

export function Chests(p: ChestsProps): JSX.Element {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<Family | null>(null);
  const [chosen, setChosen] = useState<Family | null>(null);
  const cb = useLatest(p.onChoose);
  const labels = p.labels ?? { tarot: 'Tarot tradicional', spanish: 'Baraja española' };
  const size = Math.min(p.size ?? 200, typeof window !== 'undefined' ? window.innerWidth * 0.4 : 200);

  const choose = (f: Family) => {
    if (chosen) return;
    setChosen(f);
    playSfx('chime');
    setTimeout(() => cb.current(f), reduced ? 150 : 900);
  };

  return (
    <div
      className={['fx-chests', p.className].filter(Boolean).join(' ')}
      role="group"
      aria-label="Elige baraja"
      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'clamp(16px, 6vw, 64px)', ...p.style }}
    >
      {(['tarot', 'spanish'] as const).map((f) => {
        const state = chosen === f ? 'open' : !chosen && hover === f ? 'peek' : 'closed';
        return (
          <motion.button
            key={f}
            type="button"
            className="fx-unbutton"
            aria-label={labels[f]}
            disabled={!!chosen}
            onPointerEnter={() => setHover(f)}
            onPointerLeave={() => setHover((h) => (h === f ? null : h))}
            onFocus={() => setHover(f)}
            onBlur={() => setHover(null)}
            onClick={() => choose(f)}
            animate={{ opacity: chosen && chosen !== f ? 0.35 : 1, scale: chosen && chosen !== f ? 0.92 : 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, maxWidth: '45vw' }}
          >
            <div style={{ width: size, transformOrigin: 'bottom center' }}>
              <Chest family={f} state={state} size={size} label={labels[f]} />
            </div>
            <span style={{ fontSize: 18, color: 'var(--c-gold, #d4a24c)', textAlign: 'center' }}>{labels[f]}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
