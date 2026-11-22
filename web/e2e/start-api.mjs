// Arranca una instancia APARTE del backend real para las E2E (no toca su código ni su config):
//  - copia el jar empaquetado a un directorio temporal (en Windows un jar en uso queda bloqueado
//    y rompería el `mvnw package` del equipo de backend),
//  - perfil dev (contenido en ../content, arte en ../web/public/art), puerto E2E_API_PORT (8081),
//  - rate-limit elevado vía propiedad `arcana.rate-limit.requests-per-minute` (las E2E de los dos
//    proyectos salen de la misma IP y superarían 60/min). El test `ratelimit (qa/load/ratelimit.sh)` comprueba
//    el 429 contra la instancia por defecto.
// Uso: node e2e/start-api.mjs   (lo lanza playwright.config.ts como webServer)
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const apiDir = resolve(here, '../../api');
const jar = join(apiDir, 'target', 'arcana-api-0.1.0-SNAPSHOT.jar');
if (!existsSync(jar)) {
  console.error(`[e2e] No existe ${jar}. Ejecuta antes: (cd api && ./mvnw -DskipTests package)`);
  process.exit(1);
}
const dir = join(tmpdir(), 'arcana-e2e');
mkdirSync(dir, { recursive: true });
const copy = join(dir, `arcana-api-e2e-${process.pid}.jar`);
copyFileSync(jar, copy);

const port = process.env.E2E_API_PORT ?? '8081';
const rpm = process.env.E2E_RATE_LIMIT ?? '100000';
const child = spawn('java', [
  '-jar', copy,
  '--spring.profiles.active=dev',
  `--server.port=${port}`,
  `--arcana.rate-limit.requests-per-minute=${rpm}`,
], { cwd: apiDir, stdio: 'inherit' });
const stop = () => { try { child.kill(); } catch { /* ya parado */ } };
process.on('SIGINT', stop); process.on('SIGTERM', stop); process.on('exit', stop);
child.on('exit', (code) => process.exit(code ?? 0));
