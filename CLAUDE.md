# Working in Starlit Website

Follow `AGENTS.md` before beginning each user request, including small fixes,
design reviews, merges, and releases. Claude Code's SessionStart and
UserPromptSubmit hooks run `tools/check-freshness.mjs` automatically.

Never assume the default branch has the newest implementation: compare open
pull requests and worktrees first. In particular, a later change may have been
merged to `main` while a larger design branch is still open. Preserve the
design **and** the later security, legal, and account behavior when integrating.

Do not deploy or publish before checking a fresh remote and running website
build/tests. If any freshness step cannot run, say what is unverified.
