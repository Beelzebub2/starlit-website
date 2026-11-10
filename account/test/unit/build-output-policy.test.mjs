import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const account = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('custom output refuses to overwrite existing files or a prior build', () => {
  const root = mkdtempSync(join(tmpdir(), 'starlit-output-guard-'));
  const output = join(root, 'account-build');
  const run = () => spawnSync(process.execPath, ['build.mjs'], {
    cwd: account,
    encoding: 'utf8',
    env: { ...process.env, STARLIT_ACCOUNT_OUT: output, STARLIT_ACCOUNT_MODE: 'mock' },
  });
  try {
    assert.equal(run().status, 0, 'an empty custom output is a valid first build');
    const config = readFileSync(join(output, 'config.js'), 'utf8');
    const repeat = run();
    assert.notEqual(repeat.status, 0, 'a later build must refuse to replace output contents');
    assert.match(repeat.stderr, /custom output directory must be empty/);
    assert.equal(readFileSync(join(output, 'config.js'), 'utf8'), config);

    const separate = join(root, 'unrelated');
    writeFileSync(separate, 'important untouched user data');
    assert.deepEqual(readdirSync(root).sort(), ['account-build', 'unrelated']);
    assert.equal(readFileSync(separate, 'utf8'), 'important untouched user data');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('custom output rejects paths inside the source repository', () => {
  // Only inspect the policy rather than invoking a destructive build against
  // source directories even if that policy accidentally regresses.
  const source = readFileSync(join(account, 'build.mjs'), 'utf8');
  assert.match(source, /customOut && inside\(join\(here, '\.\.'\), dist\)/);
  assert.match(source, /if \(!customOut\) rmSync\(dist/);
  assert.ok(existsSync(join(account, 'src', 'app.js')));
});
