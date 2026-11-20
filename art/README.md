# art/ · Generadores de arte de Tarotazo

Todo el arte es **SVG generado por código** (original, sin recursos de terceros salvo fuentes OFL y datos cartográficos abiertos).

## Regenerar

```sh
cd art
npm install            # d3-geo, topojson, es-atlas, opentype.js, @resvg/resvg-js, fuentes @fontsource/*
node generate-all.mjs  # todo (≈ 5 s)
```

Por partes:

| Script | Salida |
|---|---|
| `generate-tokens.mjs` | `web/src/styles/tokens.css` + `web/public/fonts/**` (woff2 + OFL.txt) |
| `generate-cards.mjs [modelo…] [--only id1,id2]` | `web/public/art/cards/{modelo}/{cardId}.svg`, `backs/{modelo}.svg`, `cards/manifest.json` |
| `generate-map.mjs` | `web/public/art/map/spain.svg` + `map/centroids.json` |
| `generate-remedios.mjs` | `web/public/art/remedios/{saludo,piensa,sorpresa,rie,bola}.svg` |
| `generate-pendulums.mjs` | `web/public/art/pendulums/*.svg` |
| `generate-misc.mjs` | `frames/*`, `wallpaper.svg`, `stamps/compulsado.svg`, `chests/*`, `diploma-usuario.svg`, `globe.svg`, `og.svg`, `web/public/favicon.svg` |

Vista previa (hoja de contactos PNG): `node tools/render-preview.mjs salida.png 200 6 ruta/a/*.svg`.

## Estructura

- `lib/palette.mjs` paleta única · `lib/fonts.mjs` fuentes · `lib/svg.mjs` utilidades, minificado y **texto a curvas** (opentype.js).
- `lib/theme.mjs` temas por modelo (clases de color) · `lib/figures.mjs` personas, caballo, perro, león…
- `lib/symbols.mjs` palos (tarot y españoles) y escenario · `lib/card.mjs` marcos de carta · `lib/pixel.mjs` modelo pixel.
- `cards/majors*.mjs` 22 arcanos mayores · `cards/minors.mjs` 56 menores + pips de Marsella · `cards/spanish.mjs` baraja española · `cards/backs.mjs` reversos.

Los nombres visibles de las cartas se leen de `content/es/cards/*.json` (incluidos los `cardNames` de Marsella).

## Modelos

| Modelo | Familia | Estado |
|---|---|---|
| `rws` | tarot | completo (78 + reverso) |
| `marsella` | tarot | completo (mayores ilustrados, menores de pips, VIII/XI cambiados, Loco sin numeral) |
| `neon` | tarot | completo (mismas escenas, tema neón con brillo) |
| `gatos` | tarot | completo (todas las figuras con cabeza de gato) |
| `acuarela` | tarot | completo (filtro de acuarela; más costoso de pintar) |
| `pixel` | tarot | completo (rasterizado a 90 columnas, ≈ 46 KB/carta) |
| `castellana` | española | completo (48) |
| `catalana` | española | completo (48, suelo ajedrezado y orlas) |
| `ilustrada` | española | completo (48, figuras con paisaje) |

## Notas para frontend y animación

- **Cartas**: proporción 7:12. Cada SVG lleva `class="m-{modelo}"` y su `<style>` acotado: se puede usar en `<img>` o inline.
- **Mapa**: `<path id="prov-XX" class="prov" data-code data-name data-cx data-cy tabindex="0" role="button">` (52 + recuadro de Canarias).
  Estilos por clase en el `<style>` del SVG (`.prov`, `.prov:hover`, `.prov.selected`); para cambiarlos, inserta el SVG inline
  y sobrescribe. Ceuta y Melilla van ampliadas ×4 con un aro `.marker`. `map/centroids.json` da centros normalizados 0..1 para el péndulo.
- **Péndulos**: viewBox `0 0 200 320`, enganche en `(100, 0)` (`data-anchor="100 0"`), punta abajo hacia y≈296.
- **Cofres**: viewBox `0 0 400 360`. Tapa en `<g id="lid">` con bisagra en `(200, 180)` (`data-pivot`, `transform-origin` ya puesto);
  `<g id="glow" opacity="0">` dentro del cofre para el resplandor al abrir.
- **Marcos**: viewBox `0 0 800 600`; `data-inner="110 100 580 400"` (papel) y `data-text-area` / `<rect id="text-area">` para el texto.
- **Sello**: `stamps/compulsado.svg` (400×400, girado −12°, textura de tinta con filtro).
- **Diploma de usuario**: 1400×1000; huecos `#slot-nombre`, `#slot-titulo`, `#slot-fecha` (atributos `data-slot-*` = centro x, y-base, ancho, alto).
- **Papel pintado**: mosaico 200×200 (`background: url(/art/wallpaper.svg) repeat`).
- **Remedios**: viewBox `0 -60 600 860`, mismo encuadre en las 5 poses → crossfade directo.
