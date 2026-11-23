// 2 · Nombre: la vidente lo «escribe» en la bola mientras tecleas y reacciona.
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from '../state/session';
import { useOnboarding } from '../state/content';
import { linesOf, nameReaction } from '../lib/onboarding';
import { Seer } from '../components/Seer';
import { privateInput, Screen } from '../components/common';
import { useDebounced, useReducedMotion } from '../hooks';
import { sfx } from '../lib/sound';

function words(text: string): { text: string; start: number }[] {
  const out: { text: string; start: number }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push({ text: m[0], start: m.index });
  return out;
}
const longest = (text: string) => Math.max(0, ...text.split(/\s+/).map((w) => w.length));

export function CrystalBall(p: { text: string; label: string }) {
  const rm = useReducedMotion();
  return (
    <div className="crystal" role="img" aria-label={p.label}>
      <div className="crystal__glass">
        <div className="crystal__mist" aria-hidden />
        {/* Cada palabra va entera (nowrap): la bola no parte «Centin/ela» (A-7); con nombres largos baja el cuerpo. */}
        <p className={'crystal__text' + (longest(p.text) > 9 ? ' crystal__text--long' : '')} aria-hidden>
          {words(p.text).map((w, wi) => (
            <span key={wi} className="crystal__word">
              <AnimatePresence initial={false}>
                {Array.from(w.text).map((ch, i) => (
                  <motion.span
                    key={w.start + i + ch}
                    initial={rm ? false : { opacity: 0, y: -8, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </AnimatePresence>
            </span>
          ))}
        </p>
      </div>
      <div className="crystal__base" aria-hidden />
    </div>
  );
}

export function Name() {
  const { t } = useTranslation();
  const ob = useOnboarding();
  const stored = useSession((s) => s.name);
  const setName = useSession((s) => s.setName);
  const go = useSession((s) => s.go);
  const [value, setValue] = useState(stored);
  const debounced = useDebounced(value, 550);
  const question = useMemo(() => linesOf(ob?.nombre?.pregunta) ?? t('name.title'), [ob, t]);
  const [reaction, setReaction] = useState<string | null>(null);

  useEffect(() => {
    if (!debounced.trim()) { setReaction(null); return; }
    setReaction(nameReaction(ob, debounced) ?? null);
    sfx('chime');
  }, [debounced, ob]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setName(value.trim());
    go('age');
  }
  function skip() {
    setName('');
    go('age');
  }

  return (
    <Screen title={question} className="name">
      <div className="name__stage">
        <Seer pose={reaction ? 'sorpresa' : 'bola'} say={reaction ?? (value ? t('name.thinking') : null)} />
        <CrystalBall text={value} label={t('name.ballLabel')} />
      </div>
      <form className="card-panel" onSubmit={submit}>
        <label className="field">
          <span className="field__label">{t('name.label')}</span>
          <input className="input input--big" value={value} maxLength={40} {...privateInput('words')} name="arcana-n"
            placeholder={t('name.placeholder')} onChange={(e) => setValue(e.target.value)} />
        </label>
        <p className="hint">{t('name.hint')}</p>
        <div className="row">
          <button className="btn btn--primary" type="submit" disabled={!value.trim()}>{t('app.continue')}</button>
          <button className="btn btn--ghost" type="button" onClick={skip}>{t('name.skip')}</button>
        </div>
      </form>
    </Screen>
  );
}
