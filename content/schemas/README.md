# Esquemas de contenido (JSON Schema 2020-12)

Todos comparten `common.schema.json` (`$defs` de ids, enums del CONTRACTS §1, objeto `when`).
Se valida con `node content/tools/validate.mjs`.

| Fichero | Esquema |
|---|---|
| `decks/{familia}.json` | `deck.schema.json` |
| `spreads.json` | `spreads.schema.json` |
| `provinces.json` | `provinces.schema.json` |
| `{lang}/cards/{familia}.json` | `cards-i18n.schema.json` |
| `{lang}/spreads.json` | `spreads-i18n.schema.json` |
| `{lang}/meanings/{familia}.json` | `meanings.schema.json` |
| `{lang}/fragments/*.json` | `fragments.schema.json` |
| `{lang}/interactions.json` | `interactions.schema.json` |
| `{lang}/provinces/{code}.json` | `province-sheet.schema.json` |
| `{lang}/titles.json` | `titles.schema.json` |
| `{lang}/onboarding.json` | `onboarding.schema.json` |
| `{lang}/pendulum.json` | `pendulum.schema.json` |

Ejemplos mínimos válidos en `examples/` (`onboarding`, `pendulum`); el validador también los comprueba.

## Ids de posición (para `when.posicion` y `{posicion}`)

| Tirada | Posiciones (en orden) |
|---|---|
| `dia` | `consejo` |
| `ppf` | `pasado, presente, futuro` |
| `sino` (1–3) | `respuesta, matiz, remate` (con N cartas se usan las N primeras) |
| `cruz` | `situacion, obstaculo, pasado, futuro, resultado` |
| `herradura` | `pasado, presente, futuro, consejo, entorno, obstaculos, resultado` |
| `amor` | `tu, otra, une, separa, consejo, futuro` |
| `celta` (Waite) | `cubre, cruza, corona, base, pasado, futuro, actitud, entorno, esperanzas, resultado` |

`{posicion}` debería sustituirse por `es/spreads.json → spreads[id].positions[pos].inline`
(«tu pasado», «lo que os une»), no por la etiqueta (`label`, «Pasado»).

## Campos de `when` (fragmentos e interacciones)

Los del CONTRACTS §3.1 más tres opcionales: `family` (`tarot|spanish`), `spread` (ids de
tirada) y `estacion` (`primavera|verano|otono|invierno`). `faseLunar` ∈
`nueva|creciente|llena|menguante`. `diaSemana` ISO (1 = lunes … 7 = domingo). `decadaMin/Max`
múltiplos de 10. `suitDominante` y `figurasMin` sólo se admiten en el slot `sintesis`.

## Mini-sintaxis y variables permitidas

`{variable}` y `[a|b|c]` (sin anidar, sin corchetes sueltos). El validador comprueba que cada
`{x}` esté en la lista permitida:

- Común (CONTRACTS §3.2): `provincia, comunidad, gentilicio, plato, fiesta, clima, signo, decada,
  numeroVida, tema, carta, palo, posicion, cartaAnterior, hora, diaSemana, estacion, faseLunar,
  tono` + las del navegador `nombre, inicial, edad`.
- `onboarding.json` (lo resuelve el navegador, que no tiene la ficha completa): `nombre, inicial,
  edad, santo` (fecha del santoral), `letras` (nº de letras del nombre), `chascarrillo` (teaser de
  la provincia), `provincia, comunidad, gentilicio, signo, decada, numeroVida, hora, diaSemana,
  estacion, faseLunar`. **No** `plato/fiesta/clima`.
- `pendulum.json`: las comunes + `palabra` (ouija), `opcion` (opciones, navegador),
  `porcentaje` (modo porcentaje) y `nivel` (informe de chakra, 0–100).
- Además se rechazan textos con 9 o más dígitos seguidos (parecen teléfonos, §5).

## `onboarding.json` (lo resuelve el NAVEGADOR)

Ejemplo completo: [`examples/onboarding.example.json`](examples/onboarding.example.json).

```jsonc
{
  "puerta": {                 // pantalla +18 (obligatorio)
    "titulo": "…", "pregunta": "¿Eres mayor de edad?", "aviso": "Esto es entretenimiento…",
    "si": "Sí, tengo 18 o más", "no": "Todavía no",
    "fecha": "O dime tu fecha de nacimiento",   // opcional
    "bienvenida": ["…"]                          // opcional
  },
  "menor": ["…"],             // salida amable si < 18 (obligatorio)
  "nombre": {
    "pregunta":      ["¿Cómo te llamas?"],
    "especiales":    { "vanesa": ["¿Vanesa? Las Vanesas siempre llegan tarde…"] },
    "santoral":      { "maria": "15 de agosto" },          // valor = «D de mes»
    "santoralLines": ["Tu santo es el {santo}…"],
    "porTerminacion":{ "ana": ["¿{nombre}? Rima con mañana…"] },  // gana la más larga
    "porInicial":    { "M": ["La M de {nombre}…"] },        // clave = 1 letra mayúscula
    "porLongitud":   [ { "min": 1, "max": 3, "lines": ["{letras} letras…"] } ],
    "genericas":     ["…"]                                  // obligatorio
  },
  "edad": {
    "pregunta":   ["…"],
    "porDecada":  { "20": ["…"] },        // "10" (18–19) … "100"
    "signo":      { "leo": ["…"] },       // ids del §1
    "numeroVida": { "7": ["…"] },         // "1".."9", "11", "22", "33"
    "sinFecha":   ["…"],                  // sólo dio la edad, sin signo
    "genericas":  ["…"]
  },
  "provincia": {
    "pregunta":   ["…"],
    "genericas":  ["¡De {provincia}! {chascarrillo}"],   // obligatorio
    "extranjero": ["…"]                                   // código XX, obligatorio
  }
}
```

Reglas:
- **Claves de nombre normalizadas**: minúsculas, sin tildes ni diéresis (se conserva la `ñ`),
  compuestos con un espacio (`"jose luis"`, `"maria jose"`). El front normaliza igual
  (`NFD` + quitar diacríticos salvo ñ) antes de buscar.
- Prioridad sugerida del front: `especiales` > `santoral`+`santoralLines` > `porTerminacion` >
  `porInicial` > `porLongitud` > `genericas`. Puede encadenar dos reacciones.
- Todas las listas tienen ≥ 1 elemento y se sortea una línea.
- Género neutro siempre.
