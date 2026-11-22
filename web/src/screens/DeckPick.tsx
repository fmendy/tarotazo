// 5 · Elección de baraja: dos cofres y carrusel 3D de modelos.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Carousel3D, Chests } from '../fx';
import { useSession } from '../state/session';
import { getDecks } from '../state/content';
import { useAsync } from '../hooks';
import { Seer } from '../components/Seer';
import { ErrorBox, Img, Loading, Screen } from '../components/common';
import type { DeckFamily, DeckModel } from '../lib/types';
import { sfx } from '../lib/sound';

function ModelCard(p: { m: DeckModel; selected: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={'model' + (p.m.available ? '' : ' is-soon') + (p.selected ? ' is-selected' : '')}>
      <div className="model__cards">
        <Img className="model__back cardimg" src={p.m.backImage} alt={t('deck.backAlt', { name: p.m.name })} />
        {p.m.previewImage && <Img className="model__preview cardimg" src={p.m.previewImage} alt={t('deck.previewAlt', { name: p.m.name })} />}
      </div>
      <p className="model__name">{p.m.name}</p>
      {p.m.description && <p className="model__desc">{p.m.description}</p>}
      <p className="model__meta">{t('deck.cards', { count: p.m.deckSize })}</p>
      {!p.m.available && <span className="ribbon">{t('deck.soon')}</span>}
      {p.selected && <span className="ribbon ribbon--ok">{t('deck.selected')}</span>}
    </div>
  );
}

export function DeckPick() {
  const { t, i18n } = useTranslation();
  const decks = useAsync(getDecks, [i18n.language]);
  const s = useSession();
  const [family, setFamily] = useState<DeckFamily | null>(s.deck);
  const deck = decks.data?.find((d) => d.family === family);

  function openChest(f: DeckFamily) {
    sfx('chime');
    setFamily(f);
    const d = decks.data?.find((x) => x.family === f);
    const def = d?.models.find((m) => m.id === d.defaultModel && m.available) ?? d?.models.find((m) => m.available);
    s.setDeck(f, def?.id ?? null);
  }

  return (
    <Screen title={t('deck.title')} className="deckpick">
      {decks.loading && <Loading />}
      {!!decks.error && <ErrorBox error={decks.error} onRetry={decks.reload} />}
      {decks.data && !family && (
        <>
          <Seer pose="saludo" say={t('deck.chests')} />
          <Chests onChoose={openChest} />
        </>
      )}
      {decks.data && family && deck && (
        <>
          <h2 className="subtitle">{deck.name} · {t('deck.models')}</h2>
          <Carousel3D
            items={deck.models}
            render={(m: DeckModel) => <ModelCard m={m} selected={s.model === m.id} />}
            onSelect={(m: DeckModel) => { if (m.available) { s.setModel(m.id); sfx('flip'); } }}
            getLabel={(m: DeckModel) => (m.available ? m.name : `${m.name} (${t('deck.soon')})`)}
          />
          <div className="row">
            <button className="btn btn--primary" disabled={!s.model} onClick={() => s.go('spread')}>{t('deck.choose')}</button>
            <button className="btn btn--ghost" onClick={() => setFamily(null)}>{t('deck.otherChest')}</button>
          </div>
        </>
      )}
    </Screen>
  );
}
