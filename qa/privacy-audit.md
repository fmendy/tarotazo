# Auditoría de privacidad — Tarotazo (fase 5)

QA · 2026-11-22 · Alcance: front (Vite dev y build de producción tras Caddy/Nginx), API real, pila Docker de `deploy/`.

**Veredicto: CUMPLE.** Nombre, fecha de nacimiento, edad exacta, pregunta y opciones del péndulo
no salen del navegador en ningún flujo probado. No hay cookies, ni datos personales en el
almacenamiento del navegador, ni peticiones a otros orígenes, ni logs de acceso con IP.
Hay 3 observaciones menores (P-1 a P-3) que no bloquean.

## Método

Test automatizado: `web/e2e/privacy.e2e.ts` (se ejecuta en los proyectos `desktop` y `mobile`).

1. Datos **centinela**: nombre «Zacarías Centinela», fecha de nacimiento 1983-07-29 (43 años),
   pregunta «¿Encontraré el tesoro de los Centinela en Zaragoza?», opciones «Opción Centinela Uno/Dos/Tres».
2. Sesión completa: puerta +18 con fecha → nombre → confirmación de edad → provincia (mapa) → tarot RWS,
   tirada de 3, tema Amor, pregunta escrita → barajar (con «Más») → corte → selección → lectura entera
   (respondiendo Sí a las preguntas) → cierre con imagen **con nombre** (casilla marcada) y diploma descargados
   → péndulo (Sí/No, Opciones, Ouija) con la pregunta y las opciones centinela → silenciar sonido.
3. Se captura **todo** el tráfico (`page.on('request')`): URL (en crudo y decodificada), todas las cabeceras
   (`allHeaders`) y el cuerpo; además las respuestas del API y sus `Set-Cookie`. Se buscan el nombre, el
   apellido, variantes (sin tilde, `encodeURIComponent`, `í`, base64), la fecha en 5 formatos, la
   pregunta y las opciones, y claves JSON prohibidas (`nombre`, `edad`, `birth`, `pregunta`, `opciones`…).
4. Se valida el `context` de cada POST contra la lista blanca del contrato (§6):
   `signo, decada, numeroVida, provincia, tema, toneSeed, hora, diaSemana, lang`; `decada` múltiplo de 10;
   en el péndulo `options` es sólo un número.
5. Al final: `context.cookies()`, `document.cookie`, `localStorage`, `sessionStorage`,
   `indexedDB.databases()`, `caches.keys()`, service workers.
6. Pila Docker (`E2E_DOCKER_LOGS=1`): `docker compose logs` sin líneas de acceso, sin IP de cliente y sin centinelas.

Ejecuciones: Vite dev (`desktop` + `mobile`) y pila Docker de producción en `https://localhost` (`desktop`). **Todas en verde.**

## Resultados

| Comprobación | Resultado |
|---|---|
| Centinelas en URL / cabeceras / cuerpos de petición | **0 apariciones** (≈ 25 llamadas al API por sesión) |
| Centinelas en respuestas del API | 0 |
| Campos de `context` fuera de la lista blanca | 0; `decada` = 40 (nunca 43) |
| Péndulo «opciones» | sólo `options: 2` (el número); el texto llega con `{opcion}` y se rellena en local |
| Imagen y diploma con nombre | se generan en `<canvas>` y se descargan como `blob:`; ninguna petición de red |
| Cabeceras `Cookie` / `Referer` hacia el API | ausentes (`credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, meta referrer) |
| `Set-Cookie` en respuestas | ninguna (API ni estáticos) |
| Cookies del navegador | `[]` |
| `localStorage` | sólo `arcana.muted` = `"1"` (preferencia de sonido, no personal) |
| `sessionStorage`, IndexedDB, CacheStorage, service workers | vacíos / ninguno |
| Peticiones a otros orígenes | 0 (fuentes autoalojadas, sin CDN ni analítica) |
| El servidor recibe datos personales «de más» (petición manual con `nombre`, `pregunta`, `edad`) | los ignora; no aparecen en la respuesta (Jackson `fail-on-unknown-properties: false`) |
| Logs Docker (`docker compose logs`, 21 líneas tras ~120 peticiones) | sólo arranque y avisos de Caddy; **sin logs de acceso**, sin IP de cliente; las únicas IPs son `127.0.0.1` (bind del healthcheck de Caddy) y una falsa coincidencia (`25.0.5.1`, versión de Java). Copia en `qa/security/docker-logs.txt` |
| IP hacia el front | Caddy elimina `X-Forwarded-For`/`X-Real-IP`/`Forwarded` hacia Nginx (revisado en `deploy/Caddyfile`) |
| Rate‑limit | HMAC de la IP con clave efímera en memoria (README del API); verificado 429 + `Retry-After` a través de Caddy |

Borrado de estado:
- «Salir» → pantalla de despedida; al volver a entrar el nombre está vacío y el HTML ya no contiene el centinela (`session.e2e.ts`).
- Inactividad 30 min → el store vuelve a `gate` y borra el nombre (`page.clock`), y la interfaz vuelve a la
  puerta (prueba con el temporizador acelerado). Ver P-3.

## Observaciones

- **P-1 (baja) · bloqueo de menores no persiste.** Al ser todo en memoria, recargar la pestaña tras la
  pantalla «Todavía no te toca» devuelve la puerta +18 (hallazgo QA-09 del informe). Es coherente con «nada
  en el navegador», pero si se quiere que el bloqueo sobreviva a la recarga bastaría un indicador no
  personal en `sessionStorage` (`arcana.blocked=1`), que habría que declarar en la política de privacidad.
- **P-2 (baja) · contenido del péndulo pide `?provincia=`.** `GET /content/pendulum?provincia=50` envía el
  código de provincia (dato anónimo permitido por el contrato), pero va en la URL y no en un cuerpo; no es
  personal en sí, sólo se anota para la política de privacidad («qué recibe el servidor» no menciona este endpoint).
- **P-3 (baja) · DOM tras la inactividad en segundo plano.** El borrado del store es inmediato, pero el
  cambio de pantalla lo anima `AnimatePresence` (rAF). Con el reloj falso de Playwright, tras saltos ≥ 1 min la
  pantalla antigua (con el nombre en el `<input>`) sigue en el DOM. En un navegador real con la pestaña en
  segundo plano el rAF está parado, así que el DOM antiguo puede seguir hasta que el usuario vuelva a la
  pestaña. Recomendación (frontend/animación): en `reset()` por inactividad, montar la puerta sin transición.
- La política de privacidad (texto provisional) describe correctamente lo observado; está marcada
  «pendiente de revisión legal» y le faltan los datos del titular (fuera del alcance de QA).

## Reproducir

```bash
cd web
npx playwright test e2e/privacy.e2e.ts                       # contra API real (:8081) + Vite (:5174)
# contra la pila de producción (y revisión de logs):
docker compose -f ../deploy/docker-compose.yml up --build -d
E2E_EXTERNAL=1 E2E_BASE_URL=https://localhost E2E_DOCKER_LOGS=1 npx playwright test e2e/privacy.e2e.ts --project=desktop --workers=1
```
El tráfico capturado y el almacenamiento quedan adjuntos al informe HTML (`qa/playwright-report`, adjuntos `trafico.json`, `almacenamiento.json`).
