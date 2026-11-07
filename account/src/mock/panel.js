// Test controls for the mock build only (never in a live build): latency,
// failures, offline, and edits "from another device" to produce real 409s.
import { h } from '../lib/dom.js';
import { state } from '../lib/state.js';
import { backend, scenario } from './transport.js';

export function mountMockPanel({ onChange } = {}) {
  const status = h('p', { class: 'mock-status', 'aria-live': 'polite' });
  const say = text => { status.textContent = text; };

  const latency = h('select', { class: 'input select', id: 'mock-latency', onchange: e => { scenario.latencyMs = Number(e.target.value); say(`Latency ${scenario.latencyMs} ms`); } },
    [0, 250, 1500].map(ms => h('option', { value: String(ms), selected: ms === scenario.latencyMs }, `${ms} ms`)));
  const failure = h('select', { class: 'input select', id: 'mock-fail' },
    [['', 'Nothing'], ['offline', 'Network error'], ['401', '401 session revoked'], ['403', '403 forbidden'], ['404', '404 RPC not deployed'], ['500', '500 server error']]
      .map(([v, l]) => h('option', { value: v }, l)));
  const armFailure = h('button', { type: 'button', class: 'btn btn-ghost btn-s', onclick: () => { scenario.failNext = failure.value || null; say(failure.value ? `Next request fails: ${failure.value}` : 'No failure armed'); } }, 'Arm');
  const offline = h('input', { type: 'checkbox', id: 'mock-offline', onchange: e => {
    scenario.offline = e.target.checked;
    window.dispatchEvent(new Event(e.target.checked ? 'offline' : 'online'));
    onChange?.();
  } });

  const remote = what => () => {
    const email = state.user?.email;
    if (!email) { say('Sign in first'); return; }
    say(backend.remoteEdit(email, what, state.profileId ?? 1) ? `Another device changed: ${what}` : `Nothing to change for ${what}`);
  };
  const edits = ['addons', 'collections', 'settings', 'profile', 'progress', 'revoke'].map(what =>
    h('button', { type: 'button', class: 'btn btn-ghost btn-s', dataset: { mockEdit: what }, onclick: remote(what) }, what === 'revoke' ? 'revoke sessions' : what));

  const panel = h('details', { class: 'mock-panel' },
    h('summary', {}, 'Mock API controls'),
    h('div', { class: 'mock-body' },
      h('p', { class: 'mock-note' }, 'Synthetic data in this browser tab only. Nothing here reaches a Starlit server.'),
      h('label', { for: 'mock-latency' }, 'Latency'), latency,
      h('label', { for: 'mock-fail' }, 'Next request'), h('div', { class: 'mock-row' }, failure, armFailure),
      h('label', { class: 'mock-check', for: 'mock-offline' }, offline, ' Offline'),
      h('p', { class: 'mock-label' }, 'Another device edits the current profile:'),
      h('div', { class: 'mock-row mock-wrap' }, edits),
      status));
  document.body.append(panel);
}
