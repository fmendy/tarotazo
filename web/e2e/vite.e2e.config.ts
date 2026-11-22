// Config de Vite SÓLO para E2E: la misma del front, pero en otro puerto y con el proxy
// /api apuntando a la instancia de backend de pruebas (start-api.mjs). No modifica vite.config.ts.
import { mergeConfig } from 'vite';
import base from '../vite.config';

const api = process.env.E2E_API_URL ?? `http://localhost:${process.env.E2E_API_PORT ?? '8081'}`;

export default mergeConfig(base, {
  server: { port: Number(process.env.E2E_WEB_PORT ?? 5174), strictPort: true, proxy: { '/api': api } },
});
