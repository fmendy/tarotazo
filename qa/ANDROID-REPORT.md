# QA: app Android sin conexión de Tarotazo (`es.tarotazo.app`)

QA · 2026-11-23. Dispositivo: emulador `arcana-pixel` (Android 16 / API 36, perfil pixel_6a 1080×2400 a 420 dpi). WHPX activo, GPU por software (`swiftshader_indirect`), sin ventana. APK debug 1.0 (versionCode 1), targetSdk 36. Durante toda la prueba la red estuvo **desactivada** (ver A-0).

## Recomendación

**NO LISTA todavía para la prueba cerrada de Google Play.** Basta corregir dos cosas: **A-1** (privacidad alta) y **A-2** (textos de la web que contradicen el modo sin conexión). Con eso, la app queda lista. El flujo completo funciona sin red, no hay intentos de conexión, no hay cierres inesperados y el almacenamiento de la WebView está limpio. El modo `offline` de Playwright pasa en verde en escritorio y en móvil.

## Qué se ha probado en el emulador (adb + `uiautomator dump` + capturas leídas)

| Área | Resultado |
|---|---|
| Puerta +18 | Funcionan la fecha (selector nativo de Android), la casilla y «Todavía no» (bloqueo) ✔ |
| Nombre | Hay reacción y la bola de cristal escribe el nombre ✔ (ver A-5) |
| Edad | Funcionan los tres desplegables nativos (29 · julio · 1983) y «Sólo diré mi edad» (43). Signo, década y número de vida correctos ✔ |
| Provincia | Mapa: Zaragoza con brillo y zoom, chascarrillo ✔. «Nací fuera de España» ✔ |
| Baraja | Tarot (Clásica de 1909) y española. El carrusel anuncia el nombre del modelo ✔ |
| Tirada | Ppf (3) con tema Amor y pregunta escrita. Cruz simple (5) con tema Trabajo ✔ |
| Barajado | Animación y «Más» con comentario ✔ |
| Corte | Por toque y **por arrastre** ✔ |
| Selección | 3 y 5 cartas tocando el abanico ✔. El abanico queda estable; no se reproduce el bucle QA-19 de la web |
| Lectura | Revelado carta a carta. 4 preguntas Sí/No respondidas (Sí y No) ✔ |
| Cierre | Número y color ✔. «Imagen para compartir» (con casilla de nombre) y «Tu diploma» abren la **hoja de compartir de Android** ✔ (ver A-1 y A-6) |
| Péndulo | Vitrina de 9 modelos, calibración sí/no, «Concentrarme» (oscurece). Modos Sí/No, Tablero, Porcentaje («Un 41 %»), Ouija («BESO»), Mapa («Barcelona») y Chakras (7 niveles) ✔. Enfado tras repetir la pregunta ✔. Opciones: se rellenan los campos, pero la automatización no llegó a una respuesta limpia; en el modo `offline` de Playwright pasa |
| Titulaciones | Muro, comentario y compulsar con sello ✔ (ver A-7) |
| Botón atrás | Edad → nombre, con teclado abierto sólo cierra el teclado, péndulo → cierre, cierre → baraja → provincia, bloqueo → sale de la app ✔ (ver A-4) |
| Segundo plano | Inicio → volver: se conserva el estado. `pause`/`resume` aparecen en logcat ✔ |
| Rotación | Bloqueada en vertical en móvil (`MainActivity`, `SCREEN_ORIENTATION_PORTRAIT`), como pide MOBILE.md ✔ |
| Modo ligero y silencio | Se activan desde el menú ✔ |

## Hallazgos

