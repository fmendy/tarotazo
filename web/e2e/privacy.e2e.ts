// Auditoría de privacidad automatizada (ver qa/privacy-audit.md).
// Intercepta TODO el tráfico durante una sesión completa (tarot + péndulo + cierre con descargas)
// con un nombre, una fecha de nacimiento, una pregunta y unas opciones CENTINELA, y comprueba que
// ninguno sale del navegador (URL, cabeceras, cuerpos), que no hay cookies ni almacenamiento con
// datos personales y que no se contacta con otros orígenes.
import { execSync } from 'node:child_process';
import { expect, test, type Page, type Request } from '@playwright/test';
import {
  SENTINEL, btn, chooseDeck, chooseProvince, chooseSpread, closing, confirmAge, cut, doReading, enterName,
  menu, passGate, pickCards, shuffle, watch,
} from './helpers';
import { OFFLINE, isLocalAsset } from './helpers';

interface Captured { method: string; url: string; headers: Record<string, string>; body: string | null; resBody?: string; status?: number; setCookie?: string }

const [Y, M, D] = SENTINEL.birth.split('-');
/** Formas en las que podría filtrarse un dato centinela. */
const NEEDLES: string[] = [
  'Zacarías', 'Zacarias', 'Centinela', 'centinela', 'CENTINELA',
  encodeURIComponent('Zacarías'), 'Zacar\\u00edas', 'WmFjYXLDrWFz' /* base64 «Zacarías» */,
  SENTINEL.birth, `${D}/${M}/${Y}`, `${D}-${M}-${Y}`, `${Y}${M}${D}`, `${D}${M}${Y}`,
  'tesoro de los', encodeURIComponent('tesoro de los'), 'tesoro+de+los',
  'Opción Centinela', encodeURIComponent('Opción Centinela'),
];
/** Claves que nunca deberían viajar en un cuerpo JSON. */
const FORBIDDEN_KEYS = /"(nombre|name|inicial|edad|age|birth|birthDate|fecha|fechaNacimiento|pregunta|question|opciones|optionsText|labels)"\s*:/i;
const ALLOWED_CONTEXT = new Set(['signo', 'decada', 'numeroVida', 'provincia', 'tema', 'toneSeed', 'hora', 'diaSemana', 'lang']);

function capture(page: Page) {
  const all: Captured[] = [];
  page.on('request', async (r: Request) => {
    const c: Captured = { method: r.method(), url: r.url(), headers: await r.allHeaders().catch(() => r.headers()), body: r.postData() };
    all.push(c);
    const res = await r.response().catch(() => null);
    if (res) {
      c.status = res.status();
      c.setCookie = (await res.allHeaders().catch(() => ({} as Record<string, string>)))['set-cookie'];
      if (r.url().includes('/api/')) c.resBody = await res.text().catch(() => undefined);
    }
  });
  return all;
}

function leaks(all: Captured[]) {
  const found: string[] = [];
  for (const c of all) {
    const parts: [string, string][] = [['url', decodeURIComponent(c.url)], ['url-raw', c.url], ['headers', JSON.stringify(c.headers)], ['body', c.body ?? '']];
    for (const [where, text] of parts) for (const n of NEEDLES) if (text.includes(n)) found.push(`${where}: «${n}» en ${c.method} ${c.url}`);
    if (c.body && FORBIDDEN_KEYS.test(c.body)) found.push(`clave prohibida en el cuerpo de ${c.method} ${c.url}: ${c.body.slice(0, 200)}`);
  }
  return found;
}

