// Sello «compulsado» que cae, golpea y levanta polvo. Se dispara cada vez que cambia `trigger` (> 0).
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type JSX } from 'react';
import { useImageAvailable, useReducedMotion } from './hooks';
import { playSfx } from './sound';

export interface DustStampProps {
  trigger: number;
  label: string;
  /**
   * Tamaño máximo del sello en px (por defecto 150). El tamaño real se ajusta al marco que lo
   * contiene (el primer antepasado no absoluto) para no salirse en móvil.
   */
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<number | null>(null);
  // Ajuste al marco (A-7): el sello + su leyenda caben siempre dentro del contenedor posicionado.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let frame: HTMLElement | null = el.parentElement;
    while (frame && frame !== document.body) {
      const pos = getComputedStyle(frame).position;
      if (pos !== 'absolute' && pos !== 'fixed' && frame.clientWidth > 0) break;
      frame = frame.parentElement;
    }
    if (!frame || frame === document.body) return;
    const f = frame;
    const measure = () => {
      const w = f.clientWidth;
      const h = f.clientHeight;
      if (!w) return;
      setFit(Math.max(56, Math.min(w * 0.34, h ? h * 0.42 : Infinity)));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(f);
    return () => ro.disconnect();
  }, []);
  const size = Math.round(Math.min(p.size ?? 150, fit ?? Infinity));
  const circle = size * 0.74;
  const labelFont = Math.max(10, size * 0.085);
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
      ref={rootRef}
      style={{ position: 'relative', width: size, height: circle + labelFont * 1.2 * 3 + 4, maxWidth: '100%', ...p.style }}
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
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            {hasImg ? (
              <img src={src} alt="Sello: compulsado" style={{ width: circle, height: circle, objectFit: 'contain', flex: 'none' }} />
            ) : (
              <div
                role="img"
                aria-label="Sello: compulsado"
                style={{
                  width: circle,
                  height: circle,
                  flex: 'none',
                  borderRadius: '50%',
                  border: `${Math.max(3, size * 0.035)}px double rgba(178,34,52,0.85)`,
                  color: 'rgba(178,34,52,0.88)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  fontSize: circle * 0.15,
                  textTransform: 'uppercase',
                  mixBlendMode: 'multiply',
                  background: 'radial-gradient(circle, transparent 55%, rgba(178,34,52,0.08) 56%)',
                }}
              >
                {p.stampText ?? 'Compulsado'}
              </div>
            )}
            <div
              title={p.label}
              style={{
                width: '100%', textAlign: 'center', fontSize: labelFont, lineHeight: 1.2, color: 'rgba(178,34,52,0.95)', fontStyle: 'italic',
                overflowWrap: 'anywhere', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}
            >
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
            initial={{ x: 0, y: 0, opacity: 0.8, scale: 0.4 }}
            animate={{ x: d.x, y: d.y, opacity: 0, scale: 1.6 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: d.delay }}
            style={{ position: 'absolute', left: '50%', top: circle * 0.62, width: d.s, height: d.s, marginLeft: -d.s / 2, marginTop: -d.s / 2, borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,200,170,0.75), rgba(220,200,170,0))', pointerEvents: 'none' }}
          />
        ))}
    </motion.div>
  );
}
