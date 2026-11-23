// A-1: la imagen y el diploma (que pueden llevar el nombre) no se quedan en la caché de la app.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  purgeShareCache, purgeShareCacheOnResume, setNativeModulesForTests, shareImageNative, watchSessionForShareCache,
  SHARE_DIR, SHARE_RESUME_MS, SHARE_TIMER_MS,
} from '../lib/native';
import { initialData, useSession } from '../state/session';

const files = new Map<string, string>();
let shareOutcome: 'ok' | 'cancel' = 'ok';
const shared: string[] = [];

const fs = {
  Directory: { Cache: 'CACHE' },
  Filesystem: {
    async writeFile(o: { path: string; data: string; directory: string }) { files.set(o.path, o.data); return { uri: 'file:///cache/' + o.path }; },
    async deleteFile(o: { path: string }) { if (!files.delete(o.path)) throw new Error('no existe'); },
    async rmdir(o: { path: string; recursive?: boolean }) {
      let n = 0;
      for (const k of [...files.keys()]) if (k.startsWith(o.path + '/')) { files.delete(k); n++; }
      if (!n) throw new Error('no existe');
    },
  },
};
const share = {
  Share: {
    async share(o: { files: string[] }) {
      shared.push(...o.files);
      // durante la hoja, el fichero existe
      expect(files.size).toBeGreaterThan(0);
      if (shareOutcome === 'cancel') throw new Error('Share canceled');
      return {};
    },
  },
};

const blob = () => new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' });

describe('caché temporal de compartir', () => {
  beforeEach(() => {
    files.clear(); shared.length = 0; shareOutcome = 'ok';
    setNativeModulesForTests({ fs, share } as never);
    sessionStorage.clear(); localStorage.clear();
    useSession.setState(initialData());
  });
  afterEach(async () => { await purgeShareCache(); setNativeModulesForTests(null); });

  it('NO se borra al cerrarse la hoja (las apps de destino leen la URI después)', async () => {
    await shareImageNative(blob(), 'diploma-tarotazo.png', 'Tarotazo');
    expect(shared[0]).toContain(`${SHARE_DIR}/diploma-tarotazo.png`);
    expect(files.size).toBe(1);
    shareOutcome = 'cancel';
    await expect(shareImageNative(blob(), 'tarotazo.png', 'Tarotazo')).resolves.toBe(true); // cancelar no es error
    expect(files.size).toBe(2);
  });

  it('al volver a primer plano se borra sólo si pasaron ≥ 2 min desde que se compartió', async () => {
    const t0 = Date.now();
    await shareImageNative(blob(), 'tarotazo.png', 'Tarotazo');
    expect(purgeShareCacheOnResume(t0 + SHARE_RESUME_MS - 5_000)).toBeUndefined();
    expect(files.size).toBe(1);
    await purgeShareCacheOnResume(t0 + SHARE_RESUME_MS + 5_000);
    expect(files.size).toBe(0);
  });

  it('temporizador: se borra a los 10 min aunque la app siga abierta', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await shareImageNative(blob(), 'tarotazo.png', 'Tarotazo');
      await vi.advanceTimersByTimeAsync(SHARE_TIMER_MS - 1_000);
      expect(files.size).toBe(1);
      await vi.advanceTimersByTimeAsync(2_000);
      expect(files.size).toBe(0);
    } finally { vi.useRealTimers(); }
  });

  it('al salir o caducar la sesión se purgan los restos', async () => {
    files.set(`${SHARE_DIR}/tarotazo.png`, 'resto');
    const stop = watchSessionForShareCache();
    useSession.getState().reset('bye');
    await new Promise((r) => setTimeout(r, 0));
    expect(files.size).toBe(0);
    stop();
  });

  it('al arrancar se limpian restos de una sesión anterior', async () => {
    files.set(`${SHARE_DIR}/diploma-tarotazo.png`, 'resto');
    await purgeShareCache();
    expect(files.size).toBe(0);
    await expect(purgeShareCache()).resolves.toBeUndefined(); // sin nada que borrar, no falla
  });
});
