// Pantallas sencillas: bloqueo por minoría de edad, despedida y textos legales.
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useSession } from '../state/session';
import { useOnboarding } from '../state/content';
import { linesOf } from '../lib/onboarding';
import { Seer } from '../components/Seer';
import { Screen } from '../components/common';
import { useMemo } from 'react';

export function Blocked() {
  const { t } = useTranslation();
  const ob = useOnboarding();
  const text = useMemo(() => linesOf(ob?.menor) ?? t('blocked.text'), [ob, t]);
  return (
    <Screen title={t('blocked.title')} className="blocked">
      <Seer pose="rie" say={text} />
      <p className="hint">{t('blocked.note')}</p>
    </Screen>
  );
}

export function Bye() {
  const { t } = useTranslation();
  const go = useSession((s) => s.go);
  return (
    <Screen title={t('bye.title')} className="bye">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        <Seer pose="saludo" say={t('bye.text')} />
      </motion.div>
      <button className="btn btn--primary" onClick={() => go('gate')}>{t('bye.again')}</button>
    </Screen>
  );
}

function LegalText(p: { ns: 'legal' | 'privacy' }) {
  const { t } = useTranslation();
  const back = useSession((s) => s.back);
  const body = t(`${p.ns}.body`, { returnObjects: true }) as string[];
  return (
    <Screen title={t(`${p.ns}.title`)} className="legal">
      <p className="legal__pending" role="note">{t(`${p.ns}.pending`)}</p>
      <div className="card-panel legal__body">
        {body.map((para, i) => <p key={i}>{para}</p>)}
      </div>
      <button className="btn" onClick={back}>{t('app.back')}</button>
    </Screen>
  );
}
export const Legal = () => <LegalText ns="legal" />;
export const Privacy = () => <LegalText ns="privacy" />;
