// Enrutado por estado (sin router): la pantalla actual vive en el store de sesión.
import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Ambience, ScreenTransition } from './fx';
import { useSession, type Screen } from './state/session';
import { useSessionGuards } from './state/inactivity';
import { useReducedMotion } from './hooks';
import { Footer, Menu } from './components/Menu';
import { Gate } from './screens/Gate';
import { Name } from './screens/Name';
import { Age } from './screens/Age';
import { Province } from './screens/Province';
import { DeckPick } from './screens/DeckPick';
import { SpreadPick } from './screens/SpreadPick';
import { Cut, Shuffle } from './screens/Ritual';
import { Reading } from './screens/Reading';
import { Closing } from './screens/Closing';
import { Loading } from './components/common';

// El péndulo y las titulaciones se cargan bajo demanda (aligeran la primera carga).
const PendulumScreen = lazy(() => import('./screens/pendulum/PendulumScreen').then((m) => ({ default: m.PendulumScreen })));
const Titles = lazy(() => import('./screens/Titles').then((m) => ({ default: m.Titles })));
import { Blocked, Bye, Legal, Privacy } from './screens/Simple';

const SCREENS: Record<Screen, ComponentType> = {
  gate: Gate, name: Name, age: Age, province: Province, deck: DeckPick, spread: SpreadPick,
  shuffle: Shuffle, cut: Cut, reading: Reading, closing: Closing,
  pendulum: PendulumScreen, titles: Titles, legal: Legal, privacy: Privacy, blocked: Blocked, bye: Bye,
};

const AMBIENCE: Partial<Record<Screen, 'humo' | 'velas' | 'estrellas' | 'polvo'>> = {
  gate: 'humo', name: 'velas', age: 'velas', province: 'estrellas', deck: 'polvo', spread: 'estrellas',
  shuffle: 'velas', cut: 'velas', reading: 'humo', closing: 'estrellas', pendulum: 'estrellas', titles: 'polvo',
};

export function App() {
  useSessionGuards();
  const { t } = useTranslation();
  const screen = useSession((s) => s.screen);
  const rm = useReducedMotion();
  const Current = SCREENS[screen];

  // Accesibilidad: al cambiar de pantalla, el foco va al título y se sube arriba.
  useEffect(() => {
    window.scrollTo?.({ top: 0, behavior: rm ? 'auto' : 'smooth' });
    const id = setTimeout(() => document.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true }), 60);
    return () => clearTimeout(id);
  }, [screen, rm]);

  const amb = AMBIENCE[screen];
  return (
    <div className={'app app--' + screen}>
      <a className="skip" href="#main">{t('app.skipLink')}</a>
      {amb && <Ambience variant={amb} intensity={rm ? 0.3 : 1} />}
      <Menu />
      <main id="main" className="main">
        <ScreenTransition id={screen}>
          <Suspense fallback={<Loading />}><Current /></Suspense>
        </ScreenTransition>
      </main>
      <Footer />
    </div>
  );
}
