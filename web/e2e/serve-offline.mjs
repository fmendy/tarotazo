// Sirve el build SIN CONEXIÓN (el de la app Android: `vite build --mode app`, VITE_OFFLINE=1)
// con `vite preview`, para las E2E del modo `offline` (E2E_OFFLINE=1).
//  - Compila en un directorio temporal (no toca web/dist, que usa `cap sync`).
//  - `vite preview` sin proxy /api: si la app intentase llamar al API, el test lo detecta y falla.
// Uso: node e2e/serve-offline.mjs   (lo lanza playwright.config.ts como webServer)
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(tmpdir(), 'arcana-offline-dist');
mkdirSync(out, { recursive: true });
const port = process.env.E2E_OFFLINE_PORT ?? '4174';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const opts = { cwd: web, stdio: 'inherit', shell: process.platform === 'win32' };

const b = spawnSync(npx, ['vite', 'build', '--mode', 'app', '--outDir', out, '--emptyOutDir'], opts);
if (b.status !== 0) process.exit(b.status ?? 1);
// vite.offline.config.ts quita el proxy /api que preview heredaría de server.proxy.
const child = spawn(npx, ['vite', 'preview', '--config', 'e2e/vite.offline.config.ts', '--outDir', out, '--port', port, '--strictPort'], opts);
const stop = () => { try { child.kill(); } catch { /* ya parado */ } };
process.on('SIGINT', stop); process.on('SIGTERM', stop); process.on('exit', stop);
child.on('exit', (code) => process.exit(code ?? 0));
