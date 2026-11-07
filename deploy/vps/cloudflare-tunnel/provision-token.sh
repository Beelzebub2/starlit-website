#!/usr/bin/env bash
# Read one Cloudflare remotely-managed tunnel token from stdin, without shell
# history or process args. Do not print the token or commit it to Git.
set -euo pipefail
TOKEN_DIR=/etc/starlit/cloudflare
TOKEN_FILE=$TOKEN_DIR/starlit-tunnel.token

if [ "$(id -u)" != 0 ]; then
  echo 'Run as root on the VPS.' >&2
  exit 2
fi
if [ -t 0 ]; then
  echo 'Pipe the token through stdin; do not pass it as an argument.' >&2
  exit 2
fi
if [ -e "$TOKEN_FILE" ]; then
  echo 'Starlit token already provisioned. Refusing to overwrite or rotate it.' >&2
  exit 3
fi

umask 077
install -d -m 0700 -o root -g root "$TOKEN_DIR"
tmp="$(mktemp "$TOKEN_DIR/.starlit-token.XXXXXXXX")"
trap 'rm -f "$tmp"' EXIT
cat > "$tmp"
python3 - "$tmp" <<'PY'
from pathlib import Path
import re, sys
p = Path(sys.argv[1])
token = p.read_text(encoding='ascii').strip()
if not re.fullmatch(r'[A-Za-z0-9._+/=-]{80,8192}', token):
    raise SystemExit('Invalid tunnel-token format; nothing installed.')
p.write_text(token + '\n', encoding='ascii')
PY
chown 0:65532 "$tmp"
chmod 0640 "$tmp"
mv -T "$tmp" "$TOKEN_FILE"
trap - EXIT
echo 'Cloudflare Tunnel token securely provisioned; its contents were not printed.'
