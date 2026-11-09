# Starlit Account

The Starlit account dashboard is mounted at
`https://starlit.rrmtools.uk/account?tab=overview` on the **same VPS-hosted
website** as the marketing pages. It remains an independently built browser
app with its own Content-Security-Policy; the public pages keep a stricter
policy that runs only their own `/assets/site.js` and never contacts the
account API (`connect-src 'self'`). The backend API remains at
`https://starlit-api.rrmtools.uk`.

**Status (2026-11-07):** IN_PR (website PR #6). The combined VPS
read-only staging address is
`https://site-stage.62-171-179-229.sslip.io/account?tab=overview`, and the
previous standalone account staging site remains available temporarily.
Neither staging site ships a mock backend. The final shared-domain DNS cutover
and full authenticated two-account E2E are still pending.

## What it does

| Area | What you can do | Backend |
| --- | --- | --- |
| Overview | Server-side counts for the chosen profile, plus when it last changed | `account_overview` |
| Profiles | Create, edit or delete secondary profiles (1–6). Set, change or remove a PIN, with lockout feedback | `account_profiles`, `account_save_profile`, `account_delete_profile`, `account_change_pin`, `account_remove_pin`, `verify_profile_pin` |
| Addons, plugins | Turn items on or off, rename, reorder (keyboard buttons), add by address and remove. Every change is staged and saved together | `account_extensions`, `account_save_extensions` |
| Library, continue watching, history | Lists paged by keyset ("Load more"). Change a resume point, or remove an entry | `account_items`, `account_save_item`, `account_delete_item` |
| Collections | List, reorder, duplicate, remove, import and export. A full-page editor with templates, folders, sources, artwork and a review step | `account_blob` / `account_save_blob` (`collections`) |
| Synced settings | Edit leaf values of the profile and home-row blobs. Unknown keys are kept, device-only values are read-only, and keys and tokens are hidden | `account_blob` / `account_save_blob` |
| Media servers | Name and address of Jellyfin and Emby servers only | `account_media_servers`, `account_save_media_server`, `account_delete_media_server` |
| Sessions and devices | GoTrue sessions, with sign-out of other sessions or everywhere. Installations that synced, shown read-only | `account_sessions`, `account_devices`, GoTrue `/logout?scope=` |

The [list of what isn't available](docs/API.md#not-available-and-why) is
shown in the app too. The app has no button for any action the backend
doesn't support.

## Run, build, test

```
cd account
npm ci                     # dev tools only: Playwright and axe (no runtime dependencies)
npm run build              # mock build -> account/dist
npm run preview            # http://localhost:8789 (previews dist/_headers)
npm test                   # unit, contract, policy and build tests (node:test)
npx playwright install chromium
npm run e2e                # E2E at 1440, 768 and 390 px against the mock build
SCREENSHOTS=1 npm run e2e  # also refresh docs/screenshots (synthetic data)
```

The mock build shows a "Demo data" banner and a "Mock API controls" panel,
where you can set latency, make the next request fail (401, 403, 404, 500 or a
network error), go offline, or have "another device" edit something to cause a
real 409. The synthetic accounts and their test passwords are in
`src/mock/fixtures.js`. A live build never includes them.

## Live build

```
STARLIT_ACCOUNT_MODE=live STARLIT_ANON_KEY=<public anon key> npm run build
```

* The build refuses to run if the key isn't a JWT with `role: "anon"`, so a
  service key can never be shipped to a browser. It also refuses an API URL
  that isn't https. `STARLIT_API_URL` defaults to `https://starlit-api.rrmtools.uk`.
* Live builds are **read-only** by default. Set `STARLIT_ACCOUNT_WRITES=1`
  only after the staged read checks and the two-account checks pass. This is
  the feature flag the backend rollout plan asks for.
* Google sign-in stays hidden unless `STARLIT_GOOGLE_SIGNIN=1`. Before you set
  it, allow exactly `https://starlit.rrmtools.uk/account?tab=auth-callback` in
  GoTrue's redirect list. GoTrue, not the website, receives Google's OAuth client
  callback at `https://starlit-api.rrmtools.uk/auth/v1/callback`.
* Passkey sign-in stays hidden unless `STARLIT_PASSKEY_SIGNIN=1`. Keep the
  existing GoTrue RP ID `starlit-api.rrmtools.uk`: native app passkeys use it.
  To let a browser on `starlit.rrmtools.uk` use the same RP, the API must serve
  `/.well-known/webauthn` with the exact official website Origin in its
  `origins` array, and GoTrue must allow that Origin. Browsers without
  Related Origin Requests support can use their password or Google instead.
* The CSP adds the API origin to `connect-src`, and nothing else.

The combined VPS deployment uses the existing HTTPS Caddy edge and an
isolated, non-root static container with no separate public port. See the
[combined deployment runbook](../deploy/vps/README.md). The legacy
[standalone staging runbook](deploy/vps/README.md) remains as a rollback
reference until the public domain cutover has been verified.

## Security notes

* **Tokens live in memory only.** Password, passkey and Google sessions use the
  same storage restrictions. Nothing goes to `localStorage`, cookies or
  the URL, so a reload signs you out. The only thing kept in `sessionStorage`
  is the one-time PKCE verifier, and only during a Google redirect. Only the
  language and the last profile number are stored in `localStorage`.
* No HTML strings are parsed. All data is set as text (`src/lib/dom.js`), and
  a test fails if `innerHTML`, `eval` or `console.*` show up in `src/`.
* Addon addresses are redacted (`src/lib/redact.js`), and error messages are
  stripped of addresses and tokens before they're shown.
* The client never sends a user id. The server scopes every RPC to the JWT,
  and the tests check that no request body carries one.
* A 409 is never retried with the old data. The editor loads the latest
  version, re-applies your edits for you to review, and keeps the other
  device's value until you pick yours.
* PIN-protected profiles aren't loaded until their PIN is entered. The PIN is
  a household UX gate, not authentication.

## Layout

| Path | Contents |
| --- | --- |
| `build.mjs`, `tools/preview.mjs` | Build (mock or live) and a local preview that applies the generated headers |
| `src/app.js` | Shell, routing, sign-in flow, profile scope |
| `src/lib/` | API and GoTrue clients, errors, redaction, merge, collections model, settings model, UI kit, copy (EN/PT-PT) |
| `src/views/` | One file per page |
| `src/mock/` | Mock backend that mirrors the SQL semantics, synthetic fixtures, test controls (mock builds only) |
| `src/styles/account.css` | All styles |
| `test/unit/`, `test/e2e/` | Node tests and Playwright tests (`live.spec.mjs` is for after the rollout) |
| `docs/` | [API contract consumed](docs/API.md), [design and ergonomics](docs/DESIGN.md), [testing](docs/TESTING.md), screenshots |
