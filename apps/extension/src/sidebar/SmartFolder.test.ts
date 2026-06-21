import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import type { PinNode, SmartFolderItem, SmartSectionRuntime } from '../shared/types';
import SmartFolderHarness from './SmartFolder.test.harness.svelte';

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

const { sendMock, openOptionsAtMock } = vi.hoisted(() => ({
  sendMock: vi.fn(() => Promise.resolve()),
  openOptionsAtMock: vi.fn(() => Promise.resolve()),
}));
vi.mock('../shared/bus', () => ({ bus: { send: sendMock }, dispatch: sendMock }));
vi.mock('./open-options', () => ({ openOptionsAt: openOptionsAtMock }));

/** The `chrome.permissions.request` mock — the needs-access "Grant access"
 * button calls it via `requestHostPermissions` (least-privilege-permissions). */
let permissionsRequestMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  permissionsRequestMock = vi.fn(() => Promise.resolve(true));
  // `faviconFor` resolves the `_favicon` endpoint via chrome.runtime.getURL;
  // the needs-access grant goes through `chrome.permissions.request`.
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: { getURL: (path: string) => `chrome-extension://abc${path}` },
    permissions: {
      request: permissionsRequestMock,
      contains: vi.fn(() => Promise.resolve(true)),
    },
  };
  sendMock.mockClear();
  openOptionsAtMock.mockClear();
});
afterEach(() => {
  cleanup();
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
});

function smartNode(overrides: Partial<SmartNode> = {}): SmartNode {
  return {
    kind: 'smart',
    id: 'sf-1',
    name: 'Review requests',
    icon: 'folder-git-2',
    sources: [
      { source: 'gitlab', baseUrl: 'https://gitlab.example.com', query: 'review-requested' },
    ],
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 10,
    ...overrides,
  };
}

/** A feed (`rss`) node — the reading-nook source. */
function feedNode(overrides: Partial<SmartNode> = {}): SmartNode {
  return smartNode({
    id: 'feed-1',
    name: 'Hacker News',
    icon: 'rss',
    sources: [{ source: 'rss', baseUrl: 'https://news.ycombinator.com/rss' }],
    maxItems: 30,
    hideRead: false,
    ...overrides,
  });
}

/** A feed result item (no status). */
function post(i: number): SmartFolderItem {
  return { id: `post-${i}`, title: `Post ${i}`, url: `https://example.com/p/${i}` };
}

/** A store holding a single feed folder, optionally with a runtime + read-state. */
function makeFeedStore(
  node: SmartNode,
  section?: SmartSectionRuntime,
  readIds: string[] = [],
): LunmaStore {
  const store = new LunmaStore();
  store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
  store.state.pinnedBySpace.work = [node];
  if (section) {
    const cfg = node.sources[0];
    const key = cfg ? `${cfg.source}:${new URL(cfg.baseUrl).host}` : '';
    store.state.smartFolders[node.id] = { sections: { [key]: section } };
  }
  if (readIds.length > 0) store.state.smartReadState[node.id] = readIds;
  return store;
}

function item(i: number, status?: SmartFolderItem['status']): SmartFolderItem {
  return {
    id: `mr-${i}`,
    title: `MR ${i}`,
    url: `https://gitlab.example.com/g/p/-/merge_requests/${i}`,
    ...(status !== undefined ? { status } : {}),
  };
}

function makeStore(section?: SmartSectionRuntime): LunmaStore {
  const store = new LunmaStore();
  store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
  store.state.pinnedBySpace.work = [smartNode()];
  if (section)
    store.state.smartFolders['sf-1'] = { sections: { 'gitlab:gitlab.example.com': section } };
  return store;
}

function renderSmart(
  store: LunmaStore,
  props: Partial<{
    node: SmartNode;
    expanded: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
  }> = {},
) {
  return render(SmartFolderHarness, {
    props: { store, windowId: 100, spaceId: 'work', node: smartNode(), ...props },
  });
}

describe('SmartFolder — populated render + one-glyph restraint', () => {
  test('renders one row per item with at most ONE status dot, full phrase in the ARIA label', () => {
    const store = makeStore({
      state: 'ok',
      items: [
        item(1, { tone: 'fail', label: 'Pipeline failed' }),
        item(2, { tone: 'ok', label: 'Pipeline passed' }),
        item(3), // no pipeline → no glyph
      ],
      fetchedAt: 1,
    });
    const { container } = renderSmart(store);

    const rows = container.querySelectorAll('[data-testid="smart-result-row"]');
    expect(rows).toHaveLength(3);
    // One-glyph restraint: each row carries at most one dot; tone classes map
    // to the semantic tokens; the no-pipeline row carries none.
    expect(rows[0]?.querySelectorAll('[data-testid="smart-status-dot"]')).toHaveLength(1);
    expect(rows[0]?.querySelector('[data-testid="smart-status-dot"]')?.classList).toContain('fail');
    expect(rows[0]?.getAttribute('aria-label')).toBe('MR 1 — Pipeline failed');
    expect(rows[1]?.querySelector('[data-testid="smart-status-dot"]')?.classList).toContain('ok');
    expect(rows[2]?.querySelectorAll('[data-testid="smart-status-dot"]')).toHaveLength(0);
    expect(rows[2]?.getAttribute('aria-label')).toBe('MR 3');
  });

  test('collapsed renders no children container', () => {
    const store = makeStore({ state: 'ok', items: [item(1)], fetchedAt: 1 });
    const { container } = renderSmart(store, { expanded: false });
    expect(container.querySelector('[data-testid="smart-children"]')).toBeNull();
  });
});

