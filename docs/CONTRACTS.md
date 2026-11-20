# Arcana («Tarotazo») — Contratos compartidos

Documento del jefe de proyecto. **Es la fuente de verdad entre equipos.** Si necesitas cambiar
algo de aquí, no lo cambies en silencio: anótalo al final en «Peticiones de cambio» y sigue con
lo acordado. Especificación funcional completa: `docs/spec.txt`.

## 0. Propiedad de directorios (no escribas fuera de lo tuyo)

| Equipo | Directorios propios |
|---|---|
| Datos / modelo de contenido | `content/schemas/`, `content/decks/`, `content/spreads.json`, `content/provinces.json`, `content/es/spreads.json`, `content/es/cards/`, `content/tools/` |
| Guionista | `content/es/meanings/`, `content/es/provinces/`, `content/es/titles.json`, `content/es/interactions.json` |
| Escritor (diálogos) | `content/es/fragments/`, `content/es/onboarding.json`, `content/es/pendulum.json` |
| Backend | `api/` (excepto `api/Dockerfile`) |
| Frontend | `web/` (excepto `web/src/fx/`, `web/src/pendulum/`, `web/public/art/`, `web/src/styles/tokens.css`, `web/Dockerfile`, `web/nginx.conf`) |
| Animación | `web/src/fx/`, `web/src/pendulum/` |
| Diseño gráfico | `art/`, `web/public/art/`, `web/src/styles/tokens.css` |
| DevOps | `deploy/`, `api/Dockerfile`, `web/Dockerfile`, `web/nginx.conf`, `.github/` |

Todo el contenido es **UTF-8**, JSON con 2 espacios, sin BOM.

## 1. Identificadores

- **Familias de baraja**: `tarot`, `spanish`.
- **Modelos**: tarot → `rws` (por defecto), `marsella`, `neon`, `acuarela`, `pixel`, `gatos`;
  spanish → `castellana` (por defecto), `catalana`, `ilustrada`.
- **Cartas tarot** (78): `mayor-00` … `mayor-21` (numeración RWS: `mayor-08` = Fuerza,
  `mayor-11` = Justicia; Marsella sólo cambia el numeral mostrado, no el id);
  menores `{palo}-{rango}` con palo ∈ `bastos|copas|espadas|oros` y rango ∈
  `01..10|sota|caballo|reina|rey` → p. ej. `copas-01`, `espadas-reina`.
- **Cartas españolas** (48; la versión de 40 excluye 08 y 09): `{palo}-{rango}` con
  rango ∈ `01..09|sota|caballo|rey` → p. ej. `oros-01`, `bastos-sota`.
- **Tiradas**: `dia` (1), `ppf` (3), `sino` (1–3, por defecto 3), `cruz` (5), `herradura` (7),
  `celta` (10, sólo tarot), `amor` (6).
- **Temas**: `general`, `amor`, `trabajo`, `dinero`, `salud`.
- **Tonos de la vidente**: `mistica` (25), `abuela` (20), `teletienda` (15), `ironica` (20),
  `dramatica` (10), `coach` (10) — entre paréntesis el peso por defecto.
- **Provincias**: código INE de 2 dígitos `"01"`…`"52"` (`"51"` Ceuta, `"52"` Melilla);
  `"XX"` = nacido fuera de España.
- **Signos**: `aries, tauro, geminis, cancer, leo, virgo, libra, escorpio, sagitario,
  capricornio, acuario, piscis`.
- **Péndulos**: `cuarzo, amatista, laton, obsidiana, madera, camara, llave, anillo, chorizo`.
- **Modos de péndulo**: `sino, tablero, porcentaje, ouija, mapa, opciones, chakras`.

## 2. Ficheros de contenido

