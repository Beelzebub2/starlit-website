// Client for the Starlit account RPCs (backend migration 20261107*, PR #26).
// Every call is a POST to /rest/v1/rpc/<name> with the public anon key and the
// signed-in user's bearer token. No call takes a user id: the server scopes
// everything to the JWT. Tokens are never logged or put into error text.
import { ApiError, errorFromResponse, networkError } from './errors.js';

export const ITEM_KINDS = ['library', 'watch_progress', 'watched_items'];
export const EXTENSION_KINDS = ['addons', 'plugins'];
export const BLOB_SCOPES = {
  collections: [null],
  profile_settings_blob: ['mobile', 'desktop'],
  home_catalog_settings: ['home_catalog_shared', 'mobile', 'desktop'],
};

export function createApi({ baseUrl, anonKey, transport, getAccessToken, onAuthError }) {
  async function rpc(name, args = {}, { signal } = {}) {
    const token = await getAccessToken();
    if (!token) throw new ApiError('auth', { status: 401, message: 'Not signed in' });
    let response;
    try {
      response = await transport(`${baseUrl}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(args),
        signal,
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
      });
    } catch (cause) {
      throw networkError(cause);
    }
    if (!response.ok) {
      const error = await errorFromResponse(response);
      if (error.kind === 'auth') onAuthError?.(error, token);
      throw error;
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  const kindCheck = (value, allowed) => {
    if (!allowed.includes(value)) throw new ApiError('invalid', { message: `Unsupported kind ${value}` });
  };

  return {
    rpc,
    overview: (profileId, opts) => rpc('account_overview', { p_profile_id: profileId }, opts),
    profiles: opts => rpc('account_profiles', {}, opts),
    saveProfile: (profile, expectedUpdatedAt, opts) =>
      rpc('account_save_profile', { p_profile: profile, p_expected_updated_at: expectedUpdatedAt ?? null }, opts),
    deleteProfile: (profileId, expectedUpdatedAt, opts) =>
      rpc('account_delete_profile', { p_profile_id: profileId, p_expected_updated_at: expectedUpdatedAt }, opts),
    extensions: async (profileId, kind, opts) => {
      kindCheck(kind, EXTENSION_KINDS);
      return rpc('account_extensions', { p_profile_id: profileId, p_kind: kind }, opts);
    },
    saveExtensions: async (profileId, kind, items, expectedRevision, opts) => {
      kindCheck(kind, EXTENSION_KINDS);
      return rpc('account_save_extensions', { p_profile_id: profileId, p_kind: kind, p_items: items, p_expected_revision: expectedRevision }, opts);
    },
    blob: async (profileId, scope, platform, opts) => {
      kindCheck(platform, BLOB_SCOPES[scope] ?? []);
      return rpc('account_blob', { p_profile_id: profileId, p_scope: scope, p_platform: platform }, opts);
    },
    saveBlob: async (profileId, scope, platform, value, expectedRevision, opts) => {
      kindCheck(platform, BLOB_SCOPES[scope] ?? []);
      return rpc('account_save_blob', { p_profile_id: profileId, p_scope: scope, p_platform: platform, p_value: value, p_expected_revision: expectedRevision }, opts);
    },
    items: async (profileId, kind, afterKey, limit, opts) => {
      kindCheck(kind, ITEM_KINDS);
      return rpc('account_items', { p_profile_id: profileId, p_kind: kind, p_after_key: afterKey ?? null, p_limit: limit }, opts);
    },
    saveItem: async (profileId, kind, item, expectedUpdatedAt, opts) => {
      kindCheck(kind, ITEM_KINDS);
      return rpc('account_save_item', { p_profile_id: profileId, p_kind: kind, p_item: item, p_expected_updated_at: expectedUpdatedAt ?? null }, opts);
    },
    deleteItem: async (profileId, kind, key, expectedUpdatedAt, opts) => {
      kindCheck(kind, ITEM_KINDS);
      return rpc('account_delete_item', { p_profile_id: profileId, p_kind: kind, p_key: key, p_expected_updated_at: expectedUpdatedAt }, opts);
    },
    devices: (limit = 100, opts) => rpc('account_devices', { p_limit: limit }, opts),
    sessions: (limit = 50, opts) => rpc('account_sessions', { p_limit: limit }, opts),
    mediaServers: (profileId, limit = 50, opts) => rpc('account_media_servers', { p_profile_id: profileId, p_limit: limit }, opts),
    saveMediaServer: (profileId, server, expectedUpdatedAt, opts) =>
      rpc('account_save_media_server', { p_profile_id: profileId, p_server: server, p_expected_updated_at: expectedUpdatedAt ?? null }, opts),
    deleteMediaServer: (profileId, serverId, expectedUpdatedAt, opts) =>
      rpc('account_delete_media_server', { p_profile_id: profileId, p_server_id: serverId, p_expected_updated_at: expectedUpdatedAt }, opts),
    changePin: (profileId, newPin, currentPin, opts) =>
      rpc('account_change_pin', { p_profile_id: profileId, p_new_pin: newPin, p_current_pin: currentPin ?? null }, opts),
    removePin: (profileId, currentPin, opts) =>
      rpc('account_remove_pin', { p_profile_id: profileId, p_current_pin: currentPin }, opts),
    // Existing native RPC (updated by the same migration): a UX gate, not authentication.
    verifyPin: async (profileId, pin, opts) => {
      const rows = await rpc('verify_profile_pin', { p_profile_id: profileId, p_pin: pin }, opts);
      const row = Array.isArray(rows) ? rows[0] : rows;
      return { unlocked: Boolean(row?.unlocked), retryAfterSeconds: Number(row?.retry_after_seconds ?? 0) };
    },
  };
}

/** Item key the server accepts for deletion (mirrors starlit_private.item_key with p_delete). */
export function deleteKeyFor(kind, value) {
  if (kind === 'watch_progress') return String(value.progress_key ?? '');
  if (kind === 'library') return { content_id: value.content_id, content_type: value.content_type };
  return { content_id: value.content_id, season: value.season ?? null, episode: value.episode ?? null };
}
