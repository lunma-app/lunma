import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ArchivedTab } from '../shared/types';
import RecentlyArchived from './RecentlyArchived.svelte';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn(() => Promise.resolve()) }));
vi.mock('../shared/bus', () => ({ bus: { send: sendMock } }));

interface ChromeMock {
  localGet: ReturnType<typeof vi.fn>;
  getLastFocused: ReturnType<typeof vi.fn>;
  onChangedListeners: Array<(c: Record<string, unknown>, area: string) => void>;
}

function archived(over: Partial<ArchivedTab> & { archivedAt: number }): ArchivedTab {
  return {
    tabId: over.archivedAt,
    url: `https://example.com/${over.archivedAt}`,
    title: `tab ${over.archivedAt}`,
    spaceId: 'work',
    ...over,
  };
}

function installChrome(entries: ArchivedTab[], settings: Record<string, unknown> = {}): ChromeMock {
  const mock: ChromeMock = {
    localGet: vi.fn(async () => ({
      'lunma.state': { schemaVersion: 1, state: { archivedTabs: entries } },
    })),
    getLastFocused: vi.fn(async () => ({ id: 100 })),
    onChangedListeners: [],
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      local: { get: mock.localGet },
      // readSettings / watchSettings (for the retention countdown) read sync.
      sync: { get: vi.fn(async () => ({ 'lunma.settings': settings })) },
      onChanged: {
        addListener: (l: (c: Record<string, unknown>, a: string) => void) =>
          mock.onChangedListeners.push(l),
        removeListener: vi.fn(),
      },
    },
    windows: { getLastFocused: mock.getLastFocused },
    runtime: { getURL: (p: string) => `chrome-extension://x/${p}` },
  };
  return mock;
}

beforeEach(() => {
  sendMock.mockClear();
});

afterEach(() => {
  // NB: don't delete `chrome` here — Testing-Library unmounts in its own afterEach,
  // and the component's onMount cleanup removes a `chrome.storage.onChanged` listener
  // on unmount. Each test's beforeEach reinstalls the stub, so leaving it is safe.
  vi.restoreAllMocks();
});

function rowTitles(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[data-testid="tab-row"] .title')].map(
    (el) => el.textContent ?? '',
  );
}

