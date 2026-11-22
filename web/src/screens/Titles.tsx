// Titulaciones: muro de diplomas sobre papel pintado barroco.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { DustStamp } from '../fx';
import { getTitles } from '../state/content';
import { useAsync, useReducedMotion } from '../hooks';
import { ErrorBox, Img, Loading, Screen } from '../components/common';
import { Seer } from '../components/Seer';
import { sfx } from '../lib/sound';
import type { Title } from '../lib/types';

function Diploma(p: { title: Title; active: boolean; onActivate(): void; index: number }) {
  const { t } = useTranslation();
  const rm = useReducedMotion();
  const [stamp, setStamp] = useState(0);
  const tl = p.title;
  return (
    <motion.li
      className={'diploma frame--' + tl.frame + (p.active ? ' is-active' : '')}
      initial={rm ? false : { y: -20, scale: 0.96, rotate: (p.index % 2 ? 2 : -2) }}
      animate={{ y: 0, scale: 1, rotate: p.index % 3 === 0 ? -1.5 : p.index % 3 === 1 ? 1 : 0 }}
      transition={{ delay: rm ? 0 : p.index * 0.08, type: 'spring', stiffness: 120 }}
      onMouseEnter={p.onActivate}
    >
      <div className="diploma__frame" tabIndex={0} onFocus={p.onActivate} aria-describedby={`dip-${tl.id}`}>
        <Img className="diploma__frameimg" src={`/art/frames/${tl.frame}.svg`} alt="" decorative fallback={<span className="diploma__framecss" aria-hidden />} />
        <div className="diploma__paper">
          <h2 className="diploma__title">{tl.titulo}</h2>
          <p className="diploma__center">{tl.centro}</p>
          <p className="diploma__year">{t('titles.year', { year: tl.anio })}</p>
        </div>
        <div className="diploma__stamp"><DustStamp trigger={stamp} label={tl.sello} /></div>
      </div>
      <p id={`dip-${tl.id}`} className="sr-only">{tl.comentario}</p>
      <button className="btn btn--small" onClick={() => { setStamp((n) => n + 1); sfx('stamp'); p.onActivate(); }}>{t('titles.stamp')}</button>
    </motion.li>
  );
}

export function Titles() {
  const { t, i18n } = useTranslation();
  const titles = useAsync(getTitles, [i18n.language]);
  const [active, setActive] = useState<Title | null>(null);
  return (
    <Screen title={t('titles.title')} className="titles">
      <div className="titles__wall">
        <div className="titles__seer">
          <Seer pose={active ? 'rie' : 'saludo'} say={active ? `«${active.comentario}»` : t('titles.hover')} />
        </div>
        <p className="hint">{t('titles.intro')}</p>
        {titles.loading && <Loading />}
        {!!titles.error && <ErrorBox error={titles.error} onRetry={titles.reload} />}
        {titles.data && titles.data.titles.length === 0 && <p>{t('titles.empty')}</p>}
        {titles.data && (
          <ul className="diplomas">
            {titles.data.titles.map((tl, i) => (
              <Diploma key={tl.id} title={tl} index={i} active={active?.id === tl.id} onActivate={() => setActive(tl)} />
            ))}
          </ul>
        )}
      </div>
    </Screen>
  );
}