test('privacidad: ningún dato centinela sale del navegador durante una sesión completa', async ({ page, context, baseURL }, testInfo) => {
  test.setTimeout(480_000);
  const m = watch(page, baseURL!);
  const all = capture(page);

  // --- tarot completo con nombre, fecha y pregunta centinela
  await passGate(page, { date: SENTINEL.birth });
  await enterName(page, SENTINEL.name);
  await confirmAge(page);
  await chooseProvince(page, { code: '50' });
  await chooseDeck(page, 'tarot');
  await chooseSpread(page, /Pasado, presente y futuro/, { tema: 'Amor', question: SENTINEL.question });
  await shuffle(page, true);
  await cut(page, 'mouse');
  await pickCards(page, 3, 'keyboard');
  // Las frases de la lectura llevan el nombre (lo rellena el navegador):
  await doReading(page, m, 'Sí');
  // Cierre: imagen CON nombre (casilla) y diploma con nombre → sólo canvas local.
  const share = page.locator('details.share').nth(0);
  await share.locator('summary').click();
  await share.getByRole('checkbox').check();
  await share.locator('summary').click();
  await closing(page);

  // --- péndulo: pregunta y opciones centinela
  await btn(page, 'Ir al péndulo').click();
  await btn(page, 'Elegir').click();
  await btn(page, 'Ya nos conocemos').click();
  for (const mode of ['Sí / No', 'Opciones', 'Ouija light']) {
    await page.getByRole('tab', { name: mode, exact: true }).click();
    await page.getByRole('textbox', { name: /^Tu pregunta/ }).fill(`${SENTINEL.question} ${mode}`);
    if (mode === 'Opciones') {
      const opts = page.locator('.options input');
      await opts.nth(0).fill(SENTINEL.options[0]);
      await opts.nth(1).fill(SENTINEL.options[1]);
    }
    const resp = OFFLINE ? null : page.waitForResponse((r) => r.url().includes('/pendulum/answer'));
    await page.getByRole('button', { name: /^(Preguntar al péndulo|Otra pregunta)$/ }).click();
    if (resp) await resp;
    await expect(page.locator('.pendulum__side .seer:not(.seer--compact) .bubble')).toBeVisible({ timeout: 90_000 });
  }
  // preferencia de sonido (lo único que puede guardarse)
  await menu(page, 'Silenciar sonido').catch(async () => { await page.locator('#main-menu button[aria-pressed]').first().click(); });

  // ---------- comprobaciones de red
  await page.waitForTimeout(500);
  const apiCalls = all.filter((c) => c.url.includes('/api/'));
  await testInfo.attach('trafico.json', { body: JSON.stringify(all, null, 2), contentType: 'application/json' });
  if (OFFLINE) {
    // Sin conexión: ni una sola llamada al API ni a otro origen; sólo GET de assets locales.
    expect(apiCalls.map((c) => `${c.method} ${c.url}`), 'sin conexión: ninguna llamada al API').toEqual([]);
    expect(all.filter((c) => !isLocalAsset(c.url, new URL(baseURL!).origin, c.method)).map((c) => `${c.method} ${c.url}`), 'sin conexión: sólo assets locales').toEqual([]);
  } else expect(apiCalls.length, 'se ha llamado al API').toBeGreaterThan(5);
  expect(leaks(all), 'datos centinela en URL/cabeceras/cuerpos').toEqual([]);
  // La respuesta del servidor tampoco puede contenerlos (no los ha recibido)
  expect(apiCalls.filter((c) => c.resBody && NEEDLES.some((n) => c.resBody!.includes(n))).map((c) => c.url)).toEqual([]);

  // Contexto: sólo los campos anónimos de la lista blanca; década redondeada, nunca la edad exacta (43).
  for (const c of apiCalls.filter((x) => x.method === 'POST')) {
    const body = JSON.parse(c.body ?? '{}');
    const ctx = body.context ?? {};
    expect(Object.keys(ctx).filter((k) => !ALLOWED_CONTEXT.has(k)), `campos de contexto no permitidos en ${c.url}`).toEqual([]);
    if ('decada' in ctx) expect(ctx.decada % 10, 'década redondeada').toBe(0);
    if (c.url.includes('/pendulum/answer') && 'options' in body) expect(typeof body.options, 'opciones: sólo el número').toBe('number');
  }
  // Sin Referer ni Cookie hacia el API; sin peticiones a otros orígenes.
  for (const c of apiCalls) {
    expect.soft(Object.keys(c.headers).map((h) => h.toLowerCase()), `cabeceras de ${c.url}`).not.toContain('cookie');
    expect.soft(Object.keys(c.headers).map((h) => h.toLowerCase()), `Referer en ${c.url}`).not.toContain('referer');
  }
  expect(m.foreignRequests, 'peticiones a otros orígenes').toEqual([]);
  // Respuestas del servidor sin Set-Cookie
  expect(all.filter((c) => c.setCookie).map((c) => `${c.url}: ${c.setCookie}`), 'Set-Cookie en respuestas').toEqual([]);

  // ---------- almacenamiento del navegador
  expect(await context.cookies(), 'cookies').toEqual([]);
  const storage = await page.evaluate(async () => {
    const ls: Record<string, string> = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; ls[k] = localStorage.getItem(k)!; }
    const ss: Record<string, string> = {}; for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i)!; ss[k] = sessionStorage.getItem(k)!; }
    const idb = (await indexedDB.databases?.())?.map((d) => d.name) ?? [];
    const caches_ = 'caches' in window ? await caches.keys() : [];
    const sw = navigator.serviceWorker ? (await navigator.serviceWorker.getRegistrations()).length : 0;
    return { cookie: document.cookie, ls, ss, idb, caches: caches_, sw };
  });
  await testInfo.attach('almacenamiento.json', { body: JSON.stringify(storage, null, 2), contentType: 'application/json' });
  expect(storage.cookie).toBe('');
  expect(Object.keys(storage.ls).filter((k) => k !== 'arcana.muted'), 'localStorage: sólo la preferencia de sonido').toEqual([]);
  expect(Object.values(storage.ls).join(' ')).not.toMatch(/Centinela|Zacar|1983/);
  expect(storage.ss, 'sessionStorage vacío').toEqual({});
  expect(storage.idb, 'IndexedDB vacío').toEqual([]);
  expect(storage.caches, 'CacheStorage vacío').toEqual([]);
  expect(storage.sw, 'sin service workers').toBe(0);
});

