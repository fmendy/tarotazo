# arcana-api — backend de «Tarotazo»

API sin estado ni base de datos: baraja con `SecureRandom`, sirve el contenido (JSON de `../content`) y compone
los textos de la vidente dejando `{nombre}`, `{inicial}` y `{edad}` para que los rellene el navegador.
Contratos: `../docs/CONTRACTS.md` (§3 motor narrativo, §4 péndulo, §6 API).

- Java 25 · Spring Boot 4.2.0 (Spring MVC, hilos virtuales) · Jackson 3
- Caffeine 3.3.1 · Bucket4j 8.22.0 · networknt json-schema-validator 3.0.9 · springdoc-openapi 3.2.0
- Tests: JUnit 6 (Jupiter), AssertJ, MockMvc, ArchUnit 1.5.1, Testcontainers 2.0.5

## Ejecutar

No hace falta tener Maven instalado (Maven Wrapper, Maven 3.10.1):

```bash
./mvnw spring-boot:run          # perfil dev: contenido en ../content, avisos en vez de fallo, Swagger UI
./mvnw test                     # tests unitarios + MockMvc + ArchUnit (no necesitan Docker)
./mvnw -DskipTests package      # target/arcana-api-0.1.0-SNAPSHOT.jar (incluye ../content como classpath:content/)
java -jar target/arcana-api-0.1.0-SNAPSHOT.jar --spring.profiles.active=prod
./mvnw verify -Pcontainer-tests # prueba la imagen (api/Dockerfile de DevOps) con Testcontainers; necesita Docker
```

En Windows: `mvnw.cmd …`. Puerto **8080**.

## Configuración

| Propiedad | Por defecto | Descripción |
|---|---|---|
| `arcana.content-dir` (`ARCANA_CONTENT_DIR`) | vacío (dev: `../content`) | Directorio de contenido (p. ej. volumen `/content:ro`). Si está vacío se usa el contenido empaquetado en el jar. Si está definido, tiene prioridad. |
| `arcana.content-strict` | `true` (dev: `false`) | `true`: el arranque **falla** si falta un fichero obligatorio, hay JSON mal formado o no valida contra `content/schemas/`. `false`: arranca y lista los problemas en el log. |
| `arcana.art-dir` (`ARCANA_ART_DIR`) | vacío (dev: `../web/public/art`) | Si existe, los modelos sin `backs/{art}.svg` ni `cards/{art}/` salen con `available: false`. |
| `arcana.unavailable-models` | `[]` | Modelos marcados `available: false` a mano (útil en prod, donde la API no ve el arte). |
| `arcana.cors-origins` (`ARCANA_CORS_ORIGINS`) | vacío | Orígenes CORS separados por comas. Vacío = sin CORS (en dev el front usa el proxy de Vite). |
| `arcana.rate-limit.requests-per-minute` | `240` | Límite por IP en `/api/**` (Bucket4j en memoria). `arcana.rate-limit.enabled=false` lo desactiva. |
| `arcana.max-body-bytes` | `16384` | Tamaño máximo del cuerpo en `/api/**`; por encima, `413 {"error":"payload_too_large"}`. |
| `arcana.zone` | `Europe/Madrid` | Zona para hora/día por defecto, estación y fase lunar. |

Perfiles: `dev` (lo usa `spring-boot:run`) y `prod` (estricto, sin OpenAPI ni Swagger UI). Sin perfil = estricto.

Al arrancar se registra un resumen tipo
`Contenido: 73 ficheros revisados, 0 errores, 0 avisos` con la lista de incidencias (fichero + motivo).

## Endpoints

| Método y ruta | |
|---|---|
| `GET /api/v1/decks` | Barajas y modelos (`backImage`, `previewImage`, `imagePattern`, `available`, `numerals`) |
| `GET /api/v1/spreads?deck=tarot\|spanish` | Tiradas (sin `deck` = todas); `minSize` en las de tamaño variable (`sino`) |
| `GET /api/v1/provinces` | `code, nombre, comunidad, gentilicio, zona, teaser` |
| `GET /api/v1/titles` | `{lang}/titles.json` tal cual |
| `GET /api/v1/content/onboarding` | `{lang}/onboarding.json` tal cual |
| `GET /api/v1/content/pendulum?provincia=41` | Modelos de péndulo (`nombre`, `personalidad`) y frases de ritual (`intro, calibrar.*, concentrar, repetida, enfado, medianoche`) |
| `POST /api/v1/readings` | Lectura completa |
| `POST /api/v1/readings/next-line` | Rama de una pregunta Sí/No |
| `POST /api/v1/pendulum/answer` | Resultado y frase del péndulo por modo |
| `GET /api/v1/docs` | OpenAPI (sólo dev); Swagger UI en `/api/v1/swagger-ui.html` (dev) |
| `GET /actuator/health`, `/actuator/metrics`, `/actuator/prometheus` | Salud y métricas agregadas (nada más expuesto) |

