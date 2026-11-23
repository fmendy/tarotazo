// Titulaciones, salir (borra el estado), inactividad de 30 min (page.clock) y textos legales.
import { expect, test } from '@playwright/test';
import { SENTINEL, btn, checkText, chooseProvince, confirmAge, enterName, expectClean, menu, openMenuIfCollapsed, passGate, watch } from './helpers';
import { OFFLINE } from './helpers';

test('titulaciones: muro visible y compulsar un título', async ({ page, baseURL }, testInfo) => {
  const m = watch(page, baseURL!);
  await passGate(page, { declare: true });
  await menu(page, 'Titulaciones');
  await expect(page.locator('#screen-title')).toHaveText('Titulaciones de Madame Remedios');
  const diplomas = page.locator('.diplomas > li');
  await expect(diplomas.first()).toBeVisible();
  expect(await diplomas.count()).toBeGreaterThanOrEqual(10);
  // El texto del diploma no debe quedar tapado por el marco (regresión: marco SVG encima del papel)
  const firstTitle = diplomas.first().locator('.diploma__title');
  await firstTitle.scrollIntoViewIfNeeded();
  await expect(firstTitle).toBeVisible();
  await expect.poll(() => firstTitle.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!top && (top === el || el.contains(top));
  }), { message: 'el título del diploma está tapado por otro elemento', timeout: 5000 }).toBe(true);
  // Al pasar por un diploma la vidente comenta
  await diplomas.nth(1).locator('.diploma__frame').hover();
  await expect(page.locator('.titles__seer .bubble')).toContainText('«');
  // Compulsar → sello animado
  await diplomas.nth(0).getByRole('button', { name: 'Compulsar título' }).click();
  await expect(diplomas.nth(0).getByRole('img', { name: /Sello: compulsado/ })).toBeVisible();
  await checkText(page, m, 'titulaciones');
  // Volver a la lectura desde el menú
  await menu(page, 'Volver a la lectura');
  await expect(page.getByRole('textbox', { name: 'Tu nombre', exact: true })).toBeVisible();
  await expectClean(m, testInfo);
});

test('Salir → se borra todo el estado y vuelve a la puerta', async ({ page, baseURL }, testInfo) => {
  const m = watch(page, baseURL!);
  await passGate(page, { date: SENTINEL.birth });
  await enterName(page, SENTINEL.name);
  await confirmAge(page);
  await chooseProvince(page, { code: '28' });
  await menu(page, 'Salir');
  await expect(page.locator('#screen-title')).toHaveText('Hasta la próxima');
  await checkText(page, m, 'despedida');
  await btn(page, 'Volver a empezar').click();
  await expect(page.locator('#screen-title')).toHaveText(/mayor de edad/);
  // Estado borrado: hay que volver a pasar la puerta; el nombre ya no está.
  await page.getByRole('checkbox').check();
  await page.locator('.gate__form button[type="submit"]').click();
  await expect(page.getByRole('textbox', { name: 'Tu nombre', exact: true })).toHaveValue('');
  const html = await page.content();
  expect(html).not.toContain('Centinela');
  await expectClean(m, testInfo);
});

