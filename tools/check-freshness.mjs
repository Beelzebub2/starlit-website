#!/usr/bin/env node
// Read-only source freshness audit. Fetch updates remote-tracking refs only.
// Never checkout, reset, stash, merge, or overwrite working files.
import { spawnSync } from 'node:child_process';

const mode = process.argv.find(a => a.startsWith('--mode='))?.slice(7) ?? 'check';
const run = (bin, args, cwd = process.cwd(), timeout = 12000) => {
  const r = spawnSync(bin, args, {
    cwd, encoding: 'utf8', windowsHide: true, timeout,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never' },
  });
  return { ok: r.status === 0 && !r.error, text: (r.stdout ?? '').trim(),
    error: (r.stderr ?? r.error?.message ?? '').trim() };
};

const root = run('git', ['rev-parse', '--show-toplevel']);
if (!root.ok) {
  console.log('FRESHNESS: No Git repository found; inspect the target repository before editing.');
  process.exit(0);
}
const cwd = root.text;
const git = (...args) => run('git', args, cwd);
const branch = git('symbolic-ref', '--short', '-q', 'HEAD').text || '(detached HEAD)';
const sha = git('rev-parse', '--short', 'HEAD').text;
const remote = git('remote', 'get-url', 'origin');
const dirty = git('status', '--porcelain=v1').text;
const fresh = remote.ok ? git('fetch', '--prune', '--quiet', 'origin') : { ok: false, error: 'no origin remote' };
const heads = git('for-each-ref', '--sort=-committerdate', '--count=8',
  '--format=%(refname:short) %(objectname:short) %(committerdate:short)', 'refs/remotes/origin').text;
const originHead = git('symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD').text;
const base = originHead || (git('rev-parse', '--verify', 'refs/remotes/origin/main').ok ? 'origin/main' :
  git('rev-parse', '--verify', 'refs/remotes/origin/Dev').ok ? 'origin/Dev' : '');
const divergence = base ? git('rev-list', '--left-right', '--count', `HEAD...${base}`) : { ok: false };
const counts = divergence.ok ? divergence.text.trim().split(/\s+/).map(Number) : [];
const behind = counts.length === 2 ? counts[1] : 0;
const ahead = counts.length === 2 ? counts[0] : 0;

const repoMatch = remote.text.match(/(?:github\.com[:/])([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i);
const repo = repoMatch ? `${repoMatch[1]}/${repoMatch[2]}` : '';
const prs = repo ? run('gh', ['pr', 'list', '--repo', repo, '--state', 'open', '--limit', '30',
  '--json', 'number,title,headRefName,baseRefName,updatedAt,url'], cwd, 15000) : { ok: false };
let list = [];
try { if (prs.ok) list = JSON.parse(prs.text); } catch { /* optional gh output */ }

console.log(`FRESHNESS AUDIT (${mode}) | ${repo || remote.text || cwd}`);
console.log(`Checkout: ${branch} @ ${sha}; local changes: ${dirty ? dirty.split('\n').length : 0}`);
console.log(`Fetch: ${fresh.ok ? 'OK' : 'UNVERIFIED - ' + (fresh.error || 'network/auth failure')}`);
if (base) console.log(`Default branch: ${base}; local checkout: +${ahead} / -${behind} commits`);
if (heads) console.log('Recently updated remote branches:\n' + heads);
if (prs.ok) {
  console.log(`Open pull requests (${list.length}):`);
  for (const p of list) console.log(`  #${p.number} ${p.headRefName} -> ${p.baseRefName} (${p.updatedAt}): ${p.title} ${p.url}`);
} else {
  console.log('Open PR list unverified; inspect GitHub PRs before editing (gh CLI not available/authenticated).');
}
if (!fresh.ok || behind > 0 || !prs.ok || list.length > 0) {
  console.log('REVIEW REQUIRED: Compare newer commits and open PRs for overlapping work. Do not assume main is newest.');
  console.log('Integrate relevant work deliberately; never auto-reset, discard, force-push, or replace newer code.');
}
if (mode === 'prepublish' && (!fresh.ok || (base && behind > 0) || (repo && !prs.ok))) {
  console.error('BLOCKED: Cannot publish from a stale or unverified checkout. Review and integrate remote work first.');
  process.exit(2);
}
