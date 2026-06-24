import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import FeedSubscriptions from './FeedSubscriptions.svelte';

vi.mock('../shared/bus', () => ({ bus: { send: vi.fn(() => Promise.resolve()) } }));

const STATE_KEY = 'lunma.state';

function makeState(rssCount = 0) {
  const pinnedBySpace: Record<string, unknown[]> = {};
  if (rssCount > 0) {
    pinnedBySpace.s1 = Array.from({ length: rssCount }, (_, i) => ({
      kind: 'smart',
      id: `sf-${i}`,
      name: `Feed ${i}`,
      icon: 'rss',
      sources: [{ source: 'rss', baseUrl: `https://example.com/feed${i}` }],
      maxItems: 10,
      hideRead: false,
      refreshMinutes: 30,
    }));
  }
  return {
    spaces: [
      { id: 's1', name: 'Work', color: 'blue', icon: 'star' },
      { id: 's2', name: 'Personal', color: 'green', icon: 'home' },
    ],
    savedTabs: {},
    pinnedBySpace,
    faviconRow: [],
    archivedTabs: [],
    trash: {},
    lastActivatedSpaceId: null,
    activeSpaceByWindow: {},
    spaceInstancesByWindow: {},
    tabBindings: {},
    tabLastActivity: {},
    smartItemBindings: {},
    smartReadState: {},
    liveTabsById: {},
  };
}

function installChrome(rssCount = 0): void {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      local: {
        get: vi.fn(async () => ({ [STATE_KEY]: { schemaVersion: 8, state: makeState(rssCount) } })),
        set: vi.fn(async () => undefined),
      },
      sync: { get: vi.fn(async () => ({})) },
    },
    runtime: { getURL: (p: string) => `chrome-extension://x/${p}` },
  };
}

beforeEach(() => {
  installChrome();
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
  vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
});

describe('FeedSubscriptions (options card)', () => {
  test('export button absent when no RSS folders exist', async () => {
    installChrome(0);
    const { queryByText } = render(FeedSubscriptions);
    await waitFor(() => {
      expect(queryByText('Export as OPML')).toBeNull();
    });
  });

  test('export button present when RSS folders exist', async () => {
    installChrome(2);
    const { getByText } = render(FeedSubscriptions);
    await waitFor(() => expect(getByText('Export as OPML')).not.toBeNull());
  });

  test('export triggers download and shows toast', async () => {
    installChrome(2);
    const { getByText } = render(FeedSubscriptions);
    await waitFor(() => expect(getByText('Export as OPML')).not.toBeNull());

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockReturnValue(undefined);

    await fireEvent.click(getByText('Export as OPML'));

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
    expect(clickSpy).toHaveBeenCalled();
    await waitFor(() => expect(getByText('Feeds exported')).not.toBeNull());
  });
});
