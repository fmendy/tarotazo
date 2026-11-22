// Accesibilidad básica: teclado en mapa, abanico y menú + axe-core en cada pantalla.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import {
  SENTINEL, btn, chooseDeck, chooseSpread, confirmAge, cut, doReading, enterName, menu, openMenuIfCollapsed, passGate, shuffle, watch,
} from './helpers';

interface AxeHit { screen: string; id: string; impact: string; help: string; nodes: number; targets: string[] }

async function axe(page: Page, screen: string, out: AxeHit[]) {
  // Deja que terminen las animaciones de entrada (opacidad) para no medir contrastes a medias.
  await page.waitForTimeout(1500);
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
  for (const v of r.violations) {
    out.push({ screen, id: v.id, impact: v.impact ?? 'n/a', help: v.help, nodes: v.nodes.length, targets: v.nodes.slice(0, 4).map((n) => n.target.join(' ')) });
  }
}

async function report(out: AxeHit[], testInfo: TestInfo) {
  await testInfo.attach('axe.json', { body: JSON.stringify(out, null, 2), contentType: 'application/json' });
  const serious = out.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect.soft(serious.map((v) => `${v.screen}: [${v.impact}] ${v.id} — ${v.help} (${v.nodes}) ${v.targets.join(' | ')}`), 'violaciones axe serias/críticas').toEqual([]);
}

test('teclado: puerta, nombre, edad y mapa de provincias (Tab + Intro) + axe', async ({ page, baseURL }, testInfo) => {
  const out: AxeHit[] = [];
  watch(page, baseURL!);
  await page.goto('/');
  await axe(page, 'puerta', out);
  // «Saltar al contenido» debe ser el primer elemento tabulable del documento y verse al enfocarlo.
  const firstTabbable = await page.evaluate(() => {
    const el = [...document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]')]
      .find((e) => e.tabIndex >= 0 && !e.hasAttribute('disabled'));
    return el?.textContent?.trim();
  });
  expect(firstTabbable).toBe('Saltar al contenido');
  await page.locator('a.skip').focus();
  await expect(page.locator('a.skip')).toBeInViewport();
  // Casilla + Entrar sólo con teclado
  await page.getByRole('checkbox').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter'); // envía el formulario desde la casilla
  await expect(page.getByRole('textbox', { name: 'Tu nombre', exact: true })).toBeVisible();
  await axe(page, 'nombre', out);
  await page.getByRole('textbox', { name: 'Tu nombre', exact: true }).focus();
  await page.keyboard.type(SENTINEL.name);
  await page.keyboard.press('Enter');
  await btn(page, 'Sólo diré mi edad').focus();
  await page.keyboard.press('Enter');
  await page.getByRole('spinbutton', { name: 'Edad', exact: true }).focus();
  await page.keyboard.type('44');
  await page.keyboard.press('Enter');
  await expect(page.locator('.stats')).toBeVisible();
  await axe(page, 'edad', out);
  await btn(page, 'Continuar').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.spainmap--ok')).toBeVisible();
  await axe(page, 'provincia', out);
  // Mapa: las provincias son focusables (role=button) y se eligen con Intro
  const provs = page.locator('.spainmap__svg [data-code][role="button"]');
  expect(await provs.count()).toBeGreaterThanOrEqual(52);
  await provs.first().focus();
  let reached = '';
  for (let i = 0; i < 60; i++) {
    const code = await page.evaluate(() => document.activeElement?.getAttribute('data-code'));
    if (code === '46') { reached = code; break; }
    await page.keyboard.press('Tab');
  }
  expect(reached, 'se llega a Valencia (46) tabulando por el mapa').toBe('46');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Has elegido: Valencia')).toBeVisible();
  await expect(page.locator('.spainmap__svg [data-code="46"]')).toHaveAttribute('aria-pressed', 'true');
  // tras elegir con teclado el foco no debe perderse en <body>
  const focusTag = await page.evaluate(() => document.activeElement?.tagName);
  expect.soft(focusTag, 'el foco sigue en el mapa tras elegir').not.toBe('BODY');
  await axe(page, 'provincia elegida', out);
  await report(out, testInfo);
});