test('privacidad: las respuestas del API no fijan cookies ni sesión', async ({ request }) => {
  test.skip(OFFLINE, 'sin conexión no hay API');
  for (const path of ['/api/v1/decks', '/api/v1/spreads?deck=tarot', '/api/v1/provinces', '/api/v1/titles', '/api/v1/content/onboarding', '/api/v1/content/pendulum']) {
    const r = await request.get(path);
    expect(r.status(), path).toBe(200);
    expect(r.headers()['set-cookie'], `Set-Cookie en ${path}`).toBeUndefined();
  }
  const r = await request.post('/api/v1/pendulum/answer', { data: { mode: 'sino', model: 'cuarzo', context: { lang: 'es' } } });
  expect(r.headers()['set-cookie']).toBeUndefined();
});

test('privacidad: el servidor ignora datos personales si alguien los manda (no los devuelve)', async ({ request }) => {
  test.skip(OFFLINE, 'sin conexión no hay API');
  const r = await request.post('/api/v1/readings', {
    data: {
      deck: 'tarot', model: 'rws', spread: 'dia', cutIndex: 0, picks: [3],
      context: { signo: 'leo', decada: 43, provincia: '50', tema: 'general', toneSeed: 1, hora: 10, diaSemana: 3, lang: 'es', nombre: SENTINEL.name, edad: 43 },
      nombre: SENTINEL.name, pregunta: SENTINEL.question, recentFragmentIds: [],
    },
  });
  expect(r.status()).toBeLessThan(500);
  const text = await r.text();
  expect(text).not.toContain('Centinela');
  expect(text).not.toContain('tesoro');
});

test('privacidad (pila Docker): los logs no contienen IPs de cliente ni datos centinela', async () => {
  test.skip(OFFLINE || process.env.E2E_DOCKER_LOGS !== '1', 'sólo con E2E_DOCKER_LOGS=1 y la pila de deploy/ levantada');
  const logs = execSync('docker compose -f ../deploy/docker-compose.yml logs --no-color', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  await test.info().attach('docker-logs.txt', { body: logs, contentType: 'text/plain' });
  expect(logs).not.toMatch(/Centinela|Zacar/);
  // líneas tipo access log: «GET /api/... HTTP/1.1» o JSON de Caddy con remote_ip
  expect(logs.split('\n').filter((l) => /\b(GET|POST) \/(api|assets|art)\b|remote_ip|client_ip|X-Forwarded-For/i.test(l)).slice(0, 20)).toEqual([]);
  const ipLines = logs.split('\n').filter((l) => /\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(l) && !/0\.0\.0\.0|127\.0\.0\.1|::/.test(l));
  await test.info().attach('lineas-con-ip.txt', { body: ipLines.join('\n'), contentType: 'text/plain' });
  expect(ipLines.filter((l) => /172\.\d+\.\d+\.1\b|192\.168\.65\.1\b/.test(l)), 'IP del host/cliente en logs').toEqual([]);
});
