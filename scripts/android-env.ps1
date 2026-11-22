# Tarotazo — entorno Android SOLO para la sesión actual de PowerShell.
# No toca el JAVA_HOME global (el backend usa Java 25); Android/Gradle usan JDK 21.
#   . .\scripts\android-env.ps1          (con el punto delante, para que se quede en la sesión)
# Rutas por defecto; se pueden cambiar con $env:ARCANA_ANDROID_SDK / $env:ARCANA_ANDROID_JDK.

$sdk = if ($env:ARCANA_ANDROID_SDK) { $env:ARCANA_ANDROID_SDK } else { 'C:\Android\sdk' }
$jdk = if ($env:ARCANA_ANDROID_JDK) { $env:ARCANA_ANDROID_JDK } else { 'C:\Android\jdk-21' }

if (-not (Test-Path "$jdk\bin\java.exe")) { Write-Warning "No existe $jdk\bin\java.exe (ver docs/ANDROID.md)" }
if (-not (Test-Path "$sdk\cmdline-tools\latest")) { Write-Warning "No existe $sdk\cmdline-tools\latest (ver docs/ANDROID.md)" }

$env:ANDROID_HOME     = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:JAVA_HOME        = $jdk
$env:Path = @(
  "$jdk\bin",
  "$sdk\cmdline-tools\latest\bin",
  "$sdk\platform-tools",
  "$sdk\emulator"
) -join ';' | ForEach-Object { "$_;$env:Path" }

Write-Host "ANDROID_HOME=$sdk  JAVA_HOME=$jdk (sólo esta sesión)"