test('teclado: cofres, carrusel, tiradas, corte y abanico + axe en el ritual y la lectura', async ({ page, baseURL }, testInfo) => {
  const out: AxeHit[] = [];
  const m = watch(page, baseURL!);
  await passGate(page, { date: SENTINEL.birth });
  await enterName(page, SENTINEL.name);
  await confirmAge(page);
  await page.locator('.spainmap__svg [data-code="15"]').click();
  await btn(page, 'Continuar').click();
  await axe(page, 'baraja · cofres', out);
  // Cofre con teclado
  await page.getByRole('button', { name: 'Baraja española', exact: true }).focus();
  await page.keyboard.press('Enter');
  const car = page.getByRole('listbox', { name: /Carrusel/ });
  await expect(car).toBeVisible();
  await car.focus();
  await page.keyboard.press('ArrowRight');
  await expect(car).toHaveAttribute('aria-label', /Opción 2|Catalana|catalana/i);
  await page.keyboard.press('Enter');
  await axe(page, 'baraja · carrusel', out);
  await btn(page, 'Usar este modelo').focus();
  await page.keyboard.press('Enter');
  await axe(page, 'tirada', out);
  await page.getByRole('radio', { name: /Pasado, presente y futuro/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('radio', { name: /Pasado, presente y futuro/ })).toHaveAttribute('aria-checked', 'true');
  await btn(page, 'Barajar').focus();
  await page.keyboard.press('Enter');
  await axe(page, 'barajado', out);
  await shuffle(page, false);
  await axe(page, 'corte', out);
  await cut(page, 'keyboard');
  await axe(page, 'abanico', out);
  const fan = page.getByRole('listbox', { name: /Elige 3 cartas/ });
  await fan.focus();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(fan).toHaveAttribute('aria-label', /Elegidas: 1/);
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await expect(page.locator('.screen.reading')).toBeVisible({ timeout: 30_000 });
  await axe(page, 'lectura', out);
  await doReading(page, m, 'Prefiero no decirlo');
  await axe(page, 'cierre', out);
  await report(out, testInfo);
});

test('teclado: menú (hamburguesa en móvil), Escape del selector de idioma + axe en péndulo y titulaciones', async ({ page, baseURL }, testInfo) => {
  const out: AxeHit[] = [];
  watch(page, baseURL!);
  await passGate(page, { declare: true });
  // espera a que el foco automático pase al título de la pantalla nueva
  await page.waitForTimeout(400);
  // Tras cambiar de pantalla el foco debería quedar en el título (App.tsx) y no en <body>.
  expect.soft(await page.evaluate(() => document.activeElement?.id), 'foco en el título tras cambiar de pantalla').toBe('screen-title');
  const burger = page.locator('.topbar__burger');
  // En escritorio (≥760 px) la hamburguesa debería estar oculta (app.css:75); ver QA-hallazgo.
  expect.soft(await burger.isVisible(), 'hamburguesa oculta en escritorio').toBe((page.viewportSize()?.width ?? 0) < 760);
  if ((page.viewportSize()?.width ?? 0) < 760) {
    await burger.focus();
    await page.keyboard.press('Enter');
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
  }
  const pend = page.locator('#main-menu').getByRole('button', { name: 'Péndulo', exact: true });
  await pend.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#screen-title')).toHaveText('El Oráculo Oscilante');
  await axe(page, 'péndulo · vitrina', out);
  await btn(page, 'Elegir').click();
  await axe(page, 'péndulo · calibración', out);
  await btn(page, 'Ya nos conocemos').click();
  await axe(page, 'péndulo · preguntas', out);
  // Las pestañas de modo responden a flechas (patrón tablist)
  const tab = page.getByRole('tab', { name: 'Sí / No', exact: true });
  await tab.focus();
  await page.keyboard.press('ArrowRight');
  const sel = await page.getByRole('tab', { selected: true }).innerText();
  expect.soft(sel, 'tablist: ArrowRight cambia de pestaña (patrón ARIA)').toBe('Tablero');
  await menu(page, 'Titulaciones');
  await axe(page, 'titulaciones', out);
  // Selector de idioma: abre con Intro y cierra con Escape
  await openMenuIfCollapsed(page);
  const ball = page.locator('.langball__btn');
  await ball.focus();
  await page.keyboard.press('Enter');
  await expect(ball).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(ball).toHaveAttribute('aria-expanded', 'false');
  await menu(page, 'Salir');
  await axe(page, 'despedida', out);
  await page.getByRole('button', { name: 'Volver a empezar' }).click();
  await btn(page, 'Todavía no').click();
  await axe(page, 'bloqueo', out);
  await report(out, testInfo);
});
