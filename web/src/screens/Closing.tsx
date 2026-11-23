// 10 · Cierre: síntesis, número y color, imagen para compartir y diploma (canvas local).
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TypewriterText } from '../fx';
import { useSession } from '../state/session';
import { useFill } from '../state/vars';
import { useReducedMotion } from '../hooks';
import { drawDiploma, drawShareImage, downloadCanvas, shareCanvas } from '../lib/canvasArt';
import { Disclaimer, ErrorBox, Screen } from '../components/common';
import { Seer } from '../components/Seer';
import { sfx } from '../lib/sound';
import { haptic } from '../lib/native';
import { isApp } from '../lib/mode';

export function Closing() {
  const { t, i18n } = useTranslation();
  const s = useSession();
  const r = s.reading;
  const rm = useReducedMotion();
  const fill = useFill();
  const shareRef = useRef<HTMLCanvasElement>(null);
  const diplomaRef = useRef<HTMLCanvasElement>(null);
  const [includeName, setIncludeName] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => { sfx('bell'); }, []);

  useEffect(() => {
    if (!r || !shareRef.current) return;
    drawShareImage(shareRef.current, {
      title: t('app.name'),
      spreadName: r.spread.name,
      cards: r.cards.map((c) => ({ name: c.name, reversed: c.reversed, position: r.spread.positions.find((p) => p.id === c.position)?.label ?? c.position })),
      luckyNumber: r.summary.luckyNumber,
      luckyColor: r.summary.luckyColor,
      labels: { lucky: t('closing.lucky'), color: t('closing.color'), reversed: t('share.reversed'), footer: t('share.footer'), disclaimer: t('app.disclaimerShort') },
      name: includeName && s.name ? s.name : null,
    });
  }, [r, includeName, s.name, t]);

  useEffect(() => {
    if (!diplomaRef.current) return;
    drawDiploma(diplomaRef.current, {
      heading: t('diploma.heading'), title: t('diploma.title'), grantedTo: t('diploma.grantedTo'),
      name: s.name || t('diploma.anonymous'), center: t('diploma.center'), signature: t('diploma.signature'),
      date: new Date().toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }), seal: t('diploma.seal'),
    });
  }, [s.name, t, i18n.language]);

  if (!r) return <Screen title={t('closing.title')}><ErrorBox error={null} onRetry={() => s.go('deck')} /></Screen>;

  const appear = (i: number) => ({
    initial: rm ? false : { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { delay: rm ? 0 : 0.3 + i * 0.4 },
  });

  return (
    <Screen title={t('closing.title')} className="closing">
      <Disclaimer text={r.disclaimer || undefined} short />
      <motion.div className="card-panel" {...appear(0)}>
        <h2 className="subtitle">{t('closing.summary')}</h2>
        <p className="summary">{rm ? fill(r.summary.text) : <TypewriterText text={fill(r.summary.text)} />}</p>
      </motion.div>
      <div className="luck">
        <motion.div className="luck__item" {...appear(1)}>
          <span className="luck__label">{t('closing.lucky')}</span>
          <span className="luck__number">{r.summary.luckyNumber}</span>
        </motion.div>
        <motion.div className="luck__item" {...appear(2)}>
          <span className="luck__label">{t('closing.color')}</span>
          <span className="luck__swatch" style={{ background: r.summary.luckyColor.hex }} aria-hidden />
          <span className="luck__color">{r.summary.luckyColor.name}</span>
        </motion.div>
      </div>
      <Seer pose="saludo" say={fill(r.outro)} />

      <details className="card-panel share">
        <summary>{t('closing.shareTitle')}</summary>
        <p className="hint">{t('closing.shareHint')}</p>
        {s.name && (
          <label className="check"><input type="checkbox" checked={includeName} onChange={(e) => setIncludeName(e.target.checked)} /> <span>{t('closing.includeName')}</span></label>
        )}
        <canvas ref={shareRef} className="share__canvas" role="img" aria-label={t('closing.shareTitle')} />
        <div className="row">
          <button className="btn" onClick={async () => {
            if (!shareRef.current) return;
            // En la app, downloadCanvas ya abre la hoja de compartir de Android (y borra la copia temporal).
            if (isApp()) { await downloadCanvas(shareRef.current, 'tarotazo.png'); setStatus(t('closing.shared')); return; }
            setStatus((await shareCanvas(shareRef.current, 'tarotazo.png', t('app.name'))) === 'shared' ? t('closing.shared') : t('closing.downloaded'));
          }}>{t('closing.share')}</button>
          {/* En la app la hoja de Android ya permite guardar: un único botón «Compartir o guardar…» (A-3). */}
          {!isApp() && <button className="btn btn--ghost" onClick={async () => { if (shareRef.current) { await downloadCanvas(shareRef.current, 'tarotazo.png'); setStatus(t('closing.downloaded')); } }}>{t('closing.download')}</button>}
        </div>
      </details>

      <details className="card-panel share">
        <summary>{t('closing.diplomaTitle')}</summary>
        <canvas ref={diplomaRef} className="share__canvas share__canvas--wide" role="img" aria-label={t('diploma.title')} />
        <button className="btn" onClick={async () => { if (diplomaRef.current) { sfx('stamp'); haptic('medium'); await downloadCanvas(diplomaRef.current, t('diploma.filename')); setStatus(t('closing.downloaded')); } }}>{t('closing.diploma')}</button>
      </details>
      {status && <p className="hint" role="status">{status}</p>}

      <div className="row">
        <button className="btn btn--primary" onClick={s.newReading}>{t('closing.again')}</button>
        <button className="btn" onClick={() => s.openSide('pendulum')}>{t('closing.pendulum')}</button>
        <button className="btn btn--ghost" onClick={() => s.reset('bye')}>{t('closing.exit')}</button>
      </div>
    </Screen>
  );
}