```
content/
  schemas/*.schema.json          JSON Schema draft 2020-12 de cada fichero
  decks/tarot.json, spanish.json estructura neutra: cartas y modelos
  spreads.json                   estructura neutra: tiradas y posiciones
  provinces.json                 código, comunidad, datos neutros
  tools/validate.mjs             valida todo + comprueba claves por idioma (node, sin deps salvo ajv)
  es/
    cards/tarot.json, spanish.json     nombres visibles de cartas y modelos
    spreads.json                       nombres/descr. de tiradas y etiquetas de posiciones
    meanings/tarot.json, spanish.json  significados «serios» (núcleo)
    fragments/*.json                   fragmentos narrativos del motor (ver §3)
    interactions.json                  preguntas Sí/No con ramas
    provinces/{codigo}.json            ficha de chascarrillos de cada provincia (52 + XX)
    titles.json                        diplomas de la vidente
    onboarding.json                    reacciones a nombre/edad/provincia (se resuelven en el NAVEGADOR)
    pendulum.json                      frases del péndulo, palabras ouija, chakras
```

### 2.1 `decks/tarot.json` (ejemplo)
```json
{
  "family": "tarot",
  "reversedProbability": 0.3,
  "defaultModel": "rws",
  "models": [{ "id": "rws", "deckSize": 78, "art": "rws" }],
  "cards": [
    { "id": "mayor-00", "arcana": "major", "number": 0 },
    { "id": "copas-reina", "arcana": "minor", "suit": "copas", "rank": "reina", "court": true }
  ]
}
```
Spanish: `models[].deckSize` es 40 o 48; las cartas 08/09 llevan `"only48": true`.

### 2.2 `spreads.json`
```json
{ "spreads": [
  { "id": "ppf", "size": 3, "families": ["tarot","spanish"], "positions": ["pasado","presente","futuro"], "layout": "row" }
]}
```
`layout` ∈ `single|row|cross|horseshoe|celtic|love` (el front lo usa para colocar las cartas).

### 2.3 `es/meanings/tarot.json`
```json
{ "mayor-13": {
    "keywords": ["cambio","cierre","transformación"],
    "upright":  { "general": ["…","…"], "amor": ["…"], "trabajo": ["…"], "dinero": ["…"], "salud": ["…"] },
    "reversed": { "general": ["…","…"], "amor": ["…"], "trabajo": ["…"], "dinero": ["…"], "salud": ["…"] }
} }
```
Mínimo 2 variantes en `general` y 1 en cada otro tema, por orientación. Respetar límites de
contenido (§5). Pueden usar la mini‑sintaxis de §3.2.

### 2.4 `es/provinces/28.json`
```json
{ "code": "28", "nombre": "Madrid", "comunidad": "Comunidad de Madrid", "gentilicio": "madrileño/a",
  "plato": ["el cocido", "el bocata de calamares"], "fiesta": ["San Isidro"], "clima": ["nueve meses de invierno y tres de infierno"],
  "chascarrillos": ["…", "…", "…"] }
```
`plato`, `fiesta`, `clima` son listas (se sortea uno). `chascarrillos` ≥ 3 frases (en la fase
MVP; ≥ 6 en fase 4). Tópicos **amables**, nunca ofensivos.

### 2.5 `es/titles.json`
```json
{ "titles": [ { "id": "magia-torrelodones", "titulo": "…", "centro": "…", "comentario": "…", "sello": "…", "anio": 1987, "frame": "barroco" } ] }
```
`frame` ∈ `barroco|dorado|madera|moderno|pergamino`. `sello` = chiste al «compulsar».

## 3. Motor narrativo

### 3.1 Fragmentos (`es/fragments/*.json`)
Cada fichero: `{ "fragments": [ Fragment, … ] }`.
```json
{ "id": "entrada.mistica.001",
  "slot": "entrada",
  "tones": ["mistica"],
  "weight": 1,
  "when": { "tema": ["amor"], "invertida": true, "arcana": "major", "cardIds": ["mayor-16"],
            "suit": ["espadas"], "posicion": ["futuro"], "decadaMin": 40, "decadaMax": 50,
            "horaMin": 0, "horaMax": 6, "mayoresMin": 3, "provincia": ["41"], "signo": ["leo"],
            "diaSemana": [2], "faseLunar": ["menguante"], "primeraCarta": true, "ultimaCarta": true },
  "text": "Mmm… [ojo|cuidado|atención], {nombre}." }
```
- `tones` vacío o ausente = vale para todos. `when` ausente = siempre. Todas las condiciones
  presentes deben cumplirse (AND); listas = cualquiera de (OR).
