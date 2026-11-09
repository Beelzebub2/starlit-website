# API contract this dashboard uses

This is the client-side view of the account dashboard API: what the browser
calls, what it sends, and how it reads the answers. The authoritative
definition is the private backend's `account_*` migrations (PR #26, merged at
`fc17191`). The mock in `src/mock/backend.js` mirrors them, and
`test/unit/api-contract.test.mjs` checks the client against that mock.

**Rollout update (2026-11-07):** all three account migrations were restored
and tested against an isolated PostgreSQL copy, then applied to the VPS. All
18 account RPCs are present, anonymous RPC access is denied, and a real
browser received GoTrue's safe error response to a deliberately invalid login.
The staging UI is read-only and serves no mock data. **Successful sign-in,
real per-profile reads and the two-account authenticated E2E have not yet
been independently verified**. These remain security gates before writes.

## Transport

* `POST {API}/rest/v1/rpc/{name}` with a JSON body. Headers: `apikey: <public
  anon key>`, `Authorization: Bearer <access token>`, `Content-Type:
  application/json`. Requests use `credentials: 'omit'` and
  `referrerPolicy: 'no-referrer'`.
* No call takes a user id. The server scopes each one to the JWT and also
  checks that the JWT's GoTrue session still exists.
* Functions that return void answer `204` or an empty body, which the client
  reads as `null`.

## Error mapping

| HTTP | Source | Client `ApiError.kind` | What the UI does |
| --- | --- | --- | --- |
| 409 | `PT409` (stale revision or `updated_at`) | `conflict` | Loads the latest version, re-applies your edits for review, never retries automatically |
| 401 | `PT401` (session revoked), expired JWT | `auth` | Drops the session from memory and goes back to sign-in with "You were signed out" |
| 403 | permission denied | `forbidden` | "Not allowed" |
| 400 | `22023` validation | `invalid` | Shows the server message with addresses and tokens removed |
| 404 / `PGRST202` | RPC not deployed | `missing` | "Not available yet" |
| 5xx / 429 | server | `server` (can be retried) | "Something went wrong", with Try again |
| network | fetch failed | `network` | "No connection", with Try again |

## Calls

| RPC | Arguments sent | Response used | Concurrency |
| --- | --- | --- | --- |
| `account_overview` | `p_profile_id` | `library_items, watch_progress, watched_records, collections, addons, plugins, last_data_change` | read |
| `account_profiles` | – | array of profile rows (`profile_index, name, avatar_color_hex, avatar_*, profile_background_*, uses_primary_addons, uses_primary_plugins, pin_enabled, pin_locked_until, updated_at`) | read |
| `account_save_profile` | `p_profile` (index, name, colour, the two "use primary" flags, and the avatar and background fields kept from the row), `p_expected_updated_at` (`null` = create only) | saved row | `updated_at` |
| `account_delete_profile` | `p_profile_id` (never 1), `p_expected_updated_at` | void | `updated_at` |
| `account_extensions` | `p_profile_id`, `p_kind` = `addons` \| `plugins` | `{ revision, items: [{ url, name, enabled, sort_order }] }` | read |
| `account_save_extensions` | whole list with `sort_order` = position, `p_expected_revision` | same as read | revision |
| `account_blob` | `p_scope` = `collections` (platform `null`) \| `profile_settings_blob` (`mobile`, `desktop`) \| `home_catalog_settings` (`home_catalog_shared`, `mobile`, `desktop`) | `{ revision, value, updated_at }` | read |
| `account_save_blob` | whole value, `p_expected_revision` | same as read | revision |
| `account_items` | `p_kind` = `library` \| `watch_progress` \| `watched_items`, `p_after_key` (the last `next_cursor`, unchanged), `p_limit` = 25 | `{ items: [{ key, value, updated_at }], next_cursor }` | read; keyset paging, stops on a short page |
| `account_save_item` | full item with the edited fields; resume points also set `last_watched` to now so the native timestamp check accepts them | `{ key, value, updated_at }` | `updated_at` |
| `account_delete_item` | key: `progress_key` string, `{content_id, content_type}` for library, `{content_id, season, episode}` for history | void | `updated_at` |
| `account_devices` | `p_limit` = 100 | installations (`installation_id, client_name, client_version, platform, device_name, updated_at`) | read |
| `account_sessions` | `p_limit` = 50 | `{ session_id, signed_in_at, expires_at, is_current }`. The UI shows only the first 8 characters of the id | read |
| `account_media_servers` | `p_profile_id`, `p_limit` = 50 | `{ server_id, server_type, name, base_url, enabled, created_at, updated_at }` | read |
| `account_save_media_server` | only `server_id?, server_type, name, base_url, enabled`; `p_expected_updated_at` (`null` = create) | saved row | `updated_at` |
| `account_delete_media_server` | `p_server_id`, `p_expected_updated_at` | void | `updated_at` |
| `account_change_pin` | `p_new_pin` (4 digits), `p_current_pin` (when a PIN exists) | `{ ok, retry_after_seconds }` | lockout on the server |
| `account_remove_pin` | `p_current_pin` | `{ ok, retry_after_seconds }` | lockout on the server |
| `verify_profile_pin` (existing native RPC) | `p_pin` | `[{ unlocked, retry_after_seconds }]` | lockout on the server |

