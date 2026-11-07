# Starlit official website

One Starlit website for the public marketing pages and the account dashboard,
hosted together on the Ubuntu VPS under `https://starlit.rrmtools.uk/`.
The backend API remains a separate service at `https://starlit-api.rrmtools.uk`.
The static marketing pages never receive account tokens or execute JavaScript;
only the `/account?tab=...` page runs the login UI.

**Rollout (2026-11-07):** a real combined read-only build is available on VPS
staging at https://site-stage.62-171-179-229.sslip.io/ with its account at
https://site-stage.62-171-179-229.sslip.io/account?tab=overview . The public production
hostname still points to Cloudflare Pages because DNS cutover has not been
authorized/configured. Do not confuse staging with the live public site.

**Safe merge before DNS cutover:** The regular `npm run build` (used by the
legacy Cloudflare Pages marketing deployment) deliberately omits links to
`/account?tab=...`, because Pages does not host the account UI. The
combined VPS builder explicitly enables those links and bundles the account
app, with its separate CSP. Merging this repository therefore cannot create a
broken account navigation link on the legacy Pages site while the DNS record
still points there. This is a temporary compatibility measure; hosting moves
to the VPS only when the actual DNS record changes.

## Pages

| English | Portuguese (Portugal) | Contents |
| --- | --- | --- |
| `/` | `/pt/` | Home: the PC and phone together, feature status, highlights |
| `/remote/` | `/pt/comando/` | PC remote: pairing, what the phone can do, Wi-Fi and Bluetooth, firewall, security |
| `/anime/` | `/pt/anime/` | Airing Now, the MyAnimeList tab, rewatches and tracking |
| `/watch/` | `/pt/ver/` | The player, Google Cast, sources, offline downloads and storage |
| `/sync/` | `/pt/conta/` | What syncs, self-service registration, sign-in methods, diagnostics |
| `/download/` | `/pt/transferir/` | Downloads, install steps, what's new, checksums and FAQ |

Plus the six policy pages (privacy, terms, cookies, delete account, contact,
legal operator) in both languages, and `404.html` / `pt/404.html`: Cloudflare
Pages serves the nearest one with a real 404 status.

Plus `/account?tab=overview` (profile manager, synced library, account settings,
sessions and devices) on the same website. The public pages have no forms,
tracking or JavaScript; the account area uses self-hosted JS and the existing
authenticated Starlit API. Support is `support.starlit@rrmtools.uk`.

## Build, test and preview

```
npm run build     # writes dist/
npm test          # checks pages, links, anchors, metadata, headers, policy text and feature labels
npm run preview   # serves dist/ at http://localhost:8788 like Cloudflare Pages
npm run test:combined # verifies one VPS release contains both apps, with separate CSPs
npm run build:combined # requires STARLIT_ANON_KEY (public JWT, never service-role)
npm run preflight # fetches and compares remote code, open PRs and local checkout
npm run prepublish # blocks publication if the checkout is behind main/unverified
```

The preview applies `dist/_headers` (including the Content-Security-Policy),
redirects `/privacy` to `/privacy/` and serves the 404 pages with a 404 status.

## Source freshness guard

Read `AGENTS.md` before any change. Claude Code automatically runs the
`SessionStart` and `UserPromptSubmit` hooks from `.claude/settings.json`.
They fetch remote-tracking refs, identify newer branches and list open PRs
before work begins. Other coding agents follow the same workflow through
`AGENTS.md`. Never treat a merge as proof of a production deployment.

**New deployment:** build a combined read-only release with
`deploy/vps/build-combined.mjs` and serve it from the existing VPS HTTPS
edge using `deploy/vps/compose.yml`. See [VPS rollout and rollback](deploy/vps/README.md).
The former Cloudflare Pages project is **historical live infrastructure**:
do not republish there or change DNS until the VPS is fully validated.

## Source layout

