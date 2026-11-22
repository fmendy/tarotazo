// E2E de Tarotazo (fase 5, QA). Contra el backend REAL.
//
//   npx playwright test                       # escritorio + móvil (Pixel 7, reducedMotion)
//   npx playwright test --project=desktop     # sólo uno
//   E2E_BASE_URL=https://localhost E2E_EXTERNAL=1 npx playwright test e2e/privacy.e2e.ts   # contra la pila Docker
//   PERF_URL=http://localhost:4173 npx playwright test --project=perf   # FPS (build + vite preview)
//
// Por defecto levanta su propia pila de pruebas:
//   - API real (jar de api/target) en :8081 con el rate-limit elevado (ver e2e/start-api.mjs),
//   - Vite en :5174 con el proxy /api → :8081 (e2e/vite.e2e.config.ts).
// Con E2E_EXTERNAL=1 no arranca nada y usa E2E_BASE_URL (p. ej. http://localhost:5173 o la pila Docker).
import { defineConfig, devices } from '@playwright/test';

const external = process.env.E2E_EXTERNAL === '1';
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5174';

export default defineConfig({
  testDir: './e2e',
  // *.e2e.ts (no *.spec.ts): Vitest recoge **/*.spec.ts por defecto y rompería `npm test`.
  testMatch: /.*\.e2e\.ts$/,
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: '../qa/playwright-report', open: 'never' }], ['json', { outputFile: '../qa/playwright-results.json' }]],
  outputDir: '../qa/test-results',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true, // CA interna de Caddy en la pila Docker local
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    acceptDownloads: true,
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: /(perf|_debug)\.e2e\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 }, contextOptions: { reducedMotion: 'no-preference' } },
    },
    {
      name: 'mobile',
      testIgnore: /(perf|_debug)\.e2e\.ts/,
      use: { ...devices['Pixel 7'], contextOptions: { reducedMotion: 'reduce' } },
    },
    {
      name: 'perf',
      testMatch: /perf\.e2e\.ts/,
      use: { ...devices['Pixel 7'], baseURL: process.env.PERF_URL ?? 'http://localhost:4173', contextOptions: { reducedMotion: 'no-preference' } },
    },
  ],
  webServer: external ? undefined : [
    {
      command: 'node e2e/start-api.mjs',
      url: `http://localhost:${process.env.E2E_API_PORT ?? '8081'}/actuator/health`,
      reuseExistingServer: true,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npx vite --config e2e/vite.e2e.config.ts',
      url: baseURL,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
