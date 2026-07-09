import { expect, test } from './fixtures';

// focused-tab-switches-space: focusing an OPEN/temporary tab that lives in
// another Space must switch the window to that Space — closing the gap
// `cross-space-tab-switch` left open (it scoped itself to pinned saved tabs). We
// drive the exact bus command the launcher's open-tab result dispatches
// (`focusTab`, which is just `chrome.tabs.update({ active: true })`) and assert
// BOTH the SW's `activeSpaceByWindow` and the sidebar's active-Space chip follow.
//
// Everything runs from the sidebar PAGE: it renders the real `App` bound to its
// window and has full `chrome.*` access, so we can both drive bus commands and
// read persisted state.

const CMD = `lunma/command`;

/** Dispatch a sidebar bus command exactly as a surface does (`lunma/command`). */
async function dispatch(page: import('@playwright/test').Page, cmd: unknown): Promise<void> {
  await page.evaluate(
    ({ type, cmd }) =>
      chrome.runtime
        .sendMessage({ type, id: `e2e:${Date.now()}:${Math.random()}`, cmd })
        .catch(() => undefined),
    { type: CMD, cmd },
  );
}

/** The persisted Lunma state (the SW writes it on every dirty drain). */
async function readState(page: import('@playwright/test').Page): Promise<{
  activeSpaceByWindow: Record<number, string>;
  spaces: Array<{ id: string; name: string }>;
  spaceInstancesByWindow: Record<number, Record<string, { tempTabIds: number[] }>>;
}> {
  return page.evaluate(async () => {
    const got = await chrome.storage.local.get('lunma.state');
    return (got['lunma.state'] as { state: unknown }).state as never;
  });
}

/** The `data-space-id` of the sidebar's currently-active Space chip. */
async function activeChipSpaceId(page: import('@playwright/test').Page): Promise<string | null> {
  return page.evaluate(() => {
    const chip = document.querySelector(
      '[data-testid="space-chip"][data-active="true"]',
    ) as HTMLElement | null;
    return chip?.getAttribute('data-space-id') ?? null;
  });
}

test('focusing a cross-Space OPEN tab switches the sidebar to its Space', async ({
  context,
  extensionId,
}) => {
  test.setTimeout(60_000);
  const sidebarUrl = `chrome-extension://${extensionId}/src/sidebar/index.html`;
  const page = await context.newPage();
  await page.goto(sidebarUrl);

  // Boot settle: the space switcher renders once the snapshot lands.
  await page.waitForSelector('[data-testid="space-chip"]', { timeout: 20_000 });
  await page.waitForTimeout(1500);

  const windowId = await page.evaluate(
    async () => (await chrome.windows.getCurrent()).id as number,
  );
  const defaultSpaceId = await activeChipSpaceId(page);
  expect(defaultSpaceId, 'a default Space is active at boot').toBeTruthy();

  // 1. Create a second Space "Home" (createSpace activates it).
  await dispatch(page, {
    kind: 'createSpace',
    payload: { name: 'Home', color: 'blue', icon: 'star', windowId },
  });
  await expect
    .poll(async () => (await readState(page)).spaces.some((s) => s.name === 'Home'), {
      timeout: 15_000,
    })
    .toBe(true);
  const homeSpaceId = (await readState(page)).spaces.find((s) => s.name === 'Home')?.id as string;
  // The sidebar followed the external createSpace+activate.
  await expect.poll(() => activeChipSpaceId(page), { timeout: 10_000 }).toBe(homeSpaceId);

  // 2. While Home is active, open a real tab → an OPEN/temporary tab in Home (NOT
  //    pinned — this is the open-tab gap the feature closes).
  const tabId = await page.evaluate(
    async (windowId) =>
      (await chrome.tabs.create({ windowId, url: 'https://example.com/', active: true }))
        .id as number,
    windowId,
  );
  // Wait until Lunma tracks the new tab as a temporary tab in Home.
  await expect
    .poll(
      async () =>
        (await readState(page)).spaceInstancesByWindow[windowId]?.[
          homeSpaceId
        ]?.tempTabIds.includes(tabId) ?? false,
      { timeout: 15_000 },
    )
    .toBe(true);

  // 3. Switch back to the default Space — the open tab now lives in a non-active
  //    Space (the cross-Space precondition).
  await dispatch(page, { kind: 'activateSpace', payload: { windowId, spaceId: defaultSpaceId } });
  await expect.poll(() => activeChipSpaceId(page), { timeout: 10_000 }).toBe(defaultSpaceId);

  // 4. THE FEATURE: focus the cross-Space OPEN tab from "the launcher" (its
  //    open-tab result dispatches `focusTab`).
  await dispatch(page, { kind: 'focusTab', payload: { tabId } });

  // The SW must switch the window's active Space to Home…
  await expect
    .poll(async () => (await readState(page)).activeSpaceByWindow[windowId], { timeout: 10_000 })
    .toBe(homeSpaceId);
  // …AND the sidebar must follow.
  await expect.poll(() => activeChipSpaceId(page), { timeout: 10_000 }).toBe(homeSpaceId);
});
