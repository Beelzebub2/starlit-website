import test from 'node:test';
import assert from 'node:assert/strict';
import { getAt, setAt, leaves, mergeObjects } from '../../src/lib/merge.js';
import { withoutCredentials, withValue } from '../../src/lib/settings.js';

test('settings edits reject prototype-polluting paths and never inspect inherited keys', () => {
  const clean = {};
  for (const path of [
    ['__proto__', 'polluted'], ['constructor', 'prototype', 'polluted'], ['features', 'prototype', 'polluted'],
  ]) {
    assert.throws(() => setAt(clean, path, true));
    assert.throws(() => withValue(clean, path, true));
    assert.equal(getAt(clean, path), undefined);
  }
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(({}).polluted, undefined);
});

test('malicious JSON keys never enter the edited settings object or conflict paths', () => {
  const poisoned = JSON.parse('{"features":{"safe":{"enabled":true},"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}}');
  const paths = [...leaves(poisoned).values()].map(entry => entry.path.join('.'));
  assert.deepEqual(paths, ['features.safe.enabled']);
  const result = mergeObjects({}, poisoned, {});
  assert.equal(result.value.features.safe.enabled, true);
  assert.equal(Object.prototype.polluted, undefined);
  const clean = withoutCredentials(poisoned);
  assert.deepEqual(Object.keys(clean.features), ['safe']);
});
