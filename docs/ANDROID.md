# Tarotazo Android — entorno, compilación y firma

App Android sin conexión hecha con Capacitor 8 (contrato en `docs/MOBILE.md`). Aquí se explica
cómo montar el entorno local, cómo compilar e instalar la app, cómo firmarla y cómo funcionan la CI
y GitHub Pages.

## Versiones (las fija la plantilla de Capacitor 8.6)

| Pieza | Versión | Motivo |
|---|---|---|
| Capacitor (`@capacitor/android`, `/cli`) | 8.6.x | `web/package.json` |
| Android Gradle Plugin | 8.13.0 | Plantilla de Capacitor 8 |
| Gradle (wrapper) | 8.14.3 | Plantilla |
| JDK | **Temurin 21** (21.0.13.1+2) | El módulo `capacitor-android` compila con Java 21. AGP 8.13 no admite JDK 25 como JDK de Gradle. |
| compileSdk / targetSdk | **36** (Android 16) | Plantilla; es el último estable (Google Play exige el targetSdk del año: comprobar en la Play Console) |
| minSdk | 24 (Android 7.0) | Plantilla / `docs/MOBILE.md` |
| SDK: platform-tools, `platforms;android-36`, `build-tools;36.0.0` (y `35.0.0`, la versión por defecto de AGP 8.13), `emulator`, `system-images;android-36;google_apis;x86_64` | — | — |

El backend sigue con Java 25. **No cambies el `JAVA_HOME` global**: Android usa el JDK 21 sólo
dentro de la sesión (`scripts/android-env.ps1`) o con `org.gradle.java.home`.

## 1. Instalación local (Windows, fuera del repo)

Rutas: JDK en `C:\Android\jdk-21`, SDK en `C:\Android\sdk` y descargas en `C:\Android\downloads`.

### 1.1 JDK 21 (Eclipse Temurin, adoptium.net)

```powershell
# Metadatos oficiales (nombre, URL y SHA-256):
#   https://api.adoptium.net/v3/assets/latest/21/hotspot?os=windows&architecture=x64&image_type=jdk&vendor=eclipse
curl.exe -L -o C:\Android\downloads\jdk21.zip https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13.1%2B2/OpenJDK21U-jdk_x64_windows_hotspot_21.0.13.1_2.zip
(Get-FileHash C:\Android\downloads\jdk21.zip -Algorithm SHA256).Hash
#   esperado: BBEBEA1469996B276683C9299C227B294F85C847039C82633218186A4AD4FBF2
Expand-Archive C:\Android\downloads\jdk21.zip C:\Android\tmp; Move-Item C:\Android\tmp\jdk-21* C:\Android\jdk-21
```

### 1.2 Android command-line tools (developer.android.com)

```powershell
# Paquete «cmdline-tools;latest» 23.0 del repositorio oficial de Google
# (https://dl.google.com/android/repository/repository2-3.xml publica el SHA-1;
#  https://developer.android.com/studio#command-line-tools-only publica el SHA-256)
curl.exe -L -o C:\Android\downloads\cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-win-16111833_latest.zip
(Get-FileHash C:\Android\downloads\cmdline-tools.zip -Algorithm SHA1).Hash
#   esperado SHA-1:   57D04F2D75EB8E8FFFC5000A987E5DE4B5A63E9D
#   SHA-256 medido:   E5885E2E59038C0778A85FC19F01DE7CE7C567C105553F7617B936B1E0E87B2B
Expand-Archive C:\Android\downloads\cmdline-tools.zip C:\Android\tmp
New-Item -ItemType Directory -Force C:\Android\sdk\cmdline-tools
Move-Item C:\Android\tmp\cmdline-tools C:\Android\sdk\cmdline-tools\latest   # la carpeta debe llamarse «latest»
```

> En la versión 23 de cmdline-tools, `sdkmanager` avisa de que está obsoleto y remite a
> `android sdk` (Android CLI), pero sigue funcionando. Debajo se usa `sdkmanager`, el comando
> documentado; `android sdk install …` hace lo mismo.

### 1.3 Paquetes del SDK, licencias y AVD

```powershell
. .\scripts\android-env.ps1                    # JAVA_HOME=JDK 21 y ANDROID_HOME sólo para esta sesión
sdkmanager --licenses                          # leer y aceptar las licencias del Android SDK (interactivo)
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" "build-tools;35.0.0" `
           "emulator" "system-images;android-36;google_apis;x86_64"