describe('SmartFolder — count badge', () => {
  test('renders the item count', () => {
    const store = makeStore({
      state: 'ok',
      items: Array.from({ length: 7 }, (_, i) => item(i)),
      fetchedAt: 1,
    });
    const { container } = renderSmart(store);
    expect(container.querySelector('[data-testid="folder-row-badge"]')?.textContent).toBe('7');
  });

  test('renders the item count (no artificial cap)', () => {
    const store = makeStore({
      state: 'ok',
      items: Array.from({ length: 20 }, (_, i) => item(i)),
      fetchedAt: 1,
    });
    const { container } = renderSmart(store);
    expect(container.querySelector('[data-testid="folder-row-badge"]')?.textContent).toBe('20');
  });

  test('badge shows exact count regardless of maxItems', () => {
    const node = smartNode({ maxItems: 30 });
    const store = new LunmaStore();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.pinnedBySpace.work = [node];
    store.state.smartFolders['sf-1'] = {
      sections: {
        'gitlab:gitlab.example.com': {
          state: 'ok',
          items: Array.from({ length: 30 }, (_, i) => item(i)),
          fetchedAt: 1,
        },
      },
    };
    const { container } = renderSmart(store, { node });
    expect(container.querySelector('[data-testid="folder-row-badge"]')?.textContent).toBe('30');
  });

  test('renders no badge before the first fetch lands', () => {
    const store = makeStore(); // no runtime → pending
    const { container } = renderSmart(store);
    expect(container.querySelector('[data-testid="folder-row-badge"]')).toBeNull();
  });
});

describe('SmartFolder — pinned-tab activation (smart-folder-item-bindings)', () => {
  test('clicking a result row dispatches openSmartItem with identity only — never a URL', async () => {
    const store = makeStore({ state: 'ok', items: [item(42)], fetchedAt: 1 });
    const { container } = renderSmart(store);
    await fireEvent.click(
      container.querySelector('[data-testid="smart-result-row"]') as HTMLButtonElement,
    );
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'openSmartItem',
      payload: {
        spaceId: 'work',
        folderId: 'sf-1',
        itemId: 'gitlab:gitlab.example.com:mr-42',
        windowId: 100,
      },
    });
  });

  test("a bound row whose tab is the window's focused tab takes the active treatment", () => {
    const store = makeStore({ state: 'ok', items: [item(1), item(2)], fetchedAt: 1 });
    store.state.smartItemBindings['sf-1'] = {
      'gitlab:gitlab.example.com:mr-1': { 100: { tabId: 7, allowGlob: '' } },
    };
    store.state.liveTabsById[7] = {
      tabId: 7,
      windowId: 100,
      title: 'MR 1',
      url: 'https://gitlab.example.com/g/p/-/merge_requests/1',
      active: true,
      status: 'complete',
    };
    const { container } = renderSmart(store);

    const rows = container.querySelectorAll('[data-testid="smart-result-row"]');
    expect(rows[0]?.getAttribute('data-bound')).toBe('true');
    expect(rows[0]?.getAttribute('data-active')).toBe('true');
    expect(rows[0]?.classList).toContain('active');
    // An unbound sibling stays plain.
    expect(rows[1]?.getAttribute('data-bound')).toBe('false');
    expect(rows[1]?.classList).not.toContain('active');
  });

  test('a bound-but-unfocused row reads as a normal row (no active wash)', () => {
    const store = makeStore({ state: 'ok', items: [item(1)], fetchedAt: 1 });
    store.state.smartItemBindings['sf-1'] = {
      'gitlab:gitlab.example.com:mr-1': { 100: { tabId: 7, allowGlob: '' } },
    };
    store.state.liveTabsById[7] = {
      tabId: 7,
      windowId: 100,
      title: 'MR 1',
      url: 'https://gitlab.example.com/g/p/-/merge_requests/1',
      active: false,
      status: 'complete',
    };
    const { container } = renderSmart(store);
    const row = container.querySelector('[data-testid="smart-result-row"]');
    expect(row?.getAttribute('data-bound')).toBe('true');
    expect(row?.getAttribute('data-active')).toBe('false');
  });

  test('a binding for ANOTHER window carries no treatment here', () => {
    const store = makeStore({ state: 'ok', items: [item(1)], fetchedAt: 1 });
    store.state.smartItemBindings['sf-1'] = {
      'gitlab:gitlab.example.com:mr-1': { 200: { tabId: 7, allowGlob: '' } },
    }; // window 200, not 100
    const { container } = renderSmart(store);
    const row = container.querySelector('[data-testid="smart-result-row"]');
    expect(row?.getAttribute('data-bound')).toBe('false');
    expect(container.querySelector('[data-testid="smart-close"]')).toBeNull();
  });

  test("the bound row's ✕ dispatches closeTab for the bound tab; the dot stays in the DOM", async () => {
    const store = makeStore({
      state: 'ok',
      items: [item(1, { tone: 'ok', label: 'Pipeline passed' })],
      fetchedAt: 1,
    });
    store.state.smartItemBindings['sf-1'] = {
      'gitlab:gitlab.example.com:mr-1': { 100: { tabId: 7, allowGlob: '' } },
    };
    const { container } = renderSmart(store);

    const close = container.querySelector('[data-testid="smart-close"]') as HTMLButtonElement;
    expect(close).not.toBeNull();
    await fireEvent.click(close);
    expect(sendMock).toHaveBeenCalledWith({ kind: 'closeTab', payload: { tabId: 7 } });
    // The dot is hidden by hover CSS only — it remains in the DOM (returns on
    // mouse-out) and the full phrase stays in the ARIA label.
    expect(container.querySelector('[data-testid="smart-status-dot"]')).not.toBeNull();
    expect(
      container.querySelector('[data-testid="smart-result-row"]')?.getAttribute('aria-label'),
    ).toBe('MR 1 — Pipeline passed');
  });

  test('an unbound row renders no ✕', () => {
    const store = makeStore({ state: 'ok', items: [item(1)], fetchedAt: 1 });
    const { container } = renderSmart(store);
    expect(container.querySelector('[data-testid="smart-close"]')).toBeNull();
  });
});

