# Informe de QA — Fase 5 · Tarotazo (`arcana`) · 2026-11-22

> Redactado por el QA; guardado por el jefe de proyecto (la herramienta del QA no le permitió escribir este fichero). Estado de corrección de cada hallazgo: ver «Seguimiento» al final.

## Resumen ejecutivo
**LISTO PARA BETA CERRADA CON CONDICIONES** — 0 bloqueantes · 1 alta · 6 medias · 15 bajas · 3 informativos.

- **Funcionalidad**: flujo completo de tarot (puerta +18, nombre, edad, mapa y extranjero, tarot y española, tiradas 1/3/5, barajado, corte, selección, lectura con Sí/No, cierre con número, color, imagen y diploma), los 7 modos del péndulo (calibración, «concentrarme», enfado), titulaciones, salir e inactividad funcionan en escritorio y móvil contra el API real. Sin errores de consola, sin 4xx/5xx, sin plantillas sin resolver en el tarot (la única, en la vitrina del péndulo: QA-01).
- **Privacidad**: cumple (`qa/privacy-audit.md`).
- **Seguridad**: sin hallazgos altos ni críticos (`qa/security.md`).
- **Carga**: p99 3,8 ms en `/readings` y 1,9 ms en `/decks` a 150 + 150 rps; p99 36 ms a ≈1 100 rps; 0 errores del API.
- **Rendimiento del front**: 60 fps con CPU ×4 en barajado y péndulo; Lighthouse móvil 85 / 100 / 100 / 92.
- **Condiciones para la beta**: QA-19, QA-01, QA-08 y accesibilidad QA-02…QA-05. Textos legales pendientes de revisión y de los datos del titular (decisión del titular).

## Tests
- `web/e2e/tarot.e2e.ts` (8) · `pendulum.e2e.ts` (3) · `session.e2e.ts` (7) · `a11y.e2e.ts` (3, axe WCAG 2.1 AA en 17 pantallas) · `privacy.e2e.ts` (4) · `perf.e2e.ts` (2). `helpers.ts` comprueba tras cada pantalla consola, `pageerror`, peticiones fallidas, 4xx/5xx, otros orígenes y texto sin resolver.
- Ejecutar: `cd web && npx playwright test` (levanta su propia pila: API en :8081 sin rate-limit, Vite en :5174).
- Resultado inicial (desktop + mobile): 31 pasan, 17 fallan (todos por hallazgos documentados), 2 omitidos. Pila Docker: 5/5. Perf: 2/2.

