import { fileURLToPath } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, test } from '@playwright/test';

// preserve-user-tab-groups (task 5.1): mirrors the confirmed empirical repro —
// Lunma was destroying user-created native Chrome tab groups at every
// service-worker boot (seedExistingTabs adopted their tabs into the active
// Space; the boot materialization sweep then dragged those tabs into the
// Space's own group, emptying and dissolving the user's group). Follows the
// `_persist.spec.ts` relaunch pattern: a real persistent-context restart with
// `--restore-last-session` (not `chrome.runtime.reload()`, which the MV3
// unpacked-extension harness can't reliably recover from — see
// `space-group-collapse.spec.ts`'s `fixme`).
//
// Two variants, both confirmed to destroy the user's group before the fix:
//   A. Same title + same colour as the Space's own group (worst-case collision
//      — title/colour tiebreak alone must not matter).
//   B. A differently-named/coloured group ("Mine", orange) — the common case.

const EXT = fileURLToPath(new URL('./../dist', import.meta.url));

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
  let sw = ctx.serviceWorkers()[0];
  if (!sw) sw = await ctx.waitForEvent('serviceworker');
  return { ctx, sw };
}

interface Dump {
  groups: Array<{ id: number; title?: string | undefined; color?: string | undefined }>;
  tabs: Array<{ id: number; groupId: number }>;
  /** tempTabIds across EVERY window's instance for `spaceId` — a real browser
   * restart opens the restored session as a NEW window with a NEW windowId, so
   * the pre-restart windowId cannot be relied on to look this up after. */
  tempTabIds: number[];
  /** Every instance's recorded (≥0) `groupId`, across ALL Spaces/windows — the
   * live group ids Lunma currently tracks. A restart can give the Space's OWN
   * group the SAME title/colour as the user's own group (variant A), so a live
   * group's title cannot disambiguate which is which after restart — only
   * "is this id recorded by some instance" can (the same signal the boot pass
   * itself uses). */
  trackedGroupIds: number[];
}

async function dump(sw: Awaited<ReturnType<typeof launch>>['sw'], spaceId: string): Promise<Dump> {
  return sw.evaluate(async (sid) => {
    const groups = await chrome.tabGroups.query({});
    const tabs = await chrome.tabs.query({});
    const got = await chrome.storage.local.get('lunma.state');
    const state = (got['lunma.state'] as { state: Record<string, unknown> })?.state as {
      spaceInstancesByWindow: Record<number, Record<string, { groupId: number; tempTabIds: number[] }>>;
    };
    const tempTabIds: number[] = [];
    const trackedGroupIds: number[] = [];
    for (const windowMap of Object.values(state?.spaceInstancesByWindow ?? {})) {
      const ids = windowMap?.[sid as string]?.tempTabIds;
      if (ids) tempTabIds.push(...ids);
      for (const instance of Object.values(windowMap ?? {})) {
        if (instance.groupId >= 0) trackedGroupIds.push(instance.groupId);
      }
    }
    return {
      groups: groups.map((g) => ({ id: g.id, title: g.title, color: g.color })),
      tabs: tabs.map((t) => ({ id: t.id as number, groupId: t.groupId as number })),
      tempTabIds,
      trackedGroupIds,
    };
  }, spaceId);
}

