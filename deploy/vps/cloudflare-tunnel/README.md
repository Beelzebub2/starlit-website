# Starlit Cloudflare Tunnel — VPS deployment

Cloudflare HTTPS/WAF -> **dedicated outbound Starlit Tunnel** -> internal Docker
`tokview-ntfy-https:8088` (Caddy edge with sanitized CrowdSec log) ->
`starlit-site-web:8081` (static marketing + read-only account dashboard).

No new host ports. Never touch the unrelated `puzzle42` or Minecraft
tunnels. The API at `starlit-api.rrmtools.uk` remains unchanged.
The new origin Caddy listener denies unrecognized Host names, rejects private
website paths, keeps existing distinct CSPs and logs queryless requests for
CrowdSec. Its port 8088 must **not** be mapped to the VPS host.

**CrowdSec limitation:** the current bouncer is a VPS *firewall* bouncer.
It can ingest the tunnel origin's existing sanitized Caddy access log, but
its firewall bans do not block individual visitors through Cloudflare Tunnel.
Protect the hostname with Cloudflare WAF/bot protections and rate limiting;
for automatic CrowdSec blocking, enable and verify a Cloudflare-side CrowdSec
remediation integration. Do not mistake logging for enforcement.

## 1. VPS origin preparation — no Cloudflare login needed

Before editing production files, verify the current website release and
take backups of the existing edge Caddyfile.

1. Append only `edge.Caddyfile` to the **existing**
   `/opt/rrm-ntfy/Caddyfile`; preserve the `crowdsec-access` snippet and
   all unrelated blocks. Validate the complete candidate with
   `caddy validate`. Gracefully reload the current edge, with a
   backup ready for immediate rollback. Do not publish 8088 on the host.
2. Run `smoke.sh` on the VPS to check both allowed hosts, unknown-host
   404, private-path 404, marketing/account CSPs and no-store.
3. Copy `compose.yml`, `provision-token.sh` and `smoke.sh` into
   `/opt/starlit-tunnel/`. Validate Compose. **Do not start cloudflared
   without a genuine token from the correct Cloudflare account.**

## 2. Create and test a dedicated tunnel in Cloudflare

You need authenticated access to the Cloudflare account owning
`rrmtools.uk`. Go to **Networking > Tunnels**, create a remotely managed
tunnel named **starlit-website**, and obtain its *connector token*.

First configure a temporary **published application**:

| Setting | Value |
| --- | --- |
| Hostname | `starlit-tunnel-stage.rrmtools.uk` |
| Service | `http://tokview-ntfy-https:8088` |
| HTTP Host Header | `starlit-tunnel-stage.rrmtools.uk` |
| DNS | Cloudflare-proxied CNAME to the new `<TUNNEL_UUID>.cfargotunnel.com` |

**Never place the tunnel token in GitHub, issues, chat, command arguments or
Compose environment values.** On an interactive root shell **on the VPS**,
run (the read prompt does not echo or save the token to shell history):

```bash
read -rsp 'Cloudflare Starlit tunnel token: ' token; echo
printf '%s' "$token" | bash /opt/starlit-tunnel/provision-token.sh
unset token
cd /opt/starlit-tunnel
docker compose config -q
docker compose up -d --no-deps cloudflared
docker inspect starlit-cloudflared --format '{{.State.Status}}'
```

The provisioner refuses invalid input and overwrites, storing a restricted
token file outside the repository. Confirm **Healthy** in the Cloudflare
Tunnels dashboard. Verify the public test hostname with a real browser:
home, /pt/, /download/, `/account?tab=plugins`, static account assets,
CSP/no-store, private paths 404, and a deliberately invalid sign-in.
Check tunnel connectivity and Cloudflare WAF events.

Do not enable Cloudflare Access identity login on public marketing pages.

## 3. Cut over the official hostname without disrupting other services

**Only after test hostname and WAF controls are verified:**

1. Back up the existing `starlit.rrmtools.uk` DNS record (record ID,
   type, target, TTL, proxy flag), plus the Pages custom-domain assignment and
   previous Pages deployment. Keep the old route available for rollback.
2. Add another published application on the **same Starlit tunnel**:
   hostname `starlit.rrmtools.uk`, service URL
   `http://tokview-ntfy-https:8088`, HTTP Host Header
   `starlit.rrmtools.uk`. If the Pages mapping conflicts, coordinate
   removing its custom-domain binding with the DNS replacement.
3. Replace the Pages DNS mapping with a **proxied CNAME** named `starlit`
   pointing to `<TUNNEL_UUID>.cfargotunnel.com`. **Do not** set a
   DNS-only A record pointing to the VPS. Leave starlit-api, email, push
   and all unrelated DNS records intact.
4. Confirm real TLS/HTTP 200 on home, PT, downloads and
   `/account?tab=plugins`; the account remains read-only. Verify
   Cloudflare WAF and cache rules (**bypass cache for `/account*`**),
   unknown hosts/private paths, login safety, CrowdSec log ingestion, and
   unrelated API/push/email service health.
5. If a critical check fails, **restore the original DNS record and Pages
   custom-domain binding immediately**, using the saved values. Do not
   remove the older Pages build or the standalone VPS staging release.

## Remaining security gates

- Cloudflare WAF and rate limits need to be inspected on the real zone;
  the firewall-only CrowdSec bouncer cannot enforce per-user bans on tunnel
  traffic without Cloudflare-side remediation.
- Account writes stay **OFF** until authenticated isolation, PIN/session
  revocation and concurrent 409-write checks pass using two disposable users.
- Google OAuth remains disabled until the account callback is allowlisted.
- Monitor tunnel health/disconnects. A healthy Docker container or DNS CNAME
  alone is not proof that public traffic reaches the VPS correctly.

The previous public site is still on Cloudflare Pages until its DNS/custom
domain has actually been replaced. The Cloudflare dashboard login and zone
edit permissions must be available to complete that external step.
