import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createInitialState } from '../../shared/store.svelte';
import type {
  AppState,
  ChangeData,
  LensItem,
  LensSectionRuntime,
  PinNode,
  Space,
} from '../../shared/types';
import LensPage from './LensPage.svelte';

type LensNode = Extract<PinNode, { kind: 'lens' }>;

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
  // Reduced motion → lane rise collapses to instant (the queue reads immediately).
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

function change(over: Partial<ChangeData> = {}): ChangeData {
  return {
    author: 'alex',
    repo: 'lunma/lunma',
    reviewers: [
      { login: 'jd', state: 'approved' },
      { login: 'sm', state: 'pending' },
    ],
    draft: false,
    additions: 112,
    deletions: 40,
    updatedAt: Date.now() - 2 * 3_600_000, // ~2h ago
    ...over,
  };
}

function item(id: string, over: Partial<LensItem> = {}): LensItem {
  return {
    id,
    title: `Change ${id}`,
    url: `https://example.com/${id}`,
    status: { tone: 'ok', label: 'Checks passed' },
    change: change(),
    ...over,
  };
}

/** A single-source review lens (github, review-requested + authored). */
function reviewNode(): LensNode {
  return {
    kind: 'lens',
    lensKind: 'review',
    id: 'rev-1',
    name: 'Reviews',
    icon: 'git-pull-request-arrow',
    sources: [
      {
        source: 'github',
        baseUrl: 'https://github.com',
        queries: ['review-requested', 'authored'],
      },
    ],
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 10,
  };
}

/** A two-source review lens (github + gitlab, both review-requested). */
function twoSourceReviewNode(): LensNode {
  return {
    kind: 'lens',
    lensKind: 'review',
    id: 'rev-2',
    name: 'Reviews',
    icon: 'git-pull-request-arrow',
    sources: [
      { source: 'github', baseUrl: 'https://github.com', queries: ['review-requested'] },
      { source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['review-requested'] },
    ],
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 10,
  };
}

function stateWith(node: LensNode, sections: Record<string, LensSectionRuntime>): AppState {
  const state = createInitialState();
  state.spaces.push(WORK);
  state.activeSpaceByWindow[100] = 'work';
  state.pinnedBySpace.work = [node];
  state.lenses[node.id] = { sections };
  return state;
}

function renderPage(node: LensNode, initialState: AppState) {
  return render(LensPage, {
    props: { windowId: 100, folderId: node.id, initialState, tint: 'vivid' as const },
  });
}

beforeEach(() => installChrome());
afterEach(() => cleanup());