- **Slots** (`slot`):
  - `entrada` — reacción al girar la carta (corta).
  - `puente` — conecta el núcleo con la posición («En tu pasado…», «Y como obstáculo…»); puede usar `{posicion}`.
  - `personalizacion` — usa variables del usuario.
  - `guino` — chiste, refrán o referencia local (probabilidad 40–60 %).
  - `cambioHumor` — la vidente cambia de tono a mitad de lectura («perdona, me ha dado un aire»).
  - `sintesis` — cierre de la lectura completa, con `when.mayoresMin`, palo dominante, etc.
  - `saludo` / `despedida` — inicio y fin de la sesión de lectura.
  - `salud` — descargo obligatorio cuando `tema == salud` («para eso, mejor tu médico»).
  - `pendulo.*` — ver §4 (van en `es/pendulum.json`, no aquí).
- `when.suitDominante` (`bastos|copas|espadas|oros`) y `when.figurasMin` sólo aplican a `sintesis`.

### 3.2 Mini‑sintaxis de texto
- `{variable}` — sustitución. `[a|b|c]` — alternativa sorteada (sin anidar).
- Variables que resuelve el **servidor**: `provincia, comunidad, gentilicio, plato, fiesta, clima,
  signo, decada, numeroVida, tema, carta, palo, posicion, cartaAnterior, hora, diaSemana,
  estacion, faseLunar, tono`.
- Variables que resuelve **sólo el navegador** (el servidor las deja intactas): `{nombre}`,
  `{inicial}`, `{edad}`.
- Género neutro siempre («alguien especial», «te veo con fuerza»).

### 3.3 Interacciones (`es/interactions.json`)
```json
{ "interactions": [ { "id": "letra-m", "tones": [], "when": {}, "prompt": "¿Hay alguien con la letra M en tu vida?",
    "branches": { "si": "…", "no": "…", "skip": "…" } } ] }
```
Probabilidad 25 % por carta, máximo 3 por lectura. La rama se pide a `POST /readings/next-line`.

### 3.4 Algoritmo de selección (backend)
1. Semilla de sesión → PRNG determinista sólo para elegir texto (las cartas usan `SecureRandom`).
2. Tono inicial sorteado con los pesos del §1 usando `toneSeed`; 15 % de probabilidad por
   lectura de un `cambioHumor` a mitad (cambia de tono a partir de esa carta).
3. Por carta: `entrada` + `puente` + núcleo (meanings[cardId][orientación][tema] o `general`)
   + `personalizacion` + `guino` (p=0.5) + interacción (p=0.25, máx 3).
4. Filtrar por `tones` y `when`, elegir por `weight`; evitar ids de `recentFragmentIds` (el
   navegador manda los ids usados en las 3 últimas lecturas) y no repetir dentro de la lectura.
5. Si `tema == salud`, añadir un fragmento `salud`.

## 4. Péndulo (`es/pendulum.json`)
```json
{ "lines": { "sino.si": ["…"], "sino.no": ["…"], "sino.duda": ["…"], "tablero.0": ["…"], "porcentaje.alto": ["…"],
             "porcentaje.medio": ["…"], "porcentaje.bajo": ["…"], "ouija": ["…{palabra}…"], "mapa": ["…{provincia}…"],
             "opciones": ["…{opcion}…"], "chakras.intro": ["…"], "calibrar.si": ["…"], "calibrar.no": ["…"],
             "enfado": ["…"], "medianoche": ["…"] },
  "models": { "cuarzo": { "personalidad": "…", "lines": { "sino.si": ["…"] } } },
  "ouijaWords": ["SI","NO","AMOR","PIZZA", "…"],
  "chakras": [ { "id": "raiz", "nombre": "Raíz", "informes": ["…"] } ] }
```
`tablero.0..4` = SÍ, PROBABLE, QUIZÁ, POCO PROBABLE, NO. `{opcion}` lo rellena el navegador
(las opciones del usuario nunca se envían; el servidor sólo recibe cuántas hay).

## 5. Límites de contenido (obligatorios)
Nada de predicciones sobre muerte, enfermedades graves, embarazo o decisiones económicas
concretas. La Muerte, La Torre y el 10 de Espadas = cambio o cierre, con humor. Tema salud →
siempre «para eso, mejor tu médico». Sin marcas ni sagas protegidas. Sin números de teléfono.
Humor amable: nada sexista, racista, ni que se burle de colectivos o provincias con malicia.

