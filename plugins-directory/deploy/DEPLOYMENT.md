# Starlit Plugins — separate hostname, existing private VPS

**Target:** `https://starlitplugins.rrmtools.uk/`. Status: public website already deployed on its own isolated origin; release instructions and routing templates are maintained here. External plugin repositories are not security-audited or content-rights certified. No secrets belong in this folder.

## Existing Starlit origin to preserve

The verified Starlit website deployment uses `starlit-site-web:8081` on private Docker network `rrm-ntfy_tokview-push`, with `tokview-ntfy-https:8088` as the Cloudflare Tunnel's internal Caddy edge. `starlit.rrmtools.uk` and account routes remain untouched. The new site is **not** on the main site's `:8081` root; it gets its own private origin `starlit-plugins-web:8082` with hostname-specific reverse proxy and the same official Starlit Tunnel. See the original `starlit-website/deploy/vps/cloudflare-tunnel/` for full origin security and CrowdSec details.

## Release checks for the existing deployment

1. Confirm the active Cloudflare Tunnel, private edge and isolated Caddy origin remain healthy. Preserve the main Starlit website and account routes.
2. Run `npm run check`, `npm run prepublish`, and `npm run build:public`. `prepublish` validates metadata, **not** rights or executable safety. `verify:public` confirms all entries match the independent source snapshot and disables installation for unavailable manifests.
3. Keep honest informational and copyright notices (EN/PT-PT), and a functioning abuse/copyright report contact. Do not claim Starlit has reviewed, approved or secured external scripts. Copyright notices are not a legal exemption for links to unauthorized streams.
4. Publish only the tested static build to a new immutable release; record the SHA and keep the previous release for rollback. Smoke-test both locales, security headers and existing service endpoints.
## Origin update

For an update to the existing VPS installation under `/opt/starlit-plugins/`:

- Install the reviewed `deploy/Caddyfile` as `/opt/starlit-plugins/Caddyfile` and `deploy/compose.yml` as `/opt/starlit-plugins/compose.yml`.
- Place the built static `dist/` contents into a new immutable release `/opt/starlit-plugins/releases/<release-id>/`, owned/readable by UID 10001; atomically update `/opt/starlit-plugins/releases/current` to point to it. Preserve older releases for rollback.
- `docker compose -f /opt/starlit-plugins/compose.yml config -q`, `caddy validate` using the complete config, and `docker compose ... up -d` **only** the new `plugins` service. Verify it is healthy from the private Docker network.
- The Cloudflare edge hostname route is **already configured**. Keep it intact; only review or update the route when necessary. Never replace existing Starlit or CrowdSec handlers, and never expose private ports.
- Confirm the internal `Host: starlitplugins.rrmtools.uk` reverse-proxy route serves `/`, `/pt/`, `/legal/`, `/pt/legal/`, `/catalog.json` and static assets with the strict CSP; unknown host/path and private file requests must return 404.

## Existing Cloudflare routing

Use the already configured **Starlit website Tunnel** (not an unrelated tunnel) and published hostname:

| Field | Expected value |
| --- | --- |
| Public hostname | `starlitplugins.rrmtools.uk` |
| Service | `http://tokview-ntfy-https:8088` |
| HTTP Host Header | `starlitplugins.rrmtools.uk` |
| DNS | Cloudflare-managed proxied CNAME to this tunnel's `<UUID>.cfargotunnel.com` |
| Access | Public with applicable WAF/rate limits; no identity login required for informational directory |

Use Cloudflare's current [published application route guidance](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/). The hostname and origin must both be tested. DNS must not be pointed to the VPS IP and this service must not expose a public host port. Test `deploy/smoke.sh https://starlitplugins.rrmtools.uk` and check the response headers, site content, valid TLS, Cloudflare WAF events, sanitized CrowdSec logs and unrelated `starlit.rrmtools.uk`, account, API and push health.

**Rollback:** Remove/disable only this published application route, remove only the new host block after config review, or return the `current` symlink to the prior verified directory. Keep other hosts, data, and containers untouched. Document actual deployment SHA and test outcomes; do not claim production until HTTPS smoke checks succeed.

## Limitations

The templates assume the private Docker edge service names were not renamed after the reference snapshot. Live VPS/Cloudflare state must be verified. The hostname and service were deployed on 2026-11-14; changes to this repository alone do not deploy them. Plugin installation stays manual; there is no Starlit app modification or deep-link handler change.

## Community-directory public build

`npm run build:public` publishes independently sourced community publisher manifests as a static metadata directory. Available sources have an optional **Copy manifest** button; unavailable manifests have that action disabled. The site does not host executable plugin files, stream copyrighted works, or automatically install anything in the app.

The public `publication.json` uses `mode: "community-directory"` and separately reports available and unavailable repositories. Metadata validation is **not** a security audit, copyright license or legal certification. Operators should handle credible copyright and abuse reports and correct or remove links as needed.
