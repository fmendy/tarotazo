import type { CSSProperties, JSX } from 'react';

/** Carta (reverso o anverso) con imagen; si la imagen no existe se ve un reverso procedural. */
export function CardImage(p: { src?: string; front?: boolean; className?: string; style?: CSSProperties; alt?: string }): JSX.Element {
  const style = { ...(p.src ? { ['--fx-card-img' as string]: `url("${p.src}")` } : null), ...p.style } as CSSProperties;
  return (
    <div
      className={['fx-card', p.front ? 'fx-card--front' : '', p.className ?? ''].join(' ')}
      style={style}
      role={p.alt ? 'img' : undefined}
      aria-label={p.alt}
      aria-hidden={p.alt ? undefined : true}
    />
  );
}

export const CARD_RATIO = 12 / 7;
