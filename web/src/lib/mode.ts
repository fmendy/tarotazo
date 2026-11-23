// ¿Estamos en la app Android sin conexión (VITE_OFFLINE=1) o en la web? Los tests pueden forzarlo.
const BUILD_APP = import.meta.env.VITE_OFFLINE === '1';
let override: boolean | null = null;

export function isApp(): boolean { return override ?? BUILD_APP; }
/** Sólo para pruebas: fuerza (true/false) o libera (null) el modo app. */
export function setAppModeForTests(v: boolean | null) { override = v; }
