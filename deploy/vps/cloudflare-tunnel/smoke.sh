#!/usr/bin/env bash
# Verify the private Caddy listener BEFORE cutover, without changing DNS.
set -euo pipefail
EDGE=tokview-ntfy-https
NETWORK=rrm-ntfy_tokview-push
HOST=starlit.rrmtools.uk
ip="$(docker inspect "$EDGE" --format "{{with index .NetworkSettings.Networks \"$NETWORK\"}}{{.IPAddress}}{{end}}")"
if [[ ! "$ip" =~ ^[0-9.]+$ ]]; then
  echo 'Cannot identify the existing internal Caddy edge.' >&2
  exit 2
fi
assert_code() {
  local expected="$1" host="$2" path="$3" result
  result="$(curl -sS --max-time 6 -o /dev/null -w '%{http_code}' -H "Host: $host" "http://$ip:8088$path")"
  printf 'Origin HTTP %s %s => %s\n' "$host" "$path" "$result"
  test "$result" = "$expected"
}
assert_code 200 "$HOST" /
assert_code 200 "$HOST" /pt/
assert_code 200 "$HOST" '/account?tab=plugins'
assert_code 200 "$HOST" '/account?tab=library'
assert_code 200 "$HOST" /account/app.js
assert_code 200 starlit-tunnel-stage.rrmtools.uk '/account?tab=overview'
assert_code 404 "$HOST" /account/_headers
assert_code 404 "$HOST" /account/mock/transport.js
assert_code 404 "$HOST" /.env
assert_code 404 "$HOST" /nonexistent-page
assert_code 404 evil.invalid /
curl -sSI --max-time 6 -H "Host: $HOST" "http://$ip:8088/account?tab=plugins" | grep -qi "script-src 'self'"
curl -sSI --max-time 6 -H "Host: $HOST" "http://$ip:8088/" | grep -qi "script-src 'none'"
curl -sSI --max-time 6 -H "Host: $HOST" "http://$ip:8088/account?tab=plugins" | grep -qi 'no-store'
echo 'Cloudflare Tunnel private-origin security checks passed.'
