import { expect, test } from './fixtures';

// cross-space-tab-switch: activating a COUPLED (pinned) saved tab that lives in
// another Space must switch the window to that Space — and, crucially, the
// SIDEBAR must follow (the real broadcast → reconcile round-trip a unit test
// cannot exercise). We drive the exact bus command the launcher dispatches
// (`focusSavedTab`) and assert the sidebar's active Space chip moves.
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
  savedTabs: Record<string, { id: string; spaceId: string | null; originalURL: string }>;
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

test('focusing a cross-Space pinned tab switches the sidebar to its Space', async ({
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

  // 2. While Home is active, open a real tab and pin it into Home → a coupled saved tab.
  const tabId = await page.evaluate(
    async (windowId) =>
      (await chrome.tabs.create({ windowId, url: 'https://example.com/', active: true }))
        .id as number,
    windowId,
  );
  // Wait until Lunma tracks the new tab in Home.
  await expect
    .poll(
      async () =>
        (await readState(page)).spaceInstancesByWindow[windowId]?.[homeSpaceId]?.tempTabIds.includes(
          tabId,
        ) ?? false,
      { timeout: 15_000 },
    )
    .toBe(true);
  await dispatch(page, {
    kind: 'pinTab',
    payload: { tabId, windowId, spaceId: homeSpaceId, targetIndex: 0 },
  });
  // A coupled saved tab now lives in Home (match by Space — the live URL may not
  // have settled to the exact string at pin time).
  await expect
    .poll(
      async () =>
        Object.values((await readState(page)).savedTabs).some((s) => s.spaceId === homeSpaceId),
      { timeout: 15_000 },
    )
    .toBe(true);
  const savedTabId = Object.values((await readState(page)).savedTabs).find(
    (s) => s.spaceId === homeSpaceId,
  )?.id as string;

  // 3. Switch back to the default Space — the bound saved tab now lives in a
  //    non-active Space (the cross-Space precondition).
  await dispatch(page, { kind: 'activateSpace', payload: { windowId, spaceId: defaultSpaceId } });
  // External activateSpace must move the sidebar (the broadcast→reconcile path).
  await expect.poll(() => activeChipSpaceId(page), { timeout: 10_000 }).toBe(defaultSpaceId);

  // 4. THE FEATURE: focus the cross-Space pinned tab from "the launcher".
  await dispatch(page, { kind: 'focusSavedTab', payload: { savedTabId, windowId } });

  // The SW must switch the window's active Space to Home…
  await expect
    .poll(async () => (await readState(page)).activeSpaceByWindow[windowId], { timeout: 10_000 })
    .toBe(homeSpaceId);
  // …AND the sidebar must follow.
  await expect.poll(() => activeChipSpaceId(page), { timeout: 10_000 }).toBe(homeSpaceId);
});

test('opening a DORMANT cross-Space pinned tab switches the sidebar to its Space', async ({
  context,
  extensionId,
}) => {
  test.setTimeout(60_000);
  const sidebarUrl = `chrome-extension://${extensionId}/src/sidebar/index.html`;
  const page = await context.newPage();
  await page.goto(sidebarUrl);
  await page.waitForSelector('[data-testid="space-chip"]', { timeout: 20_000 });
  await page.waitForTimeout(1500);

  const windowId = await page.evaluate(
    async () => (await chrome.windows.getCurrent()).id as number,
  );
  const defaultSpaceId = (await activeChipSpaceId(page)) as string;

  // Create Home, pin a tab into it (coupled saved tab).
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
  await expect.poll(() => activeChipSpaceId(page), { timeout: 10_000 }).toBe(homeSpaceId);

  const tabId = await page.evaluate(
    async (windowId) =>
      (await chrome.tabs.create({ windowId, url: 'https://example.com/', active: true }))
        .id as number,
    windowId,
  );
  await expect
    .poll(
      async () =>
        (await readState(page)).spaceInstancesByWindow[windowId]?.[homeSpaceId]?.tempTabIds.includes(
          tabId,
        ) ?? false,
      { timeout: 15_000 },
    )
    .toBe(true);
  await dispatch(page, {
    kind: 'pinTab',
    payload: { tabId, windowId, spaceId: homeSpaceId, targetIndex: 0 },
  });
  await expect
    .poll(
      async () =>
        Object.values((await readState(page)).savedTabs).some((s) => s.spaceId === homeSpaceId),
      { timeout: 15_000 },
    )
    .toBe(true);
  const savedTabId = Object.values((await readState(page)).savedTabs).find(
    (s) => s.spaceId === homeSpaceId,
  )?.id as string;

  // Switch to the default Space, then CLOSE the bound tab → the saved tab is now
  // DORMANT in this window (the launcher's `openSavedTab` precondition).
  await dispatch(page, { kind: 'activateSpace', payload: { windowId, spaceId: defaultSpaceId } });
  await expect.poll(() => activeChipSpaceId(page), { timeout: 10_000 }).toBe(defaultSpaceId);
  await page.evaluate(async (tabId) => chrome.tabs.remove(tabId).catch(() => undefined), tabId);
  await expect
    .poll(
      async () =>
        (await readState(page) as unknown as { tabBindings: Record<string, Record<number, number>> })
          .tabBindings?.[savedTabId]?.[windowId] === undefined,
      { timeout: 10_000 },
    )
    .toBe(true);

  // THE FEATURE (dormant path): open the cross-Space pinned tab from "the launcher".
  await dispatch(page, { kind: 'openSavedTab', payload: { savedTabId, windowId } });

  await expect
    .poll(async () => (await readState(page)).activeSpaceByWindow[windowId], { timeout: 10_000 })
    .toBe(homeSpaceId);
  await expect.poll(() => activeChipSpaceId(page), { timeout: 10_000 }).toBe(homeSpaceId);
});
