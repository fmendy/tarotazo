// «El Oráculo Oscilante»: vitrina, calibración, pregunta (local) y modos.
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Pendulum } from '../../pendulum';
import { Ambience } from '../../fx';
import { useSession } from '../../state/session';
import { useFill } from '../../state/vars';
import { getPendulumContent } from '../../state/content';
import { useAsync } from '../../hooks';
import { randomInt } from '../../lib/random';
import { api } from '../../lib/api';
import { provinceName } from '../../lib/provinces';
import { normalizeName } from '../../lib/onboarding';
import {
  CHAKRA_IDS, chakraPoint, ouijaTargets, percentTarget, sectorTarget, sinoTarget, type PendulumTarget,
} from '../../lib/pendulumGeom';
import { PENDULUM_MODELS, PENDULUM_MODES, type PendulumMode, type PendulumModel, type PendulumResponse } from '../../lib/types';
import { Disclaimer, ErrorBox, Img, Screen } from '../../components/common';
import { Seer } from '../../components/Seer';
import type { MapApi } from '../../components/SpainMap';
import { sfx, startAmbient, stopAmbient, useSound } from '../../lib/sound';
import { Board } from './Boards';

type Phase = 'showcase' | 'calibrate' | 'ask';

/** Giroscopio con permiso explícito (iOS pide requestPermission). */
function useGyro() {
  const [tilt, setTilt] = useState<{ x: number; y: number } | undefined>(undefined);
  const [state, setState] = useState<'off' | 'on' | 'denied'>('off');
  const supported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window && (window.matchMedia?.('(pointer: coarse)').matches ?? false);
  useEffect(() => {
    if (state !== 'on') return;
    const c = (v: number) => Math.max(-1, Math.min(1, v));
    const h = (e: DeviceOrientationEvent) => setTilt({ x: c((e.gamma ?? 0) / 30), y: c(((e.beta ?? 45) - 45) / 30) });
    window.addEventListener('deviceorientation', h);
    return () => window.removeEventListener('deviceorientation', h);
  }, [state]);
  async function enable() {
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<'granted' | 'denied'> };
    try {
      const r = DOE.requestPermission ? await DOE.requestPermission() : 'granted';
      setState(r === 'granted' ? 'on' : 'denied');
    } catch { setState('denied'); }
  }
  return { tilt: state === 'on' ? tilt : undefined, state, supported, enable };
}

