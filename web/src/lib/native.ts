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
  if (away >= INACTIVITY_MS) useSession.getState().reset('gate'); // reset → epoch → purga
  else void purgeShareCacheOnResume(now);
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

// ---- Imagen y diploma (A-1: privacidad) ---------------------------------------------------------
// La copia temporal vive en `cache/share/` (carpeta propia) y se borra: al cerrarse la hoja de compartir
// (éxito o cancelación), al salir o caducar la sesión (cambio de `epoch`) y al arrancar la app.
export const SHARE_DIR = 'share';

type FsMod = typeof import('@capacitor/filesystem');
type ShareMod = typeof import('@capacitor/share');
let modsOverride: { fs: FsMod; share: ShareMod } | null = null;
/** Sólo para pruebas: inyecta Filesystem/Share falsos y fuerza el modo nativo. */
export function setNativeModulesForTests(m: { fs: FsMod; share: ShareMod } | null) { modsOverride = m; }
const native = () => isNative() || !!modsOverride;
async function mods(): Promise<{ fs: FsMod; share: ShareMod }> {
  if (modsOverride) return modsOverride;
  const [fs, share] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
  return { fs, share };
}

export const SHARE_RESUME_MS = 2 * 60 * 1000;
export const SHARE_TIMER_MS = 10 * 60 * 1000;
let sharedAt: number | null = null;
let shareTimer: ReturnType<typeof setTimeout> | null = null;

function markShared(now = Date.now()) {
  sharedAt = now;
  if (shareTimer) clearTimeout(shareTimer);
  shareTimer = setTimeout(() => { void purgeShareCache(); }, SHARE_TIMER_MS);
}

/** Al volver a primer plano: si se compartió hace ≥ 2 min, se borra la copia temporal. */
export function purgeShareCacheOnResume(now = Date.now()): Promise<void> | undefined {
  if (sharedAt !== null && now - sharedAt >= SHARE_RESUME_MS) return purgeShareCache();
  return undefined;
}

/** Borra todas las copias temporales (no falla si no existen). */
export async function purgeShareCache(): Promise<void> {
  if (!native()) return;
  sharedAt = null;
  if (shareTimer) { clearTimeout(shareTimer); shareTimer = null; }
  try {
    const { fs } = await mods();
    await fs.Filesystem.rmdir({ path: SHARE_DIR, directory: fs.Directory.Cache, recursive: true });
  } catch { /* no había nada */ }
}

/** Salir, inactividad o bloqueo cambian `epoch`: se borran las copias temporales al instante. */
export function watchSessionForShareCache(): () => void {
  return useSession.subscribe((s, prev) => { if (s.epoch !== prev.epoch) void purgeShareCache(); });
}

/** Escribe la imagen en la caché, abre la hoja de compartir del sistema (guardar, enviar…) y la borra. */
export async function shareImageNative(blob: Blob, filename: string, text: string): Promise<boolean> {
  if (!native()) return false;
  const { fs, share } = await mods();
  const { Filesystem, Directory } = fs;
  const path = `${SHARE_DIR}/${filename.replace(/[^a-z0-9._-]/gi, '_')}`;
  const data = await blobToBase64(blob);
  const res = await Filesystem.writeFile({ path, data, directory: Directory.Cache, recursive: true });
  // NO se borra al cerrarse la hoja: WhatsApp, Gmail o Drive leen la URI del FileProvider de forma
  // asíncrona. Se borra al volver a primer plano pasados 2 min, a los 10 min, o al salir/caducar/arrancar.
  markShared();
  try {
    await share.Share.share({ title: filename, text, files: [res.uri], dialogTitle: text });
  } catch {
    // Cancelar la hoja no es un error (A-6): no se registra nada.
  }
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
  // Restos de una sesión anterior (p. ej. la app se cerró con la hoja de compartir abierta).
  void purgeShareCache();
  watchSessionForShareCache();
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
