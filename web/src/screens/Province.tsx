// 4 · Provincia de nacimiento: mapa SVG inline + lista accesible + «Nací fuera de España».
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useSession } from '../state/session';
import { useOnboarding, useProvinces } from '../state/content';
import { usePersonalVars } from '../state/vars';
import { linesOf, provinceReaction } from '../lib/onboarding';
import { stripUnresolved } from '../lib/resolve';
import { SpainMap } from '../components/SpainMap';
import { Seer } from '../components/Seer';
import { Img, Screen } from '../components/common';
import { sfx } from '../lib/sound';
import { useReducedMotion } from '../hooks';

export function Province() {
  const { t } = useTranslation();
  const ob = useOnboarding();
  const provinces = useProvinces();
  const vars = usePersonalVars();
  const rm = useReducedMotion();
  const selected = useSession((s) => s.province);
  const setProvince = useSession((s) => s.setProvince);
  const go = useSession((s) => s.go);
  const [hover, setHover] = useState<string | null>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const question = useMemo(() => linesOf(ob?.provincia?.pregunta) ?? t('province.title'), [ob, t]);

  const info = (code: string | null) => (code ? provinces.find((p) => p.code === code) : undefined);
  const shown = info(hover) ?? info(selected);

  function choose(code: string) {
    setProvince(code);
    sfx('chime');
    const p = info(code);
    const text = provinceReaction(ob, code, {
      ...vars,
      provincia: p?.nombre ?? t('province.abroadName'),
      comunidad: p?.comunidad,
      gentilicio: p?.gentilicio,
      chascarrillo: p?.teaser,
    });
    setReaction(text ? stripUnresolved(text) : p?.teaser || null);
  }

  return (
    <Screen title={question} className="province">
      <div className="province__layout">
        <div className="province__map">
          <SpainMap selected={selected} onSelect={(c) => choose(c)} onHover={(c) => setHover(c)} />
          <p className="province__teaser" aria-live="polite">
            {shown ? <><strong>{shown.nombre}</strong>{shown.teaser ? ` — ${shown.teaser}` : ''}</> : ' '}
          </p>
        </div>
        <div className="province__side">
          <Seer pose={reaction ? 'rie' : 'piensa'} say={reaction} />
          <label className="field">
            <span className="field__label">{t('province.listLabel')}</span>
            <select className="input" value={selected && selected !== 'XX' ? selected : ''} onChange={(e) => e.target.value && choose(e.target.value)}>
              <option value="">{t('province.choose')}</option>
              {[...provinces].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((p) => (
                <option key={p.code} value={p.code}>{p.nombre}</option>
              ))}
            </select>
          </label>
          <motion.button
            className={'btn abroad' + (selected === 'XX' ? ' is-selected' : '')}
            aria-pressed={selected === 'XX'}
            onClick={() => choose('XX')}
            whileHover={rm ? undefined : { rotate: [0, -6, 6, 0] }}
          >
            <Img className="abroad__globe" src="/art/globe.svg" alt={t('province.abroadAlt')} decorative
              fallback={<span className="abroad__globe abroad__globe--css" aria-hidden />} />
            {t('province.abroad')}
          </motion.button>
          {selected && (
            <p className="hint" aria-live="polite">
              {t('province.selected', { name: selected === 'XX' ? t('province.abroadName') : info(selected)?.nombre ?? selected })}
            </p>
          )}
          <button className="btn btn--primary" disabled={!selected} onClick={() => go('deck')}>{t('app.continue')}</button>
        </div>
      </div>
    </Screen>
  );
}
