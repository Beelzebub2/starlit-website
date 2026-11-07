#!/bin/sh
# Install a prebuilt LIVE account/dist tar on the VPS, without replacing the
# existing release until the bundle is validated. Run as root on the VPS.
set -eu
base=/opt/starlit-account
archive=${1:?Usage: install-release.sh /root/starlit-account-live.tar.gz RELEASE_ID}
release=${2:?Release ID required}
case "$release" in *[!a-zA-Z0-9._-]* | '' | '.' | '..') echo 'Invalid release id' >&2; exit 2 ;; esac
test "$(id -u)" -eq 0 || { echo 'Root required to install immutable release' >&2; exit 2; }
test -f "$archive" || { echo 'Release archive not found' >&2; exit 2; }
umask 022
install -d -m 755 "$base/releases"
target="$base/releases/$release"
test ! -e "$target" || { echo 'Release already exists; refusing to overwrite' >&2; exit 2; }
install -d -m 755 "$target"
tar -xzf "$archive" -C "$target" --no-same-owner --no-same-permissions
test -f "$target/index.html" && test -f "$target/config.js" && test -f "$target/_headers" || {
  echo 'Missing mandatory account build artifacts' >&2; exit 2;
}
grep -Eq '"mode": "live"' "$target/config.js" || { echo 'Not a live build' >&2; exit 2; }
grep -Eq '"writesEnabled": false' "$target/config.js" || { echo 'Writes must start disabled' >&2; exit 2; }
test ! -e "$target/mock" || { echo 'Mock code must never be deployed' >&2; exit 2; }
grep -q "default-src 'none'" "$target/_headers" || { echo 'Strict CSP missing' >&2; exit 2; }
find "$target" -type f -exec chmod 644 {} +
find "$target" -type d -exec chmod 755 {} +
ln -s "$release" "$base/releases/.current-$release"
mv -Tf "$base/releases/.current-$release" "$base/releases/current"
echo "Installed read-only Starlit Account release: $release"
