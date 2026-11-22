# Seguridad — Tarotazo (fase 5)

QA · 2026-11-22 · Pila: `docker compose -f deploy/docker-compose.yml up --build -d` (Caddy 2.11.9 → Nginx unprivileged → API Spring Boot, perfil `prod`).
`deploy/smoke.sh`: **27 OK, 0 FAIL**. Pila parada al terminar (`docker compose down`, volúmenes conservados).

**Resumen: sin hallazgos altos ni críticos explotables.** ZAP baseline: 0 FAIL, 6 WARN (todos
aceptables o falsos positivos, justificados abajo). Trivy: imágenes propias limpias (0 HIGH/CRITICAL);
la imagen de Caddy (etiqueta flotante, fuera del CI) trae 2 HIGH de librerías Go no alcanzables con esta
configuración. Hallazgos de endurecimiento menores: S-1 a S-5.

## 1. OWASP ZAP baseline

```bash
# Java no envía SNI para «localhost» (sin punto) → Caddy aborta el TLS con internal_error.
# Se levanta el proxy con un dominio con punto (sólo variable de entorno, sin tocar ficheros):
ARCANA_DOMAIN=tarotazo.localhost docker compose -f deploy/docker-compose.yml up -d proxy
MSYS_NO_PATHCONV=1 docker run --rm --add-host tarotazo.localhost:host-gateway \
  -v "$PWD/qa/security:/zap/wrk:rw" -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t https://tarotazo.localhost/ -j -a -m 3 -r zap-baseline.html -J zap-baseline.json -w zap-baseline.md -I
```
Informes: `qa/security/zap-baseline.{html,json,md}`, salida `qa/security/zap-output.txt`.
Spider clásico + AJAX spider, 3 min. **FAIL 0 · WARN 6 · PASS 65.**

| Regla ZAP | Dónde | Valoración |
|---|---|---|
| 10015 Re-examine Cache-control | `/` y `/api/v1/content/onboarding` | `/` lleva `no-cache` a propósito (index.html). El API **no** envía `Cache-Control` → ver S-3 (baja). |
| 10049 Storable and Cacheable Content | `/assets/*`, `/fonts/*`, favicon | Falso positivo: contenido público con hash, `immutable` intencionado. |
| 10055 CSP `style-src 'unsafe-inline'` | HTML | Aceptado y documentado por DevOps (framer-motion escribe estilos en línea). `script-src 'self'` sin `unsafe-*`, que es lo relevante para XSS. |
| 10109 Modern Web Application | HTML | Informativo (SPA). |
| 90004 COEP ausente | HTML y API | Aceptado: no se usan `SharedArrayBuffer` ni aislamiento entre orígenes; COOP y CORP ya están. |
| 90005 Sec-Fetch-Dest ausente | peticiones del spider | Falso positivo: es una cabecera de **petición** que el cliente ZAP no envía. |

Además el spider encontró `/robots.txt` y `/sitemap.xml` con **200 y el HTML de la SPA** (fallback de
Nginx): ver S-4.

## 2. Trivy (aquasec/trivy:0.69.3, la versión fijada en `.github/workflows/ci.yml`)

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v //var/run/docker.sock:/var/run/docker.sock -v trivy-cache:/root/.cache/trivy \
  aquasec/trivy:0.69.3 image --scanners vuln,secret,misconfig --severity HIGH,CRITICAL --no-progress <imagen>
