import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createInitialState } from '../../shared/store.svelte';
import type { AppState, PinNode, SmartSectionRuntime, Space } from '../../shared/types';
import FolderPage from './FolderPage.svelte';

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

let sendMessage: ReturnType<typeof vi.fn>;

function installChrome(): void {
  sendMessage = vi.fn(() => Promise.resolve());
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      sendMessage,
      getURL: (path: string) => `chrome-extension://test/${path}`,
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    tabs: { query: vi.fn(() => Promise.resolve([])), create: vi.fn(), update: vi.fn() },
    windows: { update: vi.fn() },
  };
}

/** The most recent bus command dispatched via chrome.runtime.sendMessage. */
function lastCommand(): { kind: string; payload: Record<string, unknown> } | undefined {
  const commands = sendMessage.mock.calls
    .map((c) => c[0] as { type?: string; cmd?: { kind: string; payload: Record<string, unknown> } })
    .filter((m) => m?.type === 'lunma/command');
  return commands.at(-1)?.cmd;
}

const WORK: Space = { id: 'work', name: 'Work', color: 'blue', icon: 'briefcase' };
const GITLAB_AUTHORED_SK = 'gitlab:gitlab.example.com:authored';
const GITLAB_REVIEW_SK = 'gitlab:gitlab.example.com:review-requested';

function twoFilterNode(): SmartNode {
  return {
    kind: 'smart',
    id: 'sf-1',
    name: 'My work',
    icon: 'folder-git-2',
    sources: [
      {
        source: 'gitlab',
        baseUrl: 'https://gitlab.example.com',
        queries: ['authored', 'review-requested'],
      },
    ],
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 10,
  };
}

function stateWith(node: SmartNode, sections: Record<string, SmartSectionRuntime>): AppState {
  const state = createInitialState();
  state.spaces.push(WORK);
  state.activeSpaceByWindow[100] = 'work';
  state.pinnedBySpace.work = [node];
  state.smartFolders[node.id] = { sections };
  return state;
}

beforeEach(() => installChrome());
afterEach(() => cleanup());

describe('FolderPage (smart-folder-page)', () => {
  test('renders the folder name and every resolved section in order', () => {
    const node = twoFilterNode();
    const initialState = stateWith(node, {
      [GITLAB_AUTHORED_SK]: {
        state: 'ok',
        items: [{ id: '42', title: 'Fix the parser', url: 'https://gitlab.example.com/mr/42' }],
        fetchedAt: 1,
      },
      [GITLAB_REVIEW_SK]: {
        state: 'ok',
        items: [{ id: '7', title: 'Review me', url: 'https://gitlab.example.com/mr/7' }],
        fetchedAt: 1,
      },
    });
    const { container, getByText } = render(FolderPage, {
      props: { windowId: 100, folderId: 'sf-1', initialState, tint: 'vivid' as const },
    });

    expect(getByText('My work')).toBeTruthy();
    const sectionKeys = [...container.querySelectorAll('[data-testid="folderpage-section"]')].map(
      (el) => el.getAttribute('data-source-key'),
    );
    expect(sectionKeys).toEqual([GITLAB_AUTHORED_SK, GITLAB_REVIEW_SK]);
    // Section labels carry host · filter.
    expect(getByText('gitlab.example.com · authored')).toBeTruthy();
    expect(getByText('gitlab.example.com · reviewing')).toBeTruthy();
  });

  test('activating a result card dispatches openSmartItem with the namespaced id', async () => {
    const node = twoFilterNode();
    const initialState = stateWith(node, {
      [GITLAB_AUTHORED_SK]: {
        state: 'ok',
        items: [{ id: '42', title: 'Fix the parser', url: 'https://gitlab.example.com/mr/42' }],
        fetchedAt: 1,
      },
    });
    const { container } = render(FolderPage, {
      props: { windowId: 100, folderId: 'sf-1', initialState, tint: 'vivid' as const },
    });

    await fireEvent.click(
      container.querySelector('[data-testid="folderpage-item"]') as HTMLButtonElement,
    );
    expect(lastCommand()).toEqual({
      kind: 'openSmartItem',
      payload: {
        spaceId: 'work',
        folderId: 'sf-1',
        itemId: `${GITLAB_AUTHORED_SK}:42`,
        windowId: 100,
      },
    });
  });

  test('a signed-out github section renders the Connectors affordance, not a red error', () => {
    const node: SmartNode = {
      ...twoFilterNode(),
      icon: 'folder-git-2',
      sources: [{ source: 'github', baseUrl: 'https://github.com', queries: ['authored'] }],
    };
    const initialState = stateWith(node, {
      'github:github.com:authored': { state: 'signed-out', items: [], fetchedAt: null },
    });
    const { getByTestId } = render(FolderPage, {
      props: { windowId: 100, folderId: 'sf-1', initialState, tint: 'vivid' as const },
    });
    expect(getByTestId('folderpage-signin').textContent).toContain('Add a token');
  });

  test('first-fetch pending renders static ghost cards', () => {
    const node = twoFilterNode();
    const initialState = stateWith(node, {
      [GITLAB_AUTHORED_SK]: { state: 'pending', items: [], fetchedAt: null },
      [GITLAB_REVIEW_SK]: { state: 'pending', items: [], fetchedAt: null },
    });
    const { container } = render(FolderPage, {
      props: { windowId: 100, folderId: 'sf-1', initialState, tint: 'vivid' as const },
    });
    expect(container.querySelectorAll('[data-testid="folderpage-ghost"]').length).toBeGreaterThan(
      0,
    );
  });

  test('a feed section renders rich magazine cards (hero image + excerpt + date)', () => {
    const node: SmartNode = {
      kind: 'smart',
      id: 'sf-1',
      name: 'Reading',
      icon: 'rss',
      sources: [{ source: 'rss', baseUrl: 'https://news.example.com/rss', queries: [] }],
      maxItems: 20,
      hideRead: false,
      refreshMinutes: 30,
    };
    const initialState = stateWith(node, {
      'rss:news.example.com': {
        state: 'ok',
        items: [
          {
            id: 'e1',
            title: 'A big story',
            url: 'https://news.example.com/a',
            excerpt: 'A short summary of the story.',
            imageUrl: 'https://img.example.com/a.jpg',
            publishedAt: Date.now() - 2 * 3_600_000, // ~2h ago
          },
        ],
        fetchedAt: 1,
      },
    });
    const { container, getByText, getByTestId } = render(FolderPage, {
      props: { windowId: 100, folderId: 'sf-1', initialState, tint: 'vivid' as const },
    });

    // Magazine grid + hero image (lazy + no-referrer) + excerpt + relative date.
    expect(container.querySelector('.card-grid.feed')).not.toBeNull();
    const hero = getByTestId('folderpage-hero').querySelector('img') as HTMLImageElement;
    expect(hero.getAttribute('src')).toBe('https://img.example.com/a.jpg');
    expect(hero.getAttribute('loading')).toBe('lazy');
    expect(hero.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(getByText('A short summary of the story.')).toBeTruthy();
    expect(getByTestId('folderpage-date').textContent).toContain('h ago');
  });

  test('no folderId renders the calm missing state (never an error card)', () => {
    const initialState = stateWith(twoFilterNode(), {});
    const { getByTestId } = render(FolderPage, {
      props: { windowId: 100, folderId: null, initialState, tint: 'vivid' as const },
    });
    expect(getByTestId('folderpage-missing')).toBeTruthy();
  });
});
