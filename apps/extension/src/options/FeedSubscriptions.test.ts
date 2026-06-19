import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import FeedSubscriptions from './FeedSubscriptions.svelte';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn(() => Promise.resolve()) }));
vi.mock('../shared/bus', () => ({ bus: { send: sendMock } }));

const STATE_KEY = 'lunma.state';

const FLAT_OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head><title>Feeds</title></head>
  <body>
    <outline type="rss" text="HN" xmlUrl="https://hnrss.org/frontpage"/>
    <outline type="rss" text="Lobsters" xmlUrl="https://lobste.rs/rss"/>
    <outline type="rss" text="Julia Evans" xmlUrl="https://jvns.ca/atom.xml"/>
  </body>
</opml>`;

const NON_RSS_XML = `<?xml version="1.0"?><root><item>not an opml</item></root>`;

function makeState(rssCount = 0) {
  const pinnedBySpace: Record<string, unknown[]> = {};
  if (rssCount > 0) {
    pinnedBySpace.s1 = Array.from({ length: rssCount }, (_, i) => ({
      kind: 'smart',
      id: `sf-${i}`,
      name: `Feed ${i}`,
      icon: 'rss',
      source: 'rss',
      baseUrl: `https://example.com/feed${i}`,
      maxItems: 10,
      hideRead: false,
      refreshMinutes: 30,
    }));
  }
  return {
    schemaVersion: 10,
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
    smartFolders: {},
  };
}

let getStorageMock: ReturnType<typeof vi.fn>;

function installChrome(rssCount = 0): void {
  getStorageMock = vi.fn(async () => ({ [STATE_KEY]: { state: makeState(rssCount) } }));
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      local: { get: getStorageMock },
      sync: { get: vi.fn(async () => ({})) },
    },
    runtime: { getURL: (p: string) => `chrome-extension://x/${p}` },
  };
}

async function feedFile(
  input: HTMLInputElement,
  content: string,
  name = 'feeds.opml',
): Promise<void> {
  Object.defineProperty(input, 'files', {
    value: [new File([content], name, { type: 'text/xml' })],
    configurable: true,
  });
  await fireEvent.change(input);
}

beforeEach(() => {
  sendMock.mockClear();
  installChrome();
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
  vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FeedSubscriptions (options card)', () => {
  test('import happy path: confirm step shows feed count and Space picker', async () => {
    const { container, getByText } = render(FeedSubscriptions);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await feedFile(fileInput, FLAT_OPML);

    await waitFor(() =>
      expect(container.querySelector('[data-testid="import-confirm"]')).not.toBeNull(),
    );

    // Feed count text
    expect(getByText(/Found 3 feeds/)).not.toBeNull();
    // Space picker present
    expect(container.querySelector('[data-testid="space-picker"]')).not.toBeNull();
    // bus.send not yet called
    expect(sendMock).not.toHaveBeenCalled();
  });

  test('import: dispatches importOpml and shows toast on confirm', async () => {
    const { container, getByText } = render(FeedSubscriptions);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await feedFile(fileInput, FLAT_OPML);

    await waitFor(() =>
      expect(container.querySelector('[data-testid="import-confirm"]')).not.toBeNull(),
    );

    await fireEvent.click(getByText('Import'));

    await waitFor(() =>
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'importOpml',
          payload: expect.objectContaining({
            feeds: expect.arrayContaining([expect.objectContaining({ name: 'HN' })]),
          }),
        }),
      ),
    );
    await waitFor(() => expect(getByText('3 feeds imported')).not.toBeNull());
  });

  test('opening the import confirm focuses the primary action; cancel restores the trigger', async () => {
    const { container, getByText } = render(FeedSubscriptions);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await feedFile(fileInput, FLAT_OPML);

    // Open → focus lands on the confirm's primary action (Import), not <body>.
    await waitFor(() => {
      const importBtn = container.querySelector(
        '[data-testid="import-confirm"] [data-variant="primary"]',
      ) as HTMLButtonElement;
      expect(importBtn).not.toBeNull();
      expect(document.activeElement).toBe(importBtn);
    });

    // Cancel → focus returns to the "Import from OPML" trigger.
    await fireEvent.click(getByText('Cancel'));
    await waitFor(() => {
      const trigger = container.querySelector(
        '[data-testid="feed-import-trigger"]',
      ) as HTMLButtonElement;
      expect(trigger).not.toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });

  test('import error: no feeds found in file shows error alert, no confirm step', async () => {
    const { container, queryByTestId } = render(FeedSubscriptions);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await feedFile(fileInput, NON_RSS_XML, 'bad.xml');

    await waitFor(() =>
      expect(container.querySelector('[data-testid="import-error"]')).not.toBeNull(),
    );

    expect(queryByTestId('import-confirm')).toBeNull();
    expect(sendMock).not.toHaveBeenCalled();
  });

  test('export button absent when no RSS folders exist', async () => {
    installChrome(0);
    const { queryByText } = render(FeedSubscriptions);

    // Wait for onMount to complete (state read)
    await waitFor(() => {
      const btn = queryByText('Export as OPML');
      expect(btn).toBeNull();
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
