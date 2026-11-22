// Lanza el wrapper de Gradle de web/android en Windows, Linux o macOS: node scripts/gradle.mjs assembleDebug
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const android = resolve(dirname(fileURLToPath(import.meta.url)), '../android');
const win = process.platform === 'win32';
const r = spawnSync(win ? 'gradlew.bat' : './gradlew', process.argv.slice(2), { cwd: android, stdio: 'inherit', shell: win });
process.exit(r.status ?? 1);