```

| Imagen | SO | Vulnerabilidades HIGH/CRITICAL | Fichero |
|---|---|---|---|
| `arcana-web:local` | alpine 3.23.4 | **0** | `qa/security/trivy-arcana-web_local.txt` |
| `arcana-api:local` | alpine 3.24.4 + `app.jar` | **0** (SO y dependencias Java) | `qa/security/trivy-arcana-api_local.txt` |
| `caddy:2-alpine` (2.11.9) | alpine 3.24.4 | SO 0 · binario Go: **2 HIGH** | `qa/security/trivy-caddy_2-alpine.txt` |

Caddy: `github.com/go-jose/go-jose/v3` v3.0.5 CVE-2026-116587 (DoS con JWK RSA manipuladas; sin parche;
sólo se usa en el flujo ACME, que habla con la CA, no con clientes) y `golang.org/x/net` v0.60.0
CVE-2026-78661 (DoS en `x/net/html`, arreglado en 0.62.0; Caddy no procesa HTML de clientes en esta
configuración: sin `templates`). Riesgo bajo, pero ver S-2.

Trivy avisa de que hay una versión 0.76.2 y salta reglas que exigen ≥ 0.72: actualizar la versión fijada (S-2).

## 3. Pruebas manuales adicionales (a través de Caddy)

| Prueba | Resultado |
|---|---|
| `/actuator/health`, `/api/actuator/*` | 404 (no publicado) ✔ |
| `/api/v1/docs` / Swagger en `prod` | 404 ✔ |
| `TRACE /api/v1/decks` | 405 ✔ |
| Validación: `cutIndex: 9`, `picks` fuera de rango, `options: 99`, `interactionId: "../../etc/passwd"`, `?lang=../../etc` | 400 con mensaje genérico, sin traza ✔ |
| `recentFragmentIds` con 200 000 elementos (1,9 MB) | 400 «como mucho 500 ids», pero el cuerpo **se acepta y parsea entero** (0,7 s) → S-1 |
| Cabeceras (smoke + ZAP) | CSP estricta, HSTS 1 año, `nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` mínima, COOP, sin `Server` ✔ |
| Cookies / sesión | ninguna `Set-Cookie` (API y estáticos) ✔ |
| Rate‑limit vía Caddy (`qa/load/ratelimit.sh`, 70 peticiones seguidas) | 66 × 200 y después 429 con `Retry-After: 1` ✔ (60/min + reposición del cubo durante la ráfaga) |
| Logs (`docker compose logs`) | sin logs de acceso ni IP de cliente (ver `privacy-audit.md`) ✔ |
| Contenedores | `read_only`, `cap_drop: ALL`, `no-new-privileges`, usuarios no root (web 101, API 10001), redes `internal` sin salida ✔ (revisión de `deploy/docker-compose.yml`) |

## 4. Hallazgos de seguridad (todos DevOps salvo indicación)

| Id | Sev. | Hallazgo | Recomendación |
|---|---|---|---|
| S-1 | baja | Sin límite de tamaño de cuerpo para `/api/*` en Caddy; el API parsea un JSON de 1,9 MB antes de rechazarlo. Con rate‑limit de 60/min por IP el impacto es limitado, pero facilita consumir CPU/memoria. | `request_body { max_size 32KB }` en el `handle /api/*` del `Caddyfile` (y/o `server.tomcat.max-swallow-size`/`spring.servlet.multipart` en el backend). |
| S-2 | baja | `caddy:2-alpine` es una etiqueta **flotante** y la imagen del proxy no pasa por Trivy en CI (sólo web y API); trae 2 HIGH en dependencias Go. Trivy fijado en 0.69.3 (hay 0.76.2; reglas nuevas se saltan). | Fijar `caddy:2.11.x-alpine@sha256:…`, añadir el proxy a la matriz de Trivy del CI y actualizar Trivy a conciencia. |
| S-3 | baja | Las respuestas del API no llevan `Cache-Control`. No contienen datos personales (el servidor nunca los recibe), pero las lecturas son únicas. | `Cache-Control: no-store` en `POST /readings*` y `/pendulum/answer`; `public, max-age=300` en contenido (`/decks`, `/titles`…). Backend o Caddy. |
| S-4 | baja | `/robots.txt` y `/sitemap.xml` devuelven el `index.html` (200) por el fallback SPA; Lighthouse marca «robots.txt no válido (21 errores)». | Añadir `web/public/robots.txt` (frontend) o `location = /robots.txt` en `nginx.conf`. Para un sitio +18 conviene además decidir indexación. |
| S-5 | info | `web/.dockerignore` no excluye `e2e/` ni `playwright.config.ts` (se copian al contexto de build; no llegan a `dist`). | Añadirlos a `web/.dockerignore`. |