test('inactividad de 30 minutos → se borra la sesión (page.clock)', async ({ page, baseURL }, testInfo) => {
  // Importa el store por su URL de Vite (sólo existe en el servidor de desarrollo). En el build sin
  // conexión lo cubre «inactividad (tiempo real acelerado)».
  test.skip(OFFLINE, 'el store no es importable en el build de producción');
  const m = watch(page, baseURL!);
  await page.clock.install();
  await passGate(page, { date: SENTINEL.birth });
  await enterName(page, SENTINEL.name);
  await confirmAge(page);
  await expect(page.locator('.spainmap--ok')).toBeVisible();
  // Estado del store (sólo en dev, el módulo se puede importar por su URL de Vite).
  const screen = () => page.evaluate(async () => (await import(/* @vite-ignore */ '/src/state/session.ts' as string)).useSession.getState().screen as string);
  const name = () => page.evaluate(async () => (await import(/* @vite-ignore */ '/src/state/session.ts' as string)).useSession.getState().name as string);
  await page.clock.fastForward('29:00');
  expect(await screen()).toBe('province');
  await page.clock.fastForward('01:05');
  expect(await screen(), 'a los 30 min el store vuelve a la puerta').toBe('gate');
  expect(await name(), 'y el nombre se ha borrado').toBe('');
  // La interfaz debería mostrar la puerta. Con el reloj falso de Playwright, tras un salto de ≥1 min
  // AnimatePresence (framer-motion) no completa la transición de salida: se comprueba aparte en
  // «inactividad (tiempo real acelerado)». Aquí sólo se registra.
  const ui = await page.locator('#screen-title').innerText();
  testInfo.annotations.push({ type: 'ui tras salto de reloj', description: ui });
  await expectClean(m, testInfo);
});

test('inactividad (tiempo real acelerado: el temporizador de 30 min se reduce a 3 s) → la interfaz vuelve a la puerta', async ({ page, baseURL }, testInfo) => {
  const m = watch(page, baseURL!);
  // Sin reloj falso: se acorta SÓLO el setTimeout de 30 min (1 800 000 ms) del guardián de inactividad.
  await page.addInitScript(() => {
    const st = window.setTimeout.bind(window);
    (window as unknown as { setTimeout: unknown }).setTimeout = (fn: TimerHandler, ms?: number, ...a: unknown[]) => st(fn, ms === 1_800_000 ? 3000 : ms, ...a);
  });
  await passGate(page, { date: SENTINEL.birth });
  await enterName(page, SENTINEL.name);
  await confirmAge(page);
  await expect(page.locator('.spainmap--ok')).toBeVisible();
  await expect(page.locator('#screen-title')).toHaveText(/mayor de edad/, { timeout: 10_000 });
  expect(await page.content()).not.toContain('Centinela');
  await openMenuIfCollapsed(page);
  await expect(page.locator('#main-menu').getByRole('button', { name: 'Péndulo' })).toBeDisabled();
  await expectClean(m, testInfo);
});

test('la actividad reinicia el temporizador de inactividad', async ({ page, baseURL }) => {
  watch(page, baseURL!);
  await page.clock.install();
  await passGate(page, { declare: true });
  await expect(page.getByRole('textbox', { name: 'Tu nombre', exact: true })).toBeVisible();
  await page.clock.fastForward('20:00');
  await page.getByRole('textbox', { name: 'Tu nombre', exact: true }).press('a');
  await page.clock.fastForward('20:00');
  await expect(page.getByRole('textbox', { name: 'Tu nombre', exact: true })).toBeVisible();
});

test('aviso legal y privacidad accesibles desde el pie y vuelven a la pantalla anterior', async ({ page, baseURL }, testInfo) => {
  const m = watch(page, baseURL!);
  await page.goto('/');
  await page.getByRole('button', { name: 'Aviso legal' }).click();
  await expect(page.locator('#screen-title')).toHaveText('Aviso legal');
  await expect(page.getByRole('note').filter({ hasText: 'pendiente de revisión legal' })).toBeVisible();
  await checkText(page, m, 'aviso legal');
  await btn(page, 'Volver').click();
  await page.getByRole('button', { name: 'Privacidad' }).click();
  await expect(page.locator('#screen-title')).toHaveText('Política de privacidad');
  await checkText(page, m, 'privacidad');
  await btn(page, 'Volver').click();
  await expect(page.locator('#screen-title')).toHaveText(/mayor de edad/);
  await expectClean(m, testInfo);
});

test('aviso de entretenimiento en portada y meta rating adulto', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('note').filter({ hasText: /entretenimiento/i }).first()).toBeVisible();
  await expect(page.locator('meta[name="rating"]').first()).toHaveAttribute('content', 'adult');
});
