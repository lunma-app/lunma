import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import TempTabsHarness from './TempTabs.test.harness.svelte';

vi.mock('../shared/bus', () => ({
  bus: { send: vi.fn(() => Promise.resolve()) },
  dispatch: vi.fn(),
  TAB_DEDUP_FLASH: 'lunma/tab-dedup-flash',
}));

beforeEach(() => {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      getURL: (path: string) => `chrome-extension://abc${path}`,
      onMessage: { addListener: () => undefined, removeListener: () => undefined },
    },
  };
});

function setup(parents: Record<number, number | undefined>) {
  const store = new LunmaStore();
  store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
  const ids = Object.keys(parents).map(Number);
  store.state.spaceInstancesByWindow[1] = {
    work: { spaceId: 'work', groupId: 1, tempTabIds: ids, tempTabTitles: {} },
  };
  for (const id of ids) {
    store.state.liveTabsById[id] = {
      tabId: id,
      windowId: 1,
      title: `tab ${id}`,
      url: `https://x/${id}`,
      active: false,
      status: 'complete',
      ...(parents[id] !== undefined ? { provenanceParentTabId: parents[id] } : {}),
    };
  }
  return { store, spaceId: 'work' };
}

function depths(container: HTMLElement): (string | null)[] {
  return [...container.querySelectorAll('[data-testid="tab-row"]')].map((el) =>
    el.getAttribute('data-depth'),
  );
}

describe('TempTabs provenance nesting', () => {
  test('a child renders one indent step under its parent, order untouched', () => {
    const { store, spaceId } = setup({ 1: undefined, 2: 1, 3: 2 });
    const { container } = render(TempTabsHarness, { props: { store, windowId: 1, spaceId } });
    expect(depths(container)).toEqual([null, '1', '2']);
  });

  test('a parent outside the rendered rows leaves the row flat', () => {
    // tab 2's parent (99) is not in this list — a lineage rule must never point
    // at a row that is not there.
    const { store, spaceId } = setup({ 1: undefined, 2: 99 });
    const { container } = render(TempTabsHarness, { props: { store, windowId: 1, spaceId } });
    expect(depths(container)).toEqual([null, null]);
  });

  test('with no parents resolved the list is entirely flat', () => {
    const { store, spaceId } = setup({ 1: undefined, 2: undefined });
    const { container } = render(TempTabsHarness, { props: { store, windowId: 1, spaceId } });
    expect(depths(container)).toEqual([null, null]);
  });

  test('a cycle terminates rather than hanging', () => {
    const { store, spaceId } = setup({ 1: 2, 2: 1 });
    const { container } = render(TempTabsHarness, { props: { store, windowId: 1, spaceId } });
    expect(depths(container).length).toBe(2);
  });
});
