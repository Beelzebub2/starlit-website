#!/bin/sh
# Install an immutable combined release. Run as root on the VPS.
set -eu
base=/opt/starlit-site
archive=${1:?Usage: install-release.sh BUILD_TAR RELEASE_ID}
release=${2:?Release ID required}
case "$release" in *[!a-zA-Z0-9._-]* | '' | '.' | '..') echo 'Invalid release id' >&2; exit 2 ;; esac
test "$(id -u)" -eq 0 || { echo 'Root required' >&2; exit 2; }
test -s "$archive" || { echo 'Missing release archive' >&2; exit 2; }
# Never unpack absolute paths, parent traversal or symlinks as root.
if tar -tzf "$archive" | grep -E '(^/|(^|/)\.\./)' >/dev/null; then
  echo 'Unsafe archive paths' >&2; exit 2
fi
if tar -tvzf "$archive" | grep '^l' >/dev/null; then
  echo 'Refusing symlink entries in release archive' >&2; exit 2
fi
target="$base/releases/$release"
test ! -e "$target" || { echo 'Release already exists; refusing overwrite' >&2; exit 2; }
umask 022
install -d -m 755 "$base/releases" "$target"
tar -xzf "$archive" -C "$target" --no-same-owner --no-same-permissions
for f in index.html _headers account/index.html account/config.js account/_headers; do
  test -s "$target/$f" || { echo "Missing required artifact: $f" >&2; exit 2; }
done
grep -q "script-src 'none'" "$target/_headers" || { echo 'Marketing CSP changed' >&2; exit 2; }
grep -q "script-src 'self'" "$target/account/_headers" || { echo 'Account CSP missing' >&2; exit 2; }
grep -q '"mode": "live"' "$target/account/config.js" || { echo 'Not a live account build' >&2; exit 2; }
grep -q '"basePath": "/account/"' "$target/account/config.js" || { echo 'Wrong account mount path' >&2; exit 2; }
grep -q '"writesEnabled": false' "$target/account/config.js" || { echo 'Account writes may not be enabled' >&2; exit 2; }
test ! -e "$target/account/mock" || { echo 'Mock account code detected' >&2; exit 2; }
python3 - "$target/account/config.js" <<'PY'
import base64, json, re, sys
from pathlib import Path
js=Path(sys.argv[1]).read_text()
match=re.search(r'Object\.freeze\((\{.*\})\);',js,re.S)
if not match: raise SystemExit('Generated account config is not valid')
cfg=json.loads(match.group(1))
parts=cfg.get('anonKey','').split('.')
if len(parts)!=3: raise SystemExit('Invalid public account token')
claims=json.loads(base64.urlsafe_b64decode(parts[1]+'='*(-len(parts[1])%4)))
if claims.get('role')!='anon': raise SystemExit('Service-role/browser credentials are forbidden')
if cfg.get('basePath')!='/account/' or cfg.get('mode')!='live' or cfg.get('writesEnabled') is not False:
    raise SystemExit('Unsafe account build configuration')
PY
find "$target" -type f -exec chmod 644 {} +
find "$target" -type d -exec chmod 755 {} +
ln -s "$release" "$base/releases/.current-$release"
mv -Tf "$base/releases/.current-$release" "$base/releases/current"
echo "Installed combined Starlit VPS release $release (account read-only)"