## 6. API v1 (JSON, `Accept-Language` o `?lang=`; por defecto `es`)

### `GET /api/v1/decks`
```json
[ { "family": "tarot", "name": "Tarot tradicional", "defaultModel": "rws",
    "models": [ { "id": "rws", "name": "Rider‑Waite‑Smith", "description": "…", "deckSize": 78,
                  "backImage": "/art/backs/rws.svg", "previewImage": "/art/cards/rws/mayor-00.svg",
                  "imagePattern": "/art/cards/rws/{cardId}.svg", "available": true } ] } ]
```
`available: false` para modelos cuyo arte aún no existe.

### `GET /api/v1/spreads?deck=spanish`
```json
[ { "id": "ppf", "name": "Pasado, presente y futuro", "description": "…", "size": 3, "layout": "row",
    "positions": [ { "id": "pasado", "label": "Pasado" } ] } ]
```

### `GET /api/v1/provinces`
`[ { "code": "28", "nombre": "Madrid", "comunidad": "Comunidad de Madrid", "teaser": "<un chascarrillo>" } ]`

### `GET /api/v1/content/onboarding` · `GET /api/v1/titles`
Devuelven tal cual `es/onboarding.json` y `es/titles.json` del idioma pedido (fallback `es`).

### `POST /api/v1/readings`
Petición (nunca nombre, edad exacta ni pregunta):
```json
{ "deck": "tarot", "model": "rws", "spread": "ppf", "cutIndex": 2, "picks": [5, 17, 40],
  "context": { "signo": "leo", "decada": 30, "numeroVida": 7, "provincia": "41", "tema": "amor",
               "toneSeed": 123456789, "hora": 23, "diaSemana": 5, "lang": "es" },
  "recentFragmentIds": ["entrada.mistica.001"] }
```
- `cutIndex` ∈ 0..2 (tres montones; el elegido va arriba). `picks`: índices del abanico
  (0..deckSize‑1), tantos como posiciones, distintos.
- Servidor: baraja completa con `SecureRandom`, aplica corte, toma `picks`, sortea orientación.

Respuesta:
```json
{ "tone": "mistica",
  "spread": { "id": "ppf", "name": "…", "layout": "row", "positions": [ { "id": "pasado", "label": "Pasado" } ] },
  "intro": "texto saludo",
  "cards": [ { "position": "pasado", "cardId": "mayor-13", "name": "La Muerte", "reversed": false,
               "image": "/art/cards/rws/mayor-13.svg",
               "tone": "mistica",
               "lines": [ { "kind": "entrada", "text": "…" }, { "kind": "puente", "text": "…" }, { "kind": "nucleo", "text": "…" },
                          { "kind": "personalizacion", "text": "… {nombre} …" }, { "kind": "guino", "text": "…" },
                          { "kind": "cambioHumor", "text": "…" } ],
               "interaction": { "id": "letra-m", "prompt": "…", "options": ["si","no","skip"] } } ],
  "summary": { "text": "…", "luckyNumber": 7, "luckyColor": { "name": "verde botella", "hex": "#1f5e3b" } },
  "outro": "texto despedida",
  "disclaimer": "Entretenimiento, no consejo profesional.",
  "usedFragmentIds": ["…"] }
```
`interaction` puede ser `null`. `lines` mantiene el orden de lectura.

### `POST /api/v1/readings/next-line`
`{ "interactionId": "letra-m", "answer": "si" | "no" | "skip", "tone": "mistica", "context": {…mismo objeto…} }`
→ `{ "text": "…" }`

### `POST /api/v1/pendulum/answer`
`{ "mode": "sino", "model": "cuarzo", "options": 3, "context": {…} }` →
```json
{ "mode": "sino", "result": { "answer": "si" },  "text": "…" }
```
`result` según modo: `sino` → `{answer: si|no|duda}`; `tablero` → `{sector: 0..4}`;
`porcentaje` → `{value: 0..100}`; `ouija` → `{word}`; `mapa` → `{provincia: "28"}`;
`opciones` → `{index}` (texto con `{opcion}` sin resolver); `chakras` → `{levels:[{id, nivel 0..100, informe}]}`.

