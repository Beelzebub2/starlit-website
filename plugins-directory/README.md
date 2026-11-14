# Starlit Plugins — standalone community directory

A **standalone static website** planned for **https://starlitplugins.rrmtools.uk/**. It borrows Starlit's own brand mark, colors, dark aesthetic and design typography, but has its own site, deployment and legal information pages. It is not a feature inside Starlit and does not use app deep links.

## Features

- Original, responsive desktop/mobile UI; no external UI libraries or CDNs.
- English + Portuguese (Portugal): `/`, `/pt/`, `/legal/`, `/pt/legal/`.
- Search original GitHub repositories and provider names, filter by language, sort by source count and show each repository's providers.
- **Copy manifest** copies the original GitHub-hosted HTTPS manifest URL. Visitors then add it manually under **Starlit → Settings → Content & Discovery → Plugins → Add repository**. Nothing gets installed by this website.
- Strict CSP, no third-party JavaScript, accounts, analytics, cookies, advertisements, plugin execution, direct streaming or media downloads.
- Publisher links, legal/reporting pages and explicit notices that source availability is **not** a legal, performance or security approval.
- `data/catalog.json` is an independently sourced metadata snapshot. This is not copied from nuvioplugins.com's site or database.

## Source inventory — 2026-11-14

The metadata contains 12 community publisher/repository **candidates**. Eight original publisher GitHub `manifest.json` files were independently verified, exposing 204 provider entries at the observation date. Four additional candidate manifests could not be confirmed; their Copy buttons are disabled. Repository counts are metadata, not streams, users, downloads, legal rights or working-status claims. Manifest files can change after observation.

**Legal publication gate:** The directory has *not* been cleared to publicly recommend every listed third-party media scraper. Source-code availability and copyright disclaimers are not sufficient to authorize a plugin that accesses unauthorized copyrighted media. Review each proposed listing's underlying service/content rights, author and code license, security and applicable storefront/service policies, and arrange a practical copyright/security notice and removal process before publicly publishing this catalog. A publicly deployed directory may create copyright liability even if it does not host videos. Have competent Portuguese IP counsel confirm the exact publication policy and listings. This project intentionally does **not** auto-import newly discovered providers.

A separate fail-closed `npm run prepublish` command verifies that each catalog entry has a documented publisher, license, content-rights and security approval flag. It **currently fails intentionally** because all entries remain research candidates. Never skip it during production release, and never set review flags without real evidence.

Do not mirror or copy [nuvioplugins.com](https://nuvioplugins.com)'s assets, screenshots, database or prose; the repo and manifest metadata here was taken from each original GitHub publisher source. Public legal notices are originally written, **draft** until reviewed by counsel.

## Run locally

Node 20+ required; no npm dependencies and no credentials.

```bash
npm run check
npm run preview
```

Then open `http://127.0.0.1:4173/`, `http://127.0.0.1:4173/pt/`, and `/legal/`. The source build creates static files under `dist/`. Do not open `dist/index.html` as a `file://` URL; the search interface fetches same-origin `/catalog.json` and needs an HTTP server.

The build copies the official Starlit mark into the public asset folder. If you integrate this code under `starlit-website/plugins-directory`, put the existing Starlit parent `assets/fonts/` directory at the expected location; the build optionally copies the parent site's already licensed brand font web assets. **Do not distribute font binaries separately** from the official branding source. Standalone builds without these fonts use system font fallbacks.

## Deployment / launch

See [deploy/DEPLOYMENT.md](deploy/DEPLOYMENT.md). The existing VPS already runs the Starlit site over Cloudflare Tunnel, but this directory uses a **separate static Caddy container**, behind the same private edge network; no public host ports or changes to the main app/account routes. Do not configure public DNS until the origin, Cloudflare WAF, legal review and security checks are complete. Cloudflare Tunnel needs a distinct published application hostname with the correct Host header; then run `deploy/smoke.sh`.

## Validation

`npm run check` runs a deterministic rebuild, source checks, catalog/schema + bilingual pages/CSP safety assertions, and interaction-level tests for search, filters, sorting, provider expansion, copy and disabled unavailable actions. Review on real desktop/mobile browser before release; alternate static renderers are not a substitute for browser acceptance.

## Codebase boundaries

This website **does not modify Starlit app plugins, App Store flavors or Tizen/webOS execution**. It does not collect watched history or connect to the Starlit account API. It is a static community directory and must not be presented as a security-vetted app store. Corrections or takedowns are handled by updating reviewed first-party `data/catalog.json` and redeploying.

## GitHub integration

The directory is intended to live under `plugins-directory/` of the existing Starlit website repository, not in a new GitHub repository. Copy `deploy/ci-workflow.yml` into the parent repository's `.github/workflows/starlit-plugins-directory.yml` to run the isolated static build and client tests on directory PRs. This CI file is source only and cannot deploy to production by itself.
