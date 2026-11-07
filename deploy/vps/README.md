# Unified Starlit website on the VPS

**Preferred production ingress (November 2026): Cloudflare Tunnel.** See
[Cloudflare Tunnel deployment](cloudflare-tunnel/README.md) for the safe
staging, host/DNS routing and rollback workflow. The direct-public-IP
DNS-only A-record procedure later in this document is retained as historical
context only and **must not be used for the Tunnel cutover**.

The Starlit marketing website and authenticated Account & Sync dashboard are
two separate static builds **served by one VPS container and one hostname**:

- Public pages: https://starlit.rrmtools.uk/
- Accounts: https://starlit.rrmtools.uk/account?tab=overview
- Backend API: https://starlit-api.rrmtools.uk/ (already hosted separately).

Cloudflare may still act as the authoritative DNS provider, but the new
website assets are served from the user's Ubuntu VPS, **not Cloudflare Pages**.
The marketing pages and logged-in account have different Caddy CSP headers:
public pages forbid scripts and network connections; Account permits only
self-hosted scripts and the HTTPS API. Account content has noindex/no-store.

## Verified state on 2026-11-07

Combined staging: https://site-stage.62-171-179-229.sslip.io/

Account staging: https://site-stage.62-171-179-229.sslip.io/account?tab=overview

The combined container is healthy. HTTPS, home/pt/download/privacy routes,
account deep-link fallback, account CSS/JS, private 404 responses, CORS
allowlist, and both desktop/mobile sign-in screens were tested. A fake
password is safely rejected by the real API. Marketing pages remained
reachable on Cloudflare Pages during the staging rollout.

**Not yet complete:** production DNS cutover; successful signed-in testing
with two disposable real accounts; enabling account writes. Those last two
are independent of moving the static hosting and must not be conflated.

## VPS layout

- /opt/starlit-site/compose.yml: isolated Caddy 2.10.2 container, non-root,
  read-only, no host ports; connects only to rrm-ntfy_tokview-push.
- /opt/starlit-site/Caddyfile: separate per-path security policies and static
  route handling; /account routes use a SPA fallback, marketing returns 404.
- /opt/starlit-site/releases/: immutable distributions, with atomic current
  symlink. Never clean another application's deployment directories.
- /opt/rrm-ntfy/Caddyfile: existing public HTTPS edge. Add the new host
  block only after validation; preserve push and earlier account staging.
- /opt/starlit-account/: legacy account-only staging deployment left intact
  as a rollback/reference until the unified domain is verified.

## Build and install

The public JWT is the existing GoTrue **publishable anon** key (role anon).
Never expose the GoTrue JWT signing secret, operator token, refresh token, or
service_role key to the frontend. The key comes from the VPS private env
during build only; generated config contains the public anon value.

From a fresh, reviewed source checkout:

1. Run npm run build and npm test at the repo root.
2. Run cd account, npm ci, npm test and npm run e2e (mock regression suite).
3. Run npm run test:combined at the root with a synthetic anon JWT.
4. For actual deployment, export STARLIT_ANON_KEY with the public production
   anon JWT and run node deploy/vps/build-combined.mjs. Do not set
   STARLIT_ACCOUNT_WRITES=1.
5. Package only the combined-dist contents and transfer the archive to the
   VPS. Install it with /opt/starlit-site/install-release.sh FILE RELEASE_ID.
6. Validate docker compose config -q and Caddy config (caddy validate),
   then start/recreate only the starlit-site-web container.
7. Test the internal route matrix before enabling a public TLS host.
8. Add the staging host block from deploy/vps/edge.Caddyfile to the existing
   /opt/rrm-ntfy/Caddyfile, validate and gracefully reload the existing edge.

The install script refuses existing release IDs, mock builds, missing
artifacts, service-role mode and enabled account writes. A failed build
must never replace the current release.

**Merge/Pages safety:** `npm run build` without the VPS distribution
step does not include the account app and MUST NOT advertise links to it.
`deploy/vps/build-combined.mjs` sets
`STARLIT_COMBINED_VPS_SITE=1` exclusively for the marketing build in the
same release as the real `/account` frontend. Tests assert that the
ordinary Pages build has no dead `/account?tab=` navigation, while
the combined VPS build includes both locales' account links.

## Superseded: direct-public-IP DNS cutover (do not use with Tunnel)

Currently the public starlit.rrmtools.uk hostname still resolves via the
Cloudflare Pages/proxy service. Do **not** modify that record before staging
and rollback checks are complete. When ready:

1. Snapshot the current DNS resource record and the edge Caddyfile. Preserve
   the previous values for rollback.
2. At the Cloudflare DNS zone rrmtools.uk, point **starlit** to the VPS
   public IPv4 **62.171.179.229**, set **DNS only** (grey cloud) with
   a short TTL. This replaces the Pages mapping for that hostname only.
   Leave starlit-api, email, push and all unrelated records unchanged.
3. Activate the final starlit.rrmtools.uk HTTPS vhost in the existing VPS
   Caddy edge file, validate and gracefully reload Caddy. It will issue
   its normal Let's Encrypt certificate once DNS points at the VPS.
4. Verify a real valid HTTPS certificate, /, /pt/, /download/, /account/,
- /account?tab=overview, /account?tab=signin, /account?tab=library,
  /assets/site.css,
   /account/app.js, separate CSPs and a genuine 404 for unknown public
   pages. Verify the login invalid-credentials path without leaking data.
5. Confirm unrelated services and all existing downloads are still healthy.
   Retain the old Pages distribution and isolated account staging during
   the first verification period; do not delete their deployments.

The Cloudflare account that was available on 2026-11-07 had expired Wrangler
OAuth credentials without DNS-edit privileges, and the browser dashboard
was signed out. For this reason the final DNS was **not** changed, and
the new public-domain deployment must not be reported as complete.

## Rollback

If the unified live host fails, restore only the previous starlit DNS record
from the saved values, and reload the saved edge configuration if needed.
The old public Pages project is retained. A bad static release can be rolled
back by atomically pointing /opt/starlit-site/releases/current at the previous
verified release, with no application-data migration or restart of Postgres.
Never reset Git history or remove unrelated Docker containers as a rollback.

## Security gates for enabling account writes

The account app defaults to read-only. Before changing that:

- Test sign-in, sessions, PIN, cross-account isolation and revoked sessions
  against two disposable verified users with a controlled inbox.
- Test overlapping updates return HTTP 409, with no silent overwrites.
- Confirm server-side authorization checks remain in place; a client flag
  must never be the server's security boundary.
- Verify OAuth callback is allowlisted as
  https://starlit.rrmtools.uk/account?tab=auth-callback before enabling Google.
- Recheck CSP, 404, brute-force protections and cross-origin CORS after every
  deployment. Avoid passwords, raw account records and tokens in logs.

No set of tests can guarantee the absence of every vulnerability.
