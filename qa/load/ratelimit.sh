#!/usr/bin/env bash
# Comprueba el rate-limit por IP (60/min por defecto): 70 peticiones seguidas.
#   BASE_URL=http://localhost:8080 qa/load/ratelimit.sh
#   BASE_URL=https://localhost INSECURE=1 qa/load/ratelimit.sh      # a través de Caddy
set -u
BASE_URL="${BASE_URL:-http://localhost:8080}"
K=""; [ "${INSECURE:-0}" = "1" ] && K="-k"
declare -A codes
retry=""
for i in $(seq 1 70); do
  out=$(curl -s $K -o /dev/null -D - -w 'CODE:%{http_code}' "$BASE_URL/api/v1/decks")
  c=${out##*CODE:}
  codes[$c]=$(( ${codes[$c]:-0} + 1 ))
  if [ "$c" = "429" ] && [ -z "$retry" ]; then retry=$(printf '%s' "$out" | grep -i '^retry-after' | tr -d '\r'); first429=$i; fi
done
for c in "${!codes[@]}"; do echo "HTTP $c: ${codes[$c]}"; done
echo "primer 429 en la petición: ${first429:-ninguna} · ${retry:-sin Retry-After}"
