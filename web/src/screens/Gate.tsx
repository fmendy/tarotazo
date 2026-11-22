// 1 · Portada y puerta +18.
import { useEffect, useState, type FormEvent } from 'react';
import { hideSplash } from '../lib/native';
import { OFFLINE } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useSession } from '../state/session';
import { useOnboarding } from '../state/content';
import { Seer } from '../components/Seer';
import { Disclaimer, useAutofocus } from '../components/common';
import { sfx } from '../lib/sound';
import { useReducedMotion } from '../hooks';

export function Gate() {
  const { t } = useTranslation();
  const ob = useOnboarding();
  const passGate = useSession((s) => s.passGate);
  const block = useSession((s) => s.block);
  const rm = useReducedMotion();
  const h1 = useAutofocus<HTMLHeadingElement>();
  useEffect(() => { hideSplash(); }, []);
  const [date, setDate] = useState('');
  const [declared, setDeclared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; // local, no UTC (QA-15)
  const pu = ob?.puerta;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!date && !declared) { setError(t('gate.needOne')); return; }
    const r = passGate(date || null);
    if (r === 'invalid') setError(t('gate.invalidDate'));
    else if (r === 'ok') sfx('bell');
  }

  return (
    <section className="screen gate" aria-labelledby="screen-title">
      <motion.div
        className="gate__hero"
        initial={rm ? false : { opacity: 0, y: 30, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      >
        <p className="gate__brand">{t('app.name')}</p>
        <p className="gate__tagline">{t('app.tagline')}</p>
        <Seer pose="saludo" say={pu?.titulo ?? t('gate.title')} />
      </motion.div>

      <motion.form
        className="card-panel gate__form"
        onSubmit={submit}
        noValidate
        initial={rm ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: rm ? 0 : 0.9, duration: 0.6 }}
      >
        <h1 ref={h1} id="screen-title" className="screen__title" tabIndex={-1} data-autofocus>{pu?.pregunta ?? t('gate.question')}</h1>
        <p className="badge-18" aria-label={t('gate.rating')}>+18</p>

        <label className="field">
          <span className="field__label">{pu?.fecha ?? t('gate.dateLabel')}</span>
          <input type="date" className="input" value={date} max={today} min="1900-01-01"
            onChange={(e) => { setDate(e.target.value); setError(null); }} autoComplete="off" />
        </label>
        <p className="gate__or">{t('gate.or')}</p>
        <label className="check">
          <input type="checkbox" checked={declared} onChange={(e) => { setDeclared(e.target.checked); setError(null); }} />
          <span>{t('gate.declare')}</span>
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="row">
          <button type="submit" className="btn btn--primary">{pu?.si ?? t('gate.enter')}</button>
          <button type="button" className="btn btn--ghost" onClick={block}>{pu?.no ?? t('gate.no')}</button>
        </div>
        <Disclaimer text={pu?.aviso ?? t('app.disclaimer')} />
        <p className="hint">{t(OFFLINE ? 'gate.privacyNoteApp' : 'gate.privacyNote')}</p>
      </motion.form>
    </section>
  );
}