describe('SmartFolder — binding-held rows (open work holds its row)', () => {
  test('a bound item dropped from an ok result keeps rendering, and evaporates on unbind', async () => {
    const store = makeStore({ state: 'ok', items: [item(1), item(2)], fetchedAt: 1 });
    store.state.smartItemBindings['sf-1'] = {
      'gitlab:gitlab.example.com:mr-1': { 100: { tabId: 7, allowGlob: '' } },
    };
    const { container } = renderSmart(store);
    await tick();
    expect(container.querySelectorAll('[data-testid="smart-result-row"]')).toHaveLength(2);

    // The next ok poll no longer lists mr-1 (merged) — its binding lives, so
    // the row holds, rendered from component memory with its bound treatment.
    store.state.smartFolders['sf-1'] = {
      sections: { 'gitlab:gitlab.example.com': { state: 'ok', items: [item(2)], fetchedAt: 2 } },
    };
    await tick();
    let rows = container.querySelectorAll('[data-testid="smart-result-row"]');
    expect(rows).toHaveLength(2);
    const heldRow = [...rows].find((r) => r.getAttribute('aria-label') === 'MR 1');
    expect(heldRow?.getAttribute('data-bound')).toBe('true');

    // The bound tab closes → the binding drops → the held row evaporates.
    store.unbindSmartItemsForTab(7);
    await tick();
    rows = container.querySelectorAll('[data-testid="smart-result-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.getAttribute('aria-label')).toBe('MR 2');
  });

  test('an honest ok-empty result keeps ONLY binding-held rows', async () => {
    const store = makeStore({ state: 'ok', items: [item(1), item(2)], fetchedAt: 1 });
    store.state.smartItemBindings['sf-1'] = {
      'gitlab:gitlab.example.com:mr-1': { 100: { tabId: 7, allowGlob: '' } },
    };
    const { container } = renderSmart(store);
    await tick();

    store.state.smartFolders['sf-1'] = {
      sections: { 'gitlab:gitlab.example.com': { state: 'ok', items: [], fetchedAt: 2 } },
    };
    await tick();
    const rows = container.querySelectorAll('[data-testid="smart-result-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.getAttribute('aria-label')).toBe('MR 1');
  });
});

describe('SmartFolder — menu (Refresh now · Edit… · Move · Delete)', () => {
  const TRIGGER = '[data-testid="folder-row-menu-trigger"]';
  const menuItem = (id: string): HTMLButtonElement =>
    document.querySelector(`[data-menu-id="${id}"]`) as HTMLButtonElement;

  test('a queue folder carries Refresh · Edit · Open-all · Move · Delete (no Mark-all-read)', async () => {
    const store = makeStore({ state: 'ok', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store);
    await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
    const ids = [...document.querySelectorAll('[data-testid="folder-row-menu-item"]')].map((e) =>
      e.getAttribute('data-menu-id'),
    );
    expect(ids).toEqual(['refresh', 'edit', 'open-all', 'move-up', 'move-down', 'delete']);
  });

  test('a feed folder additionally carries Mark all read', async () => {
    const node = feedNode();
    const store = makeFeedStore(node, { state: 'ok', items: [post(1)], fetchedAt: 1 });
    const { container } = renderSmart(store, { node });
    await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
    const ids = [...document.querySelectorAll('[data-testid="folder-row-menu-item"]')].map((e) =>
      e.getAttribute('data-menu-id'),
    );
    expect(ids).toEqual([
      'refresh',
      'edit',
      'open-all',
      'mark-all-read',
      'move-up',
      'move-down',
      'delete',
    ]);
  });

  test('Open all in a tab dispatches openSmartFolderListing', async () => {
    const store = makeStore({ state: 'ok', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store);
    await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
    await fireEvent.click(menuItem('open-all'));
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'openSmartFolderListing',
      payload: { spaceId: 'work', folderId: 'sf-1', windowId: 100 },
    });
  });

  test('Mark all read (feed) dispatches markAllSmartItemsRead', async () => {
    const node = feedNode();
    const store = makeFeedStore(node, { state: 'ok', items: [post(1)], fetchedAt: 1 });
    const { container } = renderSmart(store, { node });
    await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
    await fireEvent.click(menuItem('mark-all-read'));
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'markAllSmartItemsRead',
      payload: { spaceId: 'work', folderId: 'feed-1' },
    });
  });

  test('Refresh now dispatches refreshSmartFolder', async () => {
    const store = makeStore({ state: 'ok', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store);
    await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
    await fireEvent.click(menuItem('refresh'));
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'refreshSmartFolder',
      payload: { spaceId: 'work', folderId: 'sf-1' },
    });
  });

  test('Move up/down dispatch the host callbacks and disable at the list ends', async () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    const store = makeStore({ state: 'ok', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store, {
      canMoveUp: false,
      canMoveDown: true,
      onMoveUp,
      onMoveDown,
    });
    await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
    // At the top of the list: Move up is inert.
    expect(menuItem('move-up').getAttribute('aria-disabled')).toBe('true');
    await fireEvent.click(menuItem('move-up'));
    expect(onMoveUp).not.toHaveBeenCalled();
    await fireEvent.click(menuItem('move-down'));
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });

  test('Delete is a two-step confirm — first arms "Delete — confirm" (menu open), second dispatches once', async () => {
    const store = makeStore({ state: 'ok', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store);
    await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);

    // First activation: dispatches nothing, morphs the entry into the danger
    // "Delete — confirm", and keeps the menu open (`keepOpen`).
    await fireEvent.click(menuItem('delete'));
    expect(sendMock).not.toHaveBeenCalled();
    const armed = menuItem('delete');
    expect(armed).not.toBeNull();
    expect(armed.textContent).toContain('Delete — confirm');
    expect(armed.classList).toContain('danger');
    expect(document.querySelector('[data-testid="folder-row-menu-item"]')).not.toBeNull();

    // Second activation dispatches deleteSmartFolder exactly once.
    await fireEvent.click(menuItem('delete'));
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'deleteSmartFolder',
      payload: { spaceId: 'work', folderId: 'sf-1' },
    });
  });

  test('closing the menu disarms a pending Delete — reopening shows the unarmed "Delete"', async () => {
    const store = makeStore({ state: 'ok', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store);

    // Arm via the right-click ContextMenu (its close is synchronous).
    await fireEvent.contextMenu(
      container.querySelector('[data-testid="context-surface"]') as HTMLElement,
    );
    await fireEvent.click(menuItem('delete'));
    expect(menuItem('delete').textContent).toContain('Delete — confirm');

    // Escape closes the menu without confirming — nothing dispatched, menu gone.
    const panel = document.querySelector('[data-testid="smart-folder-menu"]') as HTMLElement;
    await fireEvent.keyDown(panel, { key: 'Escape' });
    expect(sendMock).not.toHaveBeenCalled();
    expect(document.querySelector('[data-menu-id="delete"]')).toBeNull();

    // Reopening lands on the unarmed "Delete", never the stale "Delete — confirm".
    await fireEvent.contextMenu(
      container.querySelector('[data-testid="context-surface"]') as HTMLElement,
    );
    const reopened = menuItem('delete');
    expect(reopened).not.toBeNull();
    expect(reopened.textContent).toContain('Delete');
    expect(reopened.textContent).not.toContain('confirm');
    expect(sendMock).not.toHaveBeenCalled();
  });

  test('Edit… drills into the SmartFolderEditor panel with a back-header', async () => {
    const store = makeStore({ state: 'ok', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store);
    await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
    await fireEvent.click(menuItem('edit'));
    expect(document.querySelector('[data-testid="smart-folder-editor"]')).not.toBeNull();
    const back = document.querySelector('[data-testid="folder-row-menu-back"]');
    expect(back?.textContent).toContain('Edit smart folder');
    // Pre-filled from the node — the new multi-source editor shows existing
    // sources in the source list with a host chip.
    const sourceList = document.querySelector('[data-testid="smart-source-list"]');
    expect(sourceList).not.toBeNull();
    expect(sourceList?.querySelector('[data-source="gitlab"]')?.textContent).toBe('GitLab');
    const sourceUrl = sourceList?.querySelector('.source-url');
    expect(sourceUrl?.textContent).toBe('gitlab.example.com');
  });

  test('Save closes the kebab morph entirely — no action list remains open', async () => {
    const store = makeStore({ state: 'ok', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store);
    await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
    await fireEvent.click(menuItem('edit'));
    const save = [...document.querySelectorAll('button')].find((b) =>
      (b.textContent ?? '').includes('Save'),
    ) as HTMLButtonElement;
    await fireEvent.click(save);

    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ kind: 'updateSmartFolder' }));
    // The whole morph is dismissed — neither the editor nor the Refresh/Edit/
    // Move/Delete action list survives the confirm (the editor's onDone
    // contract: the host closes its menu, not just the drill-in).
    expect(document.querySelector('[data-testid="smart-folder-editor"]')).toBeNull();
    expect(document.querySelector('[data-testid="folder-row-menu-item"]')).toBeNull();
  });

  test('Save via the right-click ContextMenu path closes that menu entirely too', async () => {
    const store = makeStore({ state: 'ok', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store);
    await fireEvent.contextMenu(
      container.querySelector('[data-testid="context-surface"]') as HTMLElement,
    );
    await fireEvent.click(menuItem('edit'));
    expect(document.querySelector('[data-testid="smart-folder-editor"]')).not.toBeNull();
    const save = [...document.querySelectorAll('button')].find((b) =>
      (b.textContent ?? '').includes('Save'),
    ) as HTMLButtonElement;
    await fireEvent.click(save);

    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ kind: 'updateSmartFolder' }));
    expect(document.querySelector('[data-testid="smart-folder-editor"]')).toBeNull();
    expect(document.querySelector('[data-menu-id="edit"]')).toBeNull();
  });
});

