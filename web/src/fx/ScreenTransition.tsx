// Transición entre pantallas (AnimatePresence): niebla que se disipa, cortina o naipe.
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import type { CSSProperties, JSX, ReactNode } from 'react';
import { useReducedMotion } from './hooks';

export type TransitionVariant = 'mist' | 'curtain' | 'card';

export interface ScreenTransitionProps {
  id: string;
  children: ReactNode;
  /** Estilo de transición (por defecto 'mist'). */
  variant?: TransitionVariant;
  className?: string;
  style?: CSSProperties;
}

const VARIANTS: Record<TransitionVariant, Variants> = {
  mist: {
    initial: { opacity: 0, y: 24, scale: 0.985 },
    enter: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.2, 0.7, 0.2, 1] } },
    exit: { opacity: 0, y: -16, scale: 1.015, transition: { duration: 0.3, ease: 'easeIn' } },
  },
  curtain: {
    initial: { opacity: 0, clipPath: 'inset(0 50% 0 50%)' },
    enter: { opacity: 1, clipPath: 'inset(0 0% 0 0%)', transition: { duration: 0.6, ease: [0.6, 0, 0.2, 1] } },
    exit: { opacity: 0, clipPath: 'inset(0 50% 0 50%)', transition: { duration: 0.35, ease: 'easeIn' } },
  },
  card: {
    initial: { opacity: 0, rotateY: -70, transformPerspective: 1200 },
    enter: { opacity: 1, rotateY: 0, transformPerspective: 1200, transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] } },
    exit: { opacity: 0, rotateY: 70, transformPerspective: 1200, transition: { duration: 0.3, ease: 'easeIn' } },
  },
};

const REDUCED: Variants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export function ScreenTransition(p: ScreenTransitionProps): JSX.Element {
  const reduced = useReducedMotion();
  const v = reduced ? REDUCED : VARIANTS[p.variant ?? 'mist'];
  return (
    <AnimatePresence mode="wait" initial>
      <motion.div key={p.id} className={p.className} style={p.style} variants={v} initial="initial" animate="enter" exit="exit">
        {p.children}
      </motion.div>
    </AnimatePresence>
  );
}
