import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { SidebarCommand } from '../shared/bus';
import Harness from './ServiceConnectPicker.test.harness.svelte';

// ServiceConnectPicker (sources-redesign, D2/D10): the shared Service-dropdown
// connect picker. The bus is mocked so `bus.send`/`dispatch` resolve instantly
// and we assert the commands; tokens go through a backing storage.local record.

const sendMock = vi.fn(async (_cmd: SidebarCommand) => undefined);
const dispatchMock = vi.fn();
vi.mock('../shared/bus', () => ({
  bus: { send: (cmd: SidebarCommand) => sendMock(cmd) },
  dispatch: (cmd: SidebarCommand) => dispatchMock(cmd),
}));

let localData: Record<string, unknown>;

function installChrome(): void {
  localData = {};
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      local: {
        get: vi.fn(async (key: string) => {
          const v = localData[key];
          return v === undefined ? {} : { [key]: v };
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(localData, items);
        }),
      },
    },
  };
}

beforeEach(() => {
  installChrome();
  sendMock.mockClear();
  dispatchMock.mockClear();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

const sel = (c: HTMLElement, id: string) => c.querySelector(`[data-testid="${id}"]`);
const input = (c: HTMLElement, id: string) => sel(c, id) as HTMLInputElement;

/** The shared Select is a custom listbox: open the trigger, then click the
 * option whose label matches. */
async function selectService(c: HTMLElement, label: string): Promise<void> {
  await fireEvent.click(sel(c, 'connect-service') as HTMLButtonElement);
  const option = [...c.querySelectorAll('[data-testid="select-option"]')].find(
    (o) => o.textContent?.trim() === label,
  ) as HTMLButtonElement;
  await fireEvent.click(option);
}

describe('ServiceConnectPicker', () => {
  test('selecting GitLab shows host + optional token and mints a session-capable account WITHOUT a token', async () => {
    const { container } = render(Harness, { props: { spaces: [] } });
    // Default service is GitHub (pat-only) → Connect disabled until a token.
    await selectService(container, 'GitLab');
    // Session-capable: the token is optional, so Connect is enabled with just a host.
    const commit = sel(container, 'connect-commit') as HTMLButtonElement;
    expect(commit.disabled).toBe(false);
    await fireEvent.click(commit);

    await waitFor(() => {
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'createAccount',
          payload: expect.objectContaining({ provider: 'gitlab', baseUrl: 'https://gitlab.com' }),
        }),
      );
    });
    // No token written for the empty optional token.
    expect(localData['lunma.connectors']).toBeUndefined();
  });

  test('GitHub (pat-only) blocks Connect until a token, then writes the token off-bus', async () => {
    const { container } = render(Harness, { props: { spaces: [] } });
    expect((sel(container, 'connect-commit') as HTMLButtonElement).disabled).toBe(true);
    await fireEvent.input(input(container, 'connect-token'), { target: { value: 'ghp-secret' } });
    const commit = sel(container, 'connect-commit') as HTMLButtonElement;
    expect(commit.disabled).toBe(false);
    await fireEvent.click(commit);

    await waitFor(() => {
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'createAccount',
          payload: expect.objectContaining({ provider: 'github' }),
        }),
      );
      // The token went to the off-bus secrets record, keyed by the minted id.
      expect(Object.values(localData['lunma.connectors'] as Record<string, string>)).toContain(
        'ghp-secret',
      );
    });
  });

  test('the RSS feed branch shows a feed-URL field only (no token) and offers OPML import', async () => {
    const { container } = render(Harness, {
      props: { spaces: [{ id: 'work', name: 'Work' }] },
    });
    await selectService(container, 'RSS feed');
    // No token field for a feed; the OPML bulk-add option is present.
    expect(sel(container, 'connect-token')).toBeNull();
    expect(sel(container, 'connect-import-opml')).not.toBeNull();
  });

  test('the programmatically-clicked OPML file input is out of the tab order and a11y tree (SCP-01)', () => {
    const { container } = render(Harness, {
      props: { spaces: [{ id: 'work', name: 'Work' }] },
    });
    const fileInput = sel(container, 'connect-import-file') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    expect(fileInput.getAttribute('tabindex')).toBe('-1');
    expect(fileInput.getAttribute('aria-hidden')).toBe('true');
  });

  test('OPML import reveals the "Found N feeds — import as one folder into:" confirm and dispatches importOpml', async () => {
    const { container, getByText } = render(Harness, {
      props: { spaces: [{ id: 'work', name: 'Work' }] },
    });
    await selectService(container, 'RSS feed');
    // Simulate a picked OPML file with two feed outlines.
    const file = new File(
      [
        '<opml><body>' +
          '<outline type="rss" text="A" xmlUrl="https://a.example.com/feed"/>' +
          '<outline type="rss" text="B" xmlUrl="https://b.example.com/feed"/>' +
          '</body></opml>',
      ],
      'feeds.opml',
      { type: 'text/x-opml' },
    );
    const fileInput = sel(container, 'connect-import-file') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    await fireEvent.change(fileInput);

    await waitFor(() => expect(sel(container, 'connect-import-confirm')).not.toBeNull());
    expect(getByText(/Found 2 feeds — import as one folder into:/)).toBeTruthy();
    // The result reveals in a role="status" region so AT is told the parse
    // succeeded and a confirm step appeared (SCP-03).
    expect(container.querySelector('.import-found')?.getAttribute('role')).toBe('status');

    await fireEvent.click(sel(container, 'connect-import-button') as HTMLButtonElement);
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'importOpml',
        payload: expect.objectContaining({ spaceId: 'work' }),
      }),
    );
  });

  test('editor mode (onImportFeeds): OPML is offered without spaces, the confirm reads "add to this lens" with no Space picker, and it hands the feeds to the host instead of dispatching importOpml', async () => {
    const onImportFeeds = vi.fn();
    const { container, getByText } = render(Harness, { props: { onImportFeeds } });
    await selectService(container, 'RSS feed');
    // The bulk option is offered even with no spaces, because onImportFeeds is set.
    expect(sel(container, 'connect-import-opml')).not.toBeNull();

    const file = new File(
      [
        '<opml><body>' +
          '<outline type="rss" text="A" xmlUrl="https://a.example.com/feed"/>' +
          '<outline type="rss" text="B" xmlUrl="https://b.example.com/feed"/>' +
          '</body></opml>',
      ],
      'feeds.opml',
      { type: 'text/x-opml' },
    );
    const fileInput = sel(container, 'connect-import-file') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    await fireEvent.change(fileInput);

    await waitFor(() => expect(sel(container, 'connect-import-confirm')).not.toBeNull());
    // Editor framing: "add to this lens", and NO target-Space picker.
    expect(getByText(/Found 2 feeds — add to this lens:/)).toBeTruthy();
    expect(sel(container, 'connect-import-space')).toBeNull();

    await fireEvent.click(sel(container, 'connect-import-button') as HTMLButtonElement);
    expect(onImportFeeds).toHaveBeenCalledTimes(1);
    const passed = onImportFeeds.mock.calls[0]?.[0] as { feedUrl: string }[];
    expect(passed.map((f) => f.feedUrl)).toEqual([
      'https://a.example.com/feed',
      'https://b.example.com/feed',
    ]);
    // No standalone "Feeds" lens: importOpml is never dispatched.
    expect(dispatchMock).not.toHaveBeenCalledWith(expect.objectContaining({ kind: 'importOpml' }));
  });
});
