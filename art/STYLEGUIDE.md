# Tarotazo · Guía de estilo

**Gabinete de vidente de barrio**: terciopelo morado, dorados de mercadillo, velas, humo y papel
pintado barroco. Kitsch pero entrañable: nada da miedo; todo guiña un ojo. La vidente, **Madame Remedios**,
tiene más diplomas que aciertos.

Fuente de verdad de los valores: `art/lib/palette.mjs` → genera `web/src/styles/tokens.css`
(`node art/generate-tokens.mjs`). No edites tokens.css a mano.

## 1. Color (`--c-*`)

| Token | Valor | Uso |
|---|---|---|
| `--c-bg` | `#140a1f` | Fondo de página (noche morada) |
| `--c-bg2` | `#1e0f2e` | Capa elevada |
| `--c-velvet` / `--c-velvet2` / `--c-plum` | `#3b1450` / `#5a1f72` / `#2a0f3a` | Terciopelo: paneles, tarjetas, sombras |
| `--c-gold` / `--c-gold-light` / `--c-gold-dark` / `--c-brass` | `#d4a24c` / `#f0cf7a` / `#8a6420` / `#b8893a` | Bordes, iconos, títulos, botones |
| `--c-ink` / `--c-ink-muted` | `#f4e9d8` / `#cdbca9` | Texto sobre oscuro |
| `--c-paper` / `--c-paper2` | `#f3e6c8` / `#e7d3a8` | Pergamino (diplomas, bocadillos) |
| `--c-paper-ink` / `--c-paper-ink-muted` | `#2b1a12` / `#5e4630` | Texto sobre papel |
| `--c-accent` | `#8e3b8f` | Magenta vidente (relleno, no texto pequeño) |
| `--c-accent-text` | `#e59ae0` | Magenta legible sobre oscuro |
| `--c-crimson` `--c-ember` `--c-candle` `--c-flame` | | Lacre, brasas, velas |
| `--c-teal` / `--c-teal-light` | `#2f8f83` / `#7fd1c4` | Bola de cristal, «magia» |
| `--c-ok` `--c-warn` `--c-danger` | | Estados |
| `--c-line` | `#24140f` | Línea de grabado de las ilustraciones |

Alias semánticos: `--c-surface`, `--c-surface-2`, `--c-text`, `--c-text-muted`, `--c-link`, `--c-focus`, `--c-border`.
Degradados: `--g-velvet`, `--g-gold`, `--g-candle`, `--g-paper`.

### Contraste (WCAG AA ≥ 4.5 texto normal)
| Texto / fondo | Ratio |
|---|---|
| ink / bg | 16.0 |
| ink / velvet | 12.5 |
| ink-muted / bg | 10.4 |
| ink-muted / velvet | 8.1 |
| gold / bg | 8.3 |
| gold-light / velvet | 9.9 |
| accent-text / bg | 9.2 |
| paper-ink / paper | 13.5 |
| paper-ink-muted / paper | 7.1 |
| bg / gold (botón dorado) | 8.3 |
| crimson / paper | 6.0 |
| danger / bg | 7.6 |

Reglas: **nunca** `--c-accent` ni `--c-gold-dark` como color de texto sobre `--c-bg`. Sobre dorado, texto `--c-bg`.

## 2. Tipografía (`--f-*`) — todas OFL, autoalojadas en `/fonts`

| Token | Familia | Uso |
|---|---|---|
| `--f-display` | Cinzel Decorative 700/900 | Logotipo, títulos grandes (≥ 28 px) |
| `--f-title` | Cinzel 400/700 | Títulos de sección, nombres de cartas, botones en mayúsculas |
| `--f-body` | Alegreya 400/700 + cursiva | Texto corrido, lecturas de la vidente |
| `--f-hand` | Caveat 500/700 | Notas manuscritas, firma, comentarios al margen |
| `--f-poster` | Rye 400 | Toque «teletienda/feria» (rótulos, sello) — con mesura |

Escala: `--fs-xs … --fs-3xl` (13 → 68 px), `--lh-tight` 1.15, `--lh-body` 1.55, `--ls-caps` 0.08em para versalitas.
Todas cubren el castellano (latín + latín extendido con `unicode-range`).

## 3. Espacio, radios, sombras
- Espaciado (escala 4 px): `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 24 · `--s-6` 32 · `--s-7` 48 · `--s-8` 64 · `--s-9` 96.
- Radios: `--r-xs` 3 · `--r-sm` 6 · `--r-md` 12 · `--r-lg` 20 · `--r-xl` 32 · `--r-pill` · `--r-round` · `--r-card` 4.2 % (≈ esquina de las cartas).
- Sombras: `--shadow-sm|md|lg`, `--shadow-card` (canto dorado + caída), `--shadow-inset`, `--shadow-text`.
- Brillos: `--glow-gold`, `--glow-candle`, `--glow-magic`, `--glow-teal`, `--glow-text`; `--filter-glow` (drop-shadow para hover del mapa y marcos).
- Movimiento: `--ease-out`, `--ease-spring`, `--t-fast|med|slow` (a 0 con `prefers-reduced-motion`).

## 4. Ilustración
- **Estilo «grabado coloreado»**: contorno de tinta `#24140f` de grosor constante (4,5 px en viewBox 700×1200), colores planos,
  sombras mínimas. Figuras de frente, cabeza grande (≈ 6 cabezas), carita amable con mofletes.
- Todo es **SVG generado por código** (`art/lib`), sin copiar barajas concretas: la iconografía tradicional (RWS, Marsella,
  española) se redibuja con las primitivas propias (`person`, `horse`, `cup`, `wand`, `sword`, `pentacle`, `oroES`…).
- Las cartas usan **clases de color** (`.r`, `.b`, `.gn`, `.s`…) con CSS acotado a la clase raíz `m-{modelo}`; cada modelo
  es un tema (`art/lib/theme.mjs`). Así se pueden insertar inline varias cartas sin choques.
- Las cartas no dependen de fuentes: los rótulos van convertidos a curvas.
- Legibilidad mínima: 120 px de ancho (comprobado con resvg).

### Cartas (viewBox `0 0 700 1200`)
- Tarot: banda superior con numeral romano, panel ilustrado `48,128 → 652,1032` (radio 12), banda inferior con nombre.
  Marsella: bandas con fondo, nombre en versalitas, menores de pips sin nombre, VIII = Justicia / XI = Fuerza, El Loco sin numeral.
- Española: marco con **pintas** (cortes en el filete superior/inferior: oros 0, copas 1, espadas 2, bastos 3)
  e índices en las cuatro esquinas (sota 10, caballo 11, rey 12).
- Reversos: simétricos por giro de 180° (no delatan una carta invertida).

## 5. Madame Remedios
Turbante morado con broche de rubí y pluma verde azulado, aros dorados enormes, gafas de media luna con cordón,
chal fucsia con estrellitas y flecos, lunar junto a la boca, labios rojos, rizos oscuros asomando.
Poses: `saludo`, `piensa`, `sorpresa` (gafas resbalando), `rie` (lagrimita), `bola` (con mesa y bola de cristal).
viewBox `0 -60 600 860`, fondo transparente, mismo encuadre en todas (se pueden fundir).

## 6. Tono visual
Generoso con el dorado, nunca con el negro puro. Brillos cálidos (velas), nada de rojos sangre ni calaveras realistas
(La Muerte es un esqueleto simpático; el 10 de Espadas, una siesta al amanecer).
