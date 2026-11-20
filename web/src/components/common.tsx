import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiFailure } from '../lib/api';

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

export function Screen(p: { title: string; children: ReactNode; className?: string; titleHidden?: boolean }) {
  return (
    <section className={'screen ' + (p.className ?? '')} aria-labelledby="screen-title">
      <h1 id="screen-title" className={p.titleHidden ? 'sr-only' : 'screen__title'} tabIndex={-1} data-autofocus>
        {p.title}
      </h1>
      {p.children}
    </section>
  );
}
