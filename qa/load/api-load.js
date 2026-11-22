// Prueba de carga del API de Tarotazo con k6 (grafana/k6 vía Docker). Ver qa/load/README.md.
//
//   docker run --rm -i -v "$PWD/qa/load:/scripts" -e BASE_URL=http://host.docker.internal:8082 \
//     grafana/k6:1.4.2 run --summary-export=/scripts/summary.json /scripts/api-load.js
//
// La instancia de backend debe arrancarse APARTE con el rate‑limit desactivado o elevado
// (propiedades `arcana.rate-limit.enabled=false` o `arcana.rate-limit.requests-per-minute=N`);
// si no, a partir de 60 peticiones/min desde la misma IP casi todo será 429.
import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const BASE = __ENV.BASE_URL || 'http://host.docker.internal:8082';
const RPS_READINGS = Number(__ENV.RPS_READINGS || 150);
const RPS_DECKS = Number(__ENV.RPS_DECKS || 150);
const DURATION = __ENV.DURATION || '60s';

const tReadings = new Trend('t_readings', true);
const tDecks = new Trend('t_decks', true);
const errs = new Counter('errors_by_status');

export const options = {
  discardResponseBodies: false,
  scenarios: {
    warmup: { executor: 'constant-vus', vus: 5, duration: '10s', exec: 'mixed', tags: { phase: 'warmup' } },
    readings: {
      executor: 'constant-arrival-rate', rate: RPS_READINGS, timeUnit: '1s', duration: DURATION,
      preAllocatedVUs: 50, maxVUs: 400, exec: 'readings', startTime: '12s', tags: { phase: 'load' },
    },
    decks: {
      executor: 'constant-arrival-rate', rate: RPS_DECKS, timeUnit: '1s', duration: DURATION,
      preAllocatedVUs: 30, maxVUs: 300, exec: 'decks', startTime: '12s', tags: { phase: 'load' },
    },
    spike: {
      executor: 'ramping-arrival-rate', startRate: 50, timeUnit: '1s', preAllocatedVUs: 100, maxVUs: 800,
      stages: [{ target: 600, duration: '20s' }, { target: 600, duration: '20s' }, { target: 0, duration: '5s' }],
      exec: 'readings', startTime: `${12 + parseInt(DURATION, 10) + 5}s`, tags: { phase: 'spike' },
    },
  },
  thresholds: {
    'http_req_failed{phase:load}': ['rate<0.01'],
    't_readings{phase:load}': ['p(95)<300', 'p(99)<800'],
    't_decks{phase:load}': ['p(95)<100', 'p(99)<300'],
  },
  summaryTrendStats: ['min', 'med', 'avg', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const SPREADS = { tarot: [['dia', 1], ['ppf', 3], ['cruz', 5], ['herradura', 7], ['celta', 10], ['amor', 6]], spanish: [['dia', 1], ['ppf', 3], ['cruz', 5], ['herradura', 7], ['amor', 6]] };
const MODELS = { tarot: ['rws', 'marsella', 'neon', 'acuarela', 'pixel', 'gatos'], spanish: ['castellana', 'catalana', 'ilustrada'] };
const SIZES = { castellana: 40, catalana: 48, ilustrada: 40 };
const SIGNOS = ['aries', 'tauro', 'geminis', 'cancer', 'leo', 'virgo', 'libra', 'escorpio', 'sagitario', 'capricornio', 'acuario', 'piscis'];
const TEMAS = ['general', 'amor', 'trabajo', 'dinero', 'salud'];
const r = (n) => Math.floor(Math.random() * n);
const one = (a) => a[r(a.length)];

function readingBody() {
  const deck = Math.random() < 0.6 ? 'tarot' : 'spanish';
  const model = one(MODELS[deck]);
  const [spread, size] = one(SPREADS[deck]);
  const deckSize = deck === 'tarot' ? 78 : SIZES[model];
  const picks = new Set();
  while (picks.size < size) picks.add(r(deckSize));
  const code = String(1 + r(52)).padStart(2, '0');
  return JSON.stringify({
    deck, model, spread, cutIndex: r(3), picks: [...picks],
    context: { signo: one(SIGNOS), decada: 10 * (2 + r(7)), numeroVida: 1 + r(9), provincia: code, tema: one(TEMAS), toneSeed: r(2 ** 31), hora: r(24), diaSemana: 1 + r(7), lang: 'es' },
    recentFragmentIds: [],
  });
}

export function readings() {
  const res = http.post(`${BASE}/api/v1/readings`, readingBody(), { headers: { 'Content-Type': 'application/json', 'Accept-Language': 'es' }, tags: { name: 'POST /readings' } });
  tReadings.add(res.timings.duration);
  if (res.status !== 200) errs.add(1, { status: String(res.status) });
  check(res, { 'readings 200': (x) => x.status === 200, 'readings tiene cartas': (x) => x.status === 200 && (x.json('cards') || []).length > 0 });
}

export function decks() {
  const res = http.get(`${BASE}/api/v1/decks`, { headers: { 'Accept-Language': 'es' }, tags: { name: 'GET /decks' } });
  tDecks.add(res.timings.duration);
  if (res.status !== 200) errs.add(1, { status: String(res.status) });
  check(res, { 'decks 200': (x) => x.status === 200 });
}

export function mixed() { if (Math.random() < 0.5) readings(); else decks(); }
