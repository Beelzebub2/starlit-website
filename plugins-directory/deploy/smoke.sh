#!/bin/sh
# Run only once a reachable approved staging route exists. Checks actual site.
set -eu
HOST=${1:-https://starlitplugins.rrmtools.uk}
for path in / /pt/ /legal/ /pt/legal/ /catalog.json /assets/site.css /assets/site.js; do
  status=$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' "$HOST$path")
  [ "$status" = 200 ] || { echo "$path returned $status, expected 200" >&2; exit 1; }
done
for path in /does-not-exist /data/catalog.json /_headers; do
  status=$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' "$HOST$path")
  [ "$status" = 404 ] || { echo "$path returned $status, expected 404" >&2; exit 1; }
done
curl -sSI --max-time 10 "$HOST/" | grep -qi "content-security-policy: default-src 'none'"
curl -sS --max-time 10 "$HOST/catalog.json" | grep -q '"repositories"'
echo "Starlit Plugins smoke checks PASS ($HOST)"
