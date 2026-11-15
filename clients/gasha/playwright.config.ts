import { defineConfig, devices } from '@playwright/test';

// A port of its own, so a `pnpm dev` (5173) or `pnpm preview` (4173) already
// running, here or in another worktree, is never mistaken for this one.
const PORT = 5179;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Never serve the report on failure: that would hang `pnpm verify`.
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  // The Phaser replay plays a step every 300 ms: the level 5 report lasts
  // about 15 s.
  expect: { timeout: 20_000 },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // Every /fight call is answered from tests/fixtures; the engine itself
    // is never reached, but the app refuses to start without its URL.
    env: {
      PUBLIC_COMBAT_ENGINE_URL:
        process.env.PUBLIC_COMBAT_ENGINE_URL ?? 'http://localhost:3000',
    },
  },
});
