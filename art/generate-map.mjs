// Mapa de provincias de España (es-atlas · datos IGN/CNIG, CC BY 4.0) → web/public/art/map/spain.svg
// Cada provincia: <path id="prov-XX" data-code="XX" data-name="…" class="prov">. Canarias en recuadro.
// Ceuta y Melilla se dibujan ampliadas ×4 (si no, no se podrían pulsar) con un aro marcador.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { geoConicConformal, geoMercator, geoPath, geoCentroid } from 'd3-geo';
import * as topojson from 'topojson-client';
import { presimplify, simplify, quantile } from 'topojson-simplify';
import { writeSvg, roundNums, esc } from './lib/svg.mjs';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const topo0 = JSON.parse(fs.readFileSync(require.resolve('es-atlas/es/provinces.json'), 'utf8'));
let names = {};
try { for (const p of JSON.parse(fs.readFileSync(path.join(ROOT, 'content/provinces.json'), 'utf8')).provinces) names[p.code] = p.nombre; } catch {}

const topo = simplify(presimplify(topo0), quantile(presimplify(topo0), 0.35));
const all = topojson.feature(topo, topo.objects.provinces).features.filter((f) => f.id !== '54');
const isCan = (f) => f.id === '35' || f.id === '38';
const main = all.filter((f) => !isCan(f));
const can = all.filter(isCan);

const W = 1000, H = 820;
const projMain = geoConicConformal().rotate([3.6, 0]).parallels([36, 43]);
projMain.fitExtent([[20, 20], [W - 20, H - 20]], { type: 'FeatureCollection', features: main });
const inset = { x: W - 350, y: H - 210, w: 330, h: 185 };
const projCan = geoMercator().fitExtent([[inset.x + 12, inset.y + 12], [inset.x + inset.w - 12, inset.y + inset.h - 12]], { type: 'FeatureCollection', features: can });

const clean = (d) => roundNums(d.replace(/(\d+\.\d)\d+/g, '$1')).replace(/,/g, ' ').replace(/ ?([MLZ]) ?/g, '$1').replace(/ -/g, '-');
const pathMain = geoPath(projMain), pathCan = geoPath(projCan);

function magnified(f, k = 4) {
  const [cx, cy] = projMain(geoCentroid(f));
  // aplicamos el aumento sobre coordenadas ya proyectadas
  const p2 = geoPath().projection({ stream: (s) => { const inner = projMain.stream({ point: (x, y) => s.point(cx + (x - cx) * k, cy + (y - cy) * k), lineStart: () => s.lineStart(), lineEnd: () => s.lineEnd(), polygonStart: () => s.polygonStart(), polygonEnd: () => s.polygonEnd(), sphere: () => s.sphere() }); return inner; } });
  return { d: p2(f), cx, cy };
}

const items = [];
const markers = [];
for (const f of all) {
  const code = f.id;
  const name = names[code] ?? f.properties.name;
  let d;
  if (isCan(f)) d = pathCan(f);
  else if (code === '51' || code === '52') {
    const m = magnified(f, 4);
    d = m.d;
    markers.push(`<circle class="marker" cx="${m.cx.toFixed(1)}" cy="${m.cy.toFixed(1)}" r="16"/>`);
  } else d = pathMain(f);
  const [lx, ly] = isCan(f) ? pathCan.centroid(f) : code === '51' || code === '52' ? projMain(geoCentroid(f)) : pathMain.centroid(f);
  items.push({ code, name, d: clean(d), lx, ly });
}
items.sort((a, b) => a.code.localeCompare(b.code));

// fronteras de comunidades autónomas (malla interior, decorativa)
const ccaaMesh = topojson.mesh(topo, topo.objects.autonomous_regions, (a, b) => a !== b);
const meshD = clean(pathMain(ccaaMesh));

const style = `.prov{fill:#3b1450;stroke:#d4a24c;stroke-width:.8;stroke-linejoin:round;cursor:pointer;transition:fill .2s,filter .2s}.prov:hover,.prov:focus{fill:#5a1f72;outline:none}.prov.selected{fill:#d4a24c;stroke:#f0cf7a}.ccaa{fill:none;stroke:#f0cf7a;stroke-width:1.6;opacity:.55;pointer-events:none}.inset-frame{fill:none;stroke:#d4a24c;stroke-width:1.5;stroke-dasharray:6 4;pointer-events:none}.marker{fill:none;stroke:#f0cf7a;stroke-width:1.5;stroke-dasharray:3 3;pointer-events:none}.inset-label{fill:#f0cf7a;font:600 14px Cinzel,Georgia,serif;pointer-events:none}`;
const body = [
  `<g class="provinces">`,
  ...items.map((p) => `<path id="prov-${p.code}" class="prov" data-code="${p.code}" data-name="${esc(p.name)}" data-cx="${p.lx.toFixed(1)}" data-cy="${p.ly.toFixed(1)}" tabindex="0" role="button" aria-label="${esc(p.name)}" d="${p.d}"><title>${esc(p.name)}</title></path>`),
  `</g>`,
  `<path class="ccaa" d="${meshD}"/>`,
  `<g class="markers">${markers.join('')}</g>`,
  `<rect class="inset-frame" x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" rx="8"/>`,
  `<text class="inset-label" x="${inset.x + inset.w - 12}" y="${inset.y + 22}" text-anchor="end">Islas Canarias</text>`,
].join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="group" aria-label="Mapa de provincias de España">
<!-- Datos: es-atlas (Martín González, MIT) a partir de cartografía del IGN/CNIG (CC BY 4.0). Simplificado para Tarotazo. -->
<style>${style}</style>
${body}
</svg>
`;
const out = path.join(ROOT, 'web/public/art/map/spain.svg');
const n = writeSvg(out, svg);
// también un JSON con centroides normalizados (0..1) para el péndulo en modo mapa
const centroids = Object.fromEntries(items.map((p) => [p.code, { name: p.name, x: +(p.lx / W).toFixed(4), y: +(p.ly / H).toFixed(4) }]));
writeSvg(path.join(ROOT, 'web/public/art/map/centroids.json'), JSON.stringify(centroids, null, 2) + '\n');
console.log(`map: ${items.length} provincias, ${(n / 1024).toFixed(0)} KB`);
