import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

// Layer-2 smoke: drive the real custom pointer-drag controller in a
// real Chromium with the built extension loaded. Covers the happy path —
// pin a temporary tab by dragging it into the Pinned section (persists across
// a sidebar reload), then reorder two pinned tabs.
//
// The sidebar is a side panel; rather than fight the side-panel chrome we open
// its HTML directly as a normal tab (it resolves windowId via
// `chrome.windows.getCurrent` and connects to the live SW exactly the same).

/** Open the sidebar page and wait for it to render against live SW state. */
async function openSidebar(page: Page, extensionId: string): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/src/sidebar/index.html`);
  await expect(page.getByTestId('sidebar')).toBeVisible();
  // A Default Space is seeded at SW boot; the content stage renders once state
  // arrives.
  await expect(page.getByTestId('sidebar-content')).toBeVisible();
}

/** Create a temporary tab in the sidebar's window via the extension API. */
async function createTempTab(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await chrome.tabs.create({ url: 'about:blank', active: false });
  });
}

/** Read the active Space's top-level pinned-node ids straight from persisted
 * state. `pinnedBySpace` holds a `PinNode[]` tree, so map each node to its id
 * (a `string[]`); without the map the reorder assertion would compare
 * `[object Object]` strings and pass regardless of order. */
async function pinnedOrder(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const got = (await chrome.storage.local.get('lunma.state')) as {
      'lunma.state'?: {
        state?: {
          activeSpaceByWindow: Record<number, string | null>;
          pinnedBySpace: Record<string, Array<{ id: string }>>;
        };
      };
    };
    const st = got['lunma.state']?.state;
    if (!st) return [];
    const win = (await chrome.windows.getCurrent({})).id as number;
    const spaceId = st.activeSpaceByWindow[win];
    return spaceId ? (st.pinnedBySpace[spaceId] ?? []).map((n) => n.id) : [];
  });
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

const tempRows = (page: Page): Locator =>
  page.getByTestId('temp-tabs').getByTestId('tab-row');
const pinnedRows = (page: Page): Locator =>
  page.getByTestId('pinned-tabs').getByTestId('tab-row');

test('drag a temp tab into Pinned: it pins, persists, and reorders', async ({
  page,
  extensionId,
}) => {
  await openSidebar(page, extensionId);

  // Seed two temporary tabs and wait for both to render.
  await createTempTab(page);
  await createTempTab(page);
  await expect.poll(async () => tempRows(page).count()).toBeGreaterThanOrEqual(2);

  // --- pin via drag --------------------------------------------------------
  await expect(pinnedRows(page)).toHaveCount(0);
  await dragTo(page, tempRows(page).first(), page.getByTestId('pinned-tabs'));
  await expect(pinnedRows(page)).toHaveCount(1);

  // --- persistence across a sidebar reload ---------------------------------
  await page.reload();
  await expect(page.getByTestId('sidebar')).toBeVisible();
  await expect(pinnedRows(page)).toHaveCount(1);

  // --- reorder two pinned tabs ---------------------------------------------
  // Pin a second temp tab as a SECOND TOP-LEVEL pin. Drop in the bottom gutter of
  // the existing pinned row (below its drop-onto band) — dropping onto the row's
  // middle band would now fold the two into a folder (temp→onto-tab creates a
  // folder; pin-temp-tab-into-folder), which is a different gesture.
  {
    const existing = await pinnedRows(page).first().boundingBox();
    const src = await tempRows(page).first().boundingBox();
    if (!existing || !src) throw new Error('missing bounding box for second pin');
    await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
    await page.mouse.down();
    await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2 + 8, { steps: 3 });
    // 2px above the row's bottom edge = its between-rows gutter, not the onto band.
    await page.mouse.move(existing.x + existing.width / 2, existing.y + existing.height - 2, {
      steps: 12,
    });
    await page.mouse.up();
  }
  await expect(pinnedRows(page)).toHaveCount(2);

  const before = await pinnedOrder(page);
  expect(before).toHaveLength(2);

  // Drag the second pinned row above the first.
  const firstBox = await pinnedRows(page).nth(0).boundingBox();
  const second = pinnedRows(page).nth(1);
  if (!firstBox) throw new Error('missing pinned row box');
  const sBox = await second.boundingBox();
  if (!sBox) throw new Error('missing second pinned row box');
  await page.mouse.move(sBox.x + sBox.width / 2, sBox.y + sBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(sBox.x + sBox.width / 2, sBox.y + sBox.height / 2 - 8, { steps: 3 });
  await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + 2, { steps: 12 });
  await page.mouse.up();

  await expect
    .poll(async () => (await pinnedOrder(page)).join(','))
    .toBe([before[1], before[0]].join(','));
});
