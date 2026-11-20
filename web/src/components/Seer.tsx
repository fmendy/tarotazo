// Madame Remedios con su bocadillo.
import { useTranslation } from 'react-i18next';
import { TypewriterText } from '../fx';
import { Img } from './common';
import { useReducedMotion } from '../hooks';

export type Pose = 'saludo' | 'piensa' | 'sorpresa' | 'rie' | 'bola';

export function Seer(p: { pose?: Pose; say?: string | null; compact?: boolean; typewriter?: boolean; onSaid?(): void }) {
  const { t } = useTranslation();
  const rm = useReducedMotion();
  const pose = p.pose ?? 'saludo';
  return (
    <figure className={'seer' + (p.compact ? ' seer--compact' : '')}>
      <Img
        className="seer__img"
        src={`/art/remedios/${pose}.svg`}
        alt={t(`seer.alt.${pose}`)}
        fallback={<span className="seer__placeholder" aria-hidden><span className="seer__turban" /><span className="seer__face" /></span>}
      />
      {p.say ? (
        <figcaption className="bubble" aria-live="polite">
          <span className="sr-only">{t('seer.says')}: </span>
          {p.typewriter !== false && !rm ? <TypewriterText key={p.say} text={p.say} onDone={p.onSaid} /> : <span>{p.say}</span>}
        </figcaption>
      ) : null}
    </figure>
  );
}
