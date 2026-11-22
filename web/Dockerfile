# syntax=docker/dockerfile:1.7
# Tarotazo (arcana) — front estático.
# Contexto de build: web/   ->  docker build -t arcana-web web

ARG NODE_VERSION=24
ARG NGINX_VERSION=1.29

############################
# 1) Compilación (Node LTS)
############################
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
ENV CI=true \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

############################
# 2) Runtime: Nginx sin root
############################
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine AS runtime

LABEL org.opencontainers.image.title="arcana-web" \
      org.opencontainers.image.description="Tarotazo — front React servido por Nginx sin root" \
      org.opencontainers.image.source="https://github.com/fmendy/tarotazo"

USER root
# Configuración propia (sustituye la principal) y fuera el default.conf de la imagen.
# Parches de seguridad del SO base (Trivy falla en CRITICAL con arreglo disponible).
RUN apk upgrade --no-cache && rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN chown -R root:root /usr/share/nginx/html && chmod -R a+rX /usr/share/nginx/html
# UID 101 = usuario "nginx" de la imagen unprivileged
USER 101

# Los scripts de entrada no tienen nada que hacer (no hay templates ni default.conf).
ENV NGINX_ENTRYPOINT_QUIET_LOGS=1

EXPOSE 8080
# Compatible con read_only: true + tmpfs en /tmp (pid y temporales van a /tmp).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