describe('ReviewQueue (review-lens)', () => {
  test('a review lens renders relationship lanes (the queue), not the generic grid', () => {
    const node = reviewNode();
    const state = stateWith(node, {
      'github:github.com:review-requested': { state: 'ok', items: [item('7')], fetchedAt: 1 },
      'github:github.com:authored': { state: 'ok', items: [item('9')], fetchedAt: 1 },
    });
    const { container } = renderPage(node, state);

    // The queue, not the magazine grid.
    expect(container.querySelector('[data-testid="lenspage-section"]')).toBeNull();
    expect(container.querySelector('.card-grid')).toBeNull();
    const lanes = [...container.querySelectorAll('[data-testid="reviewqueue-lane"]')].map((el) =>
      el.getAttribute('data-query'),
    );
    expect(lanes).toEqual(['review-requested', 'authored']);
  });

  test('a general lens still renders the generic section grid (unchanged)', () => {
    const node: LensNode = { ...reviewNode(), id: 'gen-1', lensKind: 'general' };
    const state = stateWith(node, {
      'github:github.com:review-requested': {
        state: 'ok',
        items: [{ id: '7', title: 'X', url: 'https://x' }],
        fetchedAt: 1,
      },
      'github:github.com:authored': {
        state: 'ok',
        items: [{ id: '9', title: 'Y', url: 'https://y' }],
        fetchedAt: 1,
      },
    });
    const { container } = renderPage(node, state);
    expect(container.querySelector('[data-testid="reviewqueue-lane"]')).toBeNull();
    expect(container.querySelectorAll('[data-testid="lenspage-section"]').length).toBe(2);
  });

  test('a row shows the change triage signals (CI · title · repo/author · rail · diffstat · age)', () => {
    const node = reviewNode();
    const state = stateWith(node, {
      'github:github.com:review-requested': { state: 'ok', items: [item('7')], fetchedAt: 1 },
    });
    const { container, getByText } = renderPage(node, state);

    const row = container.querySelector('[data-testid="change-row"]') as HTMLElement;
    expect(row).not.toBeNull();
    expect(getByText('Change 7')).toBeTruthy();
    // Subline: host + owner/repo + author.
    expect(row.textContent).toContain('github.com');
    expect(row.textContent).toContain('lunma/lunma');
    expect(row.textContent).toContain('@alex');
    // Reviewer rail: pending wins (one approved, one pending) → the clock glyph.
    expect(
      row.querySelector('[data-testid="reviewer-rail"] [data-icon-name="clock"]'),
    ).not.toBeNull();
    // Diffstat numerals (never colour-only).
    expect(row.querySelector('[data-testid="diffstat"]')?.textContent).toContain('+112');
    expect(row.querySelector('[data-testid="diffstat"]')?.textContent).toContain('−40');
    // Warming age.
    expect(row.textContent).toContain('2h');
  });

  test('activating a row dispatches openLensItem with the namespaced id', async () => {
    const node = reviewNode();
    const state = stateWith(node, {
      'github:github.com:review-requested': { state: 'ok', items: [item('7')], fetchedAt: 1 },
    });
    const { container } = renderPage(node, state);
    await fireEvent.click(
      container.querySelector('[data-testid="change-row"]') as HTMLButtonElement,
    );
    expect(lastCommand()).toEqual({
      kind: 'openLensItem',
      payload: {
        spaceId: 'work',
        folderId: 'rev-1',
        itemId: 'github:github.com:review-requested:7',
        windowId: 100,
        fromPage: true,
      },
    });
  });

  test('the filter toolbar appears only for a multi-source lens', () => {
    const single = reviewNode();
    const singleState = stateWith(single, {
      'github:github.com:review-requested': { state: 'ok', items: [item('7')], fetchedAt: 1 },
      'github:github.com:authored': { state: 'ok', items: [], fetchedAt: 1 },
    });
    const a = renderPage(single, singleState);
    expect(a.container.querySelector('[data-testid="lens-filterbar"]')).toBeNull();
    cleanup();

    const multi = twoSourceReviewNode();
    const multiState = stateWith(multi, {
      'github:github.com:review-requested': { state: 'ok', items: [item('7')], fetchedAt: 1 },
      'gitlab:gitlab.example.com:review-requested': {
        state: 'ok',
        items: [item('8', { change: change({ repo: 'lunma/api' }) })],
        fetchedAt: 1,
      },
    });
    const b = renderPage(multi, multiState);
    expect(b.container.querySelector('[data-testid="lens-filterbar"]')).not.toBeNull();
  });

  test('a source chip narrows the queue to that source', async () => {
    const node = twoSourceReviewNode();
    const state = stateWith(node, {
      'github:github.com:review-requested': { state: 'ok', items: [item('7')], fetchedAt: 1 },
      'gitlab:gitlab.example.com:review-requested': {
        state: 'ok',
        items: [item('8', { change: change({ repo: 'lunma/api' }) })],
        fetchedAt: 1,
      },
    });
    const { container, getByTestId } = renderPage(node, state);
    // Both changes visible across the lane.
    expect(container.querySelectorAll('[data-testid="change-row"]')).toHaveLength(2);

    // Activate the gitlab source chip → only gitlab changes remain.
    await fireEvent.click(getByTestId('filter-source:gitlab:gitlab.example.com'));
    const rows = container.querySelectorAll('[data-testid="change-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toContain('lunma/api');
  });

  test('reduced-motion holds: the queue still renders its lanes and rows', () => {
    const node = reviewNode();
    const state = stateWith(node, {
      'github:github.com:review-requested': { state: 'ok', items: [item('7')], fetchedAt: 1 },
    });
    const { container } = renderPage(node, state);
    expect(container.querySelector('[data-testid="reviewqueue-lane"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="change-row"]')).not.toBeNull();
  });

  test('a signed-out github section shows the calm Connectors affordance, not a red card', () => {
    const node = reviewNode();
    const state = stateWith(node, {
      'github:github.com:review-requested': { state: 'signed-out', items: [], fetchedAt: null },
      'github:github.com:authored': { state: 'ok', items: [], fetchedAt: 1 },
    });
    const { getByTestId } = renderPage(node, state);
    expect(getByTestId('reviewqueue-signin').textContent).toContain('Add a token');
  });
});
