import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import type { PinNode, SmartFolderItem, SmartFolderRuntime } from '../shared/types';
import SmartFolderHarness from './SmartFolder.test.harness.svelte';

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

const { sendMock, openOptionsAtMock } = vi.hoisted(() => ({
  sendMock: vi.fn(() => Promise.resolve()),
  openOptionsAtMock: vi.fn(() => Promise.resolve()),
}));
vi.mock('../shared/bus', () => ({ bus: { send: sendMock }, dispatch: sendMock }));
vi.mock('./open-options', () => ({ openOptionsAt: openOptionsAtMock }));

beforeEach(() => {
  // `faviconFor` resolves the `_favicon` endpoint via chrome.runtime.getURL.
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: { getURL: (path: string) => `chrome-extension://abc${path}` },
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
    source: 'gitlab',
    baseUrl: 'https://gitlab.example.com',
    query: 'review-requested',
    refreshMinutes: 10,
    ...overrides,
  };
}

function item(i: number, status?: SmartFolderItem['status']): SmartFolderItem {
  return {
    id: `mr-${i}`,
    title: `MR ${i}`,
    url: `https://gitlab.example.com/g/p/-/merge_requests/${i}`,
    ...(status !== undefined ? { status } : {}),
  };
}

function makeStore(runtime?: SmartFolderRuntime): LunmaStore {
  const store = new LunmaStore();
  store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
  store.state.pinnedBySpace.work = [smartNode()];
  if (runtime) store.state.smartFolders['sf-1'] = runtime;
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

  test('renders 20+ at the cap (the cap is never silent)', () => {
    const store = makeStore({
      state: 'ok',
      items: Array.from({ length: 20 }, (_, i) => item(i)),
      fetchedAt: 1,
    });
    const { container } = renderSmart(store);
    expect(container.querySelector('[data-testid="folder-row-badge"]')?.textContent).toBe('20+');
  });

  test('renders no badge before the first fetch lands', () => {
    const store = makeStore(); // no runtime → pending
    const { container } = renderSmart(store);
    expect(container.querySelector('[data-testid="folder-row-badge"]')).toBeNull();
  });
});

describe('SmartFolder — activate-only rows', () => {
  test('clicking a result row dispatches openUrl with the item url and window id', async () => {
    const store = makeStore({ state: 'ok', items: [item(42)], fetchedAt: 1 });
    const { container } = renderSmart(store);
    await fireEvent.click(
      container.querySelector('[data-testid="smart-result-row"]') as HTMLButtonElement,
    );
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'openUrl',
      payload: { url: 'https://gitlab.example.com/g/p/-/merge_requests/42', windowId: 100 },
    });
  });
});

describe('SmartFolder — menu (Refresh now · Edit… · Move · Delete)', () => {
  const TRIGGER = '[data-testid="folder-row-menu-trigger"]';
  const menuItem = (id: string): HTMLButtonElement =>
    document.querySelector(`[data-menu-id="${id}"]`) as HTMLButtonElement;

  test('carries exactly the five smart actions (no folder rename/appearance built-ins)', async () => {
    const store = makeStore({ state: 'ok', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store);
    await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
    const ids = [...document.querySelectorAll('[data-testid="folder-row-menu-item"]')].map((e) =>
      e.getAttribute('data-menu-id'),
    );
    expect(ids).toEqual(['refresh', 'edit', 'move-up', 'move-down', 'delete']);
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

  test('Delete dispatches deleteSmartFolder immediately — no two-step confirm', async () => {
    const store = makeStore({ state: 'ok', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store);
    await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
    await fireEvent.click(menuItem('delete'));
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'deleteSmartFolder',
      payload: { spaceId: 'work', folderId: 'sf-1' },
    });
  });

  test('Edit… drills into the SmartFolderEditor panel with a back-header', async () => {
    const store = makeStore({ state: 'ok', items: [], fetchedAt: 1 });
    const { container } = renderSmart(store);
    await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
    await fireEvent.click(menuItem('edit'));
    expect(document.querySelector('[data-testid="smart-folder-editor"]')).not.toBeNull();
    const back = document.querySelector('[data-testid="folder-row-menu-back"]');
    expect(back?.textContent).toContain('Edit smart folder');
    // Pre-filled from the node.
    const url = document.querySelector('[data-testid="smart-folder-url"]') as HTMLInputElement;
    expect(url.value).toBe('https://gitlab.example.com');
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
    const ghNode = smartNode({ source: 'github', baseUrl: 'https://github.com' });
    const store = makeStore({ state: 'signed-out', items: [], fetchedAt: 1 });
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
      kind: 'openUrl',
      payload: { url: 'https://gitlab.example.com/g/p/-/merge_requests/1', windowId: 100 },
    });
  });

  test('an honest ok-empty result clears the hold (no stale items resurrected)', async () => {
    const store = makeStore({ state: 'ok', items: [item(1)], fetchedAt: 1 });
    const { container } = renderSmart(store);
    expect(container.querySelectorAll('[data-testid="smart-result-row"]')).toHaveLength(1);

    // The queue genuinely empties.
    store.state.smartFolders['sf-1'] = { state: 'ok', items: [], fetchedAt: 2 };
    await tick();
    expect(container.querySelectorAll('[data-testid="smart-result-row"]')).toHaveLength(0);

    // A later reload shows ghosts, not the long-gone items.
    store.state.smartFolders['sf-1'] = { state: 'pending', items: [], fetchedAt: null };
    await tick();
    expect(container.querySelectorAll('[data-testid="smart-result-row"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-testid="smart-ghost-row"]')).toHaveLength(3);
  });
});