describe('SmartFolder — calm states (design D7)', () => {
  test('first-fetch pending shows three static ghost rows', () => {
    const store = makeStore(); // absent runtime → pending, no items
    const { container } = renderSmart(store);
    expect(container.querySelectorAll('[data-testid="smart-ghost-row"]')).toHaveLength(3);
    expect(container.querySelector('[data-testid="smart-result-row"]')).toBeNull();
  });

  test('a pending refresh keeps last-known items rendered (no ghosts, no blink)', () => {
    const store = makeStore({ state: 'pending', items: [item(1)], fetchedAt: 1 });
    const { container } = renderSmart(store);
    expect(container.querySelectorAll('[data-testid="smart-result-row"]')).toHaveLength(1);
    expect(container.querySelector('[data-testid="smart-ghost-row"]')).toBeNull();
    // The in-flight refresh spins the glyph (FolderRow's busy treatment).
    expect(container.querySelector('.glyph.busy')).not.toBeNull();
  });

  test('signed-out shows one "Sign in to ⟨host⟩" row that opens the instance', async () => {
    const store = makeStore({ state: 'signed-out', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store);
    const row = container.querySelector('[data-testid="smart-signin-row"]') as HTMLButtonElement;
    expect(row.textContent?.trim()).toBe('Sign in to gitlab.example.com');
    expect(container.querySelector('[data-testid="smart-ghost-row"]')).toBeNull();
    expect(container.querySelector('[data-testid="smart-error-note"]')).toBeNull();
    await fireEvent.click(row);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'openUrl',
      payload: { url: 'https://gitlab.example.com', windowId: 100 },
    });
    expect(openOptionsAtMock).not.toHaveBeenCalled();
  });

  test('a signed-out github folder points at Connectors via the options deep-link, never the bus', async () => {
    const ghNode = smartNode({
      sources: [{ source: 'github', baseUrl: 'https://github.com', query: 'review-requested' }],
    });
    const store = makeStore();
    store.state.smartFolders['sf-1'] = {
      sections: { 'github:github.com': { state: 'signed-out', items: [], fetchedAt: 1 } },
    };
    store.state.pinnedBySpace.work = [ghNode];
    const { container } = renderSmart(store, { node: ghNode });
    const row = container.querySelector('[data-testid="smart-signin-row"]') as HTMLButtonElement;
    expect(row.textContent?.trim()).toBe('Add a token in Settings → Connectors');
    await fireEvent.click(row);
    expect(openOptionsAtMock).toHaveBeenCalledWith('#connectors');
    // Nothing rides the bus — the openUrl handler's scheme hardening would
    // silently drop a chrome-extension:// URL, so the row never goes near it.
    expect(sendMock).not.toHaveBeenCalled();
  });

  test('a signed-out jira folder shows "Sign in to ⟨host⟩" and opens the instance, never the options path', async () => {
    const jiraNode = smartNode({
      sources: [{ source: 'jira', baseUrl: 'https://acme.atlassian.net' }],
      icon: 'folder-kanban',
    });
    const store = makeStore();
    store.state.smartFolders['sf-1'] = {
      sections: { 'jira:acme.atlassian.net': { state: 'signed-out', items: [], fetchedAt: 1 } },
    };
    store.state.pinnedBySpace.work = [jiraNode];
    const { container } = renderSmart(store, { node: jiraNode });
    const row = container.querySelector('[data-testid="smart-signin-row"]') as HTMLButtonElement;
    // Jira groups with GitLab — there is a session to sign into (no token path).
    expect(row.textContent?.trim()).toBe('Sign in to acme.atlassian.net');
    await fireEvent.click(row);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'openUrl',
      payload: { url: 'https://acme.atlassian.net', windowId: 100 },
    });
    expect(openOptionsAtMock).not.toHaveBeenCalled();
  });

  test('needs-access shows a calm grant prompt (no error card); activating requests the connector origins', async () => {
    const store = makeStore({ state: 'needs-access', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store);
    const prompt = container.querySelector('[data-testid="smart-needs-access"]') as HTMLElement;
    expect(prompt).not.toBeNull();
    expect(prompt.textContent).toContain('Lunma needs access to gitlab.example.com');
    // It is the calm family — never the error note or the sign-in row.
    expect(container.querySelector('[data-testid="smart-error-note"]')).toBeNull();
    expect(container.querySelector('[data-testid="smart-signin-row"]')).toBeNull();
    // No result rows in needs-access (the grant prompt replaces them).
    expect(container.querySelector('[data-testid="smart-result-row"]')).toBeNull();

    const grant = [...prompt.querySelectorAll('button')].find((b) =>
      (b.textContent ?? '').includes('Grant access'),
    ) as HTMLButtonElement;
    await fireEvent.click(grant);
    // GitLab is same-origin: the request carries the baseUrl origin.
    expect(permissionsRequestMock).toHaveBeenCalledWith({
      origins: ['https://gitlab.example.com/*'],
    });
    // The grant only requests — it never writes runtime state via the bus.
    expect(sendMock).not.toHaveBeenCalled();
  });

  test('a needs-access github.com folder requests the api.github.com origin (D8)', async () => {
    const ghNode = smartNode({
      sources: [{ source: 'github', baseUrl: 'https://github.com', query: 'review-requested' }],
    });
    const store = makeStore();
    store.state.smartFolders['sf-1'] = {
      sections: { 'github:github.com': { state: 'needs-access', items: [], fetchedAt: 1 } },
    };
    store.state.pinnedBySpace.work = [ghNode];
    const { container } = renderSmart(store, { node: ghNode });
    const prompt = container.querySelector('[data-testid="smart-needs-access"]') as HTMLElement;
    expect(prompt.textContent).toContain('Lunma needs access to github.com');
    const grant = [...prompt.querySelectorAll('button')].find((b) =>
      (b.textContent ?? '').includes('Grant access'),
    ) as HTMLButtonElement;
    await fireEvent.click(grant);
    expect(permissionsRequestMock).toHaveBeenCalledWith({
      origins: ['https://api.github.com/*'],
    });
  });

  test('error keeps last-known items with one dim "Couldn\'t reach ⟨host⟩" note', () => {
    const store = makeStore({
      state: 'error',
      items: [item(1), item(2)],
      fetchedAt: 1,
    });
    const { container } = renderSmart(store);
    expect(container.querySelectorAll('[data-testid="smart-result-row"]')).toHaveLength(2);
    expect(container.querySelector('[data-testid="smart-error-note"]')?.textContent).toBe(
      "Couldn't reach gitlab.example.com",
    );
  });

  test('an SW-restart reload keeps the last-shown items rendered and clickable (no ghosts)', async () => {
    // Populated first…
    const store = makeStore({ state: 'ok', items: [item(1), item(2)], fetchedAt: 1 });
    const { container } = renderSmart(store);
    expect(container.querySelectorAll('[data-testid="smart-result-row"]')).toHaveLength(2);

    // …then the SW restarts: the boot broadcast carries an EMPTY runtime slice
    // (results are never persisted) while the sidebar stays open.
    delete store.state.smartFolders['sf-1'];
    await tick();

    // The held items stay rendered (busy glyph spins — a reload, not a wipe);
    // no ghost rows; rows remain activatable mid-reload.
    expect(container.querySelectorAll('[data-testid="smart-result-row"]')).toHaveLength(2);
    expect(container.querySelector('[data-testid="smart-ghost-row"]')).toBeNull();
    expect(container.querySelector('.glyph.busy')).not.toBeNull();
    expect(container.querySelector('[data-testid="folder-row-badge"]')?.textContent).toBe('2');
    await fireEvent.click(
      container.querySelector('[data-testid="smart-result-row"]') as HTMLButtonElement,
    );
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'openSmartItem',
      payload: {
        spaceId: 'work',
        folderId: 'sf-1',
        itemId: 'gitlab:gitlab.example.com:mr-1',
        windowId: 100,
      },
    });
  });

  test('an honest ok-empty result clears the hold (no stale items resurrected)', async () => {
    const store = makeStore({ state: 'ok', items: [item(1)], fetchedAt: 1 });
    const { container } = renderSmart(store);
    expect(container.querySelectorAll('[data-testid="smart-result-row"]')).toHaveLength(1);

    // The queue genuinely empties.
    store.state.smartFolders['sf-1'] = {
      sections: { 'gitlab:gitlab.example.com': { state: 'ok', items: [], fetchedAt: 2 } },
    };
    await tick();
    expect(container.querySelectorAll('[data-testid="smart-result-row"]')).toHaveLength(0);

    // A later reload shows ghosts, not the long-gone items.
    store.state.smartFolders['sf-1'] = {
      sections: { 'gitlab:gitlab.example.com': { state: 'pending', items: [], fetchedAt: null } },
    };
    await tick();
    expect(container.querySelectorAll('[data-testid="smart-result-row"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-testid="smart-ghost-row"]')).toHaveLength(3);
  });
});

