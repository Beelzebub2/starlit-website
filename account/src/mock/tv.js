// Synthetic TV approval service for the demo build only.
export function createMockTv({ backend, json, scenario }) {
  const requests = new Map();
  const devices = new Map();
  return (path, token, body) => {
    if (path === '/.well-known/nuvio') return json(200, {
      capabilities: { tv_login: scenario.tvLoginEnabled },
      device_authorization: Object.fromEntries([['version', 1], ...['start', 'poll', 'request', 'approve', 'deny', 'devices', 'revoke'].map(name => [name + '_endpoint', 'https://mock.invalid/tv/v1/' + name])]),
    });
    const user = backend.auth.user(token);
    const list = devices.get(user.id) ?? [];
    if (path === '/tv/v1/devices') return json(200, { devices: list });
    if (path === '/tv/v1/revoke') {
      const device = list.find(d => d.device_id === body.device_id);
      if (!device) return json(404, { error: 'not_found' });
      device.revoked_at = new Date().toISOString();
      return json(200, { status: 'revoked' });
    }
    if (!scenario.tvLoginEnabled) return json(503, { error: 'temporarily_unavailable' });
    if (body.user_code === 'EXPR-1234') return json(400, { error: 'expired_token' });
    if (!['ABCD-EFGH', 'DENY-1234'].includes(body.user_code)) return json(404, { error: 'not_found' });
    const key = body.user_code;
    const prior = requests.get(key);
    if (prior?.status) return json(409, { error: 'invalid_state' });
    if (path === '/tv/v1/request') {
      const request = { user_code: key, device_name: 'Living room TV', expires_at: new Date(Date.now() + 600_000).toISOString(), approval_token: crypto.randomUUID().replaceAll('-', '') + 'abcdefghijkl'.slice(0, 11) };
      requests.set(key, { ...request, userId: user.id });
      return json(200, request);
    }
    if (!prior || prior.userId !== user.id || prior.approval_token !== body.approval_token || body.confirm !== true) return json(400, { error: 'invalid_request' });
    if (path === '/tv/v1/approve' || path === '/tv/v1/deny') {
      prior.status = path.endsWith('/approve') ? 'approved' : 'denied';
      if (prior.status === 'approved') {
        list.push({ device_id: crypto.randomUUID(), device_name: prior.device_name, authorized_at: new Date().toISOString(), revoked_at: null });
        devices.set(user.id, list);
      }
      return json(200, { status: prior.status });
    }
    return json(404, { error: 'not_found' });
  };
}
