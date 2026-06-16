import { defineConfig } from '@playwright/test';

// Layer 2 of the sidebar DnD testing strategy: a single happy-path
// smoke that drives the real pointer-drag controller in a real Chromium with
// the built extension loaded. Layer 1 (component bus-dispatch assertions) lives
// in Vitest under `src/sidebar/*.test.ts`.
//
// NOTE: Chromium loads MV3 extensions only in headed mode or `--headless=new`,
// never the default headless "shell". The extension fixture launches headed; on
// a headless CI box run under `xvfb-run pnpm test:e2e`.
export default defineConfig({
  testDir: './e2e',
  // The extension fixture launches a persistent context (a real browser
  // profile); these must not run concurrently against one profile dir.
  workers: 1,
  fullyParallel: false,
  // These headed-MV3 smokes drive a real persistent-context Chromium and are
  // inherently timing-sensitive: under heavy back-to-back load a single
  // multi-step menu/drag gesture can drop a click or stall an rAF-driven reveal.
  // Retry once everywhere (CI already did) so a transient load flake self-heals;
  // a genuine regression still fails both attempts.
  retries: 1,
  reporter: [['list']],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    trace: 'retain-on-failure',
  },
});
