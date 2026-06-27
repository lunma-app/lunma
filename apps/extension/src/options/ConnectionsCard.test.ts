import { fireEvent, render, waitFor, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { SidebarCommand } from '../shared/bus';
import type { AppState } from '../shared/types';
import ConnectionsCard from './ConnectionsCard.svelte';

// ConnectionsCard (sources-redesign, D1): the merged Connections manager. The
// bus + connectors + persisted-state reads are mocked so the card renders a
// deterministic source set and the lifecycle commands resolve instantly. The
// per-row ⋯ uses the bits-ui `BitsMenu` primitive (testids `menu-trigger` /
// `menu-item`): the trigger lives in the row, but its items PORTAL to
// <document.body> and open ASYNC, so item assertions query `document` and wait.
// A chosen action opens an inline editor below the row.

const sendMock = vi.fn(async (_cmd: SidebarCommand) => undefined);
vi.mock('../shared/bus', () => ({
  bus: { send: (cmd: SidebarCommand) => sendMock(cmd) },
  dispatch: vi.fn(),
}));

let tokenRecord: Record<string, string>;
const setAccountTokenMock = vi.fn(async (_id: string, _token: string | null) => undefined);
vi.mock('../shared/connectors', () => ({
  readAccountTokens: vi.fn(async () => tokenRecord),
  setAccountToken: (id: string, token: string | null) => setAccountTokenMock(id, token),
}));

let state: AppState;
vi.mock('../shared/chrome/storage', () => ({
  STATE_STORAGE_KEY: 'lunma.state',
  readPersistedState: vi.fn(async () => ({ kind: 'ok', state })),
}));

function makeState(): AppState {
  return {
    sources: {
      gh: { id: 'gh', provider: 'github', baseUrl: 'https://github.com', name: 'Work GitHub' },
      f1: { id: 'f1', provider: 'rss', baseUrl: 'https://news.example.com/rss', name: 'News' },
      f2: { id: 'f2', provider: 'rss', baseUrl: 'https://blog.example.com/feed' },
    },
    pinnedBySpace: {
      work: [
        {
          kind: 'lens',
          id: 'sf-1',
          name: 'Backend',
          icon: 'layers',
          lensKind: 'review',
          sources: [
            { sourceId: 'gh', queries: ['authored'] },
            { sourceId: 'f1', queries: [] },
          ],
          maxItems: 20,
          hideRead: false,
          refreshMinutes: 10,
        },
      ],
    },
    spaces: [{ id: 'work', name: 'Work', color: 'blue', icon: 'star' }],
  } as unknown as AppState;
}

function installChrome(): void {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { onChanged: { addListener: vi.fn(), removeListener: vi.fn() } },
  };
  (
    globalThis as unknown as { navigator: { clipboard: { writeText: ReturnType<typeof vi.fn> } } }
  ).navigator = { clipboard: { writeText: vi.fn(async () => undefined) } } as never;
}

