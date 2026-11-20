// 7 · Barajado y 8 · Corte + selección. Al terminar se pide la lectura al servidor.
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CardFan, CutDeck, ShuffleDeck } from '../fx';
import { useSession } from '../state/session';
import { getDecks, getSpreads } from '../state/content';
import { useAsync, useReducedMotion } from '../hooks';
import { api } from '../lib/api';
import { pick, randomInt } from '../lib/random';
import { ErrorBox, Loading, Screen } from '../components/common';
import { Seer } from '../components/Seer';
import { sfx } from '../lib/sound';
import type { DeckModel, Spread } from '../lib/types';

/** Modelo y tirada actuales (desde el API, cacheado). */
export function useCurrentDeck() {
  const { i18n } = useTranslation();
  const deck = useSession((s) => s.deck);
  const model = useSession((s) => s.model);
  const spread = useSession((s) => s.spread);
  const decks = useAsync(getDecks, [i18n.language]);
  const spreads = useAsync(() => getSpreads(deck ?? 'tarot'), [deck, i18n.language]);
  const m: DeckModel | undefined = decks.data?.find((d) => d.family === deck)?.models.find((x) => x.id === model);
  const sp: Spread | undefined = spreads.data?.find((x) => x.id === spread);
  return { model: m, spread: sp, loading: decks.loading || spreads.loading, error: decks.error || spreads.error };
}

export function Shuffle() {
  const { t } = useTranslation();
  const go = useSession((s) => s.go);
  const rm = useReducedMotion();
  const { model, loading, error } = useCurrentDeck();
  const style = useMemo(() => pick(['riffle', 'overhand', 'mesa'] as const)!, []);
  const comments = t('shuffle.comments', { returnObjects: true }) as string[];
  const [comment, setComment] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (loading) return <Screen title={t('shuffle.title')}><Loading /></Screen>;
  if (error || !model) return <Screen title={t('shuffle.title')}><ErrorBox error={error} /></Screen>;

  // ShuffleDeck trae su propio botón «más» y llama a onDone al final de CADA pasada.
  const more = () => setComment(comments[randomInt(comments.length)] ?? null);

  return (
    <Screen title={t('shuffle.title')} className="shuffle">
      <Seer pose="rie" compact say={comment} />
      <div className="stage" aria-live="polite">
        <ShuffleDeck
          backImage={model.backImage}
          style={style}
          reducedMotion={rm}
          onDone={() => setDone(true)}
          onMore={more}
          moreLabel={t('shuffle.more')}
        />
      </div>
      <div className="row">
        <button className="btn btn--primary" disabled={!done && !rm} onClick={() => go('cut')}>{t('shuffle.done')}</button>
      </div>
    </Screen>
  );
}

export function Cut() {
  const { t } = useTranslation();
  const s = useSession();
  const { model, spread, loading, error } = useCurrentDeck();
  const mode = useMemo(() => (randomInt(2) === 0 ? 'tres' : 'abanico') as 'tres' | 'abanico', []);
  const [phase, setPhase] = useState<'cut' | 'pick' | 'sending' | 'error'>(s.cutIndex === null ? 'cut' : 'pick');
  const [err, setErr] = useState<unknown>(null);

  if (loading) return <Screen title={t('cut.title')}><Loading /></Screen>;
  if (error || !model || !spread) return <Screen title={t('cut.title')}><ErrorBox error={error} /></Screen>;

  async function send(picks: number[]) {
    if (!model || !spread || !s.deck || s.cutIndex === null) return;
    s.setPicks(picks);
    setPhase('sending');
    try {
      const r = await api.reading({
        deck: s.deck, model: model.id, spread: spread.id, cutIndex: s.cutIndex, picks,
        context: s.context(), recentFragmentIds: s.flatRecentIds(),
      });
      s.setReading(r);
      s.go('reading');
    } catch (e) {
      setErr(e); setPhase('error');
    }
  }

  return (
    <Screen title={phase === 'cut' ? t('cut.title') : t('cut.pickTitle')} className="cut">
      {phase === 'cut' && (
        <>
          <Seer pose="piensa" compact say={t('cut.instruction')} />
          <div className="stage">
            <CutDeck backImage={model.backImage} mode={mode} onCut={(i) => { s.setCut(i); sfx('shuffle'); setPhase('pick'); }} />
          </div>
        </>
      )}
      {phase === 'pick' && (
        <>
          <Seer pose="bola" compact say={t('cut.pickInstruction', { count: spread.size })} />
          <div className="stage stage--fan">
            <CardFan backImage={model.backImage} count={model.deckSize} pick={spread.size} onPicked={(idx) => void send(idx)} />
          </div>
        </>
      )}
      {phase === 'sending' && <p className="loading" role="status">{t('cut.reading')}</p>}
      {phase === 'error' && <ErrorBox error={err} onRetry={() => void send(s.picks)} />}
    </Screen>
  );
}
