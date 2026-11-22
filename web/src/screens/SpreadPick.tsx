// 6 · Tirada, tema y pregunta. La pregunta NUNCA sale de este componente (estado local).
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useSession } from '../state/session';
import { getSpreads } from '../state/content';
import { useAsync, useReducedMotion } from '../hooks';
import { ErrorBox, Loading, Screen } from '../components/common';
import { Seer } from '../components/Seer';
import { TEMAS } from '../lib/types';

export function SpreadPick() {
  const { t, i18n } = useTranslation();
  const s = useSession();
  const rm = useReducedMotion();
  const spreads = useAsync(() => getSpreads(s.deck ?? 'tarot'), [s.deck, i18n.language]);
  // Sólo en memoria de este componente. No se envía, no se guarda, se pierde al salir.
  const [question, setQuestion] = useState('');

  return (
    <Screen title={t('spread.title')} className="spreadpick">
      {spreads.loading && <Loading />}
      {!!spreads.error && <ErrorBox error={spreads.error} onRetry={spreads.reload} />}
      {spreads.data && (
        <div className="spreadgrid" role="radiogroup" aria-label={t('spread.title')}>
          {spreads.data.map((sp, i) => (
            <motion.button
              key={sp.id}
              role="radio"
              aria-checked={s.spread === sp.id}
              className={'spreadcard' + (s.spread === sp.id ? ' is-selected' : '')}
              onClick={() => s.setSpread(sp.id)}
              initial={rm ? false : { opacity: 0, y: 20, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: rm ? 0 : i * 0.07 }}
              whileHover={rm ? undefined : { y: -6 }}
            >
              <span className="spreadcard__pips" aria-hidden>
                {Array.from({ length: Math.min(sp.size, 10) }, (_, k) => <span key={k} className="pip" />)}
              </span>
              <span className="spreadcard__name">{sp.name}</span>
              <span className="spreadcard__size">{t('spread.cards', { count: sp.size })}</span>
              <span className="spreadcard__desc">{sp.description}</span>
            </motion.button>
          ))}
        </div>
      )}

      <fieldset className="topics">
        <legend className="field__label">{t('spread.topics')}</legend>
        <div className="row">
          {TEMAS.map((tm) => (
            <button key={tm} type="button" className={'chip' + (s.tema === tm ? ' is-selected' : '')} aria-pressed={s.tema === tm} onClick={() => s.setTema(tm)}>
              {t(`topics.${tm}`)}
            </button>
          ))}
        </div>
        {s.tema === 'salud' && <p className="health-note" role="note">{t('spread.healthNote')}</p>}
      </fieldset>

      <div className="field question">
        <label className="field__label" htmlFor="spread-q">{t('spread.questionLabel')}</label>
        <textarea id="spread-q" className="input" rows={2} maxLength={200} value={question} autoComplete="off" spellCheck={false}
          aria-describedby="spread-q-hint" placeholder={t('spread.questionPlaceholder')} onChange={(e) => setQuestion(e.target.value)} />
        <span className="hint" id="spread-q-hint">{t('spread.questionHint')}</span>
      </div>

      <Seer pose="bola" compact say={s.spread ? null : t('spread.pickSpread')} />
      <button className="btn btn--primary btn--big" disabled={!s.spread} onClick={() => s.go('shuffle')}>{t('spread.start')}</button>
    </Screen>
  );
}
