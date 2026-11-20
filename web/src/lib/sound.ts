// Envoltorio del sonido del equipo de animación + preferencia de silencio.
import { create } from 'zustand';
import * as FX from '../fx';
import { loadMuted, saveMuted } from './prefs';

type Sfx = 'shuffle' | 'flip' | 'candle' | 'bell' | 'chime' | 'stamp' | 'swing';
const fx = FX as unknown as {
  playSfx?: (n: Sfx) => void; setMuted?: (b: boolean) => void; startAmbient?: () => void; stopAmbient?: () => void;
};

export const useSound = create<{ muted: boolean; toggle(): void }>()((set, get) => ({
  muted: loadMuted(),
  toggle() {
    const m = !get().muted;
    saveMuted(m);
    try { fx.setMuted?.(m); } catch { /* sin audio */ }
    if (m) stopAmbient();
    set({ muted: m });
  },
}));

try { fx.setMuted?.(useSound.getState().muted); } catch { /* sin audio */ }

export function sfx(name: Sfx) {
  if (useSound.getState().muted) return;
  try { fx.playSfx?.(name); } catch { /* sin audio */ }
}
export function startAmbient() {
  if (useSound.getState().muted) return;
  try { fx.startAmbient?.(); } catch { /* sin audio */ }
}
export function stopAmbient() {
  try { fx.stopAmbient?.(); } catch { /* sin audio */ }
}
