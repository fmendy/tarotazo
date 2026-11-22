// Contenido público (no personal) que se pide al API y se cachea en memoria.
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, cached } from '../lib/api';
import type { OnboardingContent } from '../lib/onboarding';
import type { Deck, ProvinceInfo, Spread, TitlesFile, DeckFamily, PendulumContent } from '../lib/types';
import { PROVINCES } from '../lib/provinces';
import { useAsync } from '../hooks';

export const getOnboarding = () => cached<OnboardingContent>('onboarding', api.onboarding);
export const getProvinces = () => cached<ProvinceInfo[]>('provinces', api.provinces);
export const getDecks = () => cached<Deck[]>('decks', api.decks);
export const getSpreads = (d: DeckFamily) => cached<Spread[]>('spreads:' + d, () => api.spreads(d));
export const getTitles = () => cached<TitlesFile>('titles', api.titles);
export const getPendulumContent = (prov: string | null) => cached<PendulumContent>('pendulum:' + (prov ?? ''), () => api.pendulumContent(prov));

/** Onboarding: si falla, null (las pantallas usan textos de i18n). */
export function useOnboarding(): OnboardingContent | null {
  const { i18n } = useTranslation();
  const [data, setData] = useState<OnboardingContent | null>(null);
  useEffect(() => {
    let alive = true;
    getOnboarding().then((d) => alive && setData(d), () => alive && setData(null));
    return () => { alive = false; };
  }, [i18n.language]);
  return data;
}

/** Provincias con teaser; si el API falla, lista neutra sin teaser. */
export function useProvinces(): ProvinceInfo[] {
  const { i18n } = useTranslation();
  const s = useAsync(getProvinces, [i18n.language]);
  return s.data ?? PROVINCES.map((p) => ({ ...p, teaser: null, gentilicio: null, zona: null }));
}
