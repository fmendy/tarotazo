#!/usr/bin/env bash
# Tarotazo (arcana) — smoke test tras `docker compose up`.
#   deploy/smoke.sh                               # https://localhost (CA interna, -k)
#   BASE_URL=http://localhost:8080 deploy/smoke.sh  # perfil dev
#   BASE_URL=https://tarotazo.example deploy/smoke.sh
# Variables: BASE_URL, INSECURE (1 = curl -k; por defecto 1 si el host es localhost),
#            COMPOSE_FILES (para la comprobación interna de Actuator), SKIP_INTERNAL=1.
set -u

BASE_URL="${BASE_URL:-https://localhost}"
BASE_URL="${BASE_URL%/}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILES="${COMPOSE_FILES:-$SCRIPT_DIR/docker-compose.yml}"

case "$BASE_URL" in
  *://localhost*|*://127.0.0.1*) INSECURE="${INSECURE:-1}" ;;
  *) INSECURE="${INSECURE:-0}" ;;
esac
CURL=(curl -sS --max-time 15)
[ "$INSECURE" = "1" ] && CURL+=(-k)

pass=0; fail=0
ok()  { printf '  \033[32mOK\033[0m   %s\n' "$1"; pass=$((pass+1)); }
ko()  { printf '  \033[31mFAIL\033[0m %s\n' "$1"; fail=$((fail+1)); }
check() { if eval "$2"; then ok "$1"; else ko "$1"; fi; }

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

# Espera a que el proxy responda (hasta ~90 s).
echo "Esperando a $BASE_URL ..."
for _ in $(seq 1 45); do
  code="$("${CURL[@]}" -o /dev/null -w '%{http_code}' "$BASE_URL/" 2>/dev/null || true)"
  [ "$code" = "200" ] && break
  sleep 2
done

fetch() { # fetch <ruta> <prefijo>  -> $TMP/<prefijo>.{h,b,code}
  "${CURL[@]}" -D "$TMP/$2.h" -o "$TMP/$2.b" -w '%{http_code}' "$BASE_URL$1" >"$TMP/$2.code" 2>/dev/null || echo 000 >"$TMP/$2.code"
}
hdr() { grep -i "^$2:" "$TMP/$1.h" | tail -n1 | cut -d: -f2- | tr -d '\r' | sed 's/^ *//'; }
code() { cat "$TMP/$1.code"; }

echo "== Front (/)"
fetch / root
check "GET / -> 200"                       '[ "$(code root)" = 200 ]'
check "GET / es HTML"                      'hdr root content-type | grep -qi "text/html"'
check "index.html sin caché (no-cache)"    'hdr root cache-control | grep -qi "no-cache"'
check "SPA fallback (/lectura/x -> 200)"   '[ "$("${CURL[@]}" -o /dev/null -w "%{http_code}" "$BASE_URL/lectura/x")" = 200 ]'
check "/assets inexistente -> 404"         '[ "$("${CURL[@]}" -o /dev/null -w "%{http_code}" "$BASE_URL/assets/no-existe.js")" = 404 ]'

asset="$(grep -oE '/assets/[^"]+\.js' "$TMP/root.b" | head -n1)"
if [ -n "$asset" ]; then
  fetch "$asset" asset
  check "asset con hash cacheado (immutable) $asset" 'hdr asset cache-control | grep -qi "immutable"'
fi

echo "== Cabeceras de seguridad (/)"
csp="$(hdr root content-security-policy)"
check "CSP presente"                        '[ -n "$csp" ]'
check "CSP default-src 'self'"             'echo "$csp" | grep -q "default-src '"'"'self'"'"'"'
check "CSP script-src 'self' (sin unsafe)"  'echo "$csp" | grep -q "script-src '"'"'self'"'"';" && ! echo "$csp" | grep -q "script-src[^;]*unsafe"'
check "CSP frame-ancestors 'none'"         'echo "$csp" | grep -q "frame-ancestors '"'"'none'"'"'"'
check "CSP base-uri 'none'"                'echo "$csp" | grep -q "base-uri '"'"'none'"'"'"'
case "$BASE_URL" in https://*)
  check "HSTS"                             'hdr root strict-transport-security | grep -q "max-age="' ;;
esac
check "Referrer-Policy: no-referrer"       '[ "$(hdr root referrer-policy)" = "no-referrer" ]'
check "X-Content-Type-Options: nosniff"    '[ "$(hdr root x-content-type-options)" = "nosniff" ]'
check "Permissions-Policy gyroscope=(self)" 'hdr root permissions-policy | grep -q "gyroscope=(self)"'
check "Permissions-Policy camera=()"       'hdr root permissions-policy | grep -q "camera=()"'
check "Cross-Origin-Opener-Policy"         '[ "$(hdr root cross-origin-opener-policy)" = "same-origin" ]'
check "Sin cabecera Server"                '[ -z "$(hdr root server)" ]'
check "Sin Set-Cookie"                     '[ -z "$(hdr root set-cookie)" ]'

echo "== API"
fetch /api/v1/decks decks
check "GET /api/v1/decks -> 200"           '[ "$(code decks)" = 200 ]'
check "decks es JSON"                      'hdr decks content-type | grep -qi "application/json"'
check "decks contiene tarot"               'grep -q "\"tarot\"" "$TMP/decks.b"'
check "API sin Set-Cookie"                 '[ -z "$(hdr decks set-cookie)" ]'
check "API nosniff"                        '[ "$(hdr decks x-content-type-options)" = "nosniff" ]'
fetch /api/v1/spreads?deck=tarot spreads
check "GET /api/v1/spreads?deck=tarot -> 200" '[ "$(code spreads)" = 200 ]'

echo "== Actuator"
check "/actuator/health NO público (404)"  '[ "$("${CURL[@]}" -o /dev/null -w "%{http_code}" "$BASE_URL/actuator/health")" = 404 ]'
if [ "${SKIP_INTERNAL:-0}" != "1" ] && command -v docker >/dev/null 2>&1; then
  dc=(docker compose); for f in $COMPOSE_FILES; do dc+=(-f "$f"); done
  internal="$("${dc[@]}" exec -T arcana-api wget -q -O - http://127.0.0.1:8080/actuator/health 2>/dev/null || true)"
  check "actuator/health interno UP"       'echo "$internal" | grep -q "\"UP\""'
fi

echo
echo "Resultado: $pass OK, $fail FAIL"
[ "$fail" -eq 0 ]
