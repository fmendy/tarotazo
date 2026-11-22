// 9 · Lectura: cartas en su posición, revelado una a una con sus líneas y preguntas Sí/No.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlipCard, SpreadBoard, TypewriterText } from '../fx';
import { useSession } from '../state/session';
import { useFill } from '../state/vars';
import { useReducedMotion } from '../hooks';
import { api } from '../lib/api';
import { Disclaimer, ErrorBox, Screen } from '../components/common';
import { Seer, type Pose } from '../components/Seer';
import { useCurrentDeck } from './Ritual';
import { sfx } from '../lib/sound';
import { haptic } from '../lib/native';
import type { Answer, ReadingCard } from '../lib/types';

interface CardProgress { flipped: boolean; shownLines: number; answered: Answer | null; branch: string | null; done: boolean }

function Lines(p: { lines: { kind: string; text: string }[]; shown: number; onLineDone(): void; animate: boolean }) {
  return (
    <div className="lines">
      {p.lines.slice(0, p.shown + 1).map((l, i) => (
        <p key={i} className={'line line--' + l.kind}>
          {i === p.shown && p.animate ? <TypewriterText text={l.text} onDone={p.onLineDone} /> : l.text}
        </p>
      ))}
    </div>
  );
}

export function Reading() {
  const { t } = useTranslation();
  const s = useSession();
  const reading = s.reading;
  const rm = useReducedMotion();
  const fill = useFill();
  const { model } = useCurrentDeck();
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState<CardProgress[]>(() =>
    (reading?.cards ?? []).map(() => ({ flipped: false, shownLines: -1, answered: null, branch: null, done: false })));
  const [introDone, setIntroDone] = useState(rm);
  const [err, setErr] = useState<unknown>(null);
  const panel = useRef<HTMLDivElement>(null);
  const back = model?.backImage ?? '/art/backs/rws.svg';

  const filled = useMemo(() => reading?.cards.map((c) => ({
    ...c,
    lines: c.lines.map((l) => ({ ...l, text: fill(l.text) })),
    interaction: c.interaction ? { ...c.interaction, prompt: fill(c.interaction.prompt) } : null,
  })) ?? [], [reading, fill]);

  useEffect(() => { panel.current?.focus(); }, [current]);

  if (!reading) return <Screen title={t('reading.title')}><ErrorBox error={null} onRetry={() => s.go('deck')} /></Screen>;

  const card: ReadingCard | undefined = filled[current];
  const pr = progress[current];
  const upd = (i: number, patch: Partial<CardProgress>) =>
    setProgress((ps) => ps.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  function flip() {
    sfx('flip');
    haptic('light');
    upd(current, { flipped: true, shownLines: rm ? (card?.lines.length ?? 1) - 1 : 0 });
  }
  function lineDone() {
    const max = (card?.lines.length ?? 1) - 1;
    const i = current;
    setTimeout(() => setProgress((ps) => ps.map((x, k) => (k === i && x.shownLines < max ? { ...x, shownLines: x.shownLines + 1 } : x))), 350);
  }
  function showAll() { if (card) upd(current, { shownLines: card.lines.length - 1 }); }
  async function answer(a: Answer) {
    if (!card?.interaction) return;
    s.answer(card.interaction.id, a);
    upd(current, { answered: a });
    try {
      const r = await api.nextLine({ interactionId: card.interaction.id, answer: a, tone: String(card.tone), context: s.context() });
      upd(current, { branch: fill(r.text) });
    } catch (e) { setErr(e); upd(current, { branch: '' }); }
  }
  function next() {
    upd(current, { done: true });
    if (current < filled.length - 1) setCurrent(current + 1);
    else s.go('closing');
  }

  const linesComplete = !!card && !!pr && pr.flipped && pr.shownLines >= card.lines.length - 1;
  const needsAnswer = !!card?.interaction && pr?.answered === null;
  const canNext = linesComplete && (!card?.interaction || pr?.branch !== null);
  const pose: Pose = !pr?.flipped ? 'bola' : card?.lines.some((l, i) => l.kind === 'cambioHumor' && i <= pr.shownLines) ? 'sorpresa' : card?.reversed ? 'piensa' : 'rie';
  const slotOrder = reading.spread.positions.map((p) => p.id);

  return (
    <Screen title={reading.spread.name} className="reading">
      <Disclaimer text={reading.disclaimer || undefined} short />
      {!introDone ? (
        <div className="reading__intro">
          <Seer pose="saludo" say={fill(reading.intro)} onSaid={() => setTimeout(() => setIntroDone(true), 800)} />
          <button className="btn" onClick={() => setIntroDone(true)}>{t('app.continue')}</button>
        </div>
      ) : (
        <>
          <div className="board">
            <SpreadBoard layout={reading.spread.layout} slots={reading.cards.length}
              labels={filled.map((c) => reading.spread.positions.find((p) => p.id === c.position)?.label ?? c.position)}>
              {filled.map((c, i) => {
                const label = reading.spread.positions.find((p) => p.id === c.position)?.label ?? c.position;
                const flipped = !!progress[i]?.flipped;
                return (
                  <div key={i} className={'slot' + (i === current ? ' is-current' : '')} data-position={c.position} data-order={slotOrder.indexOf(c.position)}
                    role="img" aria-label={flipped ? t(c.reversed ? 'reading.cardAltReversed' : 'reading.cardAlt', { name: c.name, position: label }) : t('reading.backAlt', { position: label })}>
                    <FlipCard front={c.image} back={back} flipped={flipped} reversed={c.reversed} />
                  </div>
                );
              })}
            </SpreadBoard>
          </div>

          {card && pr && (
            <div className="card-panel reading__panel" ref={panel} tabIndex={-1} aria-live="polite">
              <p className="reading__pos">{t('reading.position')}: {reading.spread.positions.find((p) => p.id === card.position)?.label ?? card.position}</p>
              {!pr.flipped ? (
                <>
                  <Seer pose={pose} compact say={null} />
                  <button className="btn btn--primary btn--big" onClick={flip}>{t('reading.reveal')}</button>
                </>
              ) : (
                <>
                  <h2 className="reading__card">{card.name}{card.reversed && <small> ({t('reading.reversed')})</small>}</h2>
                  <Seer pose={pose} compact say={null} />
                  <Lines lines={card.lines} shown={pr.shownLines} onLineDone={lineDone} animate={!rm} />
                  {!linesComplete && <button className="linkbtn" onClick={showAll}>{t('reading.skipText')}</button>}
                  {linesComplete && card.interaction && (
                    <div className="interaction">
                      <p className="interaction__prompt">{card.interaction.prompt}</p>
                      <div className="row" role="group" aria-label={card.interaction.prompt}>
                        {(card.interaction.options.length ? card.interaction.options : (['si', 'no', 'skip'] as Answer[])).map((o) => (
                          <button key={o} className={'chip' + (pr.answered === o ? ' is-selected' : '')} disabled={pr.answered !== null}
                            aria-pressed={pr.answered === o} onClick={() => void answer(o)}>
                            {t(`reading.answers.${o}`)}
                          </button>
                        ))}
                      </div>
                      {pr.branch && <p className="line line--branch">{rm ? pr.branch : <TypewriterText text={pr.branch} />}</p>}
                    </div>
                  )}
                  {!!err && <ErrorBox error={err} />}
                  {canNext && !needsAnswer && (
                    <button className="btn btn--primary" onClick={next}>
                      {current < filled.length - 1 ? t('reading.next') : t('reading.finish')}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </Screen>
  );
}
