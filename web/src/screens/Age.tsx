// 3 · Edad: confirma la fecha (si ya se dio) o la pide; muestra signo, década y número de vida.
import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useSession } from '../state/session';
import { useOnboarding } from '../state/content';
import { usePersonalVars } from '../state/vars';
import { ageReactions, linesOf } from '../lib/onboarding';
import { isValidDate } from '../lib/astro';
import { Seer } from '../components/Seer';
import { Screen } from '../components/common';
import { useReducedMotion } from '../hooks';
import { sfx } from '../lib/sound';

function Candles(p: { count: number }) {
  const rm = useReducedMotion();
  const { t } = useTranslation();
  return (
    <div className="candles" role="img" aria-label={t('age.candles', { count: p.count })}>
      {Array.from({ length: p.count }, (_, i) => (
        <span key={i} className="candle" style={{ animationDelay: rm ? '0s' : `${i * 0.35}s` }}>
          <span className="candle__flame" style={{ animationDelay: rm ? '0s' : `${i * 0.35}s` }} />
        </span>
      ))}
    </div>
  );
}

function Results() {
  const { t } = useTranslation();
  const s = useSession();
  const rm = useReducedMotion();
  const ob = useOnboarding();
  const vars = usePersonalVars();
  const lines = useMemo(
    () => ageReactions(ob, { edad: s.age, decada: s.decada, signo: s.signo, numeroVida: s.numeroVida, hasDate: !!s.birthDate }, undefined, vars),
    [ob, s.age, s.decada, s.signo, s.numeroVida, s.birthDate], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const item = (i: number) => ({
    initial: rm ? false : { opacity: 0, rotateY: 90, scale: 0.6 },
    animate: { opacity: 1, rotateY: 0, scale: 1 },
    transition: { delay: rm ? 0 : 0.4 + i * 0.5, duration: 0.6 },
  });
  return (
    <div className="age__results">
      <Candles count={Math.max(1, Math.min(10, Math.round((s.decada ?? 10) / 10)))} />
      <dl className="stats">
        <motion.div className="stat" {...item(0)}><dt>{t('age.ageLabel')}</dt><dd>{t('age.years', { count: s.age ?? 0 })}</dd></motion.div>
        <motion.div className="stat" {...item(1)}><dt>{t('age.decade')}</dt><dd>{t('age.decadeValue', { decade: s.decada })}</dd></motion.div>
        <motion.div className="stat" {...item(2)}>
          <dt>{t('age.sign')}</dt><dd>{s.signo ? t(`signs.${s.signo}`) : '—'}</dd>
        </motion.div>
        <motion.div className="stat stat--big" {...item(3)}>
          <dt>{t('age.lifeNumber')}</dt><dd>{s.numeroVida ?? '?'}</dd>
        </motion.div>
      </dl>
      <Seer pose="piensa" say={lines.join(' ') || (s.signo ? null : t('age.noSign'))} />
      <button className="btn btn--primary" onClick={() => s.go('province')}>{t('app.continue')}</button>
    </div>
  );
}

export function Age() {
  const { t } = useTranslation();
  const ob = useOnboarding();
  const s = useSession();
  const [mode, setMode] = useState<'confirm' | 'date' | 'age' | 'done'>(s.birthDate ? 'confirm' : s.age !== null ? 'done' : 'date');
  const [d, setD] = useState(''); const [m, setM] = useState(''); const [y, setY] = useState('');
  const [ageVal, setAgeVal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const months = t('age.months', { returnObjects: true }) as string[];
  const thisYear = new Date().getFullYear();
  const question = useMemo(() => linesOf(ob?.edad?.pregunta) ?? t('age.title'), [ob, t]);

  function submitDate(e: FormEvent) {
    e.preventDefault();
    const Y = +y, M = +m, D = +d;
    if (!isValidDate(Y, M, D)) { setError(t('gate.invalidDate')); return; }
    const r = s.setBirthDate(`${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (r === 'invalid') setError(t('gate.invalidDate'));
    if (r === 'ok') { sfx('candle'); setMode('done'); }
  }
  function submitAge(e: FormEvent) {
    e.preventDefault();
    const r = s.setAgeOnly(Number(ageVal));
    if (r === 'invalid') setError(t('gate.invalidDate'));
    if (r === 'ok') { sfx('candle'); setMode('done'); }
  }

  if (mode === 'done') return <Screen title={question} className="age"><Results /></Screen>;

  if (mode === 'confirm' && s.birthDate) {
    const [Y, M, D] = s.birthDate.split('-').map(Number);
    return (
      <Screen title={t('age.confirmTitle')} className="age">
        <Seer pose="bola" say={t('age.dateFormat', { d: D, m: months[(M ?? 1) - 1], y: Y })} typewriter={false} />
        <div className="row">
          <button className="btn btn--primary" onClick={() => { sfx('candle'); setMode('done'); }}>{t('age.confirm')}</button>
          <button className="btn btn--ghost" onClick={() => setMode('date')}>{t('age.change')}</button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title={question} className="age">
      <Seer pose="piensa" say={null} compact />
      <div className="hourglass" aria-hidden><span className="hourglass__sand" /></div>
      {mode === 'date' ? (
        <form className="card-panel" onSubmit={submitDate} noValidate>
          <fieldset className="datefields">
            <legend className="field__label">{t('age.dateLabel')}</legend>
            <label className="field"><span className="field__label">{t('age.day')}</span>
              <select className="input" value={d} onChange={(e) => { setD(e.target.value); setError(null); }} required>
                <option value="">—</option>
                {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
              </select></label>
            <label className="field"><span className="field__label">{t('age.month')}</span>
              <select className="input" value={m} onChange={(e) => { setM(e.target.value); setError(null); }} required>
                <option value="">—</option>
                {months.map((name, i) => <option key={i} value={i + 1}>{name}</option>)}
              </select></label>
            <label className="field"><span className="field__label">{t('age.year')}</span>
              <select className="input" value={y} onChange={(e) => { setY(e.target.value); setError(null); }} required>
                <option value="">—</option>
                {Array.from({ length: 110 }, (_, i) => thisYear - i).map((yy) => <option key={yy} value={yy}>{yy}</option>)}
              </select></label>
          </fieldset>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="row">
            <button className="btn btn--primary" type="submit" disabled={!d || !m || !y}>{t('app.continue')}</button>
            <button className="btn btn--ghost" type="button" onClick={() => { setMode('age'); setError(null); }}>{t('age.onlyAge')}</button>
          </div>
        </form>
      ) : (
        <form className="card-panel" onSubmit={submitAge} noValidate>
          <label className="field"><span className="field__label">{t('age.ageLabel')}</span>
            <input className="input input--big" type="number" inputMode="numeric" min={1} max={120} value={ageVal}
              onChange={(e) => { setAgeVal(e.target.value); setError(null); }} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="row">
            <button className="btn btn--primary" type="submit" disabled={!ageVal}>{t('app.continue')}</button>
            <button className="btn btn--ghost" type="button" onClick={() => setMode('date')}>{t('age.useDate')}</button>
          </div>
        </form>
      )}
    </Screen>
  );
}
