import { expect, test } from './fixtures';

// prevent-space-group-collapse (task 5.4): two Spaces whose instances share the
// same open tabs at boot must NOT collapse into one group — the boot heal
// (`seedExistingTabs` group-aware + `reconcileTabOwnership`) splits each tab to
// the Space that owns its live Chrome group.
//
// The heal needs STABLE live tab/group ids, so we reboot via
// `chrome.runtime.reload()` (the browser keeps its tabs/groups; only the
// extension restarts) rather than a full browser restart (which reassigns ids).
//
// Everything runs from an extension PAGE — it has the same `chrome.*` access as
// the service worker (tabs/tabGroups/storage/windows) and, unlike the MV3
// worker, Playwright re-attaches to a fresh page reliably after a reload.
// Opening a fresh sidebar page wakes the rebooted worker (its `state-request`
// starts the worker), which runs the boot chain and persists the healed state.
//
// MARKED `fixme`: this asserts the *group-aware* split, which requires a fresh
// Lunma boot with STABLE Chrome tab/group ids — i.e. `chrome.runtime.reload()`,
// not a full browser restart (which reassigns ids and structurally defeats the
// group match). In the current Playwright + MV3 setup an unpacked extension
// loaded via `--load-extension` does not come back usable after
// `chrome.runtime.reload()` (neither the service worker nor extension pages
// recover), so the reboot step can't complete here. The heal logic is covered
// end-to-end at the unit level — `seed-existing-tabs.test.ts` (group-aware
// seeding) and `store.reconcile-ownership.test.ts` (incl. the reporter's exact
// Anonymous/Anonymous 2/Stars overlap). Enable this once the e2e harness can
// reboot the extension in place.
test.fixme('two Spaces sharing tabs at boot resolve to distinct groups after the reconcile', async ({
  context,
  extensionId,
}) => {
  test.setTimeout(120_000); // a reboot + two boot settles needs more than the default 30s
  const sidebarUrl = `chrome-extension://${extensionId}/src/sidebar/index.html`;

  let page = await context.newPage();
  await page.goto(sidebarUrl);
  await new Promise((r) => setTimeout(r, 2500)); // initial boot settle

  // 1. Create two real Chrome groups (one tab each) in the current window, then
  //    inject a corrupted persisted state where BOTH Space instances list BOTH
  //    tabs (the "two Spaces, one group" overlap).
  const ctx = await page.evaluate(async () => {
    const win = await chrome.windows.getCurrent();
    const windowId = win.id as number;
    // Explicit non-newtab URLs so `seedExistingTabs` doesn't skip them as home tabs.
    const a = await chrome.tabs.create({ windowId, url: 'https://example.com/a', active: false });
    const b = await chrome.tabs.create({ windowId, url: 'https://example.com/b', active: false });
    const tabA = a.id as number;
    const tabB = b.id as number;
    const groupA = await chrome.tabs.group({ tabIds: [tabA] });
    const groupB = await chrome.tabs.group({ tabIds: [tabB] });

    // Let the running extension drain its tab/group events before we overwrite.
    await new Promise((r) => setTimeout(r, 800));

    const got = await chrome.storage.local.get('lunma.state');
    const env = got['lunma.state'] as { schemaVersion: number; state: Record<string, unknown> };
    const state = env.state as {
      spaces: Array<{ id: string; name: string; color: string; icon: string }>;
      activeSpaceByWindow: Record<number, string>;
      spaceInstancesByWindow: Record<number, Record<string, unknown>>;
    };

    const s1 = state.spaces[0].id; // the booted Default
    const s2 = 'e2e-beta';
    if (!state.spaces.some((s) => s.id === s2)) {
      state.spaces.push({ id: s2, name: 'Beta', color: 'red', icon: 'star' });
    }
    // Inject the corruption: each instance lists BOTH tabs, each pointing at a
    // different real Chrome group.
    state.activeSpaceByWindow[windowId] = s1;
    state.spaceInstancesByWindow[windowId] = {
      [s1]: { spaceId: s1, groupId: groupA, tempTabIds: [tabA, tabB], tempTabTitles: {} },
      [s2]: { spaceId: s2, groupId: groupB, tempTabIds: [tabA, tabB], tempTabTitles: {} },
    };
    await chrome.storage.local.set({ 'lunma.state': { schemaVersion: env.schemaVersion, state } });
    return { windowId, tabA, tabB, groupA, groupB, s1, s2 };
  });

  // 2. Reboot the extension. This invalidates the current page's runtime, so
  //    tolerate the rejection and discard the page.
  await page.evaluate(() => chrome.runtime.reload()).catch(() => undefined);
  await page.close().catch(() => undefined);

  // 3. Reopen an extension page and confirm it regained the extension `chrome.*`
  //    APIs (the bare `window.chrome` on a blank page lacks `chrome.storage`).
  await new Promise((r) => setTimeout(r, 3000));
  page = await context.newPage();
  let ready = false;
  for (let i = 0; i < 20 && !ready; i++) {
    try {
      await page.goto(sidebarUrl, { waitUntil: 'domcontentloaded' });
      ready = await page.evaluate(() => typeof chrome !== 'undefined' && !!chrome.storage?.local);
    } catch {
      // Extension still restarting — retry.
    }
    if (!ready) await new Promise((r) => setTimeout(r, 750));
  }
  expect(ready, 'extension page regained chrome.storage after reboot').toBe(true);

  // Wake the rebooted worker so it runs boot → group-aware seed → reconcile →
  // persist, then let it settle (incl. group materialization).
  await page.evaluate(() =>
    chrome.runtime.sendMessage({ type: 'lunma/state-request' }).catch(() => undefined),
  );
  await new Promise((r) => setTimeout(r, 4500));

  // 4. Read the healed per-window instances from storage.
  const healed = await page.evaluate(async (windowId: number) => {
    const got = await chrome.storage.local.get('lunma.state');
    const state = (got['lunma.state'] as { state: Record<string, unknown> }).state as {
      spaceInstancesByWindow: Record<
        number,
        Record<string, { groupId: number; tempTabIds: number[] }>
      >;
    };
    const inst = state.spaceInstancesByWindow[windowId] ?? {};
    const out: Record<string, { groupId: number; tempTabIds: number[] }> = {};
    for (const [sid, i] of Object.entries(inst)) {
      out[sid] = { groupId: i.groupId, tempTabIds: i.tempTabIds };
    }
    return out;
  }, ctx.windowId);

  const i1 = healed[ctx.s1];
  const i2 = healed[ctx.s2];
  expect(i1, 'space 1 instance survives boot').toBeTruthy();
  expect(i2, 'space 2 instance survives boot').toBeTruthy();

  // Each tab is owned by exactly one Space — the one whose live group it sits in.
  expect(i1.tempTabIds).toContain(ctx.tabA);
  expect(i1.tempTabIds).not.toContain(ctx.tabB);
  expect(i2.tempTabIds).toContain(ctx.tabB);
  expect(i2.tempTabIds).not.toContain(ctx.tabA);

  // And the two Spaces resolve to distinct live groups — no collapse.
  expect(i1.groupId).not.toBe(i2.groupId);
});
