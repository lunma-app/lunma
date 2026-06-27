import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createInitialState } from '../../shared/store.svelte';
import type {
  AppState,
  LensItem,
  LensProvider,
  LensQuery,
  LensSectionRuntime,
  LensSourceRef,
  PinNode,
  SourceAccount,
  Space,
} from '../../shared/types';
import LensPage from './LensPage.svelte';

type LensNode = Extract<PinNode, { kind: 'lens' }>;

// LensPage is the SINGLE-lens page: it renders the lens its `?folderId` opened as
// a single collapsible inline overview (no drill-down sub-pages). Lens-to-lens
// navigation is the sidebar's job (no in-page rail). These tests assert that shell
// + the per-item bucketing that lets ONE github section feed both Changes +
// Issues, and the activation dispatch.

const ACCOUNTS: Record<string, SourceAccount> = {};
function ref(provider: LensProvider, baseUrl: string, queries: LensQuery[]): LensSourceRef {
  const id = `acc:${provider}:${baseUrl}`;
  ACCOUNTS[id] = { id, provider, baseUrl, name: provider === 'github' ? 'Work' : undefined };
  return { sourceId: id, queries };
}

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
  (window as unknown as { matchMedia: (q: string) => MediaQueryList }).matchMedia = (q: string) =>
    ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }) as unknown as MediaQueryList;
}

function lastCommand(): { kind: string; payload: Record<string, unknown> } | undefined {
  const commands = sendMessage.mock.calls
    .map((c) => c[0] as { type?: string; cmd?: { kind: string; payload: Record<string, unknown> } })
    .filter((m) => m?.type === 'lunma/command');
  return commands.at(-1)?.cmd;
}

const WORK: Space = { id: 'work', name: 'Work', color: 'blue', icon: 'briefcase' };
const GH_SK = 'github:github.com:authored';

function ghNode(): LensNode {
  return {
    kind: 'lens',
    lensKind: 'review',
    id: 'sf-1',
    name: 'Payments',
    icon: 'folder-git-2',
    sources: [ref('github', 'https://github.com', ['authored'])],
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 10,
  };
}

// A PR (Change) + an issue (Ticket) in the SAME github section — the per-item
// bucketing must split them across Changes and Issues.
const PR: LensItem = {
  id: '42',
  title: 'Fix the parser',
  url: 'https://github.com/o/r/pull/42',
  status: { tone: 'fail', label: 'Checks failed' },
  change: {
    author: 'me',
    repo: 'o/r',
    reviewers: [],
    draft: false,
    additions: 10,
    deletions: 2,
    updatedAt: 1,
  },
  refs: [{ kind: 'ticket', key: 'PAY-88', url: '', label: 'PAY-88' }],
};
const ISSUE: LensItem = {
  id: 'i5',
  title: '#5 Crash on empty config',
  url: 'https://github.com/o/r/issues/5',
  ticket: {
    key: '#5',
    statusCategory: 'todo',
    statusLabel: 'Open',
    priority: 'high',
    project: 'o/r',
    updatedAt: 1,
  },
};

function stateWith(node: LensNode, sections: Record<string, LensSectionRuntime>): AppState {
  const state = createInitialState();
  state.spaces.push(WORK);
  state.activeSpaceByWindow[100] = 'work';
  state.pinnedBySpace.work = [node];
  state.lenses[node.id] = { sections };
  for (const [id, account] of Object.entries(ACCOUNTS)) state.sources[id] = account;
  return state;
}

beforeEach(() => installChrome());
afterEach(() => cleanup());

describe('LensPage — single-lens shell + per-item bucketing', () => {
  test('renders the lens identity + the overview (no in-page rail)', () => {
    const initialState = stateWith(ghNode(), {
      [GH_SK]: { state: 'ok', items: [PR], fetchedAt: 1 },
    });
    const { getByTestId, queryByTestId } = render(LensPage, {
      props: { windowId: 100, folderId: 'sf-1', initialState },
    });
    expect(getByTestId('lens-name').textContent).toBe('Payments');
    expect(getByTestId('overview-section')).toBeTruthy();
    // The lens rail belongs to the sidebar, not this page.
    expect(queryByTestId('lens-rail')).toBeNull();
  });

  test('one github section feeds BOTH a Changes row and an Issues row', () => {
    const initialState = stateWith(ghNode(), {
      [GH_SK]: { state: 'ok', items: [PR, ISSUE], fetchedAt: 1 },
    });
    const { container } = render(LensPage, {
      props: { windowId: 100, folderId: 'sf-1', initialState },
    });
    const sections = [...container.querySelectorAll('[data-testid="overview-section"]')].map((s) =>
      s.getAttribute('data-entity'),
    );
    expect(sections).toContain('change');
    expect(sections).toContain('ticket');
    expect(container.querySelector('[data-testid="change-row"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="issue-row"]')).not.toBeNull();
    // The Change row carries the review-state pill, a failing CI circle, + its ticket chip.
    expect(container.querySelector('[data-testid="verdict"]')?.textContent).toContain('open');
    expect(container.querySelector('[data-entity="change"] .ci')?.textContent).toBe('✕');
    expect(container.querySelector('[data-testid="ticket-ref"]')?.textContent).toBe('PAY-88');
  });

  test('activating a change row dispatches openLensItem with the namespaced id', async () => {
    const initialState = stateWith(ghNode(), {
      [GH_SK]: { state: 'ok', items: [PR], fetchedAt: 1 },
    });
    const { container } = render(LensPage, {
      props: { windowId: 100, folderId: 'sf-1', initialState },
    });
    await fireEvent.click(
      container.querySelector('[data-testid="change-row"]') as HTMLButtonElement,
    );
    expect(lastCommand()).toEqual({
      kind: 'openLensItem',
      payload: {
        spaceId: 'work',
        folderId: 'sf-1',
        itemId: `${GH_SK}:42`,
        windowId: 100,
        fromPage: true,
      },
    });
  });

  test('renders the ambient aurora backdrop, intensity tracking the tint prop', () => {
    const initialState = stateWith(ghNode(), {
      [GH_SK]: { state: 'ok', items: [PR], fetchedAt: 1 },
    });
    const { getByTestId } = render(LensPage, {
      props: { windowId: 100, folderId: 'sf-1', initialState, tint: 'subtle' },
    });
    expect(getByTestId('aurora').getAttribute('data-intensity')).toBe('subtle');
  });

  test('no folderId renders the calm missing state', () => {
    const initialState = stateWith(ghNode(), {});
    const { getByTestId } = render(LensPage, {
      props: { windowId: 100, folderId: null, initialState },
    });
    expect(getByTestId('lenspage-missing')).toBeTruthy();
  });
});