Idioma: `?lang=` > `context.lang` > `Accept-Language` > `es`. El contenido de `content/{lang}/` cae a `es` por
fichero y por clave; los fragmentos caen a `es` **por slot** (si un idioma tiene algún fragmento de un slot se
usan sólo los suyos, para no mezclar idiomas en una frase).

Errores: `400 {"error":"bad_request","message":"…"}`; `429 {"error":"too_many_requests",…}` con `Retry-After`;
`413 payload_too_large`; `404/405/415` con el mismo formato; `503 {"error":"unavailable"}` si falta un fichero (sólo posible en dev).

```bash
curl -s localhost:8080/api/v1/decks
curl -s -X POST localhost:8080/api/v1/readings -H 'Content-Type: application/json' -d '{
  "deck":"tarot","model":"rws","spread":"ppf","cutIndex":2,"picks":[5,17,40],
  "context":{"signo":"leo","decada":30,"provincia":"41","tema":"amor","toneSeed":123456789,"hora":23,"diaSemana":5},
  "recentFragmentIds":[]}'
curl -s -X POST localhost:8080/api/v1/pendulum/answer -H 'Content-Type: application/json' -d '{"mode":"sino","model":"cuarzo"}'
```

Caché HTTP: los `POST` y todos los errores llevan `Cache-Control: no-store`; los GET de contenido (`/decks`,
`/spreads`, `/provinces`, `/titles`, `/content/*`) llevan `public, max-age=300` y ETag (revalidación con 304).

`{provincia}`: con código `XX` vale «tierras lejanas» y sin provincia «la tierra» (`provinciaExtranjero` /
`provinciaDesconocida` en las server labels). Ninguna respuesta deja una variable de servidor sin resolver.

## Módulos (paquetes de `es.arcana`)

- `content` — único que lee ficheros (disco o classpath). Validación JSON Schema 2020‑12 al arrancar (los `$ref`
  se resuelven en local por nombre de fichero, sin red), carga en memoria, caché Caffeine por idioma.
- `reading` — barajado (`SecureRandom`), corte en 3 montones (el elegido encima), picks, orientación con
  `reversedProbability` (del modelo o de la baraja).
- `narrative` — motor §3.4: tono inicial por `toneSeed` con los pesos del §1 (sólo tonos con contenido), cambio de
  humor (15 %, a mitad de lectura, frase `cambioHumor` del tono nuevo), selección por slot/tono/`when`/peso,
  anti‑repetición (`recentFragmentIds` y dentro de la lectura), `[a|b|c]`, variables de servidor, síntesis,
  número de la suerte, color del día y descargo de salud. Estación y fase lunar se calculan en servidor.
- `pendulum` — resultado por modo y frases (las del modelo de péndulo sustituyen a las generales).
- `ops` — rate‑limit, health del contenido y contadores agregados (`arcana.readings`, `arcana.pendulum`).
- `common` — DTO de contexto, errores, filtro sin sesión, CORS.

ArchUnit (`ArchitectureTest`) comprueba que `reading` y `pendulum` no se conocen, que `content` no depende de
los demás y que sólo `content` usa `java.nio.file` / `org.springframework.core.io`.

## Privacidad

- Nunca se registran cuerpos de petición ni IPs (sin access log de Tomcat; los errores de JSON no se devuelven
  ni se registran con su contenido).
- Rate‑limit con un HMAC‑SHA256 de la IP con clave aleatoria generada al arrancar (sólo en memoria), en un mapa
  Caffeine que expira a los 2 minutos. Detrás del proxy, la IP sale de `X-Forwarded-For` (`forward-headers-strategy: native`).
- Sin cookies ni sesión HTTP: cualquier intento de crear sesión falla (no se puede emitir `JSESSIONID`).
- Nada se persiste.

## Textos propios del servidor

Nombres visibles de signos, días, estaciones, fases, tonos y temas, colores de la suerte y descargos están en
`src/main/resources/arcana-defaults/es.json`. Un idioma puede sobrescribirlos con el fichero opcional
`content/{lang}/server-labels.json` (no está en el contrato de contenido; es una extensión).