export function PendulumScreen() {
  const { t, i18n } = useTranslation();
  const s = useSession();
  const muted = useSound((x) => x.muted);
  const fill = useFill();
  const gyro = useGyro();
  const [phase, setPhase] = useState<Phase>('showcase');
  const [mode, setMode] = useState<PendulumMode>('sino');
  // Pregunta y opciones: SÓLO estado local de este componente; nunca se envían.
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [concentrate, setConcentrate] = useState(false);
  const [target, setTarget] = useState<PendulumTarget | null>(null);
  const [queue, setQueue] = useState<PendulumTarget[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PendulumResponse | null>(null);
  const [shownText, setShownText] = useState<string | null>(null);
  const [err, setErr] = useState<unknown>(null);
  const [angry, setAngry] = useState(false);
  const [calMsg, setCalMsg] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [spelled, setSpelled] = useState('');
  const [chakraLevels, setChakraLevels] = useState<Record<string, number>>({});
  const [mapSel, setMapSel] = useState<string | null>(null);
  const mapApi = useRef<MapApi | null>(null);
  const asked = useRef<Map<string, number>>(new Map());
  const step = useRef(0);
  const midnight = new Date().getHours() === 0;
  const content = useAsync(() => getPendulumContent(s.province), [s.province, i18n.language]).data;
  /** Línea del contenido del péndulo (la del modelo, si la tiene), sorteada y resuelta. */
  const line = (key: string): string | null => {
    const own = content?.models[s.pendulumModel]?.lines?.[key];
    const arr = own?.length ? own : content?.lines[key];
    const txt = arr?.length ? arr[randomInt(arr.length)] : undefined;
    return txt ? fill(txt) : null;
  };
  const [ritual, setRitual] = useState<string | null>(null);

  useEffect(() => () => stopAmbient(), []);
  useEffect(() => { if (concentrate) startAmbient(); else stopAmbient(); }, [concentrate, muted]);

  const modelName = (m: PendulumModel) => content?.models[m]?.nombre ?? t(`pendulum.models.${m}`, { provincia: provinceName(s.province) ?? t('pendulum.chorizoDefault') });
  const cleanOptions = options.map((o) => o.trim()).filter(Boolean);

  function resetAnswer() {
    setTarget(null); setQueue([]); setResult(null); setShownText(null); setErr(null);
    setHighlight(null); setSpelled(''); setChakraLevels({}); setMapSel(null); step.current = 0;
  }

  async function ask() {
    resetAnswer();
    // Easter egg: misma pregunta 3 veces → se enfada (se compara en local, nunca se envía).
    const key = normalizeName(question).replace(/[¿?¡!.,]/g, '').trim();
    if (key) {
      const n = (asked.current.get(key) ?? 0) + 1;
      asked.current.set(key, n);
      if (n >= 3) { setAngry(true); setShownText(line('enfado') ?? t('pendulum.angry')); setTarget({ kind: 'circle' }); return; }
      setRitual(n === 2 ? line('repetida') : null);
    }
    setAngry(false);
    if (mode === 'opciones' && cleanOptions.length < 2) { setErr(null); setShownText(t('pendulum.needOptions')); return; }
    setBusy(true);
    sfx('swing');
    try {
      const r = await api.pendulum({
        mode, model: s.pendulumModel, context: s.context(),
        ...(mode === 'opciones' ? { options: cleanOptions.length } : {}),
      });
      setResult(r);
      const res = r.result as Record<string, unknown>;
      let targets: PendulumTarget[] = [];
      switch (r.mode) {
        case 'sino': targets = [sinoTarget(res.answer as 'si' | 'no' | 'duda', s.yesAxis)]; break;
        case 'tablero': targets = [sectorTarget(Number(res.sector), 5)]; break;
        case 'porcentaje': targets = [percentTarget(Number(res.value))]; break;
        case 'opciones': targets = [sectorTarget(Number(res.index), cleanOptions.length)]; break;
        case 'ouija': targets = ouijaTargets(String(res.word)); if (!targets.length) targets = [{ kind: 'circle' }]; break;
        case 'mapa': {
          const c = mapApi.current?.centerOf(String(res.provincia));
          targets = [c ? { kind: 'point', ...c } : { kind: 'circle' }];
          break;
        }
        case 'chakras': targets = CHAKRA_IDS.map((_, i) => ({ kind: 'point' as const, ...chakraPoint(i) })); break;
      }
      setQueue(targets.slice(1));
      setTarget(targets[0] ?? null);
    } catch (e) { setErr(e); } finally { setBusy(false); }
  }

  /** Al asentarse: avanza la secuencia (ouija/chakras) o muestra la respuesta. */
  function settled() {
    if (phase === 'calibrate') return;
    if (!result) return;
    const res = result.result as Record<string, unknown>;
    const i = step.current;
    if (result.mode === 'ouija') {
      const word = String(res.word);
      setSpelled(word.toLocaleUpperCase('es').slice(0, Math.min(word.length, i + 1)));
    }
    if (result.mode === 'chakras') {
      const levels = (res.levels as { id: string; nivel: number }[]) ?? [];
      const id = CHAKRA_IDS[i];
      const lvl = levels.find((l) => l.id === id)?.nivel ?? levels[i]?.nivel;
      if (id && lvl !== undefined) setChakraLevels((c) => ({ ...c, [id]: lvl }));
    }
    if (queue.length) {
      step.current = i + 1;
      sfx('swing');
      setTimeout(() => { setTarget(queue[0]!); setQueue(queue.slice(1)); }, 500);
      return;
    }
    sfx('chime');
    if (result.mode === 'tablero') setHighlight(Number(res.sector));
    if (result.mode === 'opciones') setHighlight(Number(res.index));
    if (result.mode === 'porcentaje') setHighlight(Number(res.value));
    if (result.mode === 'mapa') setMapSel(String(res.provincia));
    if (result.mode === 'ouija') setSpelled(String(res.word).toLocaleUpperCase('es'));
    const opcion = result.mode === 'opciones' ? cleanOptions[Number(res.index)] : undefined;
    setShownText(fill(result.text, { opcion, palabra: res.word as string | undefined, porcentaje: res.value as number | undefined }));
  }

  const settledRef = useRef(settled);
  settledRef.current = settled;

  // ---- vitrina ----
  if (phase === 'showcase') {
    return (
      <Screen title={t('pendulum.title')} className="pendulum">
        <Seer pose="bola" compact say={t('pendulum.showcase')} />
        <ul className="showcase" aria-label={t('pendulum.showcase')}>
          {PENDULUM_MODELS.map((m, i) => (
            <motion.li key={m} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <button className={'showcase__item' + (s.pendulumModel === m ? ' is-selected' : '')} aria-pressed={s.pendulumModel === m}
                onClick={() => { s.setPendulumModel(m); sfx('chime'); }}>
                <Img className="showcase__img" src={`/art/pendulums/${m}.svg`} alt={t('pendulum.pendulumAlt', { name: modelName(m) })}
                  fallback={<span className={`showcase__gem gem--${m}`} aria-hidden />} />
                <span>{modelName(m)}</span>
                {content?.models[m]?.personalidad && <span className="showcase__desc">{content.models[m]!.personalidad}</span>}
              </button>
            </motion.li>
          ))}
        </ul>
        <button className="btn btn--primary" onClick={() => { setPhase('calibrate'); setTarget(null); }}>{t('pendulum.choose')}</button>
        <Disclaimer short />
      </Screen>
    );
  }

  const board = (
    <Board mode={phase === 'calibrate' ? 'sino' : mode} yesAxis={s.yesAxis} options={cleanOptions} highlight={highlight}
      spelled={spelled} chakraLevels={chakraLevels} mapSelected={mapSel} onMapReady={(a) => { mapApi.current = a; }} />
  );

  return (
    <Screen title={t('pendulum.title')} className={'pendulum' + (concentrate ? ' is-concentrating' : '')}>
      {concentrate && <div className="concentrate-veil" aria-hidden><Ambience variant="humo" intensity={0.8} /></div>}
      {midnight && <p className="hint pendulum__midnight">{line('medianoche') ?? t('pendulum.midnight')}</p>}
      <div className="pendulum__layout">
        <div className="pendulum__stage">
          <Pendulum
            model={s.pendulumModel}
            mode={phase === 'calibrate' ? 'sino' : mode}
            target={target}
            yesAxis={s.yesAxis}
            onSettled={() => settledRef.current()}
            angry={angry}
            midnight={midnight}
            board={board}
            tilt={gyro.tilt}
            sound={!muted}
          />
        </div>
        <div className="pendulum__side">
          {phase === 'calibrate' ? (
            <div className="card-panel">
              <h2 className="subtitle">{t('pendulum.calibrate')}</h2>
              <p className="hint">{t('pendulum.calibrateHint')}</p>
              {!calMsg && <Seer pose="bola" compact say={[line('intro'), line('calibrar.intro')].filter(Boolean).join(' ') || null} />}
              <div className="row">
                <button className="btn" onClick={() => { setTarget({ kind: 'axis', axis: s.yesAxis }); setCalMsg((line('calibrar.si') ?? '') + ' ' + t('pendulum.yesIs', { axis: t(`pendulum.axis.${s.yesAxis}`) })); sfx('swing'); }}>{t('pendulum.showYes')}</button>
                <button className="btn" onClick={() => { const no = s.yesAxis === 'vertical' ? 'horizontal' : 'vertical'; setTarget({ kind: 'axis', axis: no }); setCalMsg((line('calibrar.no') ?? '') + ' ' + t('pendulum.noIs', { axis: t(`pendulum.axis.${no}`) })); sfx('swing'); }}>{t('pendulum.showNo')}</button>
              </div>
              {calMsg && <Seer pose="piensa" compact say={calMsg} />}
              <div className="row">
                <button className="btn btn--primary" onClick={() => { setPhase('ask'); resetAnswer(); }}>{calMsg ? t('pendulum.calibrated') : t('pendulum.skipCalibration')}</button>
                <button className="btn btn--ghost" onClick={() => setPhase('showcase')}>{t('app.back')}</button>
              </div>
            </div>
          ) : (
            <div className="card-panel">
              <div className="modes" role="tablist" aria-label={t('pendulum.mode')}>
                {PENDULUM_MODES.map((m) => (
                  <button key={m} role="tab" aria-selected={mode === m} className={'chip' + (mode === m ? ' is-selected' : '')}
                    onClick={() => { setMode(m); resetAnswer(); setAngry(false); }}>{t(`pendulum.modes.${m}`)}</button>
                ))}
              </div>
              <p className="hint">{t(`pendulum.modeHints.${mode}`)}</p>
              <label className="field">
                <span className="field__label">{t('pendulum.question')}</span>
                <input className="input" value={question} maxLength={160} autoComplete="off" spellCheck={false}
                  placeholder={t('pendulum.questionPlaceholder')} onChange={(e) => setQuestion(e.target.value)} />
                <span className="hint">{t('pendulum.questionHint')}</span>
              </label>
              {mode === 'opciones' && (
                <fieldset className="options">
                  <legend className="field__label">{t('pendulum.options')}</legend>
                  {options.map((o, i) => (
                    <div className="options__row" key={i}>
                      <input className="input" value={o} maxLength={30} aria-label={t('pendulum.optionPlaceholder', { n: i + 1 })}
                        placeholder={t('pendulum.optionPlaceholder', { n: i + 1 })} onChange={(e) => setOptions(options.map((x, k) => (k === i ? e.target.value : x)))} />
                      {options.length > 2 && (
                        <button className="iconbtn" aria-label={t('pendulum.removeOption', { n: i + 1 })} onClick={() => setOptions(options.filter((_, k) => k !== i))}>×</button>
                      )}
                    </div>
                  ))}
                  {options.length < 6 && <button className="linkbtn" onClick={() => setOptions([...options, ''])}>{t('pendulum.addOption')}</button>}
                  <span className="hint">{t('pendulum.optionsHint')}</span>
                </fieldset>
              )}
              <div className="row">
                <button className="btn" aria-pressed={concentrate} onClick={() => { setRitual(!concentrate ? line('concentrar') : null); setConcentrate(!concentrate); sfx('candle'); }}>
                  {concentrate ? t('pendulum.stopConcentrate') : t('pendulum.concentrate')}
                </button>
                <button className="btn btn--primary" disabled={busy} onClick={() => void ask()}>{result || angry ? t('pendulum.again') : t('pendulum.ask')}</button>
              </div>
              {gyro.supported && (
                <button className="linkbtn" disabled={gyro.state === 'on'} onClick={() => void gyro.enable()}>
                  {gyro.state === 'on' ? t('pendulum.gyroOn') : gyro.state === 'denied' ? t('pendulum.gyroDenied') : t('pendulum.gyro')}
                </button>
              )}
              {busy && <p className="hint" role="status">{t('pendulum.settling')}</p>}
              {!!err && <ErrorBox error={err} onRetry={() => void ask()} />}
              {ritual && !shownText && <Seer pose="piensa" compact say={ritual} />}
              {shownText && <Seer pose={angry ? 'sorpresa' : 'bola'} say={shownText} />}
              <button className="linkbtn" onClick={() => setPhase('showcase')}>{t('pendulum.showcase')}</button>
            </div>
          )}
          <Disclaimer short />
        </div>
      </div>
    </Screen>
  );
}
