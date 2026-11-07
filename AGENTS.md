# Source freshness is mandatory

Before starting *any* code, release, site, or deployment task in this repository:

1. Run `node tools/check-freshness.mjs --mode=check`. Fetch `origin` and inspect
   the current branch, its divergence from the default branch, recent remote
   branches, and **open pull requests**. The latest work may be in an unmerged PR.
2. Read the newest relevant commits, PR discussions, and diffs, not just `main`.
   Compare overlapping files and features to avoid reintroducing retired code.
3. Preserve uncommitted local changes and other agents' worktrees. Never
   silently reset, force-push, overwrite a newer file, or recreate an existing
   feature. Integrate selectively into a task branch or existing PR.
4. Before a merge, push, deployment, or release, run
   `node tools/check-freshness.mjs --mode=prepublish` plus `npm run build`
   and `npm test`; fix conflicts and recheck the current remote heads.
5. The target for the new unified website is the Ubuntu VPS, not Cloudflare
   Pages. Stage the combined marketing + /account/ build using deploy/vps,
   verify both path-specific CSPs, account security and real HTTPS before
   changing the production DNS record. Do not interrupt the still-live
   Cloudflare Pages deployment until DNS authority and rollback are ready.
   A GitHub merge alone does **not** prove the production website changed.

If network access or PR inspection is unavailable, explicitly report that
freshness is unverified and stop any risky overwrite or publication.
