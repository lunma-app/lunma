import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { BrowserContext, Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

// Layer-2 smoke for `pinned-tab-domain-boundary`: drive the real built extension
// to lock a pinned tab to its site via the drill-in editor, then prove that an
// off-site link click diverts to a new temporary tab (the pinned tab stays put)
// while an in-domain click navigates normally.
//
// One local HTTP server is bound on all interfaces so the SAME server is
// reachable as two distinct registrable domains: `localhost` (the pinned site)
// and `127.0.0.1` (off-site). The boundary content script matches `<all_urls>`
// http(s) at document_start, so a real http origin is required (chrome-extension
// and file:// origins don't get it). Layer-1 unit coverage lives in
// src/{shared,content,background,sidebar,ui}/*.test.ts.

let server: Server;
let port: number;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    if (req.url === '/inner') return res.end('<!doctype html><title>inner</title><h1>inner</h1>');
    if (req.url === '/off') return res.end('<!doctype html><title>off</title><h1>off-site</h1>');
    res.end(
      `<!doctype html><title>localhost site</title><h1>localhost site</h1>
       <p><a id="in" href="/inner">in-domain link</a></p>
       <p><a id="off" href="http://127.0.0.1:${port}/off">off-domain link</a></p>`,
    );
  });
  // No host → bound on the unspecified address, reachable as BOTH localhost and
  // 127.0.0.1 (two registrable domains off one server).
  await new Promise<void>((resolve) => server.listen(0, resolve));
  port = (server.address() as AddressInfo).port;
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
});

const tempRows = (p: Page): Locator => p.getByTestId('temp-tabs').getByTestId('tab-row');
const pinnedRows = (p: Page): Locator => p.getByTestId('pinned-tabs').getByTestId('tab-row');
const lockItem = (p: Page): Locator =>
  p.getByTestId('tab-row-menu-item').filter({ hasText: 'Lock to its site' });

/** Open the sidebar page (a normal tab — it connects to the live SW exactly like
 * the side panel) at a side-panel-ish width and wait for it to render. */
async function openSidebar(page: Page, extensionId: string): Promise<void> {
  await page.setViewportSize({ width: 390, height: 820 });
  await page.goto(`chrome-extension://${extensionId}/src/sidebar/index.html`);
  await expect(page.getByTestId('sidebar')).toBeVisible();
  await expect(page.getByTestId('sidebar-content')).toBeVisible();
}

/** Pointer-drag a row to the centre of a zone (past the 5px start threshold). */
async function dragTo(page: Page, row: Locator, zone: Locator): Promise<void> {
  const r = await row.boundingBox();
  const z = await zone.boundingBox();
  if (!r || !z) throw new Error('dragTo: missing bounding box');
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2 + 8, { steps: 3 });
  await page.mouse.move(z.x + z.width / 2, z.y + z.height / 2, { steps: 12 });
  await page.mouse.up();
}

/** Open the local site as a tab (→ a temp tab in the Space) and drag it into
 * Pinned. Returns the site page so the caller can click its links. */
async function pinSite(context: BrowserContext, sidebar: Page): Promise<Page> {
  const site = await context.newPage();
  await site.goto(`http://localhost:${port}/`);
  await sidebar.bringToFront();
  const siteRow = tempRows(sidebar).filter({ hasText: 'localhost site' }).first();
  await siteRow.waitFor();
  await dragTo(sidebar, siteRow, sidebar.getByTestId('pinned-tabs'));
  await expect(pinnedRows(sidebar)).toHaveCount(1);
  return site;
}

/** Open the pinned row's menu, drill into the editor, and switch to On (which
 * seeds the registrable domain). Leaves the menu open. */
async function lockToSite(sidebar: Page): Promise<void> {
  await pinnedRows(sidebar).first().hover();
  await sidebar.getByTestId('tab-row-menu-trigger').first().click();
  await lockItem(sidebar).click();
  const editor = sidebar.getByTestId('tab-boundary-editor');
  await expect(editor).toBeVisible();
  await editor.getByText('On', { exact: true }).click();
  await expect(editor.getByTestId('boundary-allow-list')).toBeVisible();
}

test('the menu drills into the boundary editor, seeds the domain, and back returns', async ({
  page,
  context,
  extensionId,
}) => {
  await openSidebar(page, extensionId);
  await pinSite(context, page);

  await pinnedRows(page).first().hover();
  await page.getByTestId('tab-row-menu-trigger').first().click();
  await expect(lockItem(page)).toBeVisible(); // actions list
  // The drill-in row advertises its submenu (chevron + aria-haspopup).
  await expect(lockItem(page)).toHaveAttribute('aria-haspopup', 'menu');

  await lockItem(page).click();
  const editor = page.getByTestId('tab-boundary-editor');
  await expect(editor).toBeVisible();
  // Drill-in REPLACES the actions with a back affordance.
  await expect(page.getByTestId('tab-row-menu-item')).toHaveCount(0);
  await expect(page.getByTestId('tab-row-menu-back')).toBeVisible();
  // Default mode surfaces a discoverability link to the global default.
  await expect(editor.getByTestId('boundary-options-link')).toBeVisible();

  // On seeds the tab's registrable domain (localhost) as a chip.
  await editor.getByText('On', { exact: true }).click();
  await expect(editor.getByTestId('chip')).toHaveText(/localhost/);

  // Back returns to the action list (editor gone).
  await page.getByTestId('tab-row-menu-back').click();
  await expect(lockItem(page)).toBeVisible();
  await expect(editor).toHaveCount(0);
});

test('an off-site click diverts to a new temp tab; an in-domain click navigates', async ({
  page,
  context,
  extensionId,
}) => {
  await openSidebar(page, extensionId);
  const site = await pinSite(context, page);
  await lockToSite(page);
  await page.keyboard.press('Escape'); // close the menu

  // Let the SW inject + push the allow-set to the bound tab's content script.
  await page.waitForTimeout(1200);

  // Off-site (127.0.0.1) click → a NEW tab opens and the pinned tab STAYS.
  await site.bringToFront();
  const urlBefore = site.url();
  const [opened] = await Promise.all([
    context.waitForEvent('page', { timeout: 8000 }),
    site.click('#off'),
  ]);
  await opened.waitForLoadState('domcontentloaded').catch(() => undefined);
  expect(new URL(opened.url()).hostname).toBe('127.0.0.1');
  expect(site.url()).toBe(urlBefore); // the bound tab did not navigate

  // In-domain (localhost) click → the bound tab navigates normally (no divert).
  await site.click('#in');
  await expect.poll(() => new URL(site.url()).pathname).toBe('/inner');
});
