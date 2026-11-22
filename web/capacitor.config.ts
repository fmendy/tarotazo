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
    SystemBars: {
      insetsHandling: 'css', // inyecta --safe-area-inset-* para WebViews antiguos
    },
  },
};

export default config;
