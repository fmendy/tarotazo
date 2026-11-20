// Regenera todo el arte de Tarotazo: node art/generate-all.mjs
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
for (const s of ['generate-tokens.mjs', 'generate-cards.mjs', 'generate-map.mjs', 'generate-remedios.mjs', 'generate-pendulums.mjs', 'generate-misc.mjs']) {
  console.log(`\n▶ ${s}`);
  execFileSync(process.execPath, [path.join(HERE, s)], { stdio: 'inherit', cwd: HERE });
}
