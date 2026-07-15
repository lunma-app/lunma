import { describe, expect, test, vi } from 'vitest';
import { closeTab, setTabNativePinned, ungroupTabs } from './tab-groups';

describe('ungroupTabs (favorite ungroup wrapper, D3)', () => {
  test('ungroups a tab via chrome.tabs.ungroup', async () => {
    const ungroup = vi.fn(async () => undefined);
    (globalThis as unknown as { chrome: unknown }).chrome = { tabs: { ungroup } };
    await expect(ungroupTabs(42)).resolves.toBeUndefined();
    expect(ungroup).toHaveBeenCalledWith(42);
  });

  test('swallows a Chrome refusal (best-effort, never throws)', async () => {
    const ungroup = vi.fn(async () => {
      throw new Error('Tabs cannot be edited right now (user may be dragging a tab)');
    });
    (globalThis as unknown as { chrome: unknown }).chrome = { tabs: { ungroup } };
    // A refusal (stale/closed tab, already ungrouped) must resolve, not reject —
    // the invariant is enforced best-effort.
    await expect(ungroupTabs(42)).resolves.toBeUndefined();
    expect(ungroup).toHaveBeenCalledWith(42);
  });
});

describe('setTabNativePinned (favorite native-pin wrapper)', () => {
  test('pins a tab via chrome.tabs.update', async () => {
    const update = vi.fn(async () => undefined);
    (globalThis as unknown as { chrome: unknown }).chrome = { tabs: { update } };
    await expect(setTabNativePinned(42, true)).resolves.toBeUndefined();
    expect(update).toHaveBeenCalledWith(42, { pinned: true });
  });

  test('unpins a tab via chrome.tabs.update', async () => {
    const update = vi.fn(async () => undefined);
    (globalThis as unknown as { chrome: unknown }).chrome = { tabs: { update } };
    await expect(setTabNativePinned(42, false)).resolves.toBeUndefined();
    expect(update).toHaveBeenCalledWith(42, { pinned: false });
  });

  test('swallows a Chrome refusal (best-effort, never throws)', async () => {
    const update = vi.fn(async () => {
      throw new Error('No tab with id: 42.');
    });
    (globalThis as unknown as { chrome: unknown }).chrome = { tabs: { update } };
    await expect(setTabNativePinned(42, true)).resolves.toBeUndefined();
    expect(update).toHaveBeenCalledWith(42, { pinned: true });
  });
});

describe('closeTab (consume=close best-effort wrapper, rss-connector draining queue)', () => {
  test('closes a tab via chrome.tabs.remove', async () => {
    const remove = vi.fn(async () => undefined);
    (globalThis as unknown as { chrome: unknown }).chrome = { tabs: { remove } };
    await expect(closeTab(42)).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith(42);
  });

  test('swallows "No tab with id" (already closed → benign, never SIDE_EFFECT_FAILED)', async () => {
    const remove = vi.fn(async () => {
      throw new Error('No tab with id: 42.');
    });
    (globalThis as unknown as { chrome: unknown }).chrome = { tabs: { remove } };
    // The consumed tab was already gone (user closed it, or a concurrent path
    // removed it) — the desired end-state. Must resolve, not reject.
    await expect(closeTab(42)).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith(42);
  });
});
