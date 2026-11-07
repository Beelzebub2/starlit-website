// Synthetic test accounts for the mock API. Every name, title, address and
// credential here is invented; none belongs to a real Starlit account.
// The test passwords and PIN exist only for local and E2E tests.

export const TEST_ACCOUNTS = {
  a: { email: 'ana@example.test', password: 'demo-ana-2026', pins: { 2: '2468' } },
  b: { email: 'ben@example.test', password: 'demo-ben-2026', pins: {} },
};

const ADJ = ['Quiet', 'Paper', 'Northern', 'Hollow', 'Silver', 'Late', 'Little', 'Bright', 'Velvet', 'Distant'];
const NOUN = ['Harbor', 'Orbit', 'Meadow', 'Signal', 'Lantern', 'Season', 'Ferry', 'Atlas', 'Coast', 'Hours'];
const titles = (from, count) => {
  const out = [];
  for (let i = from; out.length < count; i++) out.push(`${ADJ[i % 10]} ${NOUN[Math.floor(i / 10) % 10]}`);
  return out;
};
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const HOUR = 3600e3, DAY = 24 * HOUR;

function library(names, now) {
  return names.map((name, i) => ({
    content_id: `demo:${slug(name)}`,
    content_type: i % 3 === 2 ? 'movie' : 'series',
    name,
    poster_shape: 'POSTER',
    genres: i % 2 ? ['Drama'] : ['Comedy', 'Mystery'],
    release_info: String(2014 + (i % 12)),
    added_at: now - (i + 1) * 7 * HOUR,
  }));
}

function progress(names, now) {
  return names.map((name, i) => {
    const series = i % 3 !== 2;
    const season = series ? 1 + (i % 3) : null;
    const episode = series ? 1 + (i % 9) : null;
    const id = `demo:${slug(name)}`;
    const duration = series ? 2580000 : 6420000;
    return {
      content_id: id, content_type: series ? 'series' : 'movie', name,
      video_id: series ? `${id}:${season}:${episode}` : id,
      progress_key: series ? `${id}_s${season}e${episode}` : id,
      season, episode,
      position: Math.round(duration * (0.12 + (i % 7) * 0.11)), duration,
      last_watched: now - (i + 1) * 5 * HOUR,
    };
  });
}

function watched(names, now) {
  return names.map((name, i) => {
    const series = i % 4 !== 3;
    return {
      content_id: `demo:${slug(name)}`, content_type: series ? 'series' : 'movie', title: name,
      season: series ? 1 + (i % 2) : null, episode: series ? 1 + (i % 10) : null,
      watched_at: now - (i + 2) * 9 * HOUR,
    };
  });
}

const settingsMobile = {
  version: 4,
  features: {
    theme_settings: { accent: 'cyan', amoled_black: false, reduce_motion: false },
    poster_card_style_settings_payload: '{"corner":12,"labels":true}',
    player_settings: { preferred_audio_language: 'pt', preferred_subtitle_language: 'pt', subtitle_size: 22, autoplay_next_episode: true, skip_intro: true, hardware_decoding: true },
    stream_badge_settings: { show_quality: true, show_size: false },
    debrid_settings: { prefer_cached: true },
    tmdb_settings: { language: 'pt-PT', include_adult: false },
    mdblist_settings: { enabled: false },
    continue_watching_settings_payload: '{"limit":20}',
    trakt_comments_settings: { show_spoilers: false },
    notifications_settings: { episode_release_alerts_enabled: false },
    // A key from a newer app build this dashboard does not know: it must survive edits.
    airing_now_experiment: { enabled: true, rollout: 'beta' },
  },
  download_settings: { download_folder: '/storage/emulated/0/Download/Starlit', wifi_only: true },
};

const settingsDesktop = {
  version: 4,
  features: {
    theme_settings: { accent: 'cyan', amoled_black: true, reduce_motion: true },
    player_settings: { preferred_audio_language: 'en', preferred_subtitle_language: 'pt', subtitle_size: 28, autoplay_next_episode: false, skip_intro: true, hardware_decoding: false },
    stream_badge_settings: { show_quality: true, show_size: true },
    notifications_settings: { episode_release_alerts_enabled: true },
  },
};

const homeShared = { hidden_airing_now: ['demo:late-orbit'], rows: [{ id: 'continue', visible: true }, { id: 'library', visible: true }] };