avdmanager create avd -n arcana-pixel -k "system-images;android-36;google_apis;x86_64" -d pixel_6a
```

`pixel_6a` es el perfil de gama media: 1080×2400 y 420 dpi. Para la RAM del AVD (2 GB es
suficiente), edita `%USERPROFILE%\.android\avd\arcana-pixel.avd\config.ini` y pon `hw.ramSize=2048`.

Variables a nivel de usuario (opcional; no tocan `JAVA_HOME`):

```powershell
[Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Android\sdk', 'User')
```

### 1.4 Aceleración del emulador (WHPX)

Este equipo tiene un AMD Ryzen 5 5600H con la virtualización activada en el firmware. El
hipervisor de Windows ya está activo, porque lo usan Docker Desktop y WSL2 con
`VirtualMachinePlatform`. Por eso no sirve AEHD (el antiguo driver de AMD/Google), que choca con
Hyper-V, y hay que usar **WHPX**.

**Estado actual: la característica «Plataforma del hipervisor de Windows» (`HypervisorPlatform`)
está DESACTIVADA**, así que el emulador no puede acelerar. Para activarla, una vez, desde
PowerShell como administrador, y luego reiniciar:

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName HypervisorPlatform -All
```

Después, para comprobarlo: `emulator -accel-check` debe decir `WHPX(10.0.x) is installed and usable`.

### 1.5 Arrancar el emulador

```powershell
. .\scripts\android-env.ps1
emulator -avd arcana-pixel -netdelay none -netspeed full      # añadir -no-snapshot para arranque limpio
adb devices                                                   # emulator-5554  device
```

Para comprobar que la app no usa la red, arranca con `-no-snapshot -dns-server 0.0.0.0` o pon el
emulador en modo avión. La app debe funcionar igual.

## 2. Compilar e instalar

```powershell
. .\scripts\android-env.ps1
cd web
npm ci
npm run build:app            # Vite con VITE_OFFLINE=1 (motor y contenido locales)
npx cap sync android         # copia dist/ a android/app/src/main/assets/public
cd android
.\gradlew.bat assembleDebug  # -> app\build\outputs\apk\debug\app-debug.apk
adb install -r app\build\outputs\apk\debug\app-debug.apk
adb shell monkey -p es.tarotazo.app -c android.intent.category.LAUNCHER 1   # abrir
```

También sirve `npm run android:debug` (usa `scripts/gradle.mjs` del frontend).

Para depurar el WebView, abre `chrome://inspect` en Chrome con el emulador o el móvil conectado.

Para comprobar que el APK no pide INTERNET:

```powershell
& "$env:ANDROID_HOME\build-tools\36.0.0\aapt2.exe" dump permissions app\build\outputs\apk\debug\app-debug.apk
```

Si no se quiere usar `scripts/android-env.ps1`, se puede fijar el JDK sólo para Gradle en
`web/android/gradle.properties` (lo gestiona el frontend), o mejor en la configuración del usuario
`%USERPROFILE%\.gradle\gradle.properties`, que no se versiona:

```properties
org.gradle.java.home=C:\\Android\\jdk-21
```

## 3. Firma y publicación en Google Play

- **Play App Signing**: la clave que firma la app que reciben los usuarios la genera y custodia
  Google. El titular sólo tiene una **clave de subida** (*upload key*) para firmar los AAB que sube.
  Si la pierde, se puede restablecer desde Play Console.
- La clave de subida la crea **el titular**, en su equipo y fuera del repo. No se ha generado ninguna
  clave en este proyecto:

  ```powershell
  & C:\Android\jdk-21\bin\keytool.exe -genkeypair -v -keystore $HOME\keys\tarotazo-upload.jks `
      -storetype PKCS12 -alias upload -keyalg RSA -keysize 4096 -validity 9125 `
      -dname "CN=Tarotazo, O=<titular>, C=ES"
  ```

  Guarda el `.jks` y las contraseñas en un gestor de contraseñas y haz copia fuera de línea.
  **Nunca lo subas al repositorio.**
- Firma local (sin tocar `build.gradle`; AGP admite la firma inyectada):

  ```powershell
  .\gradlew.bat bundleRelease `
    "-Pandroid.injected.signing.store.file=$HOME\keys\tarotazo-upload.jks" `
    "-Pandroid.injected.signing.store.password=<…>" `
    "-Pandroid.injected.signing.key.alias=upload" `
    "-Pandroid.injected.signing.key.password=<…>"
  # -> app\build\outputs\bundle\release\app-release.aab
  ```

- Cada versión subida necesita un `versionCode` mayor que el anterior, también cuando sólo cambia el
  contenido (`web/android/app/build.gradle`).
- En el formulario «Seguridad de los datos» de Play: la app no recoge ni comparte datos.

## 4. CI (`.github/workflows/android.yml`)

| Disparador | Job | Resultado |
|---|---|---|
| push a `main` o PR que toquen `web/`, `content/` o `art/` | `debug` | `npm ci`, `npm run build:app`, `npx cap sync android`, `./gradlew assembleDebug`, aviso si el APK declara `INTERNET`, artefacto **tarotazo-debug-apk** |
| `workflow_dispatch` o tag `v*` | `release` (entorno `android-release`) | `bundleRelease` firmado con la clave de subida, verificación con `jarsigner`, artefacto **tarotazo-release-aab** |

Las dos usan JDK 21 (Temurin) y el SDK que trae el runner `ubuntu-latest`; AGP descarga
`platforms;android-36` y `build-tools` si faltan.

Secretos del release, en el entorno `android-release`. Aquí no hay valores:

| Secreto | Contenido |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | el `.jks` de subida en base64 (`[Convert]::ToBase64String([IO.File]::ReadAllBytes('tarotazo-upload.jks'))` o `base64 -w0`) |
| `ANDROID_KEYSTORE_PASSWORD` | contraseña del keystore |
| `ANDROID_KEY_ALIAS` | alias (p. ej. `upload`) |
| `ANDROID_KEY_PASSWORD` | contraseña de la clave |

Conviene poner revisores obligatorios en el entorno `android-release`.

## 5. Política de privacidad en GitHub Pages (`.github/workflows/pages.yml`)

Google Play exige una URL pública con la política de privacidad. El workflow publica
`web/public/legal/` (lo mantiene el frontend) en:

**https://fmendy.github.io/tarotazo/legal/privacidad.html**

Hay que activarlo una vez: en el repo, **Settings → Pages → Build and deployment → Source:
«GitHub Actions»**. Se ejecuta en cada push a `main` que toque `web/public/legal/`, o a mano con
*Run workflow*. Si falta `privacidad.html`, falla. La raíz del sitio redirige a la política.
