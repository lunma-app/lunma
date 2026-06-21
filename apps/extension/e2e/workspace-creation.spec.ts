import { fileURLToPath } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { expect, test } from './fixtures';

// workspace-creation: exercises the full createSpace UI flow —
// dispatching createSpace, asserting the Space chip renders with the correct
// name and data-space-id, and verifying the Space persists across a reload.
//
// The test runs from the sidebar page (real `App` + full `chrome.*` access)
// and uses a persistent profile so the reload survives in the same storage.

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
  spaces: Array<{ id: string; name: string }>;
  activeSpaceByWindow: Record<number, string>;
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

/** Find a chip by name, returns its data-space-id or null. */
async function chipSpaceIdByName(
  page: import('@playwright/test').Page,
  name: string,
): Promise<string | null> {
  return page.evaluate((name) => {
    const chips = Array.from(
      document.querySelectorAll('[data-testid="space-chip"]'),
    ) as HTMLElement[];
    const chip = chips.find((c) => c.textContent?.includes(name) || c.getAttribute('data-name') === name);
    return chip?.getAttribute('data-space-id') ?? null;
  }, name);
}

test('createSpace renders a chip with the correct name and data-space-id', async ({
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

  // Dispatch createSpace for a new "Work" space.
  await dispatch(page, {
    kind: 'createSpace',
    payload: { name: 'Work', color: 'purple', icon: 'briefcase', windowId },
  });

  // The state must record the new Space.
  await expect
    .poll(async () => (await readState(page)).spaces.some((s) => s.name === 'Work'), {
      timeout: 15_000,
    })
    .toBe(true);

  const workSpaceId = (await readState(page)).spaces.find((s) => s.name === 'Work')?.id as string;
  expect(workSpaceId, 'Work space has an id').toBeTruthy();

  // The sidebar must render a chip for the new Space and activate it.
  await expect
    .poll(() => activeChipSpaceId(page), { timeout: 10_000 })
    .toBe(workSpaceId);

  // The chip's data-space-id must match the persisted id.
  const chipId = await chipSpaceIdByName(page, 'Work');
  expect(chipId).toBe(workSpaceId);

  // The persisted activeSpaceByWindow must also reflect the new Space.
  await expect
    .poll(
      async () => (await readState(page)).activeSpaceByWindow[windowId],
      { timeout: 10_000 },
    )
    .toBe(workSpaceId);
});

test('a created Space persists and its chip renders after a page reload', async ({
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

  // Create a "Personal" space.
  await dispatch(page, {
    kind: 'createSpace',
    payload: { name: 'Personal', color: 'green', icon: 'star', windowId },
  });

  await expect
    .poll(async () => (await readState(page)).spaces.some((s) => s.name === 'Personal'), {
      timeout: 15_000,
    })
    .toBe(true);

  const personalSpaceId = (await readState(page)).spaces.find((s) => s.name === 'Personal')
    ?.id as string;

  // Give the SW time to drain/persist before reload.
  await page.waitForTimeout(1000);

  // Reload the sidebar — the chip must survive from persisted storage.
  await page.reload();
  await page.waitForSelector('[data-testid="space-chip"]', { timeout: 20_000 });
  await page.waitForTimeout(1500);

  // The persisted state must still contain the Personal Space.
  const stateAfterReload = await readState(page);
  const personalAfterReload = stateAfterReload.spaces.find((s) => s.name === 'Personal');
  expect(personalAfterReload?.id).toBe(personalSpaceId);

  // A chip with the correct data-space-id must be visible.
  const chipId = await chipSpaceIdByName(page, 'Personal');
  expect(chipId).toBe(personalSpaceId);
});

// Separate persistent-context test that validates storage survives a full
// browser restart (same user-data-dir, new browser process).
const EXT = fileURLToPath(new URL('./../dist', import.meta.url));

test('a created Space survives a full browser restart', async () => {
  test.setTimeout(90_000);

  const dir = mkdtempSync(join(tmpdir(), 'lunma-ws-creation-'));

  async function launch() {
    const ctx = await chromium.launchPersistentContext(dir, {
      headless: false,
      args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
    });
    let [sw] = ctx.serviceWorkers();
    // On a profile restart the SW may already be registered before our event
    // listener is wired — poll once after a short delay before falling back to
    // the event so we don't wait forever if the event was already emitted.
    if (!sw) {
      await new Promise((r) => setTimeout(r, 1_000));
      [sw] = ctx.serviceWorkers();
    }
    if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 20_000 });
    const id = new URL(sw.url()).host;
    return { ctx, id };
  }

  // First session: create a "Garden" space.
  let { ctx, id } = await launch();
  await ctx.waitForEvent('page', { timeout: 2_000 }).catch(() => undefined);
  const page1 = await ctx.newPage();
  await page1.goto(`chrome-extension://${id}/src/sidebar/index.html`);
  await page1.waitForSelector('[data-testid="space-chip"]', { timeout: 20_000 });
  await page1.waitForTimeout(1500);

  const windowId = await page1.evaluate(
    async () => (await chrome.windows.getCurrent()).id as number,
  );

  await page1.evaluate(
    ({ type, cmd }) =>
      chrome.runtime
        .sendMessage({ type, id: `e2e:restart:create`, cmd })
        .catch(() => undefined),
    {
      type: CMD,
      cmd: { kind: 'createSpace', payload: { name: 'Garden', color: 'cyan', icon: 'leaf', windowId } },
    },
  );

  await page1.waitForFunction(
    async () => {
      const got = await chrome.storage.local.get('lunma.state');
      const state = (got['lunma.state'] as { state: { spaces: Array<{ name: string }> } }).state;
      return state.spaces.some((s) => s.name === 'Garden');
    },
    undefined,
    { timeout: 15_000 },
  );

  // Give the SW time to fully persist before closing.
  await page1.waitForTimeout(1500);
  await ctx.close();

  // Second session: verify "Garden" is still in storage.
  ({ ctx, id } = await launch());
  await ctx.waitForEvent('page', { timeout: 2_000 }).catch(() => undefined);
  const page2 = await ctx.newPage();
  await page2.goto(`chrome-extension://${id}/src/sidebar/index.html`);
  await page2.waitForSelector('[data-testid="space-chip"]', { timeout: 20_000 });
  await page2.waitForTimeout(2000);

  const stateAfterRestart = await page2.evaluate(async () => {
    const got = await chrome.storage.local.get('lunma.state');
    return (got['lunma.state'] as { state: { spaces: Array<{ id: string; name: string }> } }).state;
  });

  const gardenSpace = stateAfterRestart.spaces.find((s) => s.name === 'Garden');
  expect(gardenSpace, 'Garden space persists after restart').toBeTruthy();
  expect(gardenSpace?.id, 'Garden space has an id after restart').toBeTruthy();

  // The chip must also be visible in the reloaded sidebar.
  const chipId = await page2.evaluate((name) => {
    const chips = Array.from(
      document.querySelectorAll('[data-testid="space-chip"]'),
    ) as HTMLElement[];
    const chip = chips.find(
      (c) => c.textContent?.includes(name) || c.getAttribute('data-name') === name,
    );
    return chip?.getAttribute('data-space-id') ?? null;
  }, 'Garden');

  expect(chipId).toBe(gardenSpace?.id);

  await ctx.close();
});