## GoTrue (sign-in)

| Endpoint | Used for |
| --- | --- |
| `POST /auth/v1/token?grant_type=password` | email and password sign-in |
| `POST /auth/v1/token?grant_type=refresh_token` | refresh one minute before the 900-second access token expires |
| `GET /auth/v1/user` | after Google sign-in |
| `POST /auth/v1/logout?scope=local\|others\|global` | sign out of this browser, every other session, or everywhere |
| `GET /auth/v1/authorize?provider=google` + `POST /auth/v1/token?grant_type=pkce` | Google with PKCE; off unless `STARLIT_GOOGLE_SIGNIN=1` |
| `POST /auth/v1/passkeys/authentication/options` and `POST /auth/v1/passkeys/authentication/verify` | Passkey sign-in; browser WebAuthn assertion verified by GoTrue, only enabled with `STARLIT_PASSKEY_SIGNIN=1` and exact RP-related origin allowlisting |

Changing passwords and email, registering/removing passkeys and creating accounts
stay in the native app. The website can sign in using a previously registered
passkey when the browser supports Related Origin Requests.

## Client-side rules the server doesn't enforce

* **Collections.** The server stores the array as it is. Before saving, the
  editor applies the client's own import rules (ids, titles, duplicates,
  numeric Trakt list ids, addon and TMDB required fields), plus stricter
  checks: known TMDB source types, a TMDB id for every type except DISCOVER,
  https artwork, a year range, a vote range, and the 1 MB / 1000-item limits.
  Unknown fields are kept.
* **Settings.** Only leaves you touch change. Device-only values (download
  folders, hardware decoding, cache) and opaque `*_payload` strings are
  read-only. Keys that look like credentials are hidden, and the client never
  sends or deletes them: if a blob holds any, saving that blob is turned off.
* **Addon addresses.** Shown redacted (scheme, host, last path segment only).
  Copying the full address goes to the clipboard and is never shown on screen.

## Not available, and why

| Missing | Why | What the UI does |
| --- | --- | --- |
| Signing out one specific device | Installations aren't linked to GoTrue sessions, and deleting Auth rows directly would bypass GoTrue | No per-session button; "Sign out everywhere" is offered |
| Self-service account deletion | Needs a server-side reauthentication flow that's been tested | Links to the website's deletion page (by email) |
| Signing in to Jellyfin or Emby | Needs an encrypted token vault and an SSRF policy | Name and address only, with a note |
| Resetting a PIN with the account password | The server RPC deliberately refuses | Says it isn't available yet |
| Membership and billing | The product is free | Says so |
| TV-only settings | Not a separate domain in the apps | Says so |
| Looking up addon manifests or Trakt slugs | The browser must not fetch user-supplied addresses that may carry keys | Manual addon id and numeric Trakt id, with hints |
