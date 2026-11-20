# Despliegue de Tarotazo (`arcana`)

Tres contenedores detrás de un único punto de entrada:

```
navegador ──TLS──▶ proxy (Caddy :80/:443) ──┬─ /api/*  ─▶ arcana-api:8080  (Spring Boot, Java 25)
                                            └─ resto   ─▶ arcana-web:8080  (Nginx sin root, SPA)
```

`arcana-web` y `arcana-api` sólo están en la red `internal` (sin salida a Internet y sin
puertos publicados en el host). El proxy es el único servicio en la red `edge`.

| Fichero | Para qué |
|---|---|
| `docker-compose.yml` | Producción (y local con TLS en `https://localhost`) |
| `docker-compose.dev.yml` | Superposición: local sin TLS en `http://localhost:8080` |
| `docker-compose.content.yml` | Superposición: contenido desde un directorio del host (solo lectura) |
| `Caddyfile` | Enrutado, TLS, cabeceras, sin logs de acceso |
| `smoke.sh` | Comprobaciones tras levantar (rutas, API, cabeceras, Actuator) |
| `.env.example` | Variables; copiar a `deploy/.env` |
| `../web/Dockerfile`, `../web/nginx.conf` | Imagen del front (Node 24 → nginx-unprivileged) |
| `../api/Dockerfile` | Imagen del API (Temurin 25 JDK → Temurin 25 JRE, UID 10001). **Contexto = raíz del repo** |

## Levantar en local

Requiere Docker Desktop (o Docker Engine + Compose v2). Desde la raíz del repo:

```bash
# Con TLS (certificado de la CA interna de Caddy; el navegador avisará la primera vez)
docker compose -f deploy/docker-compose.yml up --build -d
deploy/smoke.sh                                    # BASE_URL=https://localhost por defecto

# Sin TLS, en http://localhost:8080
docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.dev.yml up --build -d
BASE_URL=http://localhost:8080 \
COMPOSE_FILES="deploy/docker-compose.yml deploy/docker-compose.dev.yml" deploy/smoke.sh

docker compose -f deploy/docker-compose.yml logs -f      # sólo logs de proceso
docker compose -f deploy/docker-compose.yml down         # parar (añadir -v borra los certificados)
```

Para confiar en la CA local de Caddy: `docker compose -f deploy/docker-compose.yml cp
proxy:/data/caddy/pki/authorities/local/root.crt .` e importarla en el sistema.

Imágenes sueltas:

```bash
docker build -t arcana-web web
docker build -f api/Dockerfile -t arcana-api .     # el jar empaqueta content/
```

## Variables

