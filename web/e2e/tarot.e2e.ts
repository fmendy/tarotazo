// Flujo completo de tarot contra el backend real: 10 pantallas, dos barajas, tiradas de 3 y 5.
import { expect, test } from '@playwright/test';
import {
  SENTINEL, btn, checkText, chooseDeck, chooseProvince, chooseSpread, closing, confirmAge, cut, doReading,
  enterName, expectClean, onboard, openMenuIfCollapsed, passGate, pickCards, shuffle, watch,
} from './helpers';

test.describe('Tarot · flujo completo', () => {
  test('tarot RWS · Pasado/presente/futuro · provincia en el mapa · ratón', async ({ page, baseURL }, testInfo) => {
    const m = watch(page, baseURL!);
    await onboard(page, m, { province: { code: '50' } });
    await chooseDeck(page, 'tarot');
    await checkText(page, m, 'tirada');
    await chooseSpread(page, /Pasado, presente y futuro/, { tema: 'Amor', question: SENTINEL.question });
    await checkText(page, m, 'barajado');
    await shuffle(page, true);
    await checkText(page, m, 'corte');
    await cut(page, 'mouse');
    await checkText(page, m, 'abanico');
    await pickCards(page, 3, 'mouse');
    const log = await doReading(page, m, 'Sí');
    expect(log.cards).toHaveLength(3);
    testInfo.annotations.push({ type: 'lectura', description: `${log.cards.join(' · ')} — preguntas Sí/No: ${log.interactions}` });
    await checkText(page, m, 'cierre');
    const c = await closing(page);
    expect(c.image.suggestedFilename()).toMatch(/\.png$/);
    expect(c.diploma.suggestedFilename()).toMatch(/diploma.*\.png$/);
    // El diploma lleva el nombre: se genera en local (no hay petición de red con él; ver privacy.e2e.ts).
    await checkText(page, m, 'cierre · descargas');
    await expectClean(m, testInfo);
  });

  test('baraja española · Cruz simple (5) · «Nací fuera de España» · casilla +18 · teclado', async ({ page, baseURL }, testInfo) => {
    const m = watch(page, baseURL!);
    await passGate(page, { declare: true });
    await page.getByRole('textbox', { name: 'Tu nombre', exact: true }).fill('Vanesa');
    // Reacción inmediata al nombre (spec: «¿Vanesa? Las Vanesas siempre llegan tarde…»).
    await expect(page.locator('.bubble')).toContainText(/Vanesa/i, { timeout: 15_000 });
    await checkText(page, m, 'nombre · reacción');
    await btn(page, 'Continuar').click();
    // La edad se pide aquí porque en la puerta sólo se marcó la casilla.
    await confirmAge(page, { date: '1990-02-14' });
    await chooseProvince(page, { abroad: true });
    await chooseDeck(page, 'spanish');
    await chooseSpread(page, /Cruz simple/, { tema: 'Salud' });
    await expect(page.getByRole('note').filter({ hasText: 'mejor tu médico' })).toBeVisible();
    await shuffle(page, false);
    await cut(page, 'keyboard');
    await pickCards(page, 5, 'keyboard');
    const log = await doReading(page, m, 'No');
    expect(log.cards).toHaveLength(5);
    testInfo.annotations.push({ type: 'lectura', description: `${log.cards.join(' · ')} — preguntas Sí/No: ${log.interactions}` });
    await closing(page);
    await checkText(page, m, 'cierre');
    // Otra tirada → vuelve a la elección de baraja conservando el onboarding.
    await btn(page, 'Otra tirada').click();
    await expect(page.locator('#screen-title')).toHaveText('Elige tu baraja');
    await expectClean(m, testInfo);
  });

  test('el descargo de salud aparece en la lectura con tema Salud', async ({ page, baseURL }, testInfo) => {
    const m = watch(page, baseURL!);
    await onboard(page, m, { province: { code: '41' } });
    await chooseDeck(page, 'tarot');
    await chooseSpread(page, /Carta del día/, { tema: 'Salud' });
    await shuffle(page, false);
    await cut(page, 'mouse');
    await pickCards(page, 1, 'keyboard');
    await expect(page.locator('.screen.reading')).toBeVisible();
    const intro = page.locator('.reading__intro');
    if (await intro.isVisible()) await intro.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Girar la carta' }).click();
    const all = page.getByRole('button', { name: 'Mostrar todo el texto' });
    if (await all.isVisible()) await all.click();
    await expect(page.locator('.line--salud')).toContainText(/médico/i);
    await checkText(page, m, 'lectura salud');
    await expectClean(m, testInfo);
  });

  test('menor de edad (fecha en la puerta) → salida amable y sesión bloqueada', async ({ page, baseURL }, testInfo) => {
    const m = watch(page, baseURL!);
    const d = new Date(); d.setFullYear(d.getFullYear() - 15);
    await passGate(page, { date: d.toISOString().slice(0, 10) });
    await expect(page.locator('#screen-title')).toHaveText('Todavía no te toca');
    await expect(page.getByText('La sesión queda cerrada')).toBeVisible();
    await checkText(page, m, 'bloqueo');
    // Menú: péndulo y titulaciones deshabilitados; sin botón Salir.
    await openMenuIfCollapsed(page);
    await expect(page.locator('#main-menu').getByRole('button', { name: 'Péndulo' })).toBeDisabled();
    await expect(page.locator('#main-menu').getByRole('button', { name: 'Titulaciones' })).toBeDisabled();
    // Desde el bloqueo, el pie (aviso legal / privacidad) debería seguir siendo consultable.
    await page.getByRole('button', { name: 'Privacidad' }).click();
    await expect.soft(page.locator('#screen-title'), 'la política de privacidad se puede leer desde el bloqueo').toHaveText('Política de privacidad', { timeout: 3000 });
    const back = page.getByRole('button', { name: 'Volver' });
    if (await back.isVisible()) await back.click();
    await expect(page.locator('#screen-title')).toHaveText('Todavía no te toca');
    await expectClean(m, testInfo);
  });

  test('menor de edad declarado después (edad 16 en la pantalla de edad) → bloqueo', async ({ page, baseURL }, testInfo) => {
    const m = watch(page, baseURL!);
    await passGate(page, { declare: true });
    await enterName(page, SENTINEL.name);
    await btn(page, 'Sólo diré mi edad').click();
    await page.getByRole('spinbutton', { name: 'Edad', exact: true }).fill('16');
    await btn(page, 'Continuar').click();
    await expect(page.locator('#screen-title')).toHaveText('Todavía no te toca');
    await expectClean(m, testInfo);
  });

  test('«Todavía no» en la puerta → bloqueo', async ({ page, baseURL }, testInfo) => {
    const m = watch(page, baseURL!);
    await page.goto('/');
    await btn(page, 'Todavía no').click();
    await expect(page.locator('#screen-title')).toHaveText('Todavía no te toca');
    await expectClean(m, testInfo);
  });

  test('sesión bloqueada: ¿sobrevive a recargar la página?', async ({ page }) => {
    test.info().annotations.push({ type: 'hallazgo', description: 'QA-xx: el bloqueo vive sólo en memoria; recargar lo levanta' });
    await page.goto('/');
    await btn(page, 'Todavía no').click();
    await expect(page.locator('#screen-title')).toHaveText('Todavía no te toca');
    await page.reload();
    // Esperado por la spec: «la sesión se bloquea». Obtenido: tras recargar vuelve la puerta.
    await expect(page.locator('#screen-title'), 'tras recargar sigue bloqueado').toHaveText('Todavía no te toca');
  });
});

test('edad: fecha inválida y sin rellenar en la puerta muestran error', async ({ page, baseURL }, testInfo) => {
  const m = watch(page, baseURL!);
  await page.goto('/');
  await page.locator('.gate__form button[type="submit"]').click();
  await expect(page.getByRole('alert')).toHaveText(/Marca la casilla/);
  await page.locator('input[type="date"]').fill('2999-01-01');
  await page.locator('.gate__form button[type="submit"]').click();
  await expect(page.getByRole('alert')).toBeVisible();
  await checkText(page, m, 'puerta errores');
  await expectClean(m, testInfo);
});
