import { fileURLToPath } from 'node:url';
import { type BrowserContext, test as base, chromium } from '@playwright/test';

// Loads the built extension (`dist/`) into a fresh persistent Chromium profile
// and exposes the resolved extension id. Standard Playwright MV3 recipe:
// extensions require a headed context (or `--headless=new`), and the id is read
// off the background service worker's URL.
//
// Run `pnpm build` before `pnpm test:e2e` so `dist/` is current.

const EXTENSION_PATH = fileURLToPath(new URL('./../dist', import.meta.url));

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({ headless: _headless }, use) => {
    const context = await chromium.launchPersistentContext('', {
      // MV3 extensions don't load in the default headless shell. Honour
      // PWHEADLESS=new on CI (with xvfb) or run headed locally.
      headless: false,
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // The MV3 service worker target carries the extension id in its URL.
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const id = new URL(worker.url()).host;
    await use(id);
  },
});

export const expect = test.expect;
