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
5. For production deployment verify the target Cloudflare Pages project,
   deploy from the tested `main` build, and verify the live HTML and headers.
   A GitHub merge alone does **not** prove the production website changed.

If network access or PR inspection is unavailable, explicitly report that
freshness is unverified and stop any risky overwrite or publication.
