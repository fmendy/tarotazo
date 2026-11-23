// Utilidades compartidas de las E2E: vigilancia de consola/red, comprobación de texto visible
// y pasos del flujo de usuario (puerta → nombre → edad → provincia → baraja → tirada → ritual → lectura → cierre).
import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';

/** Modo sin conexión (build `--mode app`, VITE_OFFLINE=1): el motor es local y NO debe haber red. */
export const OFFLINE = process.env.E2E_OFFLINE === '1';

/** En modo sin conexión sólo se permiten GET de assets del propio origen (nada de /api ni otros orígenes). */
export function isLocalAsset(url: string, origin: string, method = 'GET') {
  if (url.startsWith('data:') || url.startsWith('blob:')) return true;
  try {
    const u = new URL(url);
    return u.origin === origin && method === 'GET' && !u.pathname.startsWith('/api/');
  } catch { return false; }
}

export interface Monitor {
  offlineViolations: string[];
  consoleErrors: string[];
  consoleWarnings: string[];
  pageErrors: string[];
  failedRequests: string[];
  badResponses: string[];
  foreignRequests: string[];
  textIssues: string[];
}

/** Engancha listeners a la página para recoger errores de consola, peticiones fallidas y de otros orígenes. */
export function watch(page: Page, baseURL: string): Monitor {
  const origin = new URL(baseURL).origin;
  const m: Monitor = { offlineViolations: [], consoleErrors: [], consoleWarnings: [], pageErrors: [], failedRequests: [], badResponses: [], foreignRequests: [], textIssues: [] };
  page.on('console', (msg) => {
    if (msg.type() === 'error') m.consoleErrors.push(msg.text().slice(0, 400));
    else if (msg.type() === 'warning') m.consoleWarnings.push(msg.text().slice(0, 300));
  });
  page.on('pageerror', (e) => m.pageErrors.push(String(e?.message ?? e).slice(0, 400)));
  page.on('requestfailed', (r) => {
    const err = r.failure()?.errorText ?? '';
    // Las descargas (blob:) y las cancelaciones por cambio de pantalla no son fallos del servidor.
    if (r.url().startsWith('blob:') || r.url().startsWith('data:')) return;
    m.failedRequests.push(`${r.method()} ${r.url()} → ${err}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) m.badResponses.push(`${r.status()} ${r.request().method()} ${r.url()}`);
  });
  page.on('request', (r) => {
    const u = r.url();
    if (OFFLINE && !isLocalAsset(u, origin, r.method())) m.offlineViolations.push(`${r.method()} ${u}`);
    if (u.startsWith('data:') || u.startsWith('blob:')) return;
    try { if (new URL(u).origin !== origin) m.foreignRequests.push(u); } catch { m.foreignRequests.push(u); }
  });
  return m;
}

/** Fallos de red «reales» (ERR_ABORTED por desmontar <img> al cambiar de pantalla se listan aparte). */
export function realFailures(m: Monitor) {
  return m.failedRequests.filter((f) => !/ERR_ABORTED/.test(f));
}

/** Aserción final común: sin errores de consola, sin 4xx/5xx, sin otros orígenes, sin texto sin resolver. */
export async function expectClean(m: Monitor, testInfo: TestInfo) {
  await testInfo.attach('monitor.json', { body: JSON.stringify(m, null, 2), contentType: 'application/json' });
  expect.soft(m.offlineViolations, 'sin conexión: peticiones fuera de los assets locales').toEqual([]);
  expect.soft(m.pageErrors, 'excepciones JS no capturadas').toEqual([]);
  expect.soft(m.consoleErrors, 'errores en consola').toEqual([]);
  expect.soft(m.badResponses, 'respuestas 4xx/5xx').toEqual([]);
  expect.soft(realFailures(m), 'peticiones fallidas').toEqual([]);
  expect.soft(m.foreignRequests, 'peticiones a otros orígenes').toEqual([]);
  expect.soft(m.textIssues, 'texto visible sin resolver').toEqual([]);
}

const PATTERNS: [string, RegExp][] = [
  ['{variable}', /\{[a-zA-Z][\w]*\}/g],
  ['{{i18n}}', /\{\{[^}]*\}\}/g],
  ['[a|b]', /\[[^[\]\n]*\|[^[\]\n]*\]/g],
  ['undefined', /\bundefined\b/g],
  ['NaN', /\bNaN\b/g],
  ['[object Object]', /\[object Object\]/g],
  ['null', /\bnull\b/g],
  ['clave i18n', /\b(?:app|menu|gate|name|age|province|deck|spread|shuffle|cut|reading|closing|pendulum|titles|legal|privacy)\.[a-z][A-Za-z]+\b/g],
];

/** Revisa TODO el texto visible (innerText) y los textos accesibles (aria-label, alt, title). */
export async function checkText(page: Page, m: Monitor, where: string) {
  const { visible, accessible } = await page.evaluate(() => {
    const acc: string[] = [];
    document.querySelectorAll('[aria-label],[alt],[title],[placeholder]').forEach((el) => {
      for (const a of ['aria-label', 'alt', 'title', 'placeholder']) {
        const v = el.getAttribute(a);
        if (v) acc.push(v);
      }
    });
    return { visible: document.body.innerText, accessible: acc.join('\n') };
  });
  for (const [label, re] of PATTERNS) {
    for (const [src, text] of [['visible', visible], ['a11y', accessible]] as const) {
      for (const hit of text.match(re) ?? []) {
        // El aviso legal lleva huecos «[pendiente]» a propósito (sin «|»); no casan con [a|b].
        const ctx = text.slice(Math.max(0, text.indexOf(hit) - 60), text.indexOf(hit) + hit.length + 60).replace(/\s+/g, ' ');
        m.textIssues.push(`[${where}] (${src}) ${label}: «${hit}» … ${ctx}`);
      }
    }
  }
}

// ---------------------------------------------------------------- pasos del flujo

export const SENTINEL = {
  name: 'Zacarías Centinela',
  birth: '1983-07-29',          // leo, 43 años
  question: '¿Encontraré el tesoro de los Centinela en Zaragoza?',
  options: ['Opción Centinela Uno', 'Opción Centinela Dos', 'Opción Centinela Tres'],
};

export const btn = (page: Page, name: string | RegExp, exact = true) =>
  page.getByRole('button', { name, exact: typeof name === 'string' ? exact : undefined });

export async function title(page: Page) {
  return (await page.locator('#screen-title').innerText()).trim();
}

/** Puerta +18 con fecha (ISO) o con la casilla de autodeclaración. */
export async function passGate(page: Page, opts: { date?: string; declare?: boolean } = { declare: true }) {
  await page.goto('/');
  await expect(page.locator('#screen-title')).toHaveText(/mayor de edad/i);
  if (opts.date) await page.locator('input[type="date"]').fill(opts.date);
  if (opts.declare) await page.getByRole('checkbox').check();
  await page.locator('.gate__form button[type="submit"]').click();
}

export async function enterName(page: Page, name: string) {
  const input = page.getByRole('textbox', { name: 'Tu nombre', exact: true });
  await expect(input).toBeVisible();
  await input.fill(name);
  await btn(page, 'Continuar').click();
}

/** Edad: si la fecha vino de la puerta, confirma; si no, la pide (día/mes/año) o la edad suelta. */
export async function confirmAge(page: Page, opts: { date?: string; age?: number } = {}) {
  const confirm = btn(page, 'Sí, es correcta');
  await expect(confirm.or(btn(page, 'Sólo diré mi edad')).or(page.locator('.stats'))).toBeVisible();
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click();
  } else if (opts.age !== undefined) {
    await btn(page, 'Sólo diré mi edad').click();
    await page.getByRole('spinbutton', { name: 'Edad', exact: true }).fill(String(opts.age));
    await btn(page, 'Continuar').click();
  } else if (opts.date) {
    const [y, mo, d] = opts.date.split('-').map(Number);
    await page.getByRole('combobox', { name: 'Día', exact: true }).selectOption(String(d));
    await page.getByRole('combobox', { name: 'Mes', exact: true }).selectOption(String(mo));
    await page.getByRole('combobox', { name: 'Año', exact: true }).selectOption(String(y));
    await btn(page, 'Continuar').click();
  }
  await expect(page.locator('.stats')).toBeVisible();
  await btn(page, 'Continuar').click();
}

/** Provincia: clic en el mapa SVG (código INE) o «Nací fuera de España». */
export async function chooseProvince(page: Page, opts: { code?: string; abroad?: boolean }) {
  await expect(page.locator('.spainmap--ok')).toBeVisible();
  if (opts.abroad) {
    await page.getByRole('button', { name: /Nací fuera de España/ }).click();
    await expect(page.getByText('Has elegido: fuera de España')).toBeVisible();
  } else {
    const code = opts.code ?? '28';
    const path = page.locator(`.spainmap__svg [data-code="${code}"]`).first();
    await path.click();
    await expect(path).toHaveClass(/is-selected/);
  }
  await btn(page, 'Continuar').click();
}

export async function chooseDeck(page: Page, family: 'tarot' | 'spanish') {
  await expect(page.locator('#screen-title')).toHaveText('Elige tu baraja');
  await page.getByRole('button', { name: family === 'tarot' ? 'Tarot tradicional' : 'Baraja española', exact: true }).click();
  const use = btn(page, 'Usar este modelo');
  await expect(use).toBeEnabled();
  await use.click();
}

export async function chooseSpread(page: Page, spreadName: RegExp, opts: { tema?: string; question?: string } = {}) {
  await expect(page.locator('#screen-title')).toHaveText('Elige tirada y pregunta');
  await page.getByRole('radio', { name: spreadName }).click();
  if (opts.tema) await page.getByRole('button', { name: opts.tema, exact: true }).click();
  if (opts.question) await page.getByRole('textbox', { name: /^Piensa tu pregunta/ }).fill(opts.question);
  await btn(page, 'Barajar').click();
}

export async function shuffle(page: Page, more = true) {
  await expect(page.locator('#screen-title')).toHaveText('Barajando…');
  const done = btn(page, 'Ya está bien barajado');
  if (more) {
    const mas = btn(page, 'Más');
    await expect(mas).toBeEnabled({ timeout: 20_000 });
    await mas.click();
  }
  await expect(done).toBeEnabled({ timeout: 20_000 });
  await done.click();
}

/** Corte: el modo (tres montones / abanico) se sortea; se cubren los dos. */
export async function cut(page: Page, how: 'mouse' | 'keyboard' = 'mouse') {
  await expect(page.locator('#screen-title')).toHaveText('Corta la baraja');
  const slider = page.getByRole('slider', { name: /Corta el abanico/ });
  const piles = page.getByRole('group', { name: /Corta el mazo/ });
  await expect(slider.or(piles)).toBeVisible();
  if (await slider.isVisible()) {
    if (how === 'keyboard') { await slider.focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); }
    else await slider.locator('> div').nth(12).click({ force: true });
  } else {
    const pile = page.getByRole('button', { name: 'Montón central' });
    await expect(pile).toBeEnabled();
    if (how === 'keyboard') { await page.getByRole('button', { name: 'Montón izquierdo' }).focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); }
    else await pile.click();
  }
  await expect(page.locator('#screen-title')).toHaveText('Elige tus cartas');
}

/** Selección de N cartas del abanico, con ratón (clic en cartas) o teclado (flechas + Intro). */
export async function pickCards(page: Page, n: number, how: 'mouse' | 'keyboard' = 'keyboard') {
  const fan = page.getByRole('listbox', { name: /Elige \d+ carta/ });
  await expect(fan).toBeVisible();
  if (how === 'keyboard') {
    await fan.focus();
    for (let i = 0; i < n; i++) {
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press(i % 2 ? 'Enter' : ' ');
    }
  } else {
    const cards = fan.getByRole('option');
    const count = await cards.count();
    for (let i = 0; i < n; i++) {
      const idx = Math.min(count - 1, Math.floor(count / 2) + i * 3);
      await cards.nth(idx).click({ force: true });
    }
  }
  await expect(page.locator('.reading, .error-box').first()).toBeVisible({ timeout: 30_000 });
}

export interface ReadingLog { cards: string[]; interactions: number; answered: string[] }

/** Lectura completa: gira cada carta, muestra el texto, responde a las preguntas y pasa al cierre. */
export async function doReading(page: Page, m: Monitor, answer: 'Sí' | 'No' | 'Prefiero no decirlo' = 'Sí'): Promise<ReadingLog> {
  const log: ReadingLog = { cards: [], interactions: 0, answered: [] };
  await expect(page.locator('.screen.reading')).toBeVisible();
  const intro = page.locator('.reading__intro');
  if (await intro.isVisible().catch(() => false)) {
    await checkText(page, m, 'lectura · intro');
    await intro.getByRole('button', { name: 'Continuar' }).click();
  }
  for (let i = 0; i < 12; i++) {
    const panel = page.locator('.reading__panel');
    await expect(panel).toBeVisible();
    await panel.getByRole('button', { name: 'Girar la carta' }).click();
    const name = (await panel.locator('.reading__card').innerText()).trim();
    log.cards.push(name);
    const showAll = panel.getByRole('button', { name: 'Mostrar todo el texto' });
    if (await showAll.isVisible().catch(() => false)) await showAll.click();
    const nextBtn = panel.getByRole('button', { name: /^(Siguiente carta|Ver el cierre)$/ });
    const interaction = panel.locator('.interaction');
    await expect(nextBtn.or(interaction)).toBeVisible({ timeout: 30_000 });
    if (await interaction.isVisible()) {
      log.interactions++;
      await interaction.getByRole('button', { name: answer, exact: true }).click();
      log.answered.push(answer);
      await expect(interaction.locator('.line--branch')).toBeVisible({ timeout: 15_000 });
      await expect(nextBtn).toBeVisible({ timeout: 30_000 });
    }
    await checkText(page, m, `lectura · carta ${i + 1} (${name})`);
    const label = (await nextBtn.innerText()).trim();
    await nextBtn.click();
    if (label === 'Ver el cierre') break;
  }
  await expect(page.locator('#screen-title')).toHaveText('Y esto es lo que hay');
  return log;
}

/** Cierre: número y color de la suerte, descarga de imagen y de diploma (canvas local). */
export async function closing(page: Page) {
  const num = page.locator('.luck__number');
  await expect(num).toHaveText(/^\d+$/);
  await expect(page.locator('.luck__color')).not.toBeEmpty();
  const share = page.locator('details.share').nth(0);
  await share.locator('summary').click();
  const [img] = await Promise.all([page.waitForEvent('download'), share.getByRole('button', { name: /^(Descargar imagen|Compartir o guardar imagen…)$/ }).last().click()]);
  const dip = page.locator('details.share').nth(1);
  await dip.locator('summary').click();
  const [dipl] = await Promise.all([page.waitForEvent('download'), dip.getByRole('button', { name: /^(Descargar mi diploma|Compartir o guardar mi diploma…)$/ }).click()]);
  return { luckyNumber: Number(await num.innerText()), luckyColor: await page.locator('.luck__color').innerText(), image: img, diploma: dipl };
}

/** Onboarding completo hasta la elección de baraja. */
export async function onboard(page: Page, m: Monitor, opts: { name?: string; date?: string; province?: { code?: string; abroad?: boolean } } = {}) {
  await passGate(page, { date: opts.date ?? SENTINEL.birth });
  await checkText(page, m, 'nombre');
  await enterName(page, opts.name ?? SENTINEL.name);
  await checkText(page, m, 'edad');
  await confirmAge(page);
  await checkText(page, m, 'provincia');
  await chooseProvince(page, opts.province ?? { code: '50' });
  await checkText(page, m, 'baraja');
}

export async function openMenuIfCollapsed(page: Page) {
  const burger = page.locator('.topbar__burger');
  if (!(await page.locator('#main-menu').isVisible()) && (await burger.isVisible())) await burger.click();
}

export async function menu(page: Page, item: string): Promise<Locator> {
  await openMenuIfCollapsed(page);
  const b = page.locator('#main-menu').getByRole('button', { name: item, exact: true });
  await b.click();
  return b;
}
