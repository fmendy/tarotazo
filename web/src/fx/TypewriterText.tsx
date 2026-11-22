// Texto a máquina con cursor. Reserva el espacio del texto completo (sin saltos de maquetación),
// pausa en la puntuación, se completa al hacer clic y, con movimiento reducido, sale entero.
import { useEffect, useRef, useState, type CSSProperties, type JSX } from 'react';
import { useLatest, useReducedMotion } from './hooks';

export interface TypewriterTextProps {
  text: string;
  /** Caracteres por segundo (por defecto 38). */
  speed?: number;
  onDone?(): void;
  /** Clic para completar (por defecto true). */
  skippable?: boolean;
  /** Mostrar cursor (por defecto true). */
  cursor?: boolean;
  /** Etiqueta HTML (por defecto span). */
  as?: 'span' | 'p' | 'div';
  className?: string;
  style?: CSSProperties;
}

const pauseFor = (ch: string) => (ch === '.' || ch === '!' || ch === '?' || ch === '…' ? 9 : ch === ',' || ch === ';' || ch === ':' ? 4 : 0);

export function TypewriterText(p: TypewriterTextProps): JSX.Element {
  const reduced = useReducedMotion();
  const chars = Array.from(p.text); // respeta emojis / pares sustitutos
  const [n, setN] = useState(reduced ? chars.length : 0);
  const done = useLatest(p.onDone);
  const skip = useRef(false);

  useEffect(() => {
    skip.current = false;
    if (reduced || chars.length === 0) {
      setN(chars.length);
      const t = setTimeout(() => done.current?.(), 0);
      return () => clearTimeout(t);
    }
    setN(0);
    const cps = Math.max(1, p.speed ?? 38);
    let i = 0;
    let budget = 0;
    let last = 0;
    let raf = 0;
    let wait = 0;
    const tick = (now: number) => {
      if (!last) last = now;
      budget += ((now - last) / 1000) * cps;
      last = now;
      while (budget >= 1 && i < chars.length) {
        if (wait > 0) { wait--; budget--; continue; }
        i++;
        budget--;
        wait = pauseFor(chars[i - 1]) * (cps / 38);
      }
      if (skip.current) i = chars.length;
      setN(i);
      if (i >= chars.length) {
        done.current?.();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [p.text, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const Tag = p.as ?? 'span';
  const finished = n >= chars.length;
  return (
    <Tag
      className={['fx-tw', p.className].filter(Boolean).join(' ')}
      style={{ cursor: p.skippable !== false && !finished ? 'pointer' : undefined, ...p.style }}
      onClick={() => { if (p.skippable !== false) skip.current = true; }}
    >
      {/* texto completo para lectores de pantalla (QA-03): sin role="text" ni aria-label en un genérico */}
      <span className="fx-sr">{p.text}</span>
      <span aria-hidden>{chars.slice(0, n).join('')}</span>
      {p.cursor !== false && <span aria-hidden className={`fx-tw__cursor ${finished ? 'is-done' : ''}`} />}
      <span aria-hidden className="fx-tw__rest">{chars.slice(n).join('')}</span>
    </Tag>
  );
}
