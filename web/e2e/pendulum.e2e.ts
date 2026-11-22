// Péndulo «El Oráculo Oscilante»: vitrina, calibración, «concentrarme», los 7 modos y el enfado.
import { expect, test, type Page } from '@playwright/test';
import { SENTINEL, btn, checkText, expectClean, menu, passGate, watch, type Monitor } from './helpers';

const MODES = [
  ['sino', 'Sí / No'],
  ['tablero', 'Tablero'],
  ['porcentaje', 'Porcentaje'],
  ['ouija', 'Ouija light'],
  ['mapa', 'Radiestesia en el mapa'],
  ['opciones', 'Opciones'],
  ['chakras', 'Chakras'],
] as const;

const answerBubble = (page: Page) => page.locator('.pendulum__side .seer:not(.seer--compact) .bubble');

async function openPendulum(page: Page, m: Monitor, model = 'cuarzo') {
  await passGate(page, { date: SENTINEL.birth });
  await page.getByRole('textbox', { name: 'Tu nombre', exact: true }).fill(SENTINEL.name);
  await menu(page, 'Péndulo');
  await expect(page.locator('#screen-title')).toHaveText('El Oráculo Oscilante');
  await expect(page.locator('.showcase__item')).toHaveCount(9);
  await checkText(page, m, 'péndulo · vitrina');
  await page.locator(`.showcase__item:has(img[src$="/${model}.svg"]), .showcase__item:has(.gem--${model})`).first().click();
  await btn(page, 'Elegir').click();
  await expect(page.getByRole('heading', { name: 'Calibración ritual' })).toBeVisible();
}

async function waitAnswer(page: Page) {
  const bubble = answerBubble(page);
  await expect(bubble).toBeVisible({ timeout: 90_000 });
  // Texto completo: TypewriterText expone el texto entero en aria-label; en reducedMotion es un <span>.
  const full = async () => {
    const tw = bubble.locator('.fx-tw');
    if (await tw.count()) return (await tw.first().getAttribute('aria-label')) ?? '';
    return (await bubble.innerText()).replace(/Madame Remedios dice:?/, '').trim();
  };
  await expect.poll(async () => (await full()).length, { timeout: 30_000 }).toBeGreaterThan(5);
  return full();
}

test.describe('Péndulo', () => {
  test('calibración, «concentrarme» y los 7 modos llegan a una respuesta con texto', async ({ page, baseURL }, testInfo) => {
    test.setTimeout(420_000);
    const m = watch(page, baseURL!);
    await openPendulum(page, m);
    // Calibración: sí y no
    await btn(page, 'Muéstrame tu sí').click();
    await expect(page.locator('.pendulum__side .bubble').last()).toContainText(/Su sí es en (vertical|horizontal)/);
    await btn(page, 'Muéstrame tu no').click();
    await expect(page.locator('.pendulum__side .bubble').last()).toContainText(/Su no es en (vertical|horizontal)/);
    await checkText(page, m, 'péndulo · calibración');
    await btn(page, 'Calibrado. Ya podéis hablar.').click();

    // Concentrarme: oscurece (velo) y cambia el botón
    await btn(page, 'Concentrarme').click();
    await expect(page.locator('.concentrate-veil')).toBeAttached();
    await expect(page.locator('.screen.pendulum')).toHaveClass(/is-concentrating/);
    await checkText(page, m, 'péndulo · concentrarme');
    await btn(page, 'Dejar de concentrarme').click();
    await expect(page.locator('.concentrate-veil')).toHaveCount(0);

    const results: Record<string, string> = {};
    let n = 0;
    for (const [id, label] of MODES) {
      await page.getByRole('tab', { name: label, exact: true }).click();
      await expect(page.getByRole('tab', { name: label, exact: true })).toHaveAttribute('aria-selected', 'true');
      // Preguntas distintas en cada modo para no disparar el enfado.
      await page.getByRole('textbox', { name: /^Tu pregunta/ }).fill(`${SENTINEL.question} (${++n})`);
      if (id === 'opciones') {
        const opts = page.locator('.options input');
        await opts.nth(0).fill(SENTINEL.options[0]);
        await opts.nth(1).fill(SENTINEL.options[1]);
        await page.getByRole('button', { name: 'Añadir opción' }).click();
        await opts.nth(2).fill(SENTINEL.options[2]);
      }
      const ask = page.getByRole('button', { name: /^(Preguntar al péndulo|Otra pregunta)$/ });
      const resp = page.waitForResponse((r) => r.url().includes('/api/v1/pendulum/answer'));
      await ask.click();
      const r = await resp;
      expect(r.status(), `modo ${id}: estado HTTP`).toBe(200);
      const body = await r.json();
      expect(body.mode).toBe(id);
      const text = await waitAnswer(page);
      results[id] = text;
      expect(text, `modo ${id}: texto de respuesta`).not.toMatch(/^\s*$/);
      if (id === 'opciones') expect(SENTINEL.options.some((o) => text.includes(o)), 'opciones: el texto nombra la opción elegida (rellena en local)').toBe(true);
      if (id === 'ouija') await expect(page.locator('.pboard text').last()).toHaveText(String(body.result.word).toLocaleUpperCase('es'));
      if (id === 'chakras') for (const lvl of body.result.levels) expect(lvl.nivel).toBeGreaterThanOrEqual(0);
      await checkText(page, m, `péndulo · ${id}`);
    }
    await testInfo.attach('respuestas.json', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
    await expectClean(m, testInfo);
  });

  test('misma pregunta 3 veces → el péndulo se enfada y se enrolla', async ({ page, baseURL }, testInfo) => {
    const m = watch(page, baseURL!);
    await openPendulum(page, m, 'llave');
    await btn(page, 'Ya nos conocemos').click();
    const q = '¿Me tocará la lotería?';
    for (let i = 1; i <= 3; i++) {
      // variaciones de mayúsculas/signos: se normaliza en local
      await page.getByRole('textbox', { name: /^Tu pregunta/ }).fill(i === 2 ? 'me tocará la LOTERÍA' : q);
      await page.getByRole('button', { name: /^(Preguntar al péndulo|Otra pregunta)$/ }).click();
      if (i < 3) await waitAnswer(page);
    }
    await expect(page.getByRole('img', { name: /se ha enfadado/ })).toBeVisible();
    const t = await waitAnswer(page);
    expect(t.length).toBeGreaterThan(5);
    await checkText(page, m, 'péndulo · enfado');
    await expectClean(m, testInfo);
  });

  test('opciones: con menos de 2 opciones avisa sin llamar al servidor', async ({ page, baseURL }, testInfo) => {
    const m = watch(page, baseURL!);
    await openPendulum(page, m);
    await btn(page, 'Ya nos conocemos').click();
    await page.getByRole('tab', { name: 'Opciones', exact: true }).click();
    let called = false;
    page.on('request', (r) => { if (r.url().includes('/pendulum/answer')) called = true; });
    await page.getByRole('button', { name: 'Preguntar al péndulo' }).click();
    await expect(answerBubble(page)).toContainText('Escribe al menos 2 opciones');
    expect(called).toBe(false);
    await expectClean(m, testInfo);
  });
});
