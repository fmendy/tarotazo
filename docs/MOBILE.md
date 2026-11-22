# Arcana móvil — app Android sin conexión (contrato del jefe de proyecto)

Objetivo: la misma experiencia de la web en una app Android que **no se conecta a ningún servidor**.
Todo (contenido, arte, motor narrativo, sorteo, péndulo) va dentro del APK/AAB. Se reutiliza la web
empaquetada con **Capacitor**. La web sigue funcionando como hasta ahora (con API); el modo
sin conexión se activa en compilación con `VITE_OFFLINE=1`.

- `applicationId`: **`es.tarotazo.app`** (definitivo). Nombre visible: **Tarotazo**.
- minSdk 24 (Android 7) o el mínimo que exija Capacitor; targetSdk el último estable exigido por Google Play.
- Orientación: vertical en móvil; en tableta, libre.
- **Sin permiso `INTERNET`** en el manifiesto final si Capacitor sirve los assets locales sin él
  (verificarlo en el emulador). Si no es posible, documentar por qué y asegurar que no hay ninguna
  petición de red (CSP `connect-src 'self'` / sin `fetch` externo).
- Sin analítica, sin anuncios, sin SDKs de terceros. Formulario «Seguridad de los datos» de Play: no se recoge ni comparte nada.

## Propiedad de directorios (además de `docs/CONTRACTS.md` §0)
| Equipo | Directorios |
|---|---|
| Backend (motor portado) | `web/src/engine/`, `content/es/server-labels.json`, `content/schemas/server-labels.schema.json` (+ enganche en `content/tools/validate.mjs`) |
| Frontend | resto de `web/` incluido `web/capacitor.config.ts`, `web/android/`, `web/src/lib/api.ts`, `web/public/legal/` |
| Animación | `web/src/fx/`, `web/src/pendulum/` (sólo si hay que ajustar algo para Android) |
| Diseño gráfico | `art/`, `web/resources/` (fuentes de icono y splash para `@capacitor/assets`), `store/graphics/` |
| Escritor | `store/listing/` (ficha de Play en castellano) |
| DevOps | instalación del SDK fuera del repo, `.github/workflows/android.yml`, `.github/workflows/pages.yml`, `docs/ANDROID.md` |
| QA | `web/e2e/`, `qa/` |

## Motor local (`web/src/engine/`)
Port a TypeScript **fiel** de los módulos `reading`, `narrative`, `pendulum` y la parte necesaria de
`content` del backend Java (`api/src/main/java/es/arcana/...`). Puro TS, sin DOM.

```ts
// web/src/engine/index.ts
export interface ArcanaApi {           // mismas formas que docs/CONTRACTS.md §6
  getDecks(lang: string): Promise<Deck[]>;
  getSpreads(lang: string, deck?: string): Promise<Spread[]>;
  getProvinces(lang: string): Promise<Province[]>;
  getTitles(lang: string): Promise<TitlesFile>;
  getOnboarding(lang: string): Promise<Onboarding>;
  getPendulumContent(lang: string, provincia?: string): Promise<PendulumContent>;
  createReading(req: ReadingRequest, lang: string): Promise<ReadingResponse>;
  nextLine(req: NextLineRequest, lang: string): Promise<{ text: string }>;
  pendulumAnswer(req: PendulumRequest, lang: string): Promise<PendulumResponse>;
}
export function createLocalApi(opts?: { random?: () => number }): ArcanaApi;
```
- Contenido: cargado con `import.meta.glob` desde `content/` (JSON), perezoso por idioma, con
  fallback a `es` igual que el backend. Las etiquetas de servidor (`arcana-defaults/es.json`) pasan a
  `content/es/server-labels.json` para que ambos lados usen la misma fuente.
- Cartas y orientación: `crypto.getRandomValues`. Textos: PRNG determinista con `toneSeed` como en Java.
- Los tipos los define el frontend en `web/src/lib/types.ts`; el motor los importa de ahí.
- Tests vitest portados de los tests Java + prueba masiva (200 lecturas, todas las tiradas y barajas:
  sin variables de servidor sin resolver, sin `[a|b]`, sin fragmentos repetidos, tonos con los pesos del §1).

## Frontend
- `src/lib/api.ts` usa el motor local si `import.meta.env.VITE_OFFLINE === '1'` (import dinámico, para
  que la web normal no cargue el motor ni el contenido).
- Scripts: `build:app` (`VITE_OFFLINE=1`), `cap:sync`, `android:debug`, `android:release`.
- Plugins Capacitor permitidos (oficiales): `@capacitor/app` (botón atrás, pausa → inactividad),
  `@capacitor/filesystem` + `@capacitor/share` (imagen y diploma), `@capacitor/haptics`,
  `@capacitor/splash-screen`, `@capacitor/status-bar`. Nada más sin pasar por el jefe de proyecto.
- Áreas seguras (notch), botón atrás de Android con la navegación por estado, teclado en pantalla,
  pausa/reanudación del audio y del péndulo, giroscopio (DeviceOrientation en WebView).
- Textos legales: variante «app» de la política de privacidad (sin servidor, sin IP). Páginas
  estáticas en `web/public/legal/` para publicarlas en GitHub Pages (URL exigida por Google Play).
- Cada cambio de contenido requiere nueva versión de la app (`versionCode` incremental).