| Variable | Por defecto | Uso |
|---|---|---|
| `ARCANA_DOMAIN` | `localhost` | Dominio público. Con un dominio real Caddy obtiene el certificado por ACME (Let's Encrypt/ZeroSSL); necesita 80 y 443 abiertos y el DNS apuntando al VPS. |
| `ARCANA_IMAGE_PREFIX` | `arcana` | Prefijo de imágenes. En el VPS: `ghcr.io/<owner>/arcana` → `…/arcana-web`, `…/arcana-api`. |
| `ARCANA_TAG` | `local` | Etiqueta de imagen (el workflow de deploy usa el SHA corto). |
| `ARCANA_HTTP_PORT` / `ARCANA_HTTPS_PORT` | `80` / `443` | Puertos publicados por el proxy. |
| `ARCANA_DEV_PORT` | `8080` | Puerto del perfil dev. |
| `ARCANA_SPRING_PROFILES` | `prod` (dev: `default`) | Perfil de Spring. No usar `dev` en contenedor (apunta a `../content`). |
| `ARCANA_CONTENT_DIR` | — | Sólo con `docker-compose.content.yml`: ruta del host a `content/`, montada en `/content:ro`; el backend la lee de `ARCANA_CONTENT_DIR`. |

## Endurecimiento aplicado

- Imágenes multi-stage; runtime sin compiladores ni Node/Maven.
- Usuario no root: Nginx UID 101, API UID 10001. Caddy corre como root del contenedor pero con
  `cap_drop: [ALL]` + sólo `NET_BIND_SERVICE`.
- `read_only: true` en los tres servicios; lo escribible es `tmpfs` en `/tmp` (y los volúmenes
  `caddy_data`/`caddy_config` del proxy para certificados).
- `security_opt: no-new-privileges`, límites de CPU/memoria/PIDs, healthchecks,
  `restart: unless-stopped`, logs rotados (`driver: local`, 2×5 MB).
- JVM: `JAVA_TOOL_OPTIONS` con `MaxRAMPercentage=75` respecto al límite del contenedor
  (768 MB → ~576 MB de heap), `ExitOnOutOfMemoryError`, `-XX:-UsePerfData` (nada en `/tmp`).
- Actuator (`/actuator/*`) **no** se publica: Caddy responde 404. Sólo lo usan el healthcheck
  del contenedor y `smoke.sh` vía `docker compose exec`.
- Cabeceras (Nginx en el HTML; Caddy refuerza HSTS/nosniff/Referrer/COOP en todo, API incluida):
  CSP estricta (`default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`
  por framer-motion, `frame-ancestors 'none'`, `base-uri 'none'`, `object-src 'none'`…),
  HSTS 1 año (añadir `includeSubDomains; preload` sólo cuando el dominio esté listo),
  `Referrer-Policy: no-referrer`, `nosniff`, `Permissions-Policy` con sólo
  `accelerometer=(self), gyroscope=(self)` y el resto vacío, `Cross-Origin-Opener-Policy: same-origin`.
  Nota para el front: la CSP bloquea cualquier recurso de otro origen (CDN, Google Fonts, HDRI
  remotos de drei, `eval`). Todo debe ir empaquetado o en `public/`.
- Caché: `/assets/*` y `/fonts/*` 1 año `immutable`; `/art/*` 30 días; `index.html` `no-cache`.

## Privacidad: qué logs hay y cuáles no

| Componente | Log de acceso | Qué se registra |
|---|---|---|
| Caddy | **No** (sin directiva `log` en el sitio) | Sólo log de proceso a nivel WARN: arranque, emisión/renovación de certificados, errores. |
| Nginx | **No** (`access_log off`) | `error_log` a stderr nivel warn. Nginx sólo ve la IP del contenedor de Caddy (no hay `realip`), así que nunca aparece la IP del usuario. |
| API | **No** (Tomcat access log desactivado) | Logs de aplicación sin cuerpos de petición (responsabilidad del backend). |
| Docker | — | `driver: local` rotado (10 MB máx. por servicio) con lo anterior; nada se envía fuera. |

**IP del usuario.** Caddy no confía en proxies previos (sin `trusted_proxies`): descarta
cualquier `X-Forwarded-For` que mande el cliente y pone sólo la IP del par TCP. Esa cabecera
se reenvía **únicamente al API** (para el rate-limit en memoria con Bucket4j, ventana corta y
sin persistir); al front se le quitan `X-Forwarded-For`, `X-Real-IP` y `Forwarded`. También se
quitan `Cookie` y `Referer` hacia ambos. En el API, `server.forward-headers-strategy: native`
hace que Tomcat sólo acepte `X-Forwarded-For` de direcciones internas (rangos privados, que es
donde vive la red de Docker), por lo que desde fuera no se puede falsificar.
Si algún día se pone un CDN o balanceador delante, hay que declarar su rango en el bloque
global del `Caddyfile` (`servers { trusted_proxies static <CIDR> }`) o la IP que verá el API
será la del CDN (y el rate-limit será global).

## Desplegar en un VPS

1. VPS con Docker Engine + Compose v2, puertos 80/443 (TCP y 443/UDP) abiertos, DNS `A/AAAA`
   del dominio apuntando a él. Usuario de despliegue en el grupo `docker`.
2. `mkdir -p /srv/arcana` y crear `/srv/arcana/.env` (`ARCANA_DOMAIN=tarotazo.example`).
3. En GitHub, entorno `production` con los secretos (sin valores en el repo):
   `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (clave ed25519 dedicada), `VPS_SSH_KNOWN_HOSTS`
   (`ssh-keyscan -t ed25519 <host>`), y `GHCR_READ_TOKEN` (PAT `read:packages`) si los paquetes
   de GHCR son privados. Variables opcionales: `VPS_PATH` (`/srv/arcana`), `VPS_PORT` (`22`).
4. Actions → **deploy** → *Run workflow*. Construye y publica `ghcr.io/<owner>/arcana-{web,api}`
   (con SBOM y provenance), copia `docker-compose.yml` y `Caddyfile` al VPS y ejecuta
   `docker compose pull && docker compose up -d --no-build`.
5. Comprobar: `BASE_URL=https://tarotazo.example SKIP_INTERNAL=1 deploy/smoke.sh`.

Rollback: relanzar el workflow con `tag` = SHA anterior (las imágenes quedan en GHCR).

## CI (`.github/workflows/ci.yml`)

- `web`: `npm ci`, `npm run lint` (tsc), `npm test` (vitest), `npm run build`.
- `api`: Temurin 25, `./mvnw -B verify`.
- `content`: deps de `content/tools` y `node content/tools/validate.mjs`.
- `images`: Buildx de ambas imágenes + Trivy (falla con CVE **CRITICAL** con arreglo disponible;
  HIGH sólo informa). Trivy va con versión fija desde su imagen oficial: actualizarla a conciencia.
- `sonar`: sólo si existe el secreto `SONAR_TOKEN` (variables `SONAR_HOST_URL`,
  `SONAR_PROJECT_KEY`, `SONAR_ORGANIZATION`).

## Si crece: Kubernetes (esbozo)

- `Deployment` por servicio (`arcana-web`, `arcana-api`), ambos sin estado → `HorizontalPodAutoscaler`
  por CPU. `securityContext`: `runAsNonRoot`, `readOnlyRootFilesystem: true`,
  `allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]`, `seccompProfile: RuntimeDefault`;
  `emptyDir` (medium `Memory`) en `/tmp`.
- Probes: API `livenessProbe` `/actuator/health/liveness`, `readinessProbe`
  `/actuator/health/readiness` (ya activadas con `probes.enabled`); web `/healthz`.
- Entrada: Ingress (ingress-nginx o Gateway API) + cert-manager en lugar de Caddy, con
  **logs de acceso desactivados** en el controlador y `externalTrafficPolicy: Local` si el
  rate-limit necesita la IP del cliente. Con varias réplicas del API el rate-limit en memoria
  pasa a ser por réplica: aceptable, o moverlo al Ingress (limit-rps) sin almacenar IPs.
- `NetworkPolicy`: sólo el Ingress habla con web/API; sin egress para los pods.
- Contenido: `ConfigMap`/volumen de solo lectura montado en `/content` + `ARCANA_CONTENT_DIR`,
  o simplemente el empaquetado en la imagen.
- Despliegue con Helm/Kustomize y Argo CD/Flux leyendo las mismas imágenes de GHCR.
