// Contenido base (estructura neutra + es) en UN chunk: se importa dinámicamente desde loader.ts, así que la web
// normal no lo descarga y la app lo carga una vez. Los esquemas y las herramientas no se incluyen.
import { normalizeGlob } from '../content';

const files = import.meta.glob(
  [
    '../../../../content/decks/*.json',
    '../../../../content/spreads.json',
    '../../../../content/provinces.json',
    '../../../../content/es/**/*.json',
  ],
  { eager: true, import: 'default' },
);

export default normalizeGlob(files);