### Errores
`400 { "error": "bad_request", "message": "…" }`, `429` por rate‑limit. Nunca se registra el cuerpo.

## 7. Frontend ↔ Animación (interfaces de componentes)

Animación exporta desde `web/src/fx/index.ts`:
```ts
export function ShuffleDeck(p: { backImage: string; style: 'riffle'|'overhand'|'mesa'; onDone(): void; onMore?(): void; reducedMotion?: boolean }): JSX.Element;
export function CutDeck(p: { backImage: string; mode: 'tres'|'abanico'; onCut(index: 0|1|2): void }): JSX.Element;
export function CardFan(p: { backImage: string; count: number; pick: number; onPicked(indices: number[]): void }): JSX.Element;
export function FlipCard(p: { front: string; back: string; flipped: boolean; reversed?: boolean; width?: number; onFlipped?(): void }): JSX.Element;
export function SpreadBoard(p: { layout: 'single'|'row'|'cross'|'horseshoe'|'celtic'|'love'; slots: number; children: React.ReactNode[] }): JSX.Element;
export function Ambience(p: { variant: 'humo'|'velas'|'estrellas'|'polvo'; intensity?: number }): JSX.Element; // capa de fondo
export function ScreenTransition(p: { id: string; children: React.ReactNode }): JSX.Element;
export function TypewriterText(p: { text: string; speed?: number; onDone?(): void }): JSX.Element;
export function DustStamp(p: { trigger: number; label: string }): JSX.Element; // sello «compulsado»
export function Chests(p: { onChoose(family: 'tarot'|'spanish'): void }): JSX.Element;
export function Carousel3D<T>(p: { items: T[]; render(item: T): React.ReactNode; onSelect(item: T): void }): JSX.Element;
```
Desde `web/src/pendulum/index.ts`:
```ts
export function Pendulum(p: {
  model: string;                     // id de péndulo
  mode: 'sino'|'tablero'|'porcentaje'|'ouija'|'mapa'|'opciones'|'chakras';
  target: PendulumTarget | null;     // a dónde debe «dejarse llevar»; null = libre
  yesAxis: 'vertical'|'horizontal';  // calibración sorteada por sesión
  onSettled?(): void;
  angry?: boolean;                   // easter egg (se enrolla)
  midnight?: boolean;                // brilla más
  board?: React.ReactNode;           // tablero/mapa que se dibuja debajo
}): JSX.Element;
export type PendulumTarget =
  | { kind: 'axis'; axis: 'vertical'|'horizontal' } | { kind: 'circle' }
  | { kind: 'point'; x: number; y: number };        // coords normalizadas 0..1 sobre el tablero
```
Respetan `prefers-reduced-motion` (versión mínima sin física pesada) y 60 fps en móvil medio.
Sonidos: `web/src/fx/sound.ts` exporta `playSfx(name: 'shuffle'|'flip'|'candle'|'bell'|'chime'|'stamp'|'swing')`
y `setMuted(b)`, generados con Web Audio (sin ficheros externos) o Howler si hay ficheros.

## 8. Arte (Diseño gráfico)
- `web/public/art/cards/{model}/{cardId}.svg` (proporción 7:12, viewBox `0 0 700 1200`).
- `web/public/art/backs/{model}.svg` · `web/public/art/pendulums/{id}.svg` ·
  `web/public/art/map/spain.svg` (cada provincia `<path id="prov-28" data-code="28" data-name="Madrid">`,
  Canarias en recuadro) · `web/public/art/remedios/{pose}.svg` (poses: `saludo, piensa, sorpresa, rie, bola`) ·
  `web/public/art/frames/{frame}.svg` · `web/public/art/chests/{tarot|spanish}.svg` ·
  `web/public/art/stamps/compulsado.svg` · `web/public/art/wallpaper.svg`.
- Tokens en `web/src/styles/tokens.css` (variables CSS `--c-*`, `--f-*`, `--r-*`, `--s-*`, `--shadow-*`).
  Fuentes autoalojadas en `web/public/fonts/` (licencia OFL), nunca Google Fonts remoto.

## Peticiones de cambio
(añadir aquí: fecha · equipo · cambio propuesto · motivo)

