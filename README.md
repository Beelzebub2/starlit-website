# Starlit official website

Static EN/PT-PT website for `https://starlit.rrmtools.uk/`.
Keep it **separate** from the production account API at
`https://starlit-api.rrmtools.uk/` (no API proxying or account tokens on this website).

## Pages

- Homepage, privacy, terms, cookies, delete-account, contact, legal operator
- The matching 7 pages in Portuguese (Portugal) under `/pt/`
- `404.html` and `pt/404.html`: Cloudflare Pages serves the nearest one with a
  real 404 status, so unknown addresses no longer return the homepage
- Official Starlit mark and wordmark, no Google or Cloudflare account credentials in site code
- No contact form, no JavaScript at all, no tracking or ad scripts; all email links
  use `support.starlit@rrmtools.uk`

## Build, test and preview

```
npm run build     # writes dist/
npm test          # checks pages, links, anchors, metadata, headers and policy text
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
| `constants.mjs` | Contact email, routes, homepage anchors and release links |
| `home.mjs` | Homepage copy in English and Portuguese, and its markup |
| `content.mjs` | Policy pages. Their wording is a legal draft: change it only with the operator's approval |
| `art.mjs` | The official mark, the sparkle shape and the generated night sky |
| `build.mjs` | Page layout, policy anchors and contents lists, sitemap, headers and redirects |
| `assets/site.css` | All styles; minified at build time |
| `tools/make-brand-images.py` | Rebuilds the wordmarks, social image and icons from the app repository's branding |
| `tools/preview.mjs` | Local preview server |

Homepage claims must match the current public releases (the app's README,
`docs/ANDROID.md` and `docs/RELEASE-NOTES.md`). Download buttons open
`/releases/latest` on GitHub, so they never point at an old version.

## Design

- **Colours.** Night (default) uses Midnight `#0a0e27`, Deep `#111739` and
  Starlight `#edf0ff`; Dawn (light mode) uses `#f2f4fc`, white and `#0e1333`.
  The brand gradient (`#45D6EB`, `#3965D4`, `#B250EF`) stays on the mark, list
  sparkles and step numbers. All text pairs meet WCAG AA in both themes.
- **Type.** Mona Sans (expanded widths for headings) and Source Serif 4 for
  policy text. Both are self-hosted under the SIL Open Font License; licences
  are in `assets/fonts/`.
- **Motion.** One load sequence on the homepage mark and four slow twinkles.
  Everything stops under `prefers-reduced-motion`.
- **Interactions** use `<details>` and anchors only, so the CSP keeps
  `script-src 'none'`.
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
