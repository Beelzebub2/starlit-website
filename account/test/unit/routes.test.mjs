import test from 'node:test';
import assert from 'node:assert/strict';
import { accountUrl, readAccountUrl } from '../../src/lib/routes.js';

const BASE = '/account/';
const sections = [
  ['/', 'overview'], ['/library', 'library'], ['/progress', 'progress'],
  ['/history', 'history'], ['/addons', 'addons'], ['/plugins', 'plugins'],
  ['/collections', 'collections'], ['/settings', 'settings'], ['/servers', 'servers'],
  ['/profiles', 'profiles'], ['/security', 'security'], ['/signin', 'signin'],
  ['/choose-profile', 'choose-profile'], ['/auth/callback', 'auth-callback'],
];

test('all account sections use exactly one canonical /account?tab= address', () => {
  for (const [path, tab] of sections) {
    const href = accountUrl(path, BASE);
    assert.equal(href, '/account?tab=' + tab);
    const { path: route, canonical, query } = readAccountUrl(href, BASE);
    assert.equal(route, path, tab);
    assert.equal(canonical, href);
    assert.equal(query.size, 0);
    assert.equal(new URL(href, 'https://starlit.test').pathname, '/account');
  }
});

test('overview defaults to /account but canonicalizes to the explicit overview tab', () => {
  for (const href of ['https://starlit.test/account', 'https://starlit.test/account/']) {
    const resolved = readAccountUrl(href, BASE);
    assert.equal(resolved.path, '/');
    assert.equal(resolved.canonical, '/account?tab=overview');
  }
});

test('collections create and edit retain their IDs without adding URL paths', () => {
  assert.equal(accountUrl('/collections/new', BASE), '/account?tab=collections&action=new');
  assert.equal(readAccountUrl('https://starlit.test/account?tab=collections&action=new', BASE).path, '/collections/new');
  const id = 'a/short token?';
  const href = accountUrl('/collections/edit/' + encodeURIComponent(id), BASE);
  assert.equal(href, '/account?tab=collections&action=edit&id=a%2Fshort+token%3F');
  const resolved = readAccountUrl('https://starlit.test' + href, BASE);
  assert.equal(resolved.path, '/collections/edit/' + encodeURIComponent(id));
});

test('settings preserve non-route query fields and OAuth callback retains code', () => {
  const url = accountUrl('/settings?scope=profile_settings_blob&platform=mobile', BASE);
  assert.equal(url, '/account?tab=settings&scope=profile_settings_blob&platform=mobile');
  assert.equal(readAccountUrl(url, BASE).query.get('scope'), 'profile_settings_blob');
  assert.equal(readAccountUrl(url, BASE).query.get('platform'), 'mobile');
  const oauth = readAccountUrl('/account?tab=auth-callback&code=opaque-123&state=q', BASE);
  assert.equal(oauth.path, '/auth/callback');
  assert.equal(oauth.query.get('code'), 'opaque-123');
  assert.ok(!oauth.canonical.includes('/auth/callback'));
});

test('historical deep links are read, then redirected without losing their destination', () => {
  const legacy = [
    ['/account/plugins', 'plugins', '/plugins'],
    ['/account/settings?scope=x&platform=desktop', 'settings', '/settings'],
    ['/account/collections/new', 'collections', '/collections/new'],
    ['/account/collections/edit/abc', 'collections', '/collections/edit/abc'],
  ];
  for (const [url, tab, path] of legacy) {
    const route = readAccountUrl(url, BASE);
    assert.equal(route.path, path);
    assert.equal(route.legacy, true);
    assert.equal(new URL(route.canonical, 'https://starlit.test').searchParams.get('tab'), tab);
  }
});

test('unknown tabs, outside URLs and unsafe route attempts are not routed', () => {
  assert.equal(readAccountUrl('/account?tab=not-real', BASE).path, '/__unknown_tab__');
  assert.equal(readAccountUrl('/account?tab=collections&action=other', BASE).path, '/__unknown_tab__');
  assert.equal(readAccountUrl('/accountancy?tab=plugins', BASE), null);
  assert.equal(readAccountUrl('/library', BASE), null);
  assert.throws(() => accountUrl('//evil.test', BASE));
  assert.throws(() => accountUrl('/not-real', BASE));
});

test('the standalone mock app uses the same query navigation on its root', () => {
  assert.equal(accountUrl('/plugins'), '/?tab=plugins');
  assert.equal(readAccountUrl('/?tab=plugins').path, '/plugins');
  assert.equal(readAccountUrl('/plugins').canonical, '/?tab=plugins');
});
