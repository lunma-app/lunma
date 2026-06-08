import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import type { ArchivedTab } from '../shared/types';
import ArchivedChipHarness from './ArchivedChip.test.harness.svelte';

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function archived(archivedAt: number, spaceId = 'work'): ArchivedTab {
  return {
    tabId: archivedAt,
    url: `https://example.com/${archivedAt}`,
    title: `tab ${archivedAt}`,
    spaceId,
    archivedAt,
  };
}

function makeStore(entries: ArchivedTab[]): LunmaStore {
  const store = new LunmaStore();
  store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
  store.state.archivedTabs.push(...entries);
  return store;
}

function chip(container: HTMLElement): HTMLButtonElement | null {
  return container.querySelector('[data-testid="archived-chip"]');
}

describe('ArchivedChip', () => {
  test('renders with the count when the Space has archived tabs', () => {
    const store = makeStore([archived(1), archived(2), archived(3)]);
    const { container } = render(ArchivedChipHarness, { props: { store, spaceId: 'work' } });
    const el = chip(container);
    expect(el).not.toBeNull();
    expect(el?.textContent).toContain('3');
    expect(el?.getAttribute('aria-label')).toBe('Recently archived (3)');
  });

  test('renders nothing when the Space has no archived tabs', () => {
    const store = makeStore([]);
    const { container } = render(ArchivedChipHarness, { props: { store, spaceId: 'work' } });
    expect(chip(container)).toBeNull();
  });

  test('counts only the chip’s own Space (filters by spaceId)', () => {
    const store = makeStore([archived(1, 'work'), archived(2, 'other'), archived(3, 'other')]);
    const { container } = render(ArchivedChipHarness, { props: { store, spaceId: 'work' } });
    expect(chip(container)?.textContent).toContain('1');
  });

  test('clicking calls onOpen (to open the archived options view)', async () => {
    const onOpen = vi.fn();
    const store = makeStore([archived(1)]);
    const { container } = render(ArchivedChipHarness, {
      props: { store, spaceId: 'work', onOpen },
    });
    await fireEvent.click(chip(container) as HTMLButtonElement);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