| File | Contents |
| --- | --- |
| `constants.mjs` | Contact email, routes, release links, and the current version and file names |
| `pages/*.mjs` | One file per product page: its English and Portuguese copy, and its markup |
| `ui.mjs` | Shared pieces: icons, status pills, app-window and phone frames, CSS-only tabs, asset hashing |
| `content.mjs` | Policy pages. Their wording is a legal draft: change it only with the operator's authorization |
| `build.mjs` | Header, footer, policy layout and contents lists, sitemap, headers and redirects |
| `assets/site.css` | All styles; minified at build time |
| `tools/make-brand-images.py` | Rebuilds the wordmarks, social image and icons from the app repository's branding |
| `tools/preview.mjs` | Local preview server |
| `account/` | Account dashboard assets mounted under `/account/`, with all navigation via `/account?tab=plugins`, `?tab=library`, etc. Separate CSP, session scope, tests and API access. See [account/README.md](account/README.md) |
| `deploy/vps/` | Combined immutable release build, Caddy routing, Docker isolation, staging/cutover/rollback |

Feature claims must match the current public releases (the app's README,
`docs/` and `docs/RELEASE-NOTES.md` on the `Dev` branch). Current labels:
the Bluetooth remote and Google Cast are **Beta** (neither has been tested
end-to-end on real hardware); iPhone, Mac and Linux are **Not yet**; the
MyAnimeList tab and rewatch detection are in the Windows app, and the tab is
off by default.

After each release, update `VERSION` in `constants.mjs`, the shipping log in
`pages/home.mjs` and "What's new" in `pages/download.mjs`. Download buttons
open `/releases/latest` on GitHub, so they never point at an old version.

## Design

- **Colours.** One dark theme: page `#06070F`, panels `#0B0D1A` and
  `#090B17`, lines `#161A33`, text `#EEF0FA` (secondary `#A2A8C3`, muted
  `#7C83A3`), accent `#45D6EB` with `#04121A` text on it, links `#7FE3F2`,
  Beta `#F2B84B`. The app mockups use the app's own colours (`--app-*`).
- **Type.** Bricolage Grotesque for headings (one latin file, optical size 96,
  widths 75–100%, weights 700–800), Geist for text and Geist Mono for labels
  and numbers. All three are self-hosted under the SIL Open Font License;
  licences are in `assets/fonts/`.
- **Mockups** are drawn in HTML and CSS. The shows and artwork in them are
  invented, and each page says so next to its mockups.
- **Interactions** use `<details>`, anchors and radio-button tabs styled with
  `:has()` (the phone controller, Airing Now days and MyAnimeList statuses), so
  the CSP keeps `script-src 'none'`. Without `:has()` the first tab shows.
- **Layout.** 1280 px maximum content width with 40 px side padding, 16 px
  below 960 px, where grids collapse to one column.
- **Caching.** Asset URLs carry a content hash (`?v=`). Responses keep
  `Cache-Control: no-transform` so Cloudflare cannot inject scripts (such as
  email obfuscation) that the CSP would block; that also means Cloudflare does
  not compress them, so keep pages and CSS lean.

## Compliance checklist before public launch

- [ ] **Legal operator**: confirm legal name, postal contact and any relevant
  company registration/tax identifiers. The site currently states this
  information is incomplete; brand name alone is not a sufficient substitute.
- [ ] Verify incoming mail forwarding for `support.starlit@rrmtools.uk`,
  and separately verify outbound reply-as configuration if needed.
- [ ] Verify actual backup/log retention in production and update privacy text.
- [ ] Verify processor contracts and international transfer safeguards for
  infrastructure, email and any connected providers.
- [ ] Establish and test access/export/deletion workflow. Currently via email,
  not a misleading self-service delete button.
- [ ] Make the privacy policy discoverable **inside the app** during sign-up
  and before optional account synchronization.
- [ ] Validate copyright, third-party addon, BitTorrent/peer-IP and youth access
  notices against actual distributed behavior.
- [ ] Ensure Google Cloud consent URL points to this live HTTPS site, not
  the separate API server. Register/verify `rrmtools.uk` in Search Console,
  and submit OAuth branding for review.

Legal text is a drafted transparency notice, **not a legal certification**.
Verify the facts and ask qualified Portuguese/EU counsel to review before
representing the service as fully compliant.
