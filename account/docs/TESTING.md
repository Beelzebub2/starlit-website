# Testing

## Automated (mock build, synthetic data)

`npm test` runs 36 Node tests, including the three VPS-hosting hardening
checks.

| Area | Checked |
| --- | --- |
| API contract (`api-contract.test.mjs`) | The real client against the mock backend: per-profile counts; isolation between the two accounts, with no user id in any request; 409 on a stale revision and on a stale `updated_at`; a three-way settings merge that keeps unknown keys; the server stripping provider keys; keyset paging (62 items in 3 pages, no duplicates, limits enforced); the five-try PIN lockout and `{ok:false}` results; profile create, conflict and delete (never profile 1); media servers saving metadata only; sign-out of others and everywhere; a revoked session giving 401 and the callback; typed errors for 500, 404, 403 and network failures |
| Logic (`logic.test.mjs`) | The client's collection import rules plus the stricter TMDB, Trakt and https checks; templates and presets; normalisation that keeps unknown fields; list and object merges; settings classification (device, credential, opaque); URL and token redaction; time parsing |
| Policy and build (`policy-and-build.test.mjs`) | No `innerHTML`, `eval` or `console.*`; tokens never in storage; full EN/PT key parity; no reference images or other brands; the mock build's CSP and headers; the live build has no mock code or test passwords, puts the API origin in `connect-src`, and is read-only by default; refusal of service keys, missing keys and http; the public website keeps `script-src 'none'` |

`npm run e2e` runs the Playwright suite in Chromium: everything at 1440 px,
and the responsive and accessibility specs at 768 and 390 px too.

| Spec | Checked |
| --- | --- |
| `auth` | wrong password; a deep link surviving sign-in; **two accounts never seeing each other's data**; a session revoked elsewhere; nothing in storage and a reload signing you out; Portuguese |
| `pin` | the PIN gate; **5 wrong tries → lockout with a countdown and a disabled field**; setting a PIN, and a failed removal reported as a failure |
| `editing` | keyboard reorder and toggles saved; addresses with secrets never shown; **addons 409 → merge → save**; Load more keeping focus; removing with a confirmation; editing a resume point, **with a 409 and side-by-side values**; settings keeping unknown and device keys; **a settings conflict choosing "Use mine"**; the collection editor from a preset to saved JSON (Fix focusing the field); an invalid import explained; a profile added and deleted with typed confirmation; media server URL validation; signing out others and everywhere; the unsaved-changes guard |
| `states` | skeleton at final size; 500 / 404 / 403 / network errors each with Try again; 401 → sign-in; offline banner with saving blocked and edits kept; empty states; reduced motion |
| `a11y` | axe (WCAG 2.0, 2.1 and 2.2 A/AA) on sign-in, the profile picker, all 12 pages and 3 dialogs, at three widths: no serious or critical violations |
| `responsive` | no sideways scrolling on 9 pages at 390, 768 and 1440 px; the small-screen menu dialog returning focus; documentation screenshots |

## Not yet verified

* **Authenticated live API and per-profile data.** The migrations are
  deployed and anonymous access is denied. Chromium loaded the live staging
  sign-in page without console errors, then handled a fictitious invalid
  sign-in through the real API. Successful authentication and isolation of
  two independent live accounts have not yet been E2E tested.
* **A screen reader.** Labels, roles, live regions and focus order are covered
  by axe and the keyboard tests, but nobody has used NVDA, VoiceOver or
  TalkBack on it yet.
* **Other browsers.** Only Chromium has been run. Firefox and Safari still
  need a pass: `<dialog>`, `:has()` and `structuredClone` are all supported,
  but that isn't the same as tested.

## Live E2E (next security gate)

`test/e2e/live.spec.mjs` is skipped until all of these are true:

1. The backend migrations are deployed, following the backend's rollout
   checklist (backup, migrate, smoke test). **Completed 2026-11-07.**
2. A **read-only** live build is served at a staging address
   (`STARLIT_ACCOUNT_MODE=live`, no `STARLIT_ACCOUNT_WRITES`).
   **Completed: `https://account-stage.62-171-179-229.sslip.io/`.**
3. An operator has created two disposable accounts.

```
STARLIT_E2E_LIVE=1 STARLIT_E2E_URL=https://<staging> \
STARLIT_E2E_A_EMAIL=… STARLIT_E2E_A_PASSWORD=… \
STARLIT_E2E_B_EMAIL=… STARLIT_E2E_B_PASSWORD=… \
npx playwright test --project=live
```

That checks isolation between the accounts and the sessions page. After a
build with `STARLIT_ACCOUNT_WRITES=1`, add `STARLIT_E2E_WRITES=1` to run a
real cross-browser 409. Credentials come only from the environment. Remove the
test data with the approved admin tooling.