- 2026-11-20 · Datos · **Ids de posición** fijados en `content/spreads.json` (ver `content/schemas/README.md`):
  `dia` consejo · `ppf` pasado, presente, futuro · `sino` respuesta, matiz, remate (con `minSize: 1`, se usan las N primeras) ·
  `cruz` situacion, obstaculo, pasado, futuro, resultado · `herradura` pasado, presente, futuro, consejo, entorno, obstaculos, resultado ·
  `amor` tu, **otra**, une, separa, consejo, futuro · `celta` cubre, cruza, corona, base, pasado, futuro, actitud, entorno, esperanzas, resultado.
  Motivo: el §1 no los fijaba y los fragmentos ya usan `when.posicion`.
- 2026-11-20 · Datos · `es/spreads.json`: cada posición es `{ "label": "Pasado", "inline": "tu pasado", "hint": "…" }`.
  Propuesta al backend: `{posicion}` se sustituye por `inline` (no por `label`); la API sigue devolviendo `positions[].label`.
  Motivo: «En Pasado…» suena mal; «En tu pasado…» bien.
- 2026-11-20 · Datos · `provinces.json` = `{ "provinces": [ { "code", "nombre", "nombreOficial", "comunidad", "capital", "zona" } ] }`
  (`zona` ∈ peninsula|baleares|canarias|africa|extranjero; `XX` con comunidad/capital `null`). Motivo: estructura y recuadro de Canarias en el mapa.
- 2026-11-20 · Datos · `GET /api/v1/provinces` debería incluir también `gentilicio` (de la ficha). Motivo: `onboarding.json` se resuelve en
  el navegador y sus frases de provincia usan `{provincia}`, `{comunidad}`, `{gentilicio}` y `{chascarrillo}` (= `teaser`).
- 2026-11-20 · Datos · Variables extra fuera del §3.2: `onboarding.json` → `santo`, `letras`, `chascarrillo` (sin `plato/fiesta/clima`);
  `pendulum.json` → `palabra`, `opcion`, `porcentaje`, `nivel` (informe de chakra). Ids de chakra: `raiz, sacro, plexo, corazon, garganta, tercerOjo, corona`.
  Claves opcionales extra en `pendulum.lines`: `intro`, `calibrar.intro`, `repetida`.
- 2026-11-20 · Datos · `when` admite además (opcionales) `family`, `spread`, `estacion` (`primavera|verano|otono|invierno`);
  `faseLunar` ∈ `nueva|creciente|llena|menguante`; `diaSemana` ISO 1 = lunes … 7 = domingo. Motivo: el §3.1 no fijaba esos valores.
- 2026-11-20 · Datos · `decks/*.json → models[]` añade `numerals` (Marsella: `mayor-08` «XI», `mayor-11` «VIII», `mayor-00` sin numeral),
  `minors` (escenas|pips) y `pattern`; `es/cards/*.json → models[id].cardNames` para nombres propios del modelo (Marsella: La Papisa, El Papa,
  El Enamorado, El Arcano sin Nombre, La Casa de Dios). Española: castellana 40, catalana 48, ilustrada 40. `reversedProbability`: tarot 0.3, española 0.2.
  Cartas menores llevan `number` (tarot 1–14, española 1–12 con sota 10, caballo 11, rey 12).

## Resoluciones del jefe de proyecto (prevalecen sobre lo anterior)
- 2026-11-20 · **Aceptadas todas las peticiones del equipo de datos** de esta sección. En concreto:
  - `diaSemana` es **ISO‑8601: 1 = lunes … 7 = domingo** (en `when` y en el `context` de la API).
  - `{posicion}` se sustituye por el campo `inline` de la posición («tu pasado»); `label` es para la interfaz.
  - Ids de posición definitivos: los de `content/spreads.json` (amor: `tu, otra, une, separa, consejo, futuro`).
  - `GET /api/v1/provinces` incluye también `gentilicio`.
  - `when` admite opcionalmente `family`, `spread`, `estacion`.
  - `reversedProbability`: tarot 0.3, española 0.2 (desde `decks/*.json`).
  - Numerales visibles por modelo: campo `numerals` del modelo (el id de carta no cambia).
- La verificación de edad es **autodeclaración** (decisión del titular).
