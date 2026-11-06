# Starlit official website

Static EN/PT-PT website for `https://starlit.rrmtools.uk/`.
Keep it **separate** from the production account API at
`https://starlit-api.rrmtools.uk/` (no API proxying or account tokens on this website).

## Pages

| English | Portuguese (Portugal) | Contents |
| --- | --- | --- |
| `/` | `/pt/` | Home: the PC and phone together, feature status, highlights |
| `/remote/` | `/pt/comando/` | PC remote: pairing, what the phone can do, Wi-Fi and Bluetooth, firewall, security |
| `/anime/` | `/pt/anime/` | Airing Now, the MyAnimeList tab, rewatches and tracking |
| `/watch/` | `/pt/ver/` | The player, Google Cast, sources, offline downloads and storage |
| `/sync/` | `/pt/conta/` | What syncs, accounts and approval, sign-in methods, diagnostics |
| `/download/` | `/pt/transferir/` | Downloads, install steps, what's new, checksums and FAQ |

Plus the six policy pages (privacy, terms, cookies, delete account, contact,
legal operator) in both languages, and `404.html` / `pt/404.html`: Cloudflare
Pages serves the nearest one with a real 404 status.

No contact form, no JavaScript at all, no tracking or ad scripts; all email
links use `support.starlit@rrmtools.uk`.

## Build, test and preview

```
npm run build     # writes dist/
npm test          # checks pages, links, anchors, metadata, headers, policy text and feature labels
npm run preview   # serves dist/ at http://localhost:8788 like Cloudflare Pages
```

The preview applies `dist/_headers` (including the Content-Security-Policy),
redirects `/privacy` to `/privacy/` and serves the 404 pages with a 404 status.

Deploy `dist` to the Cloudflare Pages project `starlit-official`, with the custom
domain `starlit.rrmtools.uk`. For a clean environment,
`npx wrangler pages project create starlit-official` then
`npx wrangler pages deploy dist --project-name starlit-official --branch main`.

## Source layout

| File | Contents |
| --- | --- |
| `constants.mjs` | Contact email, routes, release links, and the current version and file names |
| `pages/*.mjs` | One file per product page: its English and Portuguese copy, and its markup |
| `ui.mjs` | Shared pieces: icons, status pills, app-window and phone frames, CSS-only tabs, asset hashing |
| `content.mjs` | Policy pages. Their wording is a legal draft: change it only with the operator's approval |
| `build.mjs` | Header, footer, policy layout and contents lists, sitemap, headers and redirects |
| `assets/site.css` | All styles; minified at build time |
| `tools/make-brand-images.py` | Rebuilds the wordmarks, social image and icons from the app repository's branding |
| `tools/preview.mjs` | Local preview server |

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
