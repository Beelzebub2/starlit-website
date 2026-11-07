# VPS static account dashboard hosting

This is **VPS hosting, not Cloudflare Pages**. The dashboard is a separate,
read-only-first static service on the existing Ubuntu VPS. Cloudflare may
remain a **DNS registrar/provider**, but neither Pages nor Workers host the
account frontend. The public marketing website is not moved by this change.

## Layout

- `/opt/starlit-account/compose.yml`: isolated, non-root, read-only Caddy
  static container; NO host port mapping, DB, or secrets.
- `/opt/starlit-account/releases/<git-sha>/`: immutable build artifacts.
- `/opt/starlit-account/releases/current`: atomic symlink (rollback by
  switching to the previous release; no destructive cleanup).
- `/opt/rrm-ntfy/Caddyfile`: pre-existing HTTPS edge service. Add just an
  account hostname block that proxies `starlit-account-web:8080`. Always
  validate first with `caddy validate`, reload (not restart) and verify the
  existing ntfy hostname remains healthy. Do NOT replace the whole file.
- Docker bridge: `rrm-ntfy_tokview-push` (already used by the HTTPS edge).

## Safety gates (all mandatory)

1. Verify source freshness, PR checks, dependencies and the strict CSP.
2. Confirm the private backend migration is on the VPS, after an isolated
   restored-backup test and transactional migration run, or keep live
   frontend read-only and mark it incomplete.
3. Build with `STARLIT_ACCOUNT_MODE=live` and a **public** GoTrue anon JWT
   (`role: anon`); do not put a service_role token in browser files. The
   build fails closed if supplied a service-role key or HTTP API origin.
4. Keep `STARLIT_ACCOUNT_WRITES` unset. The client-side flag is only a UX
   control, **not an authorization boundary**. The backend always validates
   authenticated session, profile ownership, and optimistic revisions.
5. Verify the release has no `mock/` directory, test passwords or secrets;
   test `/_headers`, dotfiles and `/mock/*` return 404, deep links load,
   HTTPS redirects from port 80, TLS is valid, CSP is present, caching is
   disabled for dynamic files, and the marketing/ntfy/API sites remain healthy.
6. Create a DNS-only A record for `account.starlit.rrmtools.uk` pointing
   to the VPS address; then add a separate production host block in the
   existing Caddyfile. DNS-only avoids hosting content at Cloudflare Pages.
7. Run the live two-account E2E smoke suite and enable writes in a separately
   reviewed release only after real server authorization/conflict checks pass.

## Deployment outline (on the VPS)

```sh
install -d -m 755 /opt/starlit-account
# Copy compose.yml, Caddyfile and install-release.sh into /opt/starlit-account.
# Copy a tar.gz of the LIVE build to a private staging path.
sh /opt/starlit-account/install-release.sh /root/starlit-account-live.tar.gz COMMIT_SHA
cd /opt/starlit-account
docker compose config -q
docker compose up -d
docker inspect --format '{{.State.Health.Status}}' starlit-account-web
# Save a copy of /opt/rrm-ntfy/Caddyfile before editing. Append ONE
# account-stage or account.starlit.rrmtools.uk vhost, validate/reload.
```

If external TLS/DNS cannot be changed, do not disable HTTPS or ship the mock
build as a workaround. Use the IP-based `sslip.io` **staging** hostname only
after certificate issuance; report that the requested vanity domain is pending.

Tokens, emails, watch histories, client IPs, and DB snapshots must not be
committed into either repository or recorded in public deployment logs.
