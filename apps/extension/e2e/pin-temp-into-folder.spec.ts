import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

// Regression for pin-temp-tab-into-folder: dragging a TEMPORARY tab into the
// Pinned section must honour drop-onto semantics (file into a folder, fold onto
// a tab) AND never orphan the minted record. The original bug lost the tab —
// the record landed under neither the folder's children nor the top-level list.
// This drives the real pointer-drag controller in a real Chromium (built `dist/`)
// and inspects persisted state via chrome.storage.local, exactly as the manual
// repro did.
//
// Like pinned-tabs.spec, the sidebar is opened directly as a tab (it resolves
// windowId via chrome.windows.getCurrent and connects to the live SW the same).

interface PinNodeSnap {
  kind: string;
  id: string;
  name: string;
  children: string[];
}
interface StateSnap {
  spaceId: string | null;
  nodes: PinNodeSnap[];
  savedIds: string[];
  tempTabIds: number[];
  // Per-(saved tab, window) live bindings (per-window-tab-bindings, ADR 0003):
  // `{ [savedTabId]: { [windowId]: liveTabId } }`.
  bindings: Record<string, Record<number, number>>;
}

/** Open the sidebar page and wait for it to render against live SW state. */
async function openSidebar(page: Page, extensionId: string): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/src/sidebar/index.html`);
  await expect(page.getByTestId('sidebar')).toBeVisible();
  await expect(page.getByTestId('sidebar-content')).toBeVisible();
}

/** Create a temporary tab in the sidebar's window via the extension API. */
async function createTempTab(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await chrome.tabs.create({ url: 'about:blank', active: false });
  });
}

/** Read the active Space's pinned tree + saved-tab/temp/binding state from disk. */
async function snapshot(page: Page): Promise<StateSnap> {
  return page.evaluate(async () => {
    const got = (await chrome.storage.local.get('lunma.state')) as {
      'lunma.state'?: {
        state?: {
          activeSpaceByWindow: Record<number, string | null>;
          pinnedBySpace: Record<
            string,
            Array<{ kind: string; id: string; name?: string; children?: string[] }>
          >;
          savedTabs: Record<string, { id: string; spaceId: string }>;
          spaceInstancesByWindow: Record<number, Record<string, { tempTabIds: number[] }>>;
          tabBindings: Record<string, Record<number, number>>;
        };
      };
    };
    const st = got['lunma.state']?.state;
    const win = (await chrome.windows.getCurrent({})).id as number;
    const spaceId = st?.activeSpaceByWindow?.[win] ?? null;
    const rawNodes = (spaceId && st?.pinnedBySpace?.[spaceId]) || [];
    const nodes = rawNodes.map((n) =>
      n.kind === 'folder'
        ? { kind: 'folder', id: n.id, name: n.name ?? '', children: n.children ?? [] }
        : { kind: 'tab', id: n.id, name: '', children: [] },
    );
    const savedIds = Object.values(st?.savedTabs ?? {})
      .filter((s) => s.spaceId === spaceId)
      .map((s) => s.id);
    const inst = (spaceId && st?.spaceInstancesByWindow?.[win]?.[spaceId]) || null;
    return {
      spaceId,
      nodes,
      savedIds,
      tempTabIds: inst?.tempTabIds ?? [],
      bindings: st?.tabBindings ?? {},
    };
  });
}

/** All placed saved-tab ids (top-level tab nodes + every folder's children). */
function placedIds(nodes: PinNodeSnap[]): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    if (n.kind === 'tab') out.push(n.id);
    else out.push(...n.children);
  }
  return out;
}

/** No-orphan invariant: every savedTab for the Space is placed EXACTLY once. */
function expectNoOrphans(snap: StateSnap): void {
  const placed = placedIds(snap.nodes);
  for (const id of snap.savedIds) {
    expect(
      placed.filter((p) => p === id),
      `savedTab ${id} placed exactly once`,
    ).toHaveLength(1);
  }
  // And nothing placed that has no record (a dangling tree reference).
  for (const id of placed) {
    expect(snap.savedIds, `placed id ${id} has a savedTabs record`).toContain(id);
  }
}

/** Assert the newly minted saved tab is bound and has left Temporary. */
function expectBoundAndOutOfTemporary(snap: StateSnap, newId: string): void {
  // Per-window bindings (ADR 0003): `bindings[newId]` is `{ [windowId]: liveTabId }`.
  // The drag minted a binding in the sidebar's (single) window — assert exactly one
  // live tab id, and that the bound tab left Temporary.
  const binding = snap.bindings[newId];
  const boundTabIds = binding ? Object.values(binding) : [];
  expect(boundTabIds.length, `new saved tab ${newId} is bound in exactly one window`).toBe(1);
  const boundTabId = boundTabIds[0];
  expect(typeof boundTabId, `new saved tab ${newId} binds a live tab id`).toBe('number');
  expect(snap.tempTabIds, 'the bound tab left tempTabIds').not.toContain(boundTabId);
}

/** Pointer-drag a row to the centre of a target (past the 5px start threshold).
 * The target centre lands in a row's drop-onto band (middle 50%), which is what
 * turns a drop onto a folder/tab into a file-in / fold gesture.
 *
 * Assert-and-retry gesture (mirrors the `openFolderMenu` hardening): a single
 * pointer sequence is timing-sensitive under CI load — when issued against a
 * stale bounding box (e.g. right after an inline-rename commit re-renders the
 * list) the `mouse.down()` lands off-row, no drag starts, and the drop is a
 * silent no-op. So re-measure both ends each attempt (scroll into view first),
 * and — when the caller passes a `settled` predicate describing the expected
 * post-drop state — verify the drop registered and replay the sequence if it
 * did not. The predicate is checked against the EXACT expected state, so a
 * genuinely-successful (if slow) drop is never re-dragged into a duplicate. */
async function dragTo(
  page: Page,
  row: Locator,
  target: Locator,
  settled?: () => Promise<boolean>,
): Promise<void> {
  const ATTEMPTS = 4;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    await row.scrollIntoViewIfNeeded();
    await target.scrollIntoViewIfNeeded();
    const r = await row.boundingBox();
    const z = await target.boundingBox();
    if (!r || !z) throw new Error('dragTo: missing bounding box');
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
    await page.mouse.down();
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2 + 8, { steps: 3 });
    await page.mouse.move(z.x + z.width / 2, z.y + z.height / 2, { steps: 12 });
    await page.mouse.up();
    if (!settled) return;
    try {
      await expect.poll(settled, { timeout: 2_000 }).toBe(true);
      return;
    } catch {
      if (attempt === ATTEMPTS)
        throw new Error(`dragTo: drop did not register after ${ATTEMPTS} attempts`);
      // Stale-box no-op: nothing changed, so replaying the sequence is safe.
    }
  }
}

const tempRows = (page: Page): Locator => page.getByTestId('temp-tabs').getByTestId('tab-row');
const pinnedTabRows = (page: Page): Locator =>
  page.getByTestId('pinned-tabs').getByTestId('tab-row');

test('temp→pinned drops file into folders, fold onto tabs (auto-rename), without orphaning', async ({
  page,
  extensionId,
}) => {
  await openSidebar(page, extensionId);

  // Seed temporary tabs (the sidebar's own tab may also list; create plenty so
  // each drag has a fresh temp row to grab).
  for (let i = 0; i < 4; i += 1) await createTempTab(page);
  await expect.poll(async () => tempRows(page).count()).toBeGreaterThanOrEqual(3);

  // --- (c) drop between rows / into the empty zone → a top-level pin --------
  await expect(pinnedTabRows(page)).toHaveCount(0);
  let before = await snapshot(page);
  await dragTo(page, tempRows(page).first(), page.getByTestId('pinned-tabs'), async () => {
    return (await snapshot(page)).savedIds.length === 1;
  });
  await expect.poll(async () => (await snapshot(page)).savedIds.length).toBe(1);

  let snap = await snapshot(page);
  expect(snap.nodes).toHaveLength(1);
  expect(snap.nodes[0]?.kind).toBe('tab'); // top-level tab node, not a folder
  const topLevelTabId = snap.nodes[0]?.id as string;
  expectBoundAndOutOfTemporary(snap, topLevelTabId);
  expectNoOrphans(snap);
  await expect(pinnedTabRows(page)).toHaveCount(1);

  // --- (b) drop ONTO the top-level pinned tab → fold the two into a folder --
  before = snap;
  await dragTo(page, tempRows(page).first(), pinnedTabRows(page).first(), async () => {
    return (await snapshot(page)).savedIds.length === 2;
  });
  await expect.poll(async () => (await snapshot(page)).savedIds.length).toBe(2);
  await expect
    .poll(async () => (await snapshot(page)).nodes.some((n) => n.kind === 'folder'))
    .toBe(true);

  snap = await snapshot(page);
  const folderOfTwo = snap.nodes.find((n) => n.kind === 'folder');
  expect(folderOfTwo, 'a folder was created from the two tabs').toBeDefined();
  expect(folderOfTwo?.children).toHaveLength(2);
  expect(folderOfTwo?.children).toContain(topLevelTabId); // the original tab is now inside it
  const foldedNewId = snap.savedIds.find((id) => !before.savedIds.includes(id)) as string;
  expectBoundAndOutOfTemporary(snap, foldedNewId);
  expectNoOrphans(snap);

  // Auto-rename on fold (pin-temp-tab-into-folder): the new folder opens straight
  // into inline rename so the user can name it immediately. Type a name + commit.
  const renameInput = page.getByTestId('folder-rename-input');
  await expect(renameInput).toBeVisible();
  await renameInput.fill('Research');
  await renameInput.press('Enter');
  await expect
    .poll(async () => (await snapshot(page)).nodes.find((n) => n.kind === 'folder')?.name)
    .toBe('Research');

  // --- (a) drop a temp tab INTO the (expanded) folder's child zone ----------
  // The folder is still expanded from the auto-rename, so its child zone
  // (`pinned:<spaceId>:folder:<id>` — the exact zone whose id-parse bug used to
  // lose the tab) is the drop target. Filing in must PLACE the tab AND must NOT
  // open rename (only a fold creates-and-renames; filing into an existing folder
  // does not).
  before = await snapshot(page);
  await expect(page.getByTestId('folder-children')).toBeVisible();
  await dragTo(page, tempRows(page).first(), page.getByTestId('folder-children'), async () => {
    return (await snapshot(page)).savedIds.length === 3;
  });
  await expect.poll(async () => (await snapshot(page)).savedIds.length).toBe(3);

  snap = await snapshot(page);
  const filedNewId = snap.savedIds.find((id) => !before.savedIds.includes(id)) as string;
  // The new record lives in the folder's children — not at the top level, not lost.
  const containingFolder = snap.nodes.find(
    (n) => n.kind === 'folder' && n.children.includes(filedNewId),
  );
  expect(containingFolder, 'the temp tab was filed into the folder').toBeDefined();
  expect(containingFolder?.children).toHaveLength(3); // the named folder now holds 3
  expect(placedIds(snap.nodes)).not.toContain(undefined);
  expectBoundAndOutOfTemporary(snap, filedNewId);
  expectNoOrphans(snap);
  // Filing INTO an existing folder must NOT open inline rename.
  await expect(page.getByTestId('folder-rename-input')).toHaveCount(0);
});
