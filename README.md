# Starlit official website

Static EN/PT-PT website for `https://starlit.rrmtools.uk/`.
Keep it **separate** from the production account API at
`https://starlit-api.rrmtools.uk/` (no API proxying or account tokens on this website).

## Pages

- Homepage, privacy, terms, cookies, delete-account, contact, legal operator
- The matching 7 pages in Portuguese (Portugal) under `/pt/`
- Existing Starlit logo, no Google or Cloudflare account credentials in site code
- No contact form, third-party JavaScript, tracking or ad scripts; all email links
  use `support.starlit@rrmtools.uk`

Run `npm run build` and `npm test`. Deploy `dist` to the Cloudflare Pages
project `starlit-official`, with the custom domain `starlit.rrmtools.uk`.
For a clean environment, `npx wrangler pages project create starlit-official`
then `npx wrangler pages deploy dist --project-name starlit-official --branch main`.

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
