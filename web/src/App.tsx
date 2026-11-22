// Enrutado por estado (sin router): la pantalla actual vive en el store de sesión.
import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Ambience, ScreenTransition } from './fx';
import { useSession, type Screen } from './state/session';
import { useSessionGuards } from './state/inactivity';
import { useReducedMotion } from './hooks';
import { Footer, Menu } from './components/Menu';
import { Loading } from './components/common';
import { Gate } from './screens/Gate';
import { Name } from './screens/Name';
import { Age } from './screens/Age';
import { Province } from './screens/Province';
import { DeckPick } from './screens/DeckPick';
import { SpreadPick } from './screens/SpreadPick';
import { Cut, Shuffle } from './screens/Ritual';
import { Reading } from './screens/Reading';
import { Blocked, Bye } from './screens/Simple';

// Pantallas secundarias o pesadas bajo demanda (QA-10): péndulo, titulaciones, legal y cierre (canvas).
const named = <K extends string>(p: Promise<Record<K, ComponentType>>, k: K) => p.then((m) => ({ default: m[k] }));
const PendulumScreen = lazy(() => named(import('./screens/pendulum/PendulumScreen'), 'PendulumScreen'));
const Titles = lazy(() => named(import('./screens/Titles'), 'Titles'));
const Closing = lazy(() => named(import('./screens/Closing'), 'Closing'));
const Legal = lazy(() => named(import('./screens/Legal'), 'Legal'));
const Privacy = lazy(() => named(import('./screens/Legal'), 'Privacy'));

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
  const epoch = useSession((s) => s.epoch);
  const rm = useReducedMotion();
  const Current = SCREENS[screen];

  // Al cambiar de pantalla se sube arriba. El foco lo pone cada pantalla en su h1 al montarse
  // (ver useAutofocus en components/common), es decir, tras la transición de salida (QA-04).
  useEffect(() => { window.scrollTo?.({ top: 0, behavior: rm ? 'auto' : 'smooth' }); }, [screen, rm]);

  const amb = AMBIENCE[screen];
  return (
    <div className={'app app--' + screen}>
      <a className="skip" href="#main">{t('app.skipLink')}</a>
      {amb && <Ambience variant={amb} intensity={rm ? 0.3 : 1} />}
      <Menu />
      {/* key={epoch}: al borrar la sesión (salir/inactividad) se desmonta TODO el árbol de
          pantallas al instante, sin esperar a animaciones de salida (QA-16). */}
      <main id="main" className="main" key={epoch}>
        <ScreenTransition id={screen}>
          <Suspense fallback={<Loading />}><Current /></Suspense>
        </ScreenTransition>
      </main>
      <Footer />
    </div>
  );
}
