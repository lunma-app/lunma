import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// smart-folder-item-bindings (task 5.2): the real-browser activation path with
// the built extension loaded — the durable substitute for the dev-load eyeball.
// A smart-folder result row now activates like a pinned tab: click → a bound,
// non-temporary tab opens; re-click → that tab focuses (no second tab); delete
// the folder → its still-open bound tab demotes into Temporary (nothing closes).
//
// The runtime `smartFolders` slice is never persisted, so items can't be seeded
// through `lunma.state`; instead the forge REST endpoint is mocked via
// `context.route` (it intercepts the service worker's own fetch), and the smart
// folder is created through the real `createSmartFolder` bus command so the
// engine's immediate fetch lands actual result items. The persisted ids-only
// `smartItemBindings` slice is read straight from storage to assert binding.
//
// SW-restart healing isn't exercised here — an in-place extension reboot is
// unreliable in this Playwright + MV3 harness (see space-group-collapse.spec.ts),
// and the boot-prune path is covered end-to-end at the unit level in
// `background/tab-bindings.test.ts`. The held-row (merge-vanish) behaviour is
// covered in `sidebar/SmartFolder.test.ts`.

const FORGE = 'https://forge.e2e.test';
const MR = {
  id: 42,
  iid: 7,
  project_id: 3,
  title: 'E2E merge request',
  web_url: `${FORGE}/group/proj/-/merge_requests/7`,
  head_pipeline: { status: 'success' },
};

/** Open the sidebar page and wait for it to render against live SW state. */
async function openSidebar(page: Page, extensionId: string): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/src/sidebar/index.html`);
  await expect(page.getByTestId('sidebar')).toBeVisible();
  await expect(page.getByTestId('sidebar-content')).toBeVisible();
}

/** A compact snapshot of the persisted facts this test asserts on, read straight
 * from `lunma.state` (the ids-only `smartItemBindings` slice IS persisted). */
async function snapshot(page: Page): Promise<{
  spaceId: string | null;
  folderIds: string[];
  bindings: Record<string, Record<string, Record<string, number>>>;
  tempIds: number[];
  tabCount: number;
}> {
  return page.evaluate(async () => {
    const win = (await chrome.windows.getCurrent({})).id as number;
    const got = (await chrome.storage.local.get('lunma.state')) as {
      'lunma.state'?: {
        state?: {
          activeSpaceByWindow: Record<number, string | null>;
          pinnedBySpace: Record<string, Array<{ kind: string; id: string }>>;
          smartItemBindings: Record<string, Record<string, Record<string, number>>>;
          spaceInstancesByWindow: Record<
            number,
            Record<string, { tempTabIds: number[] }> | undefined
          >;
        };
      };
    };
    const st = got['lunma.state']?.state;
    const spaceId = st?.activeSpaceByWindow[win] ?? null;
    const folderIds = spaceId
      ? (st?.pinnedBySpace[spaceId] ?? []).filter((n) => n.kind === 'smart').map((n) => n.id)
      : [];
    const tempIds =
      spaceId && st ? (st.spaceInstancesByWindow[win]?.[spaceId]?.tempTabIds ?? []) : [];
    const tabs = await chrome.tabs.query({ windowId: win });
    return {
      spaceId,
      folderIds,
      bindings: st?.smartItemBindings ?? {},
      tempIds,
      tabCount: tabs.length,
    };
  });
}

test('a smart-folder row activates like a pinned tab: open bound, re-click focuses, delete demotes', async ({
  context,
  page,
  extensionId,
}) => {
  test.setTimeout(60_000);

  // Mock the forge: the connector's `/api/v4/merge_requests` GET returns one MR;
  // any other forge path (the opened tab's navigation) gets a tiny offline stub
  // so the bound tab loads instantly instead of hanging on DNS.
  await context.route(`${FORGE}/**`, async (route) => {
    const url = route.request().url();
    if (url.includes('/api/v4/merge_requests')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([MR]),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html>ok' });
  });

  await openSidebar(page, extensionId);
  const spaceId = (await snapshot(page)).spaceId;
  expect(spaceId, 'a Default Space is active at boot').toBeTruthy();

  // --- create a smart folder through the real bus command ------------------
  // The engine's immediate first fetch hits the mocked endpoint, so the runtime
  // lands with one real result item and the sidebar renders its row.
  await page.evaluate((sid: string) => {
    chrome.runtime.sendMessage({
      type: 'lunma/command',
      id: 'e2e:create',
      cmd: {
        kind: 'createSmartFolder',
        payload: {
          spaceId: sid,
          source: 'gitlab',
          name: 'E2E review queue',
          baseUrl: 'https://forge.e2e.test',
          query: 'authored',
          maxItems: 20,
          refreshMinutes: 10,
        },
      },
    });
  }, spaceId as string);

  // The smart node persists; grab its id once it appears.
  await expect.poll(async () => (await snapshot(page)).folderIds.length).toBe(1);
  const folderId = (await snapshot(page)).folderIds[0] as string;

  // Expand the folder (the toggle is the folder-row's hit button) and wait for
  // the mocked result row to render — proof the SW fetch was intercepted.
  await page.getByTestId('folder-row').getByRole('button', { name: 'E2E review queue' }).click();
  await expect(page.getByTestId('smart-result-row')).toHaveCount(1);

  const before = await snapshot(page);

  // --- first activation: a bound, NON-temporary tab opens ------------------
  await page.getByTestId('smart-result-row').first().click();

  // The binding lands (ids only) under smartItemBindings[folderId]['42'][win].
  await expect
    .poll(async () => Object.keys((await snapshot(page)).bindings[folderId] ?? {}))
    .toEqual(['42']);
  const opened = await snapshot(page);
  const win = await page.evaluate(async () => (await chrome.windows.getCurrent({})).id as number);
  const boundTabId = opened.bindings[folderId]?.['42']?.[String(win)];
  expect(boundTabId, 'item 42 is bound to a live tab in this window').toBeGreaterThan(0);
  // One new tab exists, and it is NOT in Temporary (the temp set is unchanged).
  expect(opened.tabCount).toBe(before.tabCount + 1);
  expect(opened.tempIds).toEqual(before.tempIds);
  expect(opened.tempIds).not.toContain(boundTabId);

  // The opened tab is active (foreground); bring the sidebar page back to drive
  // the next interactions.
  await page.bringToFront();

  // --- re-activation: focuses the bound tab, opens nothing -----------------
  await page.getByTestId('smart-result-row').first().click();
  // Give the focus round-trip a beat, then assert no second tab and the same
  // binding (same tab id).
  await page.waitForTimeout(500);
  const reclicked = await snapshot(page);
  expect(reclicked.tabCount).toBe(opened.tabCount);
  expect(reclicked.bindings[folderId]?.['42']?.[String(win)]).toBe(boundTabId);

  await page.bringToFront();

  // --- delete the folder: the bound tab demotes to Temporary, nothing closes -
  await page.getByTestId('folder-row-menu-trigger').click();
  await page.locator('[data-menu-id="delete"]').click();

  // The folder's bindings drop; its still-open tab reappears in Temporary; the
  // tab itself is NOT closed (tab count holds).
  await expect.poll(async () => (await snapshot(page)).folderIds.length).toBe(0);
  const deleted = await snapshot(page);
  expect(deleted.bindings[folderId]).toBeUndefined();
  expect(deleted.tempIds).toContain(boundTabId);
  expect(deleted.tabCount).toBe(opened.tabCount); // demoted, never closed
});
