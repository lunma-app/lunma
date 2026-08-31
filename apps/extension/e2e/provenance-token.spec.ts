import { mkdtempSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect, test } from '@playwright/test';

// tab-provenance: the whole mechanism rests on ONE undocumented Chrome behaviour —
// a token written to a page's sessionStorage comes back after a session restore.
// If Chrome ever stops restoring sessionStorage, lineage silently resets every
// morning and no unit test would notice, so it is guarded here.
//
// The negative case is the load-bearing half: relaunching WITHOUT restore yields
// no restored tabs at all, so a marker and the tab it identifies die together —
// a restored tab never carries silently-missing lineage.

const EXT = fileURLToPath(new URL('./../dist', import.meta.url));
const KEY = 'lunma.tabToken';

async function launch(dir: string, extra: string[] = []) {
  const ctx = await chromium.launchPersistentContext(dir, {
    headless: false,
    args: [
      `--disable-extensions-except=${EXT}`,
      `--load-extension=${EXT}`,
      '--no-first-run',
      ...extra,
    ],
  });
  return ctx;
}

let server: Server;
let port: number;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    // Deliberately does NOT echo `req.url`. Nothing here asserts on the page's
    // content — the paths only need to be distinct URLs — and reflecting the
    // request into the response is a real XSS shape that CodeQL flags, test
    // fixture or not.
    res.end('<!doctype html><title>provenance fixture</title><h1>provenance fixture</h1>');
  });
  await new Promise<void>((r) => server.listen(0, r));
  port = (server.address() as AddressInfo).port;
});

test.afterAll(async () => {
  await new Promise<void>((r, j) => server.close((e) => (e ? j(e) : r())));
});

test('a sessionStorage token survives a session restore, distinct per tab', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'lunma-provenance-'));
  const first = await launch(dir);

  const a = await first.newPage();
  await a.goto(`http://localhost:${port}/a`);
  await a.evaluate((k) => sessionStorage.setItem(k, 'TOKEN-A'), KEY);
  const b = await first.newPage();
  await b.goto(`http://localhost:${port}/b`);
  await b.evaluate((k) => sessionStorage.setItem(k, 'TOKEN-B'), KEY);
  // Same-origin navigation must not lose it.
  await b.goto(`http://localhost:${port}/b2`);
  expect(await b.evaluate((k) => sessionStorage.getItem(k), KEY)).toBe('TOKEN-B');
  await first.close();

  const second = await launch(dir, ['--restore-last-session']);
  await second.waitForEvent('page', { timeout: 15_000 }).catch(() => undefined);
  const found: Record<string, string | null> = {};
  for (const page of second.pages()) {
    const url = page.url();
    if (!url.startsWith('http')) continue;
    await page.waitForLoadState('domcontentloaded').catch(() => undefined);
    found[new URL(url).pathname] = await page.evaluate((k) => sessionStorage.getItem(k), KEY);
  }
  expect(found['/a']).toBe('TOKEN-A');
  expect(found['/b2']).toBe('TOKEN-B');
  await second.close();
});

test('without a session restore there are no tabs to have lost lineage', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'lunma-provenance-no-restore-'));
  const first = await launch(dir);
  const a = await first.newPage();
  await a.goto(`http://localhost:${port}/a`);
  await a.evaluate((k) => sessionStorage.setItem(k, 'TOKEN-A'), KEY);
  await first.close();

  const second = await launch(dir);
  const httpPages = second.pages().filter((p) => p.url().startsWith('http'));
  // Token and tab die together — the property that makes the marker safe to rely on.
  expect(httpPages).toHaveLength(0);
  await second.close();
});
