# Contenido de Arcana («Tarotazo»)

Aquí vive todo el dominio como datos: barajas, tiradas, provincias y textos. El backend lo lee
sin estado; no hay base de datos. Fuente de verdad de los contratos: `docs/CONTRACTS.md`.
JSON UTF-8 sin BOM, sangría de 2 espacios.

```
content/
  schemas/                 JSON Schema 2020-12 (+ README con detalles y examples/)
  decks/tarot.json         78 cartas · modelos rws, marsella, neon, acuarela, pixel, gatos
  decks/spanish.json       48 cartas (08/09 only48) · castellana 40, catalana 48, ilustrada 40
  spreads.json             7 tiradas: familias, tamaño, posiciones, layout
  provinces.json           52 provincias INE + XX (fuera de España)
  tools/validate.mjs       validador (esquemas + integridad + paridad de idiomas)
  es/                      un idioma = una carpeta
    cards/  spreads.json  meanings/  fragments/  interactions.json
    provinces/{code}.json  titles.json  onboarding.json  pendulum.json
```

Lo **neutro** (ids, tamaños, orden) está fuera de las carpetas de idioma; lo **visible**
(nombres, descripciones, frases) dentro de `{lang}/`.

## Validar

```
cd content/tools && npm install      # sólo la primera vez (ajv + ajv-formats)
node content/tools/validate.mjs      # desde la raíz del repo
node content/tools/validate.mjs --strict   # «pendiente» cuenta como error (para CI de release)
node content/tools/validate.mjs --quiet    # sólo avisos y errores
```

Código de salida ≠ 0 si hay errores. «PENDIENTE» = fichero que aún no existe en `es/`.
«AVISO» = algo mejorable o que falta en otro idioma (se usa el castellano).

## Añadir un modelo de baraja

1. En `decks/{familia}.json → models` añade `{ "id", "deckSize", "art" }` (y `numerals` si el
   numeral mostrado cambia, como Marsella con la Justicia en el VIII y la Fuerza en el XI; el
   id de la carta nunca cambia). En española, `deckSize` 40 excluye las cartas `only48`.
2. El id debe estar en la lista del CONTRACTS §1 (y en `schemas/common.schema.json`): pídelo en
   «Peticiones de cambio».
3. En cada `{lang}/cards/{familia}.json → models` añade `name` y `description` (y `cardNames`
   si algún arcano se llama distinto, p. ej. «La Papisa»).
4. El arte va en `web/public/art/cards/{art}/{cardId}.svg` y `web/public/art/backs/{art}.svg`;
   mientras no exista, la API lo marca `available: false`.

## Añadir una tirada

1. En `spreads.json` añade `{ "id", "size", "families", "positions", "layout" }` (ids de posición
   en camelCase; `minSize` si el número de cartas es variable). Reutiliza ids existentes
   (`pasado`, `futuro`, `consejo`…) para que los fragmentos con `when.posicion` sirvan también.
2. En cada `{lang}/spreads.json` añade `name`, `description` y, por posición, `label`
   (visible), `inline` (para `{posicion}` dentro de una frase) y `hint` opcional.
3. El id y el `layout` deben estar en el §1/§2.2 (si es nuevo, pídelo: el front tiene que saber
   colocar las cartas).

## Añadir un idioma

1. Crea `content/{lang}/` (p. ej. `ca`, `gl`, `eu`, `en`) con la misma estructura que `es/`.
2. Empieza por `cards/`, `spreads.json` y `onboarding.json`; lo que falte cae al castellano.
3. Transcrea, no traduzcas: los chistes y refranes se adaptan. Mantén los mismos `id` de
   fragmentos, interacciones y títulos cuando sean «el mismo» texto; puedes añadir ids nuevos.
4. Las variables `{x}` y las alternativas `[a|b]` son las mismas en todos los idiomas.
5. Ejecuta el validador: el apartado «Paridad de claves» lista lo que falta frente a `es/`.
