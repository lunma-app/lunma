import type { BrowserContext, Page } from '@playwright/test';
import { expect, test } from './fixtures';

// lens-page (task 9.2; sources-redesign): the real-browser smoke for the
// full-page lens overview with the BUILT extension loaded — proves the page is
// registered as a build entrypoint (vite rollupOptions.input, NOT a new-tab
// override / WAR) and reachable at its chrome-extension:// URL, that it mirrors
// live SW state, and that it renders the entity-merged overview. A gitlab lens
// derives `lensKind: 'review'` SW-side, so its source buckets to the **Changes**
// entity and renders as a Review-Queue change row (not a generic section card).
//
// Like lens-bindings.spec.ts, the runtime `lenses` slice is never
// persisted, so the folder is created through the real `createLens` bus
// command and the forge REST endpoint is mocked via `context.route` so the
// engine's immediate fetch lands a real result item.

const FORGE = 'https://forge.e2e.test';
const MR = {
  id: 42,
  iid: 7,
  project_id: 3,
  title: 'E2E page merge request',
  web_url: `${FORGE}/group/proj/-/merge_requests/7`,
  head_pipeline: { status: 'success' },
};

/** Force the SW's host-permission gate to report the forge origin granted (a real
 * request() would pop a native dialog Playwright can't accept). */
async function grantForgeHost(context: BrowserContext): Promise<void> {
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  await worker.evaluate(() => {
    (chrome.permissions as unknown as { contains: () => Promise<boolean> }).contains = () =>
      Promise.resolve(true);
  });
}

/** The active Space id + the lens ids, read straight from `lunma.state`. */
async function ids(page: Page): Promise<{ spaceId: string | null; folderIds: string[] }> {
  return page.evaluate(async () => {
    const win = (await chrome.windows.getCurrent({})).id as number;
    const got = (await chrome.storage.local.get('lunma.state')) as {
      'lunma.state'?: {
        state?: {
          activeSpaceByWindow: Record<number, string | null>;
          pinnedBySpace: Record<string, Array<{ kind: string; id: string }>>;
        };
      };
    };
    const st = got['lunma.state']?.state;
    const spaceId = st?.activeSpaceByWindow[win] ?? null;
    const folderIds = spaceId
      ? (st?.pinnedBySpace[spaceId] ?? []).filter((n) => n.kind === 'lens').map((n) => n.id)
      : [];
    return { spaceId, folderIds };
  });
}

test('the lens page loads at its URL and renders the folder section + card', async ({
  context,
  page,
  extensionId,
}) => {
  test.setTimeout(60_000);

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

  // Boot the sidebar to get a live SW + active Space, then grant the forge host.
  await page.goto(`chrome-extension://${extensionId}/src/sidebar/index.html`);
  await expect(page.getByTestId('sidebar')).toBeVisible();
  await grantForgeHost(context);

  const spaceId = (await ids(page)).spaceId;
  expect(spaceId, 'a Default Space is active at boot').toBeTruthy();

  // Connect an account, then create a lens REFERENCING it through the real bus
  // commands (connector-accounts) — its immediate fetch hits the mocked endpoint,
  // so the runtime lands one real result item.
  await page.evaluate((sid: string) => {
    chrome.runtime.sendMessage({
      type: 'lunma/command',
      id: 'e2e:create-account',
      cmd: {
        kind: 'createAccount',
        payload: { id: 'e2e-acc', provider: 'gitlab', baseUrl: 'https://forge.e2e.test' },
      },
    });
    chrome.runtime.sendMessage({
      type: 'lunma/command',
      id: 'e2e:create-page',
      cmd: {
        kind: 'createLens',
        payload: {
          spaceId: sid,
          sources: [{ sourceId: 'e2e-acc', queries: ['authored'] }],
          name: 'E2E page queue',
          maxItems: 20,
          refreshMinutes: 10,
        },
      },
    });
  }, spaceId as string);

  await expect.poll(async () => (await ids(page)).folderIds.length).toBe(1);
  const folderId = (await ids(page)).folderIds[0] as string;

  // Navigate THIS tab to the folder page URL (the entrypoint the extension builds).
  await page.goto(
    `chrome-extension://${extensionId}/src/launcher/lenspage/index.html?folderId=${folderId}`,
  );

  // The page mounts, mirrors SW state, and renders the entity-merged overview.
  await expect(page.getByTestId('lenspage-root')).toBeVisible();
  await expect(page.getByTestId('lenspage-name')).toHaveText('E2E page queue');
  // The gitlab source buckets to a single Changes entity section…
  await expect(page.getByTestId('overview-entity')).toHaveCount(1);
  await expect(page.getByTestId('overview-entity')).toHaveAttribute('data-entity', 'change');
  // …and the mocked MR rendered as a Review-Queue change row — proof the live
  // runtime reached the page.
  await expect(page.getByTestId('change-row')).toContainText('E2E page merge request');
});
