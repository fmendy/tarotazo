import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiFailure } from '../lib/api';

/**
 * Atributos para campos con datos personales o privados (nombre, pregunta, opciones): sin
 * autocompletar, sin autocorrección ni corrector, para que el teclado (Gboard) no sugiera ni aprenda
 * lo escrito (A-5). Es lo máximo que permite HTML estándar en un WebView.
 */
export function privateInput(capitalize: 'words' | 'sentences' | 'none' = 'sentences') {
  return {
    autoComplete: 'off',
    autoCorrect: 'off',
    autoCapitalize: capitalize,
    spellCheck: false,
    inputMode: 'text' as const,
    'aria-autocomplete': 'none' as const,
  };
}

/** Imagen que degrada con elegancia si el fichero aún no existe. */
export function Img(p: { src: string; alt: string; className?: string; style?: CSSProperties; fallback?: ReactNode; decorative?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [p.src]);
  if (failed) {
    return (
      <span className={'img-fallback ' + (p.className ?? '')} style={p.style} role={p.decorative ? undefined : 'img'} aria-label={p.decorative ? undefined : p.alt} aria-hidden={p.decorative || undefined}>
        {p.fallback ?? <span className="img-fallback__star" aria-hidden>✶</span>}
      </span>
    );
  }
  return <img src={p.src} alt={p.decorative ? '' : p.alt} className={p.className} style={p.style} onError={() => setFailed(true)} draggable={false} />;
}

export function Disclaimer(p: { short?: boolean; text?: string }) {
  const { t } = useTranslation();
  return <p className="disclaimer" role="note">{p.text ?? (p.short ? t('app.disclaimerShort') : t('app.disclaimer'))}</p>;
}

export function Loading() {
  const { t } = useTranslation();
  return <p className="loading" role="status" aria-live="polite"><span className="loading__ball" aria-hidden /> {t('app.loading')}</p>;
}

export function ErrorBox(p: { error: unknown; onRetry?(): void }) {
  const { t } = useTranslation();
  const limited = p.error instanceof ApiFailure && p.error.status === 429;
  return (
    <div className="error-box" role="alert">
      <p>{limited ? t('app.rateLimited') : t('app.error')}</p>
      {p.onRetry && <button className="btn" onClick={p.onRetry}>{t('app.retry')}</button>}
    </div>
  );
}

/**
 * Lleva el foco al h1 de la pantalla ENTRANTE al montarse (QA-04). Con AnimatePresence en modo
 * «wait» la pantalla nueva se monta cuando la saliente ya se ha ido, así que no hay carrera.
 * Si el usuario ya ha puesto el foco en un control de la pantalla nueva, no se lo quitamos.
 */
export function useAutofocus<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    let tries = 0;
    let id = 0;
    const tick = () => {
      const el = ref.current;
      if (!el || !el.isConnected) return;
      const active = document.activeElement as HTMLElement | null;
      const userInside = active && active !== document.body && el.closest('section')?.contains(active) && active !== el;
      if (userInside) return;
      el.focus({ preventScroll: true });
      if (document.activeElement !== el && tries++ < 20) id = window.setTimeout(tick, 50);
    };
    id = window.setTimeout(tick, 30);
    return () => clearTimeout(id);
  }, []);
  return ref;
}

export function Screen(p: { title: string; children: ReactNode; className?: string; titleHidden?: boolean }) {
  const h1 = useAutofocus<HTMLHeadingElement>();
  return (
    <section className={'screen ' + (p.className ?? '')} aria-labelledby="screen-title">
      <h1 ref={h1} id="screen-title" className={p.titleHidden ? 'sr-only' : 'screen__title'} tabIndex={-1} data-autofocus>
        {p.title}
      </h1>
      {p.children}
    </section>
  );
}