describe('SmartFolder — the reading nook (rss-connector)', () => {
  const rows = (c: HTMLElement): HTMLButtonElement[] =>
    [...c.querySelectorAll('[data-testid="smart-result-row"]')] as HTMLButtonElement[];

  test('unread and read rows render distinctly (dot, read class, accessible name)', () => {
    const node = feedNode();
    const store = makeFeedStore(
      node,
      { state: 'ok', items: [post(1), post(2)], fetchedAt: 1 },
      ['rss:news.ycombinator.com:post-2'], // post-2 is read
    );
    const { container } = renderSmart(store, { node });
    const [r1, r2] = rows(container);

    // Unread row: not read, carries the (un-cleared) unread dot, "unread" in name.
    expect(r1?.classList).not.toContain('read');
    expect(r1?.getAttribute('aria-label')).toBe('Post 1 — unread');
    const dot1 = r1?.querySelector('[data-testid="smart-unread-dot"]');
    expect(dot1).not.toBeNull();
    expect(dot1?.classList).not.toContain('cleared');

    // Read row: read class, the dot is mounted-but-cleared, "read" in name.
    expect(r2?.classList).toContain('read');
    expect(r2?.getAttribute('aria-label')).toBe('Post 2 — read');
    expect(r2?.querySelector('[data-testid="smart-unread-dot"]')?.classList).toContain('cleared');
    // Feed rows never carry a status dot.
    expect(container.querySelector('[data-testid="smart-status-dot"]')).toBeNull();
  });

  test('the badge counts UNREAD and disappears when everything is read', async () => {
    const node = feedNode();
    const store = makeFeedStore(
      node,
      { state: 'ok', items: [post(1), post(2), post(3)], fetchedAt: 1 },
      ['rss:news.ycombinator.com:post-1'], // 1 read → 2 unread
    );
    const { container } = renderSmart(store, { node });
    expect(container.querySelector('[data-testid="folder-row-badge"]')?.textContent).toBe('2');

    // Everything read → the badge is absent (the calm "caught up" state).
    store.state.smartReadState['feed-1'] = [
      'rss:news.ycombinator.com:post-1',
      'rss:news.ycombinator.com:post-2',
      'rss:news.ycombinator.com:post-3',
    ];
    await tick();
    expect(container.querySelector('[data-testid="folder-row-badge"]')).toBeNull();
  });

  test('opening a feed row dispatches openSmartItem; the read broadcast resolves the row in place', async () => {
    const node = feedNode();
    const store = makeFeedStore(node, { state: 'ok', items: [post(1)], fetchedAt: 1 });
    const { container } = renderSmart(store, { node });

    await fireEvent.click(rows(container)[0] as HTMLButtonElement);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'openSmartItem',
      payload: {
        spaceId: 'work',
        folderId: 'feed-1',
        itemId: 'rss:news.ycombinator.com:post-1',
        windowId: 100,
      },
    });

    // The SW marks it read and re-broadcasts — the row settles to read in place.
    store.state.smartReadState['feed-1'] = ['rss:news.ycombinator.com:post-1'];
    await tick();
    expect(rows(container)[0]?.classList).toContain('read');
    expect(rows(container)[0]?.getAttribute('aria-label')).toBe('Post 1 — read');
  });

  test('with hideRead OFF the read row is visible and the footer offers "Hide N read"', () => {
    const node = feedNode({ hideRead: false });
    const store = makeFeedStore(node, { state: 'ok', items: [post(1), post(2)], fetchedAt: 1 }, [
      'rss:news.ycombinator.com:post-2',
    ]);
    const { container } = renderSmart(store, { node });
    const readWrap = [...container.querySelectorAll('[data-testid="smart-row-wrap"]')].find(
      (w) => w.getAttribute('data-read') === 'true',
    );
    expect(readWrap?.classList).not.toContain('collapsed');
    expect(
      container.querySelector('[data-testid="smart-reading-controls"]')?.textContent,
    ).toContain('Hide 1 read');
  });

  test('with hideRead ON the read row collapses (mounted-but-inert) and the footer offers "Show N read"', () => {
    const node = feedNode({ hideRead: true });
    const store = makeFeedStore(node, { state: 'ok', items: [post(1), post(2)], fetchedAt: 1 }, [
      'rss:news.ycombinator.com:post-2',
    ]);
    const { container } = renderSmart(store, { node });
    const readWrap = [...container.querySelectorAll('[data-testid="smart-row-wrap"]')].find(
      (w) => w.getAttribute('data-read') === 'true',
    );
    // The read row stays mounted but collapses (height/opacity) and goes inert.
    expect(readWrap?.classList).toContain('collapsed');
    expect(readWrap?.getAttribute('aria-hidden')).toBe('true');
    expect(
      readWrap?.querySelector('[data-testid="smart-result-row"]')?.getAttribute('tabindex'),
    ).toBe('-1');
    // The unread row is unaffected.
    const unreadWrap = [...container.querySelectorAll('[data-testid="smart-row-wrap"]')].find(
      (w) => w.getAttribute('data-read') === 'false',
    );
    expect(unreadWrap?.classList).not.toContain('collapsed');
    expect(
      container.querySelector('[data-testid="smart-reading-controls"]')?.textContent,
    ).toContain('Show 1 read');
  });

  test('the footer hide/show toggle dispatches setSmartFolderHideRead', async () => {
    const node = feedNode();
    const store = makeFeedStore(node, { state: 'ok', items: [post(1), post(2)], fetchedAt: 1 }, [
      'rss:news.ycombinator.com:post-2',
    ]);
    const { container } = renderSmart(store, { node });
    const footer = container.querySelector('[data-testid="smart-reading-controls"]') as HTMLElement;
    const hideBtn = [...footer.querySelectorAll('button')].find((b) =>
      /Hide \d+ read/.test(b.textContent ?? ''),
    ) as HTMLButtonElement;
    await fireEvent.click(hideBtn);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'setSmartFolderHideRead',
      payload: { spaceId: 'work', folderId: 'feed-1', hideRead: true },
    });
  });

  test('the footer is absent of a hide toggle when nothing is read, and Open all dispatches the listing', async () => {
    const node = feedNode();
    const store = makeFeedStore(node, { state: 'ok', items: [post(1), post(2)], fetchedAt: 1 });
    const { container } = renderSmart(store, { node });
    const footer = container.querySelector('[data-testid="smart-reading-controls"]') as HTMLElement;
    // No read items → no hide/show toggle, but Open all is always present.
    expect(footer.textContent).not.toMatch(/Hide|Show/);
    const openAll = [...footer.querySelectorAll('button')].find((b) =>
      (b.textContent ?? '').includes('Open all'),
    ) as HTMLButtonElement;
    await fireEvent.click(openAll);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'openSmartFolderListing',
      payload: { spaceId: 'work', folderId: 'feed-1', windowId: 100 },
    });
  });

  test('a queue folder renders no reading-controls footer', () => {
    const store = makeStore({ state: 'ok', items: [item(1)], fetchedAt: 1 });
    const { container } = renderSmart(store);
    expect(container.querySelector('[data-testid="smart-reading-controls"]')).toBeNull();
    expect(container.querySelector('[data-testid="smart-unread-dot"]')).toBeNull();
  });
});

