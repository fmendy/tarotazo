// App Android sin conexión (docs/MOBILE.md). Sirve dist/ desde el propio APK: sin servidor remoto.
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'es.tarotazo.app',
  appName: 'Tarotazo',
  webDir: 'dist',
  // Sin `server.url`: nada se carga de la red. Esquema https local (WebViewAssetLoader).
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  // A-10: sin el registrador de depuración del puente (spam «[object Object]» y avisos de cancelación).
  loggingBehavior: 'none',
  android: {
    allowMixedContent: false,
    captureInput: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false, // se oculta al montar la portada (native.ts → hideSplash)
      backgroundColor: '#140a1f',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#140a1f',
      overlaysWebView: false,
    },
    // A-9: con 'css' el script que inyecta --safe-area-inset-* fallaba («Cannot read properties of null
    // (reading 'style')») porque corre antes de que exista <html>. 'native' (el recomendado) mantiene el
    // manejo de insets sin inyectar CSS: en Chromium ≥ 140 env(safe-area-inset-*) trae los valores reales
    // (viewport-fit=cover en index.html) y en WebViews antiguos Capacitor añade el relleno nativo.
    SystemBars: {
      insetsHandling: 'native',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