/** Run one variant end to end: build the state, restart, assert survival. */
async function runVariant(
  dirSuffix: string,
  userGroupTitleColor: (spaceGroupColor: string) => { title: string; color: string },
) {
  const dir = mkdtempSync(join(tmpdir(), `lunma-preserve-groups-${dirSuffix}-`));
  let { ctx, sw } = await launch(dir);
  await new Promise((r) => setTimeout(r, 2500)); // initial boot settle

  // Phase 1a: create the tracked temp tabs and read the Space's own group
  // colour (CDP `evaluate` can only serialize plain data, not a function
  // reference — the title/colour pick happens here in Node, between the two
  // evaluate calls).
  const built = await sw.evaluate(async () => {
    const win = await chrome.windows.getCurrent();
    const windowId = win.id as number;
    const t1 = await chrome.tabs.create({ windowId, url: 'https://example.com/1', active: false });
    const t2 = await chrome.tabs.create({ windowId, url: 'https://example.com/2', active: false });
    const t3 = await chrome.tabs.create({ windowId, url: 'https://example.com/3', active: false });
    await new Promise((r) => setTimeout(r, 1200)); // let onCreated/grouping settle

    const got = await chrome.storage.local.get('lunma.state');
    const state = (got['lunma.state'] as { state: Record<string, unknown> })?.state as {
      spaces: Array<{ id: string; name: string; color: string }>;
      activeSpaceByWindow: Record<number, string>;
    };
    const spaceId = state.activeSpaceByWindow[windowId] as string;
    const space = state.spaces.find((s) => s.id === spaceId);
    const spaceGroup = (await chrome.tabGroups.query({ windowId })).find((g) => g.title === space?.name);

    return {
      windowId,
      spaceId,
      t1: t1.id as number,
      t2: t2.id as number,
      t3: t3.id as number,
      spaceGroupColor: spaceGroup?.color ?? 'blue',
    };
  });

  const { title, color } = userGroupTitleColor(built.spaceGroupColor);

  // Phase 1b: group two of the tracked tabs into the user's own native group.
  await sw.evaluate(
    async ([t2, t3, groupTitle, groupColor]) => {
      const userGroupId = await chrome.tabs.group({ tabIds: [t2 as number, t3 as number] });
      await chrome.tabGroups.update(userGroupId, {
        title: groupTitle as string,
        color: groupColor as `${chrome.tabGroups.Color}`,
      });
      await new Promise((r) => setTimeout(r, 1200)); // let the D6 mid-session release drain
    },
    [built.t2, built.t3, title, color] as const,
  );

  const setup = { spaceId: built.spaceId, t2: built.t2, t3: built.t3, userGroupTitle: title };

  const before = await dump(sw, setup.spaceId);
  // D6 should already have released t2/t3 from tempTabIds before the restart.
  if (before.tempTabIds.includes(setup.t2) || before.tempTabIds.includes(setup.t3)) {
    throw new Error(
      `expected t2/t3 released from tempTabIds before restart, got ${JSON.stringify(before.tempTabIds)}`,
    );
  }
  if (before.groups.length < 2) {
    throw new Error(`expected two live groups before restart, got ${JSON.stringify(before.groups)}`);
  }
  await ctx.close();

  // Phase 2: relaunch with session restore — the actual regression repro.
  ({ ctx, sw } = await launch(dir, ['--restore-last-session']));
  await new Promise((r) => setTimeout(r, 5000)); // boot reconcile + session restore settle

  const after = await dump(sw, setup.spaceId);
  await ctx.close();

  if (after.groups.length !== 2) {
    throw new Error(
      `expected BOTH groups to survive the restart, got ${after.groups.length}: ${JSON.stringify(after.groups)}`,
    );
  }
  // Identify the user's OWN group as the one NOT recorded by any instance —
  // in variant A the Space's own restored group shares the same title/colour,
  // so title/colour cannot disambiguate after restart; "untracked" is the
  // same signal the boot pass itself uses to decide what to protect.
  const untrackedGroups = after.groups.filter((g) => !after.trackedGroupIds.includes(g.id));
  const userGroup = untrackedGroups.find((g) => g.title === setup.userGroupTitle);
  if (!userGroup) {
    throw new Error(
      `user's group ("${setup.userGroupTitle}") did not survive the restart as an untracked group. ` +
        `groups=${JSON.stringify(after.groups)} tracked=${JSON.stringify(after.trackedGroupIds)}`,
    );
  }
  const userGroupTabs = after.tabs.filter((t) => t.groupId === userGroup.id);
  if (userGroupTabs.length !== 2) {
    throw new Error(
      `expected the user's group to still hold 2 tabs, got ${userGroupTabs.length}: ${JSON.stringify(userGroupTabs)}`,
    );
  }
  if (after.tempTabIds.some((id) => userGroupTabs.some((t) => t.id === id))) {
    throw new Error("a tab in the user's group is still listed as a Space temp tab — state is dishonest");
  }
}

test('a user group with the SAME title/colour as the Space group survives a restart', async () => {
  test.setTimeout(60_000);
  await runVariant('variant-a', (spaceColor) => ({ title: 'Default', color: spaceColor }));
});

test('a differently-named/coloured user group survives a restart', async () => {
  test.setTimeout(60_000);
  await runVariant('variant-b', () => ({ title: 'Mine', color: 'orange' }));
});