describe('RecentlyArchived (options view)', () => {
  test('lists archived tabs most-recent-first, with age + delete countdown', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(10 * 3_600_000);
    installChrome([
      archived({ archivedAt: 10 * 3_600_000 - 2 * 3_600_000, title: 'Older' }),
      archived({ archivedAt: 10 * 3_600_000 - 5 * 60_000, title: 'Newer' }),
    ]);
    const { container } = render(RecentlyArchived, { props: {} });

    await waitFor(() => expect(rowTitles(container)).toEqual(['Newer', 'Older']));
    const metas = [...container.querySelectorAll('[data-testid="tab-row-meta"]')].map(
      (e) => e.textContent,
    );
    // age · deletes-in (default 7-day retention).
    expect(metas).toEqual(['5m · deletes in 7d', '2h · deletes in 7d']);
  });

  test('the delete countdown reflects the configured retention window', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(10 * 3_600_000);
    // A non-default retention (3d, vs the 7d default) proves the setting is read.
    installChrome([archived({ archivedAt: 10 * 3_600_000, title: 'Fresh' })], {
      autoArchiveRetentionDays: 3,
    });
    const { container } = render(RecentlyArchived, { props: {} });

    await waitFor(() =>
      expect(container.querySelector('[data-testid="tab-row-meta"]')?.textContent).toContain(
        'deletes in 3d',
      ),
    );
  });

  test('shows an empty state when there are no archived tabs', async () => {
    installChrome([]);
    const { container } = render(RecentlyArchived, { props: {} });
    await waitFor(() =>
      expect(container.querySelector('[data-testid="archived-empty"]')).not.toBeNull(),
    );
    expect(container.querySelectorAll('[data-testid="tab-row"]').length).toBe(0);
  });

  test('restore dispatches restoreArchivedTab into the last-focused window', async () => {
    installChrome([archived({ archivedAt: 300, tabId: 7, title: 'Restore me' })]);
    const { container } = render(RecentlyArchived, { props: {} });

    await waitFor(() =>
      expect(container.querySelector('button[aria-label="Restore Restore me"]')).not.toBeNull(),
    );
    const btn = container.querySelector(
      'button[aria-label="Restore Restore me"]',
    ) as HTMLButtonElement;
    await fireEvent.click(btn);

    await waitFor(() =>
      expect(sendMock).toHaveBeenCalledWith({
        kind: 'restoreArchivedTab',
        payload: { archivedAt: 300, tabId: 7, windowId: 100 },
      }),
    );
  });

  test('deleting a row dispatches deleteArchivedTab (no restore)', async () => {
    installChrome([archived({ archivedAt: 300, tabId: 7, title: 'Delete me' })]);
    const { container } = render(RecentlyArchived, { props: {} });

    await waitFor(() =>
      expect(container.querySelector('button[aria-label="Delete Delete me"]')).not.toBeNull(),
    );
    const btn = container.querySelector(
      'button[aria-label="Delete Delete me"]',
    ) as HTMLButtonElement;
    await fireEvent.click(btn);

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'deleteArchivedTab',
      payload: { archivedAt: 300, tabId: 7 },
    });
  });

  test('Clear all reveals a confirm row and does NOT dispatch yet', async () => {
    installChrome([
      archived({ archivedAt: 1, title: 'A' }),
      archived({ archivedAt: 2, title: 'B' }),
    ]);
    const { container, getByText } = render(RecentlyArchived, { props: {} });
    await waitFor(() => getByText('Clear all'));
    await fireEvent.click(getByText('Clear all'));

    // The destructive clear is gated behind an explicit confirm — nothing dispatched.
    expect(container.querySelector('[data-testid="import-confirm"]')).not.toBeNull();
    expect(sendMock).not.toHaveBeenCalled();
  });

  test('confirming with Delete dispatches clearArchivedTabs', async () => {
    installChrome([archived({ archivedAt: 1, title: 'A' })]);
    const { getByText } = render(RecentlyArchived, { props: {} });
    await waitFor(() => getByText('Clear all'));
    await fireEvent.click(getByText('Clear all'));
    await fireEvent.click(getByText('Delete'));
    expect(sendMock).toHaveBeenCalledWith({ kind: 'clearArchivedTabs', payload: {} });
  });

  test('Cancel dismisses the confirm without dispatching', async () => {
    installChrome([archived({ archivedAt: 1, title: 'A' })]);
    const { container, getByText } = render(RecentlyArchived, { props: {} });
    await waitFor(() => getByText('Clear all'));
    await fireEvent.click(getByText('Clear all'));
    await fireEvent.click(getByText('Cancel'));

    expect(container.querySelector('[data-testid="import-confirm"]')).toBeNull();
    expect(getByText('Clear all')).not.toBeNull();
    expect(sendMock).not.toHaveBeenCalled();
  });

  test('opening Clear all moves focus to the Delete primary action', async () => {
    installChrome([archived({ archivedAt: 1, title: 'A' })]);
    const { container, getByText } = render(RecentlyArchived, { props: {} });
    await waitFor(() => getByText('Clear all'));
    await fireEvent.click(getByText('Clear all'));

    await waitFor(() => {
      const del = container.querySelector(
        '[data-testid="import-confirm"] [data-variant="primary"]',
      ) as HTMLButtonElement;
      expect(del).not.toBeNull();
      expect(document.activeElement).toBe(del);
    });
  });

  test('cancelling Clear all restores focus to the Clear all trigger', async () => {
    installChrome([archived({ archivedAt: 1, title: 'A' })]);
    const { container, getByText } = render(RecentlyArchived, { props: {} });
    await waitFor(() => getByText('Clear all'));
    await fireEvent.click(getByText('Clear all'));
    await fireEvent.click(getByText('Cancel'));

    await waitFor(() => {
      const trigger = container.querySelector(
        '[data-testid="clear-all-trigger"]',
      ) as HTMLButtonElement;
      expect(trigger).not.toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });
});