describe('SmartFolder — the draining queue (rss-connector, maxItems = unread budget)', () => {
  /** The accessible labels of the rows that are actually VISIBLE (row-wraps not
   * collapsed by the drained default). */
  const visibleLabels = (c: HTMLElement): (string | null)[] =>
    [...c.querySelectorAll('[data-testid="smart-row-wrap"]')]
      .filter((w) => !w.classList.contains('collapsed'))
      .map(
        (w) =>
          w.querySelector('[data-testid="smart-result-row"]')?.getAttribute('aria-label') ?? null,
      );

  /** A feed buffer, newest-first (post-5 newest … post-1 oldest), all unread. */
  function fiveUnread(): SmartFolderItem[] {
    return [post(5), post(4), post(3), post(2), post(1)];
  }

  test('a feed surfaces only the newest N UNREAD (maxItems is the budget, not a fetch cap)', () => {
    const node = feedNode({ maxItems: 2, hideRead: true });
    const store = makeFeedStore(node, { state: 'ok', items: fiveUnread(), fetchedAt: 1 });
    const { container } = renderSmart(store, { node });
    // Budget 2 → only the newest two unread render, though the buffer holds five.
    expect(visibleLabels(container)).toEqual(['Post 5 — unread', 'Post 4 — unread']);
    // The badge shows the true total unread (5), not capped by maxItems.
    expect(container.querySelector('[data-testid="folder-row-badge"]')?.textContent).toBe('5');
  });

  test('reading an item drains it and backfills the next-oldest unread', async () => {
    const node = feedNode({ maxItems: 2, hideRead: true });
    const store = makeFeedStore(node, { state: 'ok', items: fiveUnread(), fetchedAt: 1 });
    const { container } = renderSmart(store, { node });
    expect(visibleLabels(container)).toEqual(['Post 5 — unread', 'Post 4 — unread']);

    // The SW marks Post 5 read (the open path) and re-broadcasts.
    store.state.smartReadState['feed-1'] = ['rss:news.ycombinator.com:post-5'];
    await tick();
    // Post 5 drains out (collapsed); Post 3 backfills in to keep two unread shown.
    expect(visibleLabels(container)).toEqual(['Post 4 — unread', 'Post 3 — unread']);
    // The drained item stays mounted-but-collapsed for the resolve beat.
    const drained = [...container.querySelectorAll('[data-testid="smart-row-wrap"]')].find((w) =>
      w.classList.contains('collapsed'),
    );
    expect(
      drained?.querySelector('[data-testid="smart-result-row"]')?.getAttribute('aria-label'),
    ).toBe('Post 5 — read');
  });

  test('the drained default hides read; "Show recently read" reveals them (and persists the toggle)', async () => {
    const node = feedNode({ maxItems: 5, hideRead: true });
    // post-3 read, the rest unread.
    const store = makeFeedStore(node, { state: 'ok', items: fiveUnread(), fetchedAt: 1 }, [
      'rss:news.ycombinator.com:post-3',
    ]);
    const { container } = renderSmart(store, { node });
    // Drained: the read Post 3 is collapsed, the four unread are visible.
    expect(visibleLabels(container)).not.toContain('Post 3 — read');
    expect(visibleLabels(container)).toHaveLength(4);
    // The footer offers to reveal the one read item.
    const footer = container.querySelector('[data-testid="smart-reading-controls"]') as HTMLElement;
    expect(footer.textContent).toContain('Show 1 read');
    const showBtn = [...footer.querySelectorAll('button')].find((b) =>
      /Show \d+ read/.test(b.textContent ?? ''),
    ) as HTMLButtonElement;
    await fireEvent.click(showBtn);
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'setSmartFolderHideRead',
      payload: { spaceId: 'work', folderId: 'feed-1', hideRead: false },
    });
  });

  test('revealing read (hideRead OFF) un-collapses the read row inline', () => {
    const node = feedNode({ maxItems: 5, hideRead: false });
    const store = makeFeedStore(node, { state: 'ok', items: fiveUnread(), fetchedAt: 1 }, [
      'rss:news.ycombinator.com:post-3',
    ]);
    const { container } = renderSmart(store, { node });
    // With the peek on, the read row is visible (greyed, not collapsed).
    expect(visibleLabels(container)).toContain('Post 3 — read');
  });

  test('the badge caps at maxItems+ when unread exceeds the budget, and clears when caught up', async () => {
    const node = feedNode({ maxItems: 3, hideRead: true });
    const store = makeFeedStore(node, { state: 'ok', items: fiveUnread(), fetchedAt: 1 });
    const { container } = renderSmart(store, { node });
    // Badge shows the true total unread (5) rather than a capped value.
    expect(container.querySelector('[data-testid="folder-row-badge"]')?.textContent).toBe('5');

    // Mark everything read → caught up → the badge disappears, nothing visible.
    store.state.smartReadState['feed-1'] = [
      'rss:news.ycombinator.com:post-1',
      'rss:news.ycombinator.com:post-2',
      'rss:news.ycombinator.com:post-3',
      'rss:news.ycombinator.com:post-4',
      'rss:news.ycombinator.com:post-5',
    ];
    await tick();
    expect(container.querySelector('[data-testid="folder-row-badge"]')).toBeNull();
    expect(visibleLabels(container)).toEqual([]);
  });
});

