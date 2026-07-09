import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// Layer-2 smoke for `launcher-shortcut-resilience`: the overlay's `Alt+L`
// keydown fallback works on an ordinary web page with the built extension
// loaded — independent of whether Chrome has bound the `toggle-launcher`
// command shortcut (a fresh Playwright profile leaves it unset, which is the
// exact "Not set" case the fallback exists for).
//
// We serve a trivial LOCAL HTTP page because the overlay content script matches
// `<all_urls>` (http/https) at document_start — chrome-extension and file://
// origins don't get it, so a real http origin is required.
//
// NOTE: the overlay uses a CLOSED shadow root, so assertions are limited to the
// host element (`[data-lunma-launcher]`); its internals (input, result rows)
// aren't reachable from the page context — that's the intentional isolation
// boundary. The unit tests (src/launcher/overlay.test.ts) force the shadow open
// to cover the internals.

let server: Server;
let baseURL: string;

test.beforeAll(async () => {
  server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(
      '<!doctype html><html><head><title>lunma e2e</title></head><body><h1>lunma e2e</h1></body></html>',
    );
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  baseURL = `http://127.0.0.1:${port}/`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

/** Press a clean `Alt+L` (physical `KeyL` so it matches the overlay's
 * layout-stable `code === 'KeyL'` guard). */
async function pressAltL(page: Page): Promise<void> {
  await page.keyboard.down('Alt');
  await page.keyboard.press('KeyL');
  await page.keyboard.up('Alt');
}

/** Dispatch a synthetic Option+L directly into the page (main world). It never
 * reaches Chrome's command router, so opening the overlay proves the
 * content-script capture-phase keydown listener — the fallback — is wired,
 * regardless of whether the command shortcut is bound. */
async function dispatchAltL(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { altKey: true, code: 'KeyL', bubbles: true, cancelable: true }),
    );
  });
}

test('Alt+L toggles the launcher overlay on an ordinary web page', async ({ page }) => {
  // NOTE: a fresh Playwright profile auto-binds ⌥L, so this real keypress may
  // open the overlay via the chrome.commands path rather than the page keydown
  // fallback. It is an end-to-end smoke that the built overlay opens on Alt+L;
  // the keydown fallback itself is asserted separately below (synthetic dispatch).
  await page.goto(baseURL);
  await page.locator('body').click();

  const host = page.locator('[data-lunma-launcher]');
  await expect(host).toHaveCount(0); // dormant until Alt+L

  await pressAltL(page);
  await expect(host).toHaveCount(1);

  await pressAltL(page);
  await expect(host).toHaveCount(0); // Alt+L again closes it
});

test('the page keydown fallback toggles the overlay independent of the command binding', async ({
  page,
}) => {
  await page.goto(baseURL);
  const host = page.locator('[data-lunma-launcher]');
  await expect(host).toHaveCount(0);

  await dispatchAltL(page);
  await expect(host).toHaveCount(1); // the capture-phase keydown listener opened it

  await dispatchAltL(page);
  await expect(host).toHaveCount(0); // and closed it
});
