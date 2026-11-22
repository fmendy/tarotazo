# Carga del API (k6)

Script: `qa/load/api-load.js` (k6 en Docker, imagen `grafana/k6`). Resultados: `qa/load/summary.json`
y el resumen en `qa/REPORT.md` / este fichero.

## Instancia de backend para la prueba (sin tocar su código)

El rate‑limit por IP (60/min) haría que casi todo fuese 429, porque k6 sale de una única IP.
Se arranca **una instancia aparte** del jar real (perfil `prod`, contenido empaquetado) con el
límite desactivado mediante propiedades de Spring:

```bash
cp api/target/arcana-api-0.1.0-SNAPSHOT.jar "$TMP/arcana-load.jar"     # copia: en Windows el jar en uso queda bloqueado
java -Xmx768m -jar "$TMP/arcana-load.jar" --spring.profiles.active=prod --server.port=8082 \
     --arcana.rate-limit.enabled=false
# alternativa: --arcana.rate-limit.requests-per-minute=1000000
```

(`-Xmx768m` ≈ el límite de memoria del contenedor en `deploy/docker-compose.yml`; en el contenedor
el heap real es el 75 % = 576 MB.)

## Ejecutar

```bash
docker run --rm -i -v "$PWD/qa/load:/scripts" -e BASE_URL=http://host.docker.internal:8082 \
  grafana/k6 run --summary-export=/scripts/summary.json /scripts/api-load.js
```

Variables: `RPS_READINGS` (150), `RPS_DECKS` (150), `DURATION` (60s).

Escenarios: calentamiento 10 s (5 VU) → carga sostenida 60 s a 150 rps `POST /api/v1/readings`
(barajas, modelos, tiradas, picks y contexto aleatorios, de 1 a 10 cartas) **en paralelo** con 150 rps
`GET /api/v1/decks` → pico de `POST /readings` hasta 600 rps (20 s rampa + 20 s meseta).

Umbrales (fase de carga): errores < 1 %, `readings` p95 < 300 ms y p99 < 800 ms, `decks` p95 < 100 ms.

## Verificación del rate‑limit

`qa/load/ratelimit.sh` lanza 70 peticiones seguidas contra la instancia por defecto (60/min) y
cuenta cuántas reciben 429 y si llevan `Retry-After`.
