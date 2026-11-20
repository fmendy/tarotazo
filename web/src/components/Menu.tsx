import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../state/session';
import { useSound } from '../lib/sound';
import { SUPPORTED } from '../i18n';

/** Selector de idioma con forma de bola de cristal (preparado aunque sólo haya «es»). */
export function LangBall() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [open]);
  return (
    <div className="langball" ref={ref}>
      <button className="iconbtn langball__btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)} title={t('menu.language')}>
        <span className="langball__orb" aria-hidden>{i18n.language.toUpperCase()}</span>
        <span className="sr-only">{t('menu.languageBall')}</span>
      </button>
      {open && (
        <ul className="langball__list" role="listbox" aria-label={t('menu.language')}>
          {SUPPORTED.map((l) => (
            <li key={l} role="option" aria-selected={i18n.language === l}>
              <button className="langball__opt" onClick={() => { void i18n.changeLanguage(l); setOpen(false); }}>
                {t(`languages.${l}`)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Menu() {
  const { t } = useTranslation();
  const screen = useSession((s) => s.screen);
  const adult = useSession((s) => s.adult);
  const openSide = useSession((s) => s.openSide);
  const back = useSession((s) => s.back);
  const reset = useSession((s) => s.reset);
  const { muted, toggle } = useSound();
  const [open, setOpen] = useState(false);
  const side = screen === 'pendulum' || screen === 'titles' || screen === 'legal' || screen === 'privacy';
  const blocked = screen === 'blocked';
  const go = (f: () => void) => () => { setOpen(false); f(); };

  return (
    <header className="topbar">
      <a className="topbar__brand" href="#main" onClick={(e) => { e.preventDefault(); if (side) back(); }}>
        {t('app.name')}
      </a>
      <button className="iconbtn topbar__burger" aria-expanded={open} aria-controls="main-menu" onClick={() => setOpen(!open)}>
        <span aria-hidden>☰</span><span className="sr-only">{open ? t('menu.close') : t('menu.open')}</span>
      </button>
      <nav id="main-menu" className={'topbar__nav' + (open ? ' is-open' : '')} aria-label={t('menu.label')}>
        {side && adult && <button className="navbtn" onClick={go(back)}>{t('menu.home')}</button>}
        <button className="navbtn" disabled={!adult || blocked} aria-current={screen === 'pendulum' ? 'page' : undefined} onClick={go(() => openSide('pendulum'))}>{t('menu.pendulum')}</button>
        <button className="navbtn" disabled={!adult || blocked} aria-current={screen === 'titles' ? 'page' : undefined} onClick={go(() => openSide('titles'))}>{t('menu.titles')}</button>
        <button className="iconbtn" aria-pressed={muted} onClick={toggle} title={muted ? t('menu.unmute') : t('menu.mute')}>
          <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
            {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
          </svg><span className="sr-only">{muted ? t('menu.unmute') : t('menu.mute')}</span>
        </button>
        <LangBall />
        {!blocked && <button className="navbtn navbtn--exit" onClick={go(() => reset('bye'))}>{t('menu.exit')}</button>}
      </nav>
    </header>
  );
}

export function Footer() {
  const { t } = useTranslation();
  const openSide = useSession((s) => s.openSide);
  return (
    <footer className="footer">
      <p className="footer__disc">{t('app.disclaimerShort')}</p>
      <button className="linkbtn" onClick={() => openSide('legal')}>{t('menu.legal')}</button>
      <span aria-hidden> · </span>
      <button className="linkbtn" onClick={() => openSide('privacy')}>{t('menu.privacy')}</button>
    </footer>
  );
}
