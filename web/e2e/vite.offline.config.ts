// `vite preview` del build sin conexión, SIN proxy /api (la config del front hereda server.proxy en
// preview). Así cualquier llamada al API falla con 404 y además la detecta helpers.ts (E2E_OFFLINE=1).
import { mergeConfig } from 'vite';
import base from '../vite.config';

const cfg = mergeConfig(base, { preview: { port: Number(process.env.E2E_OFFLINE_PORT ?? 4174), strictPort: true } });
if (cfg.server) delete cfg.server.proxy;
if (cfg.preview) delete cfg.preview.proxy;
export default cfg;