beforeEach(() => {
  state = makeState();
  tokenRecord = { gh: 'ghp-x' };
  sendMock.mockClear();
  setAccountTokenMock.mockClear();
  installChrome();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

const sel = (c: HTMLElement, id: string) => c.querySelector(`[data-testid="${id}"]`);
const all = (c: HTMLElement, id: string) => [...c.querySelectorAll(`[data-testid="${id}"]`)];

/** Menu items live in a bits-ui portal on <document.body>, not under the row. */
function menuItems(): HTMLElement[] {
  return [...document.querySelectorAll('[data-testid="menu-item"]')] as HTMLElement[];
}

/** Open a row's ⋯ menu (bits-ui opens on pointerdown+up; the click resolves it in
 * jsdom) and return its portaled menu items. */
async function openRowMenu(row: HTMLElement): Promise<HTMLElement[]> {
  const trigger = within(row).getByTestId('menu-trigger');
  await fireEvent.pointerDown(trigger);
  await fireEvent.pointerUp(trigger);
  await fireEvent.click(trigger);
  await waitFor(() => expect(menuItems().length).toBeGreaterThan(0));
  return menuItems();
}

describe('ConnectionsCard', () => {
  test('renders an Accounts group and a Feeds group with the "used in N · powers …" reach', async () => {
    const { container } = render(ConnectionsCard, { props: {} });
    await waitFor(() => expect(sel(container, 'account-row')).not.toBeNull());

    // Accounts group: the one github account, its reach + the entity it powers.
    expect(all(container, 'account-row')).toHaveLength(1);
    const reach = sel(container, 'account-reach')?.textContent ?? '';
    expect(reach).toContain('Used in 1 lens');
    expect(reach).toContain('powers Changes');

    // Feeds group: two feeds, each with its URL · reach · powers Articles.
    expect(all(container, 'feed-row')).toHaveLength(2);
    const metas = all(container, 'feed-meta').map((e) => e.textContent ?? '');
    expect(
      metas.some((t) => t.includes('news.example.com/rss') && t.includes('Used in 1 lens')),
    ).toBe(true);
    expect(
      metas.some((t) => t.includes('blog.example.com/feed') && t.includes('Not used yet')),
    ).toBe(true);
    expect(metas.every((t) => t.includes('powers Articles'))).toBe(true);
  });

  test('the Export OPML utility renders when a lens references an rss account', async () => {
    const { container } = render(ConnectionsCard, { props: {} });
    await waitFor(() => expect(sel(container, 'export-opml')).not.toBeNull());
  });

  test('the Export OPML utility is absent when no lens references an rss account', async () => {
    state.pinnedBySpace.work = [
      {
        kind: 'lens',
        id: 'sf-1',
        name: 'Backend',
        icon: 'layers',
        lensKind: 'review',
        sources: [{ sourceId: 'gh', queries: ['authored'] }],
        maxItems: 20,
        hideRead: false,
        refreshMinutes: 10,
      },
    ];
    const { container } = render(ConnectionsCard, { props: {} });
    await waitFor(() => expect(sel(container, 'account-row')).not.toBeNull());
    expect(sel(container, 'export-opml')).toBeNull();
  });

  test('+ Connect reveals the shared Service-dropdown picker', async () => {
    const { container } = render(ConnectionsCard, { props: {} });
    await waitFor(() => expect(sel(container, 'connect-open')).not.toBeNull());
    await fireEvent.click(sel(container, 'connect-open') as HTMLButtonElement);
    expect(sel(container, 'connect-service')).not.toBeNull();
  });

  test('a feed row menu offers Rename / Copy URL / Remove', async () => {
    const { container } = render(ConnectionsCard, { props: {} });
    await waitFor(() => expect(sel(container, 'feed-row')).not.toBeNull());
    const items = await openRowMenu(sel(container, 'feed-row') as HTMLElement);
    const labels = items.map((e) => e.textContent?.trim());
    expect(labels).toEqual(expect.arrayContaining(['Rename', 'Copy URL', 'Remove']));
  });

  test('disconnecting an in-use account warns, then dispatches deleteAccount + clears the token', async () => {
    const { container } = render(ConnectionsCard, { props: {} });
    await waitFor(() => expect(sel(container, 'account-row')).not.toBeNull());
    const row = sel(container, 'account-row') as HTMLElement;
    const items = await openRowMenu(row);
    const disconnect = items.find(
      (e) => e.textContent?.trim() === 'Disconnect',
    ) as HTMLButtonElement;
    await fireEvent.click(disconnect);

    // The inline confirm opens below the row, warning because reach > 0.
    await waitFor(() => expect(sel(container, 'remove-confirm')).not.toBeNull());
    expect(sel(container, 'remove-confirm')?.textContent).toContain('used in 1 lens');

    await fireEvent.click(sel(container, 'remove-confirm-button') as HTMLButtonElement);
    await waitFor(() => {
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'deleteAccount', payload: { id: 'gh' } }),
      );
    });
    expect(setAccountTokenMock).toHaveBeenCalledWith('gh', null);
  });
});
