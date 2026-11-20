// Única preferencia guardada en el navegador: el silencio del sonido (no es dato personal).
const KEY = 'arcana.muted';

export function loadMuted(): boolean {
  try { return globalThis.localStorage?.getItem(KEY) === '1'; } catch { return false; }
}
export function saveMuted(m: boolean) {
  try { globalThis.localStorage?.setItem(KEY, m ? '1' : '0'); } catch { /* bloqueado: da igual */ }
}
