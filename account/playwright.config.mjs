// E2E tests against the mock build (synthetic data, no network), at the three
// widths the design targets. The "live" project only runs when pointed at a
// staged deployment with disposable accounts (see test/e2e/live.spec.mjs).
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 8790);
const chrome = devices['Desktop Chrome'];

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure', locale: 'en-GB' },
  webServer: {
    command: 'node build.mjs && node tools/preview.mjs',
    env: { PORT: String(PORT), STARLIT_ACCOUNT_MODE: 'mock' },
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    { name: 'desktop', use: { ...chrome, viewport: { width: 1440, height: 900 } }, testIgnore: /live\.spec/ },
    { name: 'tablet', use: { ...chrome, viewport: { width: 768, height: 1024 }, hasTouch: true }, testMatch: /(responsive|a11y)\.spec/ },
    { name: 'mobile', use: { ...chrome, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, testMatch: /(responsive|a11y)\.spec/ },
    { name: 'live', testMatch: /live\.spec/, use: { ...chrome, viewport: { width: 1440, height: 900 } } },
  ],
});
