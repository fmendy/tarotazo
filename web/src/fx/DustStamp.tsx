// Sello «compulsado» que cae, golpea y levanta polvo. Se dispara cada vez que cambia `trigger` (> 0).
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useEffect, useMemo, useState, type CSSProperties, type JSX } from 'react';
import { useImageAvailable, useReducedMotion } from './hooks';
import { playSfx } from './sound';

export interface DustStampProps {
  trigger: number;
  label: string;
  /** Tamaño del sello en px (por defecto 150). */
  size?: number;
  /** Imagen del sello (por defecto /art/stamps/compulsado.svg si existe). */
  image?: string;
  /** Texto del sello procedural (por defecto «COMPULSADO»). */
  stampText?: string;
  className?: string;
  style?: CSSProperties;
}

export function DustStamp(p: DustStampProps): JSX.Element {
  const reduced = useReducedMotion();
  const src = p.image ?? '/art/stamps/compulsado.svg';
  const hasImg = useImageAvailable(src);
  const size = p.size ?? 150;
  const [shake, setShake] = useState(0);
  const controls = useAnimationControls();
  const tilt = useMemo(() => -12 + ((p.trigger * 37) % 9), [p.trigger]);

  useEffect(() => {
    if (p.trigger <= 0) return;
    const t = setTimeout(() => {
      playSfx('stamp');
      setShake((s) => s + 1);
      if (!reduced) void controls.start({ x: [0, -4, 4, -2, 0], y: [0, 3, -1, 0], transition: { duration: 0.25 } });
    }, reduced ? 0 : 380);
    return () => clearTimeout(t);
  }, [p.trigger, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const dust = useMemo(
    () =>
      Array.from({ length: reduced ? 0 : 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
        const d = size * (0.55 + Math.random() * 0.45);
        return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.6, s: 6 + Math.random() * 14, delay: Math.random() * 0.08 };
      }),
    [shake, reduced, size],
  );

  return (
    <motion.div
      className={['fx-stamp', p.className].filter(Boolean).join(' ')}
      style={{ position: 'relative', width: size, height: size, ...p.style }}
      animate={controls}
      aria-live="polite"
    >
      <AnimatePresence>
        {p.trigger > 0 && (
          <motion.div
            key={p.trigger}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 2.6, rotate: tilt - 25, y: -size * 0.6 }}
            animate={{ opacity: 1, scale: 1, rotate: tilt, y: 0 }}
            transition={reduced ? { duration: 0.15 } : { duration: 0.38, ease: [0.55, 0, 0.9, 0.4] }}
            style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}
          >
            {hasImg ? (
              <img src={src} alt="Sello: compulsado" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div
                role="img"
                aria-label="Sello: compulsado"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: `${Math.max(3, size * 0.035)}px double rgba(178,34,52,0.85)`,
                  color: 'rgba(178,34,52,0.88)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  fontSize: size * 0.13,
                  textTransform: 'uppercase',
                  mixBlendMode: 'multiply',
                  background: 'radial-gradient(circle, transparent 55%, rgba(178,34,52,0.08) 56%)',
                }}
              >
                {p.stampText ?? 'Compulsado'}
              </div>
            )}
            <div style={{ position: 'absolute', top: '100%', left: '-30%', right: '-30%', marginTop: 6, textAlign: 'center', fontSize: Math.max(11, size * 0.09), color: 'rgba(178,34,52,0.95)', fontStyle: 'italic', transform: 'rotate(2deg)' }}>
              {p.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {shake > 0 &&
        dust.map((d, i) => (
          <motion.span
            key={`${shake}-${i}`}
            aria-hidden
            initial={{ x: 0, y: size * 0.1, opacity: 0.8, scale: 0.4 }}
            animate={{ x: d.x, y: d.y + size * 0.1, opacity: 0, scale: 1.6 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: d.delay }}
            style={{ position: 'absolute', left: '50%', top: '50%', width: d.s, height: d.s, marginLeft: -d.s / 2, marginTop: -d.s / 2, borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,200,170,0.75), rgba(220,200,170,0))', pointerEvents: 'none' }}
          />
        ))}
    </motion.div>
  );
}
