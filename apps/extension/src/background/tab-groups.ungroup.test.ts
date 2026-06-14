import { describe, expect, test, vi } from 'vitest';
import { closeTab, moveTabToStripStart, ungroupTabs } from './tab-groups';

describe('ungroupTabs (favorite ungroup wrapper, ADR 0010 D3)', () => {
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

describe('moveTabToStripStart (favorite parking wrapper, sidebar-favicon-row D10)', () => {
  test('moves a tab to strip index 0 via chrome.tabs.move', async () => {
    const move = vi.fn(async () => undefined);
    (globalThis as unknown as { chrome: unknown }).chrome = { tabs: { move } };
    await expect(moveTabToStripStart(42)).resolves.toBeUndefined();
    expect(move).toHaveBeenCalledWith(42, { index: 0 });
  });

  test('swallows a Chrome refusal (best-effort, never throws)', async () => {
    const move = vi.fn(async () => {
      throw new Error('Tabs cannot be edited right now (user may be dragging a tab)');
    });
    (globalThis as unknown as { chrome: unknown }).chrome = { tabs: { move } };
    await expect(moveTabToStripStart(42)).resolves.toBeUndefined();
    expect(move).toHaveBeenCalledWith(42, { index: 0 });
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