## Hallazgos
| Id | Sev. | Equipo | Hallazgo | Fichero / línea |
|---|---|---|---|---|
| QA-19 | alta | animación + frontend | En móvil (412 px) el contenedor del abanico oscila entre 380 y 2351 px, alterna tira/abanico y desmonta ~2 800 nodos cada 2 s; las cartas se desmontan bajo el dedo y el flujo RWS móvil falla por tiempo. | `web/src/fx/CardFan.tsx:28-31`; `web/src/styles/app.css:48` (`.stage` grid sin `min-width: 0`) |
| QA-01 | media | frontend + backend | Vitrina del péndulo sin provincia: «Chorizo de {provincia}» en nombre, personalidad y `alt`. | `PendulumScreen.tsx:90,186`; `GET /content/pendulum` sin `provincia` |
| QA-02 | media | animación + frontend | Carrusel: axe crítico `aria-required-children` y serio `label-content-name-mismatch` («Opción 1 de 3»). | `fx/Carousel3D.tsx:94-151`; `screens/DeckPick.tsx:58` |
| QA-03 | media | animación | axe `aria-prohibited-attr` en `div.fx-flip[aria-label]`; `role="text"` no estándar. | `fx/FlipCard.tsx:141-148`; `fx/TypewriterText.tsx:74` |
| QA-04 | media | frontend | El foco queda en `<body>` al cambiar de pantalla. | `App.tsx:44-48` |
| QA-05 | media | frontend | Al elegir provincia con Intro el foco se pierde. | `components/SpainMap.tsx:103` |
| QA-08 | media | frontend | En la pantalla de bloqueo, «Aviso legal» y «Privacidad» no se abren (LSSI/RGPD). | `state/session.ts:115` |
| QA-06 | baja | frontend | Pestañas de modo del péndulo sin flechas ni `tabpanel`. | `PendulumScreen.tsx:239-244` |
| QA-07 | baja | frontend | Hamburguesa visible en escritorio. | `app.css:83` pisa a `:75` |
| QA-09 | baja | frontend / JP | El bloqueo de menores desaparece al recargar. | `state/session.ts` |
| QA-10 | baja | frontend | Chunk `index` 602,7 kB (201 kB gzip); `three`, `@react-three/*`, `howler` sin uso. FCP 3,1 s, LCP 3,5 s. | `web/package.json` |
| QA-11 | baja | frontend / arte | Contraste de «Compulsar título» en el marco barroco (verificar a mano). | `Titles.tsx:39`, `.btn--small` |
| QA-12 | baja | backend + contenido | «Chorizo de Fuera de España». | `content/provinces.json` (`XX`) |
| QA-13 | baja | contenido | Dos «o» seguidas en la puerta. | `content/es/onboarding.json` → `puerta.fecha` |
| QA-14 | baja | frontend | Nombres accesibles redundantes (péndulos, cofres, `.hint` dentro de `<label>`). | `PendulumScreen.tsx:183`, `fx/Chests.tsx`, `SpreadPick.tsx` |
| QA-15 | baja | frontend | `max` de la fecha de la puerta en UTC. | `Gate.tsx:21` |
| QA-16 | baja | frontend / animación | Tras inactividad en segundo plano el DOM antiguo (con el nombre) sigue hasta que vuelve el rAF. | `App.tsx`, `fx/ScreenTransition.tsx` |
| S-1 | baja | DevOps | Sin límite de cuerpo en `/api/*`. | `deploy/Caddyfile` |
| S-2 | baja | DevOps | `caddy:2-alpine` sin fijar y fuera del Trivy del CI; Trivy 0.69.3 (hay 0.76.2). | `deploy/docker-compose.yml`, `.github/workflows/ci.yml` |
| S-3 | baja | backend | El API no envía `Cache-Control`. | `api/` |
| S-4 | baja | DevOps / frontend | `/robots.txt` y `/sitemap.xml` devuelven el HTML de la SPA. | `web/nginx.conf`, `web/public/` |
| S-5 | info | DevOps | `web/.dockerignore` no excluye `e2e/` ni `playwright.config.ts`. | `web/.dockerignore` |
| QA-17 | info | frontend / animación | Zona clicable estrecha en cada carta del abanico (escritorio). | `fx/CardFan.tsx` |
| QA-18 | info | frontend | Vitest recogía `e2e/*.spec.ts` (por eso se renombraron a `*.e2e.ts`). | `web/vite.config.ts` |

## Carga (k6 en Docker; API en :8082, perfil prod, rate-limit desactivado)
| Escenario | Peticiones | p50 | p95 | p99 | Errores |
|---|---|---|---|---|---|
| `POST /readings` 150 rps × 60 s | 9 000 | 2,15 ms | 3,17 ms | 3,82 ms | 0 |
| `GET /decks` 150 rps en paralelo | 9 000 | 1,19 ms | 1,69 ms | 1,93 ms | 0 |
| Estrés ≈1 113 rps reales | 102 377 | — | 21 / 16 ms | 36 / 29 ms | 4 timeouts de red de Docker Desktop, 0 del API |

Rate-limit a través de Caddy: 429 con `Retry-After`. Ojo: 60/min por IP se agota con ~5 lecturas/min desde una IP compartida (NAT).

## Rendimiento del front
Build: `index` 602,7 kB (201 kB gzip) · CSS 40 kB · arte 14 MB en 650 SVG (mediana 17 kB) · fuentes 548 kB. Lighthouse móvil 85/100/100/92. FPS (Pixel 7 emulado): barajado 60 (×4) / 59–60 (×6); péndulo arrastrado 61 (×4) / 44 (×6).

## No cubierto
Dispositivos reales, giroscopio, Safari/iOS, sonido, cortar arrastrando, Lighthouse sobre la pila Docker.

## Seguimiento (jefe de proyecto)
- QA-09: decidido guardar un indicador **no personal** de bloqueo en `sessionStorage` (sin edad ni fecha), declarado en la política de privacidad.
- QA-12: para `XX`, `{provincia}` se resuelve como «tierras lejanas»; sin provincia, «la tierra».
- Rate-limit: se eleva a 240 peticiones/min por IP por el NAT.
- QA-13: corregido en contenido por el jefe de proyecto.
