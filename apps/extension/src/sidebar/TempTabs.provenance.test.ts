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

/** `order` fixes the `tempTabIds` sequence. It cannot be inferred from `parents`:
 * integer object keys always iterate ascending, which would silently sort away
 * the newest-first order these tests exist to exercise. */
function setup(parents: Record<number, number | undefined>, order?: number[]) {
  const store = new LunmaStore();
  store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
  const ids = order ?? Object.keys(parents).map(Number);
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

/** The rendered rows as `<tab id>@<depth>`, in the order they appear — the pair
 * the user actually sees. Depth alone cannot tell a child under its parent from
 * a child floating above it. */
function shape(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[data-testid="tab-row"]')].map((el) => {
    const id = (el.textContent ?? '').trim().replace(/^tab /, '').split(/\s/)[0];
    return `${id}@${el.getAttribute('data-depth') ?? '0'}`;
  });
}

describe('TempTabs provenance nesting', () => {
  test('a child renders one indent step under its parent', () => {
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

// `tempTabIds` is newest-first, so a tab opened from another is ALWAYS listed
// above its parent. Indenting it where it sits puts an indented child at the top
// with its parent below at depth 0 — which reads as the child being the root.
// Rows are therefore re-ordered into a pre-order walk.
describe('TempTabs provenance ordering', () => {
  test('a child listed above its parent is moved beneath it', () => {
    // Newest-first: the child (2) was opened from the parent (1), so it is first.
    const { store, spaceId } = setup({ 2: 1, 1: undefined }, [2, 1]);
    const { container } = render(TempTabsHarness, { props: { store, windowId: 1, spaceId } });
    expect(shape(container)).toEqual(['1@0', '2@1']);
  });

  test('a three-level chain listed newest-first nests in order', () => {
    const { store, spaceId } = setup({ 3: 2, 2: 1, 1: undefined }, [3, 2, 1]);
    const { container } = render(TempTabsHarness, { props: { store, windowId: 1, spaceId } });
    expect(shape(container)).toEqual(['1@0', '2@1', '3@2']);
  });

  test('siblings stay in list order, directly under their parent', () => {
    // 3 and 2 both opened from 1; 3 is newer so it is listed first.
    const { store, spaceId } = setup({ 3: 1, 2: 1, 1: undefined }, [3, 2, 1]);
    const { container } = render(TempTabsHarness, { props: { store, windowId: 1, spaceId } });
    expect(shape(container)).toEqual(['1@0', '3@1', '2@1']);
  });

  test('unrelated roots keep their list order around a nested pair', () => {
    const { store, spaceId } = setup(
      { 4: undefined, 2: 1, 1: undefined, 3: undefined },
      [4, 2, 1, 3],
    );
    const { container } = render(TempTabsHarness, { props: { store, windowId: 1, spaceId } });
    expect(shape(container)).toEqual(['4@0', '1@0', '2@1', '3@0']);
  });

  test('every row still renders when the edges form a cycle', () => {
    const { store, spaceId } = setup({ 1: 2, 2: 1, 3: undefined }, [1, 2, 3]);
    const { container } = render(TempTabsHarness, { props: { store, windowId: 1, spaceId } });
    expect(shape(container).length).toBe(3);
  });
});