function collections() {
  return [
    {
      id: '6f1c2b6e-4d1a-4c55-9a39-1a0c9d1b2a01', title: 'Weekend picks', backdropImageUrl: null, pinToTop: true,
      viewMode: 'TABBED_GRID', showAllTab: true,
      folders: [
        { id: 'f-comfort', title: 'Comfort shows', coverImageUrl: null, coverEmoji: '☕', tileShape: 'poster', hideTitle: false,
          sources: [{ provider: 'tmdb', tmdbSourceType: 'LIST', title: 'Comfort list', tmdbId: 8, mediaType: 'TV', sortBy: 'original' }] },
        { id: 'f-demo-catalog', title: 'From the demo catalog', coverImageUrl: null, tileShape: 'landscape', hideTitle: false,
          sources: [{ provider: 'addon', addonId: 'demo.catalog', type: 'series', catalogId: 'top', genre: null }],
          // Unknown to this dashboard: must be preserved untouched.
          focusGifEnabled: true },
      ],
    },
    {
      id: '6f1c2b6e-4d1a-4c55-9a39-1a0c9d1b2a02', title: 'Lists I follow', backdropImageUrl: null, pinToTop: false,
      viewMode: 'ROWS', showAllTab: false,
      folders: [
        { id: 'f-trakt', title: 'Shared list', coverImageUrl: null, tileShape: 'poster', hideTitle: false,
          sources: [{ provider: 'trakt', traktListId: 12345, title: 'Shared list', mediaType: null, sortBy: 'rank', sortHow: 'asc' }] },
      ],
    },
  ];
}

/** Build both accounts relative to `now`, so dates read naturally ("2 hours ago"). */
export function buildFixtures(now = Date.now()) {
  const iso = ms => new Date(ms).toISOString();
  return [
    {
      id: '00000000-0000-4000-a000-00000000000a', email: TEST_ACCOUNTS.a.email, password: TEST_ACCOUNTS.a.password,
      created_at: iso(now - 220 * DAY), providers: ['email'],
      profiles: [
        { profile_index: 1, name: 'Ana', avatar_color_hex: '#45D6EB' },
        { profile_index: 2, name: 'Rui', avatar_color_hex: '#F2B84B', pin: TEST_ACCOUNTS.a.pins[2] },
        { profile_index: 3, name: 'Kids', avatar_color_hex: '#7FD99A', uses_primary_addons: true },
      ],
      data: {
        1: {
          library: library(titles(0, 62), now), watch_progress: progress(titles(5, 27), now), watched_items: watched(titles(12, 40), now),
          addons: [
            { url: 'https://catalog.example.test/manifest.json', name: 'Demo Catalog', enabled: true },
            { url: 'https://streams.example.test/conf/SYNTHETIC-not-a-real-key-3f9a7c/manifest.json', name: 'Demo Streams', enabled: true },
            { url: 'https://subtitles.example.test/manifest.json?lang=pt', name: 'Demo Subtitles', enabled: false },
            { url: 'https://anime.example.test/manifest.json', name: 'Demo Anime Catalog', enabled: true },
          ],
          plugins: [{ url: 'https://plugins.example.test/repo.json', name: 'Demo plugin repository', enabled: true }],
          collections: collections(),
          profile_settings_blob: { mobile: settingsMobile, desktop: settingsDesktop },
          home_catalog_settings: { home_catalog_shared: homeShared },
          servers: [{ server_type: 'jellyfin', name: 'Home server', base_url: 'https://media.example.test:8920', enabled: true }],
        },
        2: {
          library: library(titles(70, 8), now), watch_progress: progress(titles(72, 3), now), watched_items: watched(titles(74, 6), now),
          addons: [{ url: 'https://catalog.example.test/manifest.json', name: 'Demo Catalog', enabled: true }],
          plugins: [], collections: [],
          profile_settings_blob: { mobile: { version: 4, features: { theme_settings: { accent: 'amber' } } } },
          home_catalog_settings: {}, servers: [],
        },
        3: {
          library: library(titles(90, 5), now), watch_progress: [], watched_items: [],
          addons: [], plugins: [], collections: [], profile_settings_blob: {}, home_catalog_settings: {}, servers: [],
        },
      },
      devices: [
        { installation_id: 'inst-a-1', client_name: 'Starlit', client_version: '1.13.0', platform: 'windows', device_name: 'Living room PC', updated_at: iso(now - 2 * HOUR) },
        { installation_id: 'inst-a-2', client_name: 'Starlit', client_version: '1.13.0', platform: 'android', device_name: 'Phone', updated_at: iso(now - 26 * HOUR) },
        { installation_id: 'inst-a-3', client_name: 'Starlit', client_version: '1.12.3', platform: 'windows', device_name: 'Old laptop', updated_at: iso(now - 40 * DAY) },
      ],
      otherSessions: [iso(now - 3 * DAY), iso(now - 12 * DAY)],
    },
    {
      id: '00000000-0000-4000-b000-00000000000b', email: TEST_ACCOUNTS.b.email, password: TEST_ACCOUNTS.b.password,
      created_at: iso(now - 30 * DAY), providers: ['email', 'google'],
      profiles: [{ profile_index: 1, name: 'Ben', avatar_color_hex: '#B794F4' }],
      data: {
        1: {
          library: library(titles(40, 12), now), watch_progress: progress(titles(44, 4), now), watched_items: watched(titles(50, 9), now),
          addons: [{ url: 'https://catalog-b.example.test/manifest.json', name: 'Ben Catalog', enabled: true }],
          plugins: [], collections: [], profile_settings_blob: {}, home_catalog_settings: {}, servers: [],
        },
      },
      devices: [{ installation_id: 'inst-b-1', client_name: 'Starlit', client_version: '1.13.0', platform: 'android', device_name: 'Tablet', updated_at: iso(now - 5 * HOUR) }],
      otherSessions: [],
    },
  ];
}
