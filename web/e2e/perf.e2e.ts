// FPS aproximados (requestAnimationFrame) durante el barajado y el péndulo, con CPU ×4 (CDP).
// Ejecutar contra el build de producción:  npm run build && npx vite preview  (o la pila Docker)
//   E2E_EXTERNAL=1 PERF_URL=http://localhost:4173 npx playwright test --project=perf
// Objetivo de la especificación: 60 fps en móvil de gama media.
import { expect, test, type Page } from '@playwright/test';
import { SENTINEL, btn, chooseDeck, chooseSpread, confirmAge, enterName, menu, passGate } from './helpers';

const THROTTLE = Number(process.env.PERF_THROTTLE ?? 4);

async function throttle(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  return cdp;
}

/** Cuenta frames con rAF durante `ms` y devuelve fps medio, p5 de fps instantáneo y frames > 50 ms. */
async function measure(page: Page, ms: number) {
  return page.evaluate((dur) => new Promise<{ fps: number; p5: number; long: number; frames: number; worst: number }>((resolve) => {
    const deltas: number[] = [];
    let last = performance.now();
    const start = last;
    const tick = (t: number) => {
      deltas.push(t - last); last = t;
      if (t - start < dur) requestAnimationFrame(tick);
      else {
        const sorted = [...deltas].sort((a, b) => b - a);
        const p95dt = sorted[Math.floor(sorted.length * 0.05)] ?? 0;
        resolve({ fps: Math.round((deltas.length / ((t - start) / 1000)) * 10) / 10, p5: Math.round(1000 / p95dt), long: deltas.filter((d) => d > 50).length, frames: deltas.length, worst: Math.round(sorted[0] ?? 0) });
      }
    };
    requestAnimationFrame(tick);
  }), ms);
}

const results: Record<string, unknown> = {};

test.afterAll(async ({}, testInfo) => {
  // eslint-disable-next-line no-console
  console.log('FPS', JSON.stringify(results));
  await testInfo.attach?.('fps.json', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
});

test('FPS durante el barajado (CPU ×4, Pixel 7)', async ({ page }, testInfo) => {
  await passGate(page, { date: SENTINEL.birth });
  await enterName(page, SENTINEL.name);
  await confirmAge(page);
  await page.locator('.spainmap__svg [data-code="28"]').click();
  await btn(page, 'Continuar').click();
  await chooseDeck(page, 'tarot');
  await chooseSpread(page, /Pasado, presente y futuro/);
  await expect(page.locator('#screen-title')).toHaveText('Barajando…');
  await throttle(page);
  const first = await measure(page, 2500);
  // «Más» relanza la animación (estilo aleatorio): medimos varias pasadas
  const runs = [first];
  for (let i = 0; i < 2; i++) {
    const mas = btn(page, 'Más');
    await expect(mas).toBeEnabled({ timeout: 30_000 });
    await mas.click();
    runs.push(await measure(page, 2500));
  }
  results.barajado = runs;
  await testInfo.attach('fps-barajado.json', { body: JSON.stringify(runs, null, 2), contentType: 'application/json' });
  const avg = runs.reduce((a, r) => a + r.fps, 0) / runs.length;
  expect.soft(avg, `fps medio barajado con CPU ×${THROTTLE}`).toBeGreaterThanOrEqual(50);
});

test('FPS del péndulo oscilando (CPU ×4, Pixel 7)', async ({ page }, testInfo) => {
  await passGate(page, { declare: true });
  await menu(page, 'Péndulo');
  await btn(page, 'Elegir').click();
  await btn(page, 'Ya nos conocemos').click();
  await throttle(page);
  const idle = await measure(page, 2000);
  await page.getByRole('textbox', { name: /^Tu pregunta/ }).fill('¿Saldrá el sol mañana?');
  await page.getByRole('button', { name: 'Preguntar al péndulo' }).click();
  const swing = await measure(page, 4000);
  // con el dedo: arrastre sobre el canvas
  const box = await page.locator('.pend canvas').first().boundingBox();
  let drag = null;
  if (box) {
    const pm = page.mouse;
    await pm.move(box.x + box.width / 2, box.y + 20);
    await pm.down();
    const p = measure(page, 2000);
    for (let i = 0; i < 20; i++) await pm.move(box.x + box.width / 2 + Math.sin(i / 2) * 80, box.y + 20 + i);
    await pm.up();
    drag = await p;
  }
  results.pendulo = { idle, swing, drag };
  await testInfo.attach('fps-pendulo.json', { body: JSON.stringify({ idle, swing, drag }, null, 2), contentType: 'application/json' });
  expect.soft(swing.fps, `fps péndulo con CPU ×${THROTTLE}`).toBeGreaterThanOrEqual(50);
});