| Id | Sev. | Equipo | Hallazgo | Evidencia / dónde |
|---|---|---|---|---|
| A-1 | **alta** | frontend | **La imagen y el diploma con el nombre se quedan en el dispositivo.** `shareImageNative` escribe `diploma-tarotazo.png` y `tarotazo.png` en `Directory.Cache` y no los borra. Siguen ahí tras «Salir», y la pantalla de despedida dice «Lo he borrado todo». | `run-as es.tarotazo.app ls cache` tras «Salir»: dos PNG de 269 y 202 kB. Abrí el diploma de la caché: dice «Zacarias Centinela». Código en `web/src/lib/native.ts` (`shareImageNative`, `Filesystem.writeFile(... Directory.Cache)`). Arreglo: `Filesystem.deleteFile` al cerrar la hoja de compartir, en `reset()` y al arrancar. |
| A-2 | media | frontend + contenido | **Textos de la web en la app** que contradicen el modo sin conexión: «Se queda en tu navegador. Ni el servidor ni la bola lo apuntan» (nombre); «se quedan en este navegador» (aviso de la puerta); «Se quedan en tu navegador; al servidor sólo le decimos cuántas hay» (opciones del péndulo); «Pasa el ratón (o el foco) por un marco» (titulaciones); «Usa Tab para recorrerlas e Intro para elegir» (mapa). | Árbol de accesibilidad y capturas. Fuentes: `web/src/i18n/es.json` (`name.hint`, `pendulum.optionsHint`, `titles.intro`, `province.mapLabel`) y `content/es/onboarding.json` (`puerta.aviso`). Hace falta la variante «app», como ya existe en la política de privacidad. |
| A-3 | media | frontend | Los botones **«Descargar imagen»/«Descargar mi diploma» no descargan**: abren la hoja de compartir (Quick Share, Imprimir, Drive, Maps, Mensajes) y no hay forma directa de guardar en Galería o Descargas. | Captura de la hoja (`diploma-tarotazo.png`). Opciones: renombrarlos a «Compartir…» o guardar con MediaStore. |
| A-4 | baja | jefe de proyecto (decisión) | En la app, el bloqueo de menores dura **hasta el primer «atrás»**: en «Todavía no te toca», atrás hace `exitApp()`; al reabrir se ve la puerta (`arcana.blocked` vive en `sessionStorage`, que no sobrevive al cierre). Es lo diseñado («mientras la app siga abierta»), pero en móvil saltárselo cuesta un toque. | `web/src/lib/native.ts` (`handleBack`: `blocked` → `exit`) |
| A-5 | baja | frontend | El teclado (Gboard) **sugiere y aprende** el nombre («Centinela», «Centineo's») y puede guardarlo en su diccionario personal, fuera de la app. | Captura con la barra de sugerencias. Falta `autocorrect="off"` en el campo de nombre (`web/src/screens/Name.tsx`); `spellCheck={false}` no basta en Gboard. |
| A-6 | baja | frontend | Al compartir la imagen o el diploma aparecen en logcat `E/Capacitor/Console Line 331 [object Object]` = `Share canceled`. Se captura bien, pero el error de cancelación llega a consola. | logcat: «Sending plugin error … Share … Share canceled» |
| A-7 | baja | frontend / animación | Detalles visuales: en titulaciones la vidente fija tapa el texto de introducción y el texto del sello se sale del marco; en el carrusel se corta la descripción del modelo; en el barajado el bocadillo de la vidente pisa las cartas; en la Cruz simple la carta «Resultado» tapa la etiqueta «Situación»; la bola parte «Centin/ela» a media palabra. | Capturas `tit3`, `car1`, `sh3`, `rdE`, `n01` |
| A-8 | baja | frontend | Accesibilidad en Android (TalkBack/uiautomator): las cartas del abanico salen sin límites (sólo el `listbox`); los campos de opciones del péndulo no tienen etiqueta accesible (sólo placeholder); el `input type=date` de la puerta no aparece en el árbol hasta tener valor. | `uiautomator dump` |
| A-9 | baja | frontend (config) | **«Error injecting safe area CSS: TypeError: Cannot read properties of null (reading 'style')»** (9 veces: al arrancar y al reanudar). Lo produce el script que inyecta el plugin SystemBars de Capacitor **antes de que exista `document.documentElement`**. | `node_modules/@capacitor/android/capacitor/src/main/java/com/getcapacitor/plugin/SystemBars.java:282-288` (es el «Line 6» del script inyectado), activado por `web/capacitor.config.ts` → `plugins.SystemBars.insetsHandling: 'css'`. No es código nuestro. La app usa `env(safe-area-inset-*)`, así que no se vio efecto visible. |
| A-10 | info | — | **Spam `[object Object]` / `undefined` (líneas 334/350)**: es el registrador de `native-bridge.js` de Capacitor (`LOG FROM NATIVE` / `LOG TO NATIVE`, `initLogger` de `node_modules/@capacitor/android/capacitor/src/main/assets/native-bridge.js`), que sólo está activo con `loggingBehavior` de depuración. En release no sale. Si molesta: `loggingBehavior: 'none'` en `capacitor.config.ts`. | logcat |
| A-11 | media | arte | `art/tools/frame-screenshots.mjs` **corta los titulares a 2 líneas**: «Cada lectura, distinta y con» (falta «humor») y «Sin conexión. Sin datos. Sin» (falta «anuncios.»). | `art/lib/mobile.mjs:92` (`lines.slice(0, 2)`). Capturas en `store/screenshots/03…/06…` |
| A-0 | info | entorno | El emulador se entregó con **datos móviles LTE conectados y validados** aunque wifi y datos figuraban como desactivados. Lo corté con `adb emu gsm data unregistered` + `svc data/wifi disable` + modo avión. `ping 8.8.8.8` → «Network is unreachable». | `dumpsys connectivity` |

Falsos positivos descartados:
- «Renderer process crash detected (code -1)» en logcat. Es la WebView al cerrarse la actividad tras `exitApp()`: «isolated not needed», «exited cleanly (0)».
- Los errores `CronetUrlRequest.onError` son de Google Play Services, no de la app.

## Privacidad en el dispositivo

- **Sin red:** el APK no declara `INTERNET` (sólo `VIBRATE`). `dumpsys netstats`: el UID 10216 de la app tiene 0 bytes. Logcat de la app: 185 «Handling local request», **todas a `https://localhost/`**, ningún otro host. «Failed to read DnsConfig» es el arranque de Chromium sin permiso de red.
- **`/data/data/es.tarotazo.app`** (volcado con `run-as … tar`, 64 ficheros):

| Ubicación | Contenido |
|---|---|
| Local Storage (leveldb) | sólo `arcana.muted` |
| Session Storage | sólo `arcana.blocked` (tras el bloqueo) |
| Cookies / Web Data | vacíos |
| `shared_prefs` | ajustes de la WebView y de Capacitor (versión) |
| `cache/` | **los dos PNG con el nombre** (A-1) |

  Ninguna coincidencia de «Centinela», «Zacar», «Encontrare» ni «tesoro» en ningún fichero de texto o base de datos.
- **Tras «Salir»:** el almacenamiento queda igual, salvo los PNG de la caché, que **siguen ahí** (A-1).
- `allowBackup="false"` y `dataExtractionRules`: correcto.

## Rendimiento (con GPU por software: ver la fiabilidad abajo)

| Medida | Valor |
|---|---|
| `am start -W` (en frío) | TotalTime 3,5–6,7 s (6716, 4783, 4170, 3558, 3510, 5047, 5405 ms) |
| Portada en el árbol de accesibilidad | 13–17 s en el primer arranque tras encender el emulador; ≈ 2,6–3 s en los siguientes. El pintado completo llega ≈ 8 s después en el emulador |
| gfxinfo, barajado | 358 frames; 78,8 % con jank; p50 46 ms · p90 73 ms · p95 89 ms · p99 250 ms; GPU p50 5 ms |
| gfxinfo, péndulo oscilando | 772 frames; 100 % con jank; p50 121 ms · p90 150 ms · p99 450 ms; GPU p50 4 ms; 693 «Slow UI thread» |
| Abanico en reposo | 152 frames en 5 s: sigue pintando (ambiente/partículas) |
| Bundle sin conexión | `es-*.js` 544 kB (contenido) + `react` 224 kB + `motion` 130 kB + `index` 120 kB + `gsap` 71 kB |

**Fiabilidad de estas cifras:**
- Con SwiftShader todo el raster lo hace la CPU del anfitrión. Los tiempos absolutos de frame y de arranque **no sirven** para juzgar un móvil real.
- Sí son fiables las conclusiones **relativas**: el péndulo (canvas 2D a DPR 2) cuesta unas 2,5 veces más por frame que el barajado. Además, en reposo se sigue pintando (gasto de batería).
- También es fiable que no hay cierres inesperados ni eliminaciones por memoria de la app. El LMK del emulador mató otros procesos durante el arranque, no la app.
- Para validar los 60 fps y el arranque en frío hay que medir en un Android real de gama media durante la prueba cerrada, por ejemplo con `adb shell dumpsys gfxinfo es.tarotazo.app framestats`.

## Playwright `offline` (punto 4)

- `E2E_OFFLINE=1 npx playwright test` crea los proyectos **`offline-desktop`** y **`offline-mobile`**:
  - `e2e/serve-offline.mjs` compila `vite build --mode app` en un directorio temporal (no toca `web/dist`).
  - Lo sirve con `vite preview` en :4174 **sin proxy /api** (`e2e/vite.offline.config.ts`).
- `helpers.ts`, en modo `OFFLINE`, registra cualquier petición que no sea un **GET de un asset del propio origen sin `/api/`**. `expectClean` falla si la hay.
- Adaptaciones:
  - Péndulo: sin `waitForResponse`; la ouija y los chakras se comprueban en el tablero.
  - Privacidad: exige **0 llamadas al API y sólo assets locales**; se omiten los 2 tests del API.
  - Sesión: se omite el test que importa `/src/state/session.ts`; la inactividad queda cubierta por el test de temporizador acelerado.
- **Resultado: 42 pasan, 8 omitidos, 0 fallan** (`qa/playwright-offline-results.json`).
- Prueba negativa: apuntado a la build en línea (Vite de desarrollo), el mismo test falla con «sin conexión: peticiones fuera de los assets locales».

## Capturas para Google Play (punto 5)

Las 8 capturas en bruto (1080×2400, barra de estado en modo demo, sin datos reales) están en `store/screenshots/raw/`: `01-portada`, `02-mapa`, `03-barajado`, `04-abanico`, `05-lectura` (3 cartas giradas), `06-diploma` (nombre de ejemplo «Lucia»), `07-pendulo` (modo tablero) y `08-titulaciones` (compulsado).

`captions.json` usa los 8 textos de `store/listing/es-ES.md`. `node art/tools/frame-screenshots.mjs` genera `store/screenshots/*.png` (1080×1920, lo que fija la herramienta).

Pendientes:
- A-11 corta dos titulares.
- El texto «Zahorí en el mapa de España» encaja mejor con una captura del modo *radiestesia* del péndulo que con la del mapa de nacimiento; conviene sustituir `02-mapa` si se quiere ese titular.

## Ficheros

- `web/playwright.config.ts`, `web/e2e/helpers.ts`, `web/e2e/serve-offline.mjs`, `web/e2e/vite.offline.config.ts` y los specs adaptados (`pendulum`, `privacy`, `session`).
- `qa/android/gfx-shuffle.txt`, `qa/android/gfx-pendulo.txt`, `qa/android/logcat-app.txt`, `qa/playwright-offline-results.json`.
- `store/screenshots/raw/*.png` y `store/screenshots/raw/captions.json`.
- El emulador se ha dejado **parado** (`adb emu kill`).

---

## Verificación 1.0.1 (2026-11-23)

APK `app-debug.apk` 1.0.1 (versionCode 2), instalado con `adb install -r` sobre la 1.0. El APK sólo pide `VIBRATE` (`aapt2`). La red estuvo cortada antes de abrir la app y durante toda la prueba:
- `adb emu gsm data/voice unregistered`, `svc data/wifi disable` y modo avión.
- Resultado: «Active default network: none» y `ping` → «Network is unreachable».

**Estabilidad del emulador:** se cayó 3 veces con `-gpu swiftshader_indirect`, con código de salida 139 (fallo de segmentación del propio emulador, no de la app). Con `-gpu guest` aguantó el resto de la ronda. Cada caída obligó a repetir el onboarding.

### Hallazgos originales

| Id | Estado | Comprobación en el dispositivo |
|---|---|---|
| A-1 | ✔ **corregido** | Probado compartiendo el diploma y la imagen con nombre. **Justo después**, `cache/share/diploma-tarotazo.png` y `tarotazo.png` existen (esperado). La copia desaparece en los tres casos pedidos: **(a)** al volver a primer plano tras 2 min 37 s en segundo plano; **(b)** al cerrar la app con `force-stop` y reabrirla; **(c)** al pulsar «Salir». Ver N-2 (restos de la 1.0). |
| A-2 | ✔ con un resto | Revisados en el árbol de accesibilidad los textos de puerta, nombre, mapa, opciones del péndulo y titulaciones. Ya no hay «navegador» ni «servidor» como transmisor de datos. «Ratón» y «foco» pasan a «Toca un marco…», y «Tab» a «Toca una provincia…». **Resto (baja, animación):** el abanico se sigue anunciando con «(flechas para moverte, Enter para elegir)» (`web/src/fx/CardFan.tsx:179`). |
| A-3 | ✔ | Los botones dicen «Compartir o guardar imagen…» y «Compartir o guardar mi diploma…» y abren la hoja del sistema. |
| A-4 | ✔ con un bug nuevo (N-1) | `localStorage` guarda `arcana.blocked={"t":…}`. Tras «Todavía no», atrás (`exitApp`), `force-stop` y reabrir, **sigue bloqueado**. Con el reloj +25 h (`adb root` + `date`), al reabrir aparece la puerta: **caduca bien**. Ver N-1: al reabrir bloqueado no se ve la pantalla de bloqueo. |
| A-5 | ✔ (parcial, depende del teclado) | Escribí «Qwxzorp» en el campo de nombre. Después, «Qwx» en la pregunta del péndulo **no lo sugiere** (sólo «Qwx/Wax/Sex»): no se ha aprendido. La barra de sugerencias de Gboard sigue visible; desde la web no se puede ocultar. Limitación: escribí con `adb input text`. |
| A-6 / A-10 | ✔ | En logcat (336 563 líneas en 1 h 20 min de uso) hay **0 líneas `Capacitor/Console`**. Los únicos `D/Capacitor` son «Starting BridgeActivity». |
| A-7 | ✔ (5/5) | Cruz simple con «Situación» visible bajo su carta (captura). La bola parte por palabras («Zacarias / Centinela»). En titulaciones la vidente ya no tapa el texto y el sello queda dentro del marco (su pie de texto roza la esquina, pero no se sale). El carrusel muestra la descripción completa (las flechas rozan el borde del texto: cosmético). En el barajado el bocadillo ya no pisa el mazo. |
| A-8 | ◐ parcial | Los campos de opciones exponen nombre accesible («Opción 1», «Opción 2») y la pregunta tiene etiqueta con la pista. Con **TalkBack activado**, las cartas del abanico salen como nodos «Carta N» pero `uiautomator` las sigue dando **sin límites** ([0,0][0,0]). El doble toque sobre el abanico eligió cartas y la lectura empezó, pero no pude confirmar por voz qué se anuncia: el TTS del emulador no estaba listo. Hay que confirmarlo con una persona usando TalkBack en un móvil real durante la prueba cerrada. |
| A-9 | ✔ | 0 líneas «Error injecting safe area CSS». El contenido empieza bajo la barra de estado (capturas). |
| A-11 | — | No se ha vuelto a ejecutar `frame-screenshots.mjs` en esta ronda (lo corrigió arte en `184d1b8`). |

### Pintado en reposo (`dumpsys gfxinfo`, 10 s sin tocar)

| Pantalla | 1.0 | 1.0.1 |
|---|---|---|
| Abanico | 152 frames en 5 s (≈ 30 fps) | **156 frames en 10 s (≈ 15,6 fps)** |
| Puerta | — | 155 / 10 s |
| Titulaciones | — | 103 / 10 s |
| Péndulo (preguntas, en reposo) | — | 156 / 10 s |

El pintado en reposo **baja a la mitad**: el ambiente queda limitado a unos 15–20 fps. Las cifras absolutas siguen siendo de GPU por software.

### Hallazgos nuevos

| Id | Sev. | Equipo | Hallazgo | Evidencia |
|---|---|---|---|---|
| N-1 | **alta** | frontend | **La pantalla de bloqueo no aparece al reabrir la app bloqueada: se queda el splash para siempre.** `hideSplash()` sólo se llama al montar `Gate` (`web/src/screens/Gate.tsx:21`). Con `arcana.blocked` vigente, la app arranca directamente en `blocked` y el splash (`launchAutoHide: false`) nunca se oculta. Durante 24 h, la persona que se declaró menor ve una bola girando sin texto. Parece una app colgada y el informe previo al lanzamiento de Play podría marcarla así. | Capturas a los 20 s, 90 s y 2,5 min tras abrir: sólo el splash. El árbol de accesibilidad está vacío. Arreglo sugerido: llamar a `hideSplash()` en `App.tsx` (o también en `Blocked`). |
| N-2 | baja | frontend | Los PNG que dejó la **1.0** en la raíz de `cache/` (`diploma-tarotazo.png`, `tarotazo.png`, con el nombre) **no se borran** tras actualizar a 1.0.1: la limpieza sólo cubre `cache/share/`. Afecta a quien instaló la 1.0, en principio sólo pruebas internas. | `run-as … ls cache` tras actualizar: siguen los ficheros del 23/11 a las 07:46. Arreglo: borrar también esos dos nombres en la raíz de la caché al arrancar, o `Filesystem.readdir(Cache)` y quitar `*.png`. |
| N-3 | baja | frontend | Si el reloj del móvil se atrasa, una marca `arcana.blocked` con fecha futura se trata como corrupta y **se borra** (`now - t >= 0`): cambiando la hora se desbloquea al instante. Es menor, porque el bloqueo es una autodeclaración. | `web/src/state/session.ts:29`. Lo observé al restaurar el reloj tras la prueba de +25 h. |

### Playwright sin conexión

`E2E_OFFLINE=1 npx playwright test --project=offline-desktop --project=offline-mobile` con la 1.0.1: **42 pasan, 8 omitidos, 0 fallan** (`qa/playwright-offline-results.json`).

### Veredicto final para la prueba cerrada de Google Play

**LISTA para la prueba cerrada, con una condición: corregir N-1 antes de subir el AAB.** Es un arreglo de una línea, pero la pantalla de bloqueo es justo la que ven los menores y hoy parece un cuelgue.

- Todos los hallazgos de la 1.0 están corregidos o verificados en el dispositivo, salvo dos parciales que no bloquean:
  - A-8: confirmar TalkBack en un móvil real.
  - A-2: queda la etiqueta del abanico con «flechas/Enter».
- N-2 y N-3 son bajos y pueden ir en la 1.0.2.
- Privacidad: sin red, sin datos personales persistentes (la copia temporal para compartir se borra en los tres casos pedidos) y logcat limpio.
- Durante la prueba cerrada conviene medir en un Android real de gama media el arranque en frío y los fps del barajado y del péndulo, y pedir a una persona usuaria de TalkBack que haga una lectura completa.

El emulador se ha dejado **parado** (`adb emu kill`). La hora automática del emulador está reactivada.
