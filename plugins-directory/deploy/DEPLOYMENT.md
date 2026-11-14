# Starlit Plugins — separate hostname, existing private VPS

**Target:** `https://starlitplugins.rrmtools.uk/`. Status: source and deployment templates only. The public hostname and service are **not deployed** by building this project. Do not publish any unreviewed streaming-provider catalog as legally approved. No secrets belong in this folder.

## Existing Starlit origin to preserve

The verified Starlit website deployment uses `starlit-site-web:8081` on private Docker network `rrm-ntfy_tokview-push`, with `tokview-ntfy-https:8088` as the Cloudflare Tunnel's internal Caddy edge. `starlit.rrmtools.uk` and account routes remain untouched. The new site is **not** on the main site's `:8081` root; it gets its own private origin `starlit-plugins-web:8082` with hostname-specific reverse proxy and the same official Starlit Tunnel. See the original `starlit-website/deploy/vps/cloudflare-tunnel/` for full origin security and CrowdSec details.

## Publication gates (before public DNS)

1. Obtain copyright/source licensing and safety review per indexed manifest/provider, with a real notice-and-removal process and qualified legal review under applicable EU/Portuguese law. Do not claim that “no videos hosted” alone makes the directory lawful. Replace or remove unapproved catalog candidates.
2. Confirm the real Cloudflare zone, tunnel identity, access rights, WAF/rate limiting, and the existing private edge/container network. Inspect remote deployment state and unrelated services first; never force-reset/overwrite.
3. Build and run all tests with a fresh reviewed source; **`npm run prepublish` must pass without bypasses** after legal/source/security review of the selected entries. It intentionally fails on the current unapproved candidate snapshot. Inspect actual browser layouts at desktop/phone sizes. Hash and record the intended release.

## Origin setup (after gates)

As an operator on the **actual** VPS, in a new directory `/opt/starlit-plugins/`:

- Install the reviewed `deploy/Caddyfile` as `/opt/starlit-plugins/Caddyfile` and `deploy/compose.yml` as `/opt/starlit-plugins/compose.yml`.
- Place the built static `dist/` contents into a new immutable release `/opt/starlit-plugins/releases/<release-id>/`, owned/readable by UID 10001; atomically update `/opt/starlit-plugins/releases/current` to point to it. Preserve older releases for rollback.
- `docker compose -f /opt/starlit-plugins/compose.yml config -q`, `caddy validate` using the complete config, and `docker compose ... up -d` **only** the new `plugins` service. Verify it is healthy from the private Docker network.
- Append the `deploy/cloudflare-edge-snippet.caddy` route **inside the existing `:8088` listener**, *before* the final unknown-host 404. It must **not** replace the existing `@starlit` handler or `import crowdsec-access`. Back up, validate, and gracefully reload the existing edge config; never expose `:8082` or `:8088` to a host port. This is a reviewable snippet, not a full replacement of the live Caddyfile.
- Confirm the internal `Host: starlitplugins.rrmtools.uk` reverse-proxy route serves `/`, `/pt/`, `/legal/`, `/pt/legal/`, `/catalog.json` and static assets with the strict CSP; unknown host/path and private file requests must return 404.

## Cloudflare routing (after origin checks)

Use the **existing Starlit website Tunnel** (not an unrelated tunnel) with a new **published application**:

| Field | Expected value |
| --- | --- |
| Public hostname | `starlitplugins.rrmtools.uk` |
| Service | `http://tokview-ntfy-https:8088` |
| HTTP Host Header | `starlitplugins.rrmtools.uk` |
| DNS | Cloudflare-managed proxied CNAME to this tunnel's `<UUID>.cfargotunnel.com` |
| Access | Public with applicable WAF/rate limits; no identity login required for informational directory |

Use Cloudflare's current [published application route guidance](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/). The new hostname alone does not prove the origin is ready. DNS must not be pointed to the VPS IP and this service must not expose a public host port. Test `deploy/smoke.sh https://starlitplugins.rrmtools.uk` and check the response headers, site content, valid TLS, Cloudflare WAF events, sanitized CrowdSec logs and unrelated `starlit.rrmtools.uk`, account, API and push health.

**Rollback:** Remove/disable only this published application route, remove only the new host block after config review, or return the `current` symlink to the prior verified directory. Keep other hosts, data, and containers untouched. Document actual deployment SHA and test outcomes; do not claim production until HTTPS smoke checks succeed.

## Limitations

The templates assume the private Docker edge service names were not renamed after the reference snapshot. Live VPS/Cloudflare state must be verified. No actual DNS, Caddy, Tunnel or VPS mutation was made by generating these files. Plugin installation stays manual; there is no Starlit app modification or deep-link handler change.