describe('SmartFolder — empty-state parity (rss-connector)', () => {
  const emptyNote = (c: HTMLElement): string | undefined =>
    c.querySelector('[data-testid="smart-empty-note"]')?.textContent ?? undefined;

  test('a queue folder with no open items shows a quiet note (not a blank list)', () => {
    const store = makeStore({ state: 'ok', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store);
    expect(container.querySelectorAll('[data-testid="smart-result-row"]')).toHaveLength(0);
    expect(emptyNote(container)).toBe('Nothing here right now.');
  });

  test('a populated queue folder shows no empty note', () => {
    const store = makeStore({ state: 'ok', items: [item(1)], fetchedAt: 1 });
    const { container } = renderSmart(store);
    expect(emptyNote(container)).toBeUndefined();
  });

  test('a feed with no entries shows "No entries yet."', () => {
    const node = feedNode();
    const store = makeFeedStore(node, { state: 'ok', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store, { node });
    expect(emptyNote(container)).toBe('No entries yet.');
  });

  test('a caught-up feed shows "You\'re all caught up."', () => {
    const node = feedNode({ hideRead: true });
    const store = makeFeedStore(
      node,
      { state: 'ok', items: [post(1), post(2)], fetchedAt: 1 },
      ['rss:news.ycombinator.com:post-1', 'rss:news.ycombinator.com:post-2'], // every item read
    );
    const { container } = renderSmart(store, { node });
    expect(emptyNote(container)).toBe("You're all caught up.");
  });

  test('a feed with unread shows no empty note', () => {
    const node = feedNode();
    const store = makeFeedStore(node, { state: 'ok', items: [post(1)], fetchedAt: 1 });
    const { container } = renderSmart(store, { node });
    expect(emptyNote(container)).toBeUndefined();
  });

  test('the empty note yields to the pending ghosts, the sign-in row, and the error note', () => {
    // First fetch (pending, no items) → ghosts, no empty note.
    const pending = makeStore();
    expect(emptyNote(renderSmart(pending).container)).toBeUndefined();
    cleanup();
    // Signed-out → the sign-in row owns the copy.
    const signedOut = makeStore({ state: 'signed-out', items: [], fetchedAt: 1 });
    expect(emptyNote(renderSmart(signedOut).container)).toBeUndefined();
    cleanup();
    // Error → the "Couldn't reach" note owns the copy.
    const errored = makeStore({ state: 'error', items: [], fetchedAt: 1 });
    expect(emptyNote(renderSmart(errored).container)).toBeUndefined();
  });
});
