// Integración con Android vía Capacitor (docs/MOBILE.md). En la web todo esto es un no-op.
// Los plugins se importan bajo demanda y sólo en plataforma nativa.
import { Capacitor } from '@capacitor/core';
import { useSession, type Screen } from '../state/session';
import { INACTIVITY_MS } from '../state/inactivity';
import { prefersReducedMotion } from '../fx/hooks';
import { stopAmbient, useSound } from './sound';
import * as FX from '../fx';

export const isNative = (): boolean => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

/** Pantalla a la que vuelve el botón atrás de Android (navegación por estado). */
const BACK: Partial<Record<Screen, Screen>> = {
  name: 'gate', age: 'name', province: 'age', deck: 'province', spread: 'deck', shuffle: 'spread',
  cut: 'shuffle', reading: 'deck', closing: 'deck',
};

/** Decide qué hacer con el botón atrás. Devuelve 'exit' si hay que cerrar la app. */
export function handleBack(): 'exit' | 'handled' {
  const s = useSession.getState();
  if (s.screen === 'gate' || s.screen === 'bye' || s.screen === 'blocked') return 'exit';
  if (s.screen === 'pendulum' || s.screen === 'titles' || s.screen === 'legal' || s.screen === 'privacy') {
    s.back();
    return 'handled';
  }
  const prev = BACK[s.screen];
  if (!prev) return 'exit';
  if (prev === 'gate') { s.reset('gate'); return 'handled'; } // volver a la puerta = empezar de cero
  s.go(prev);
  return 'handled';
}

let pausedAt: number | null = null;
const fxMute = (FX as unknown as { setMuted?(b: boolean): void }).setMuted;

/** Segundo plano: silencia audio y ambiente. Al volver tras > 30 min, borra la sesión. */
export function onPause(now = Date.now()) {
  pausedAt = now;
  stopAmbient();
  try { fxMute?.(true); } catch { /* sin audio */ }
  document.documentElement.classList.add('is-paused'); // CSS: pausa animaciones
  window.dispatchEvent(new Event('arcana:pause'));
}
export function onResume(now = Date.now()) {
  const away = pausedAt === null ? 0 : now - pausedAt;
  pausedAt = null;
  document.documentElement.classList.remove('is-paused');
  try { fxMute?.(useSound.getState().muted); } catch { /* sin audio */ }
  if (away >= INACTIVITY_MS) useSession.getState().reset('gate');
  window.dispatchEvent(new Event('arcana:resume'));
}

let splashHidden = false;
export function hideSplash() {
  if (splashHidden || !isNative()) return;
  splashHidden = true;
  void import('@capacitor/splash-screen').then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 300 })).catch(() => {});
}

/** Vibración suave (girar carta, sellar). Respeta el modo ligero / movimiento reducido. */
export function haptic(kind: 'light' | 'medium' = 'light') {
  if (!isNative() || prefersReducedMotion()) return;
  void import('@capacitor/haptics')
    .then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: kind === 'light' ? ImpactStyle.Light : ImpactStyle.Medium }))
    .catch(() => {});
}

/** Guarda la imagen en la caché de la app y abre la hoja de compartir del sistema (guardar, enviar…). */
export async function shareImageNative(blob: Blob, filename: string, text: string): Promise<boolean> {
  if (!isNative()) return false;
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
  const data = await blobToBase64(blob);
  const res = await Filesystem.writeFile({ path: filename, data, directory: Directory.Cache });
  try {
    await Share.share({ title: filename, text, files: [res.uri], dialogTitle: text });
  } catch { /* el usuario canceló */ }
  return true;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).replace(/^data:[^,]*,/, ''));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Arranque nativo: botón atrás, pausa/reanudación, barra de estado y teclado. */
export async function initNative(): Promise<void> {
  if (!isNative()) return;
  document.documentElement.classList.add('is-native');
  const [{ App }, { StatusBar, Style }] = await Promise.all([import('@capacitor/app'), import('@capacitor/status-bar')]);
  void StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  void StatusBar.setBackgroundColor({ color: '#140a1f' }).catch(() => {});
  void App.addListener('backButton', () => { if (handleBack() === 'exit') void App.exitApp(); });
  void App.addListener('pause', () => onPause());
  void App.addListener('resume', () => onResume());
  // Teclado en pantalla: la actividad usa adjustResize; además, el campo con foco se centra.
  document.addEventListener('focusin', (e) => {
    const el = e.target as HTMLElement | null;
    if (!el || !el.matches('input, textarea, select')) return;
    setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 350);
  });
  window.addEventListener('resize', () => {
    const el = document.activeElement as HTMLElement | null;
    if (el?.matches?.('input, textarea')) el.scrollIntoView({ block: 'center' });
  });
}
