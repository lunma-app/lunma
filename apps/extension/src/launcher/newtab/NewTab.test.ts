import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { LauncherResult } from '../../shared/launcher-contract';
import { buildEngineRegistry } from '../../shared/search-engines';
import { createInitialState } from '../../shared/store.svelte';
import type { AppState, Space } from '../../shared/types';
import NewTabHarness from './NewTab.test.harness.svelte';

// Built-ins-only registry (yt/g/bing/brave/…) for the Tab-to-search tests.
const REGISTRY = buildEngineRegistry({ customSearchUrl: '', customSearchKeyword: '' });

interface ChromeMock {
  sendMessage: ReturnType<typeof vi.fn>;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
}

let mock: ChromeMock;
/** Results the faked suggestions channel returns for any non-empty query. */
let suggestResults: LauncherResult[] = [];

function installChrome(): void {
  mock = {
    sendMessage: vi.fn((msg: { type?: string; requestId?: string }) => {
      if (msg?.type === 'lunma/launcher-suggestions-request') {
        return Promise.resolve({
          type: 'lunma/launcher-suggestions-response',
          requestId: msg.requestId,
          results: suggestResults,
        });
      }
      return Promise.resolve(); // command path (ack arrives separately / not awaited)
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      sendMessage: mock.sendMessage,
      getURL: (path: string) => `chrome-extension://test/${path}`,
      onMessage: { addListener: mock.addListener, removeListener: mock.removeListener },
    },
  };
}

function stateWithActiveSpace(windowId: number, space: Space): AppState {
  const state = createInitialState();
  state.spaces.push(space);
  state.activeSpaceByWindow[windowId] = space.id;
  return state;
}

/** The most recent bus command dispatched via chrome.runtime.sendMessage. */
function lastCommand(): { kind: string; payload: Record<string, unknown> } | undefined {
  const commands = mock.sendMessage.mock.calls
    .map((c) => c[0] as { type?: string; cmd?: { kind: string; payload: Record<string, unknown> } })
    .filter((m) => m?.type === 'lunma/command');
  return commands.at(-1)?.cmd;
}

const WORK: Space = { id: 'work', name: 'Work', color: 'blue', icon: 'briefcase' };

async function typeQuery(input: HTMLInputElement, value: string): Promise<void> {
  await fireEvent.input(input, { target: { value } });
}

beforeEach(() => {
  suggestResults = [];
  installChrome();
});

afterEach(() => {
  cleanup();
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
  vi.restoreAllMocks();
});

describe('NewTab (Space home)', () => {
  test("renders the active Space's name and icon for the window", () => {
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK) },
    });
    expect(container.querySelector('[data-testid="newtab-name"]')?.textContent).toBe('Work');
    const icon = container.querySelector('[data-testid="newtab-icon"] [data-icon-name]');
    expect(icon?.getAttribute('data-icon-name')).toBe('briefcase');
  });

  test('renders the neutral home (no name/icon) when the window has no active Space', () => {
    const state = createInitialState();
    state.activeSpaceByWindow[100] = null;
    const { container } = render(NewTabHarness, { props: { windowId: 100, initialState: state } });
    expect(container.querySelector('[data-testid="newtab-name"]')).toBeNull();
    expect(container.querySelector('[data-testid="newtab-icon"]')).toBeNull();
    expect(container.querySelector('[data-testid="newtab-home"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="newtab-search"]')).not.toBeNull();
  });

  test('renders the neutral home with no seed state (cold start)', () => {
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: null },
    });
    expect(container.querySelector('[data-testid="newtab-home"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="newtab-name"]')).toBeNull();
  });

  test('dispatches no command on mount (read-only until acted on)', () => {
    render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK) },
    });
    expect(mock.sendMessage).not.toHaveBeenCalled();
    expect(mock.addListener).toHaveBeenCalled(); // the read-only broadcast subscription
  });
});

describe('NewTab (launcher search)', () => {
  function input(container: HTMLElement): HTMLInputElement {
    return container.querySelector('[data-testid="newtab-search"]') as HTMLInputElement;
  }

  test('empty query shows the full identity home (chip hidden) and no results', () => {
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK) },
    });
    expect(container.querySelector('[data-testid="newtab-name"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="result-list"]')).toBeNull();
    // The full identity is visible; the compact chip is present but hidden.
    expect(
      container.querySelector('[data-testid="newtab-identity"]')?.getAttribute('aria-hidden'),
    ).toBe('false');
    expect(
      container.querySelector('[data-testid="newtab-identity-chip"]')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  test('typing collapses the full identity into the identity chip (not unmounted)', async () => {
    suggestResults = [
      { id: 'tab:11', source: 'tab', title: 'Tab one', url: 'https://one/', score: 3, tabId: 11 },
      { id: 'bookmark:b', source: 'bookmark', title: 'Book', url: 'https://book/', score: 2 },
    ];
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK) },
    });
    await typeQuery(input(container), 'one');
    await waitFor(() =>
      expect(container.querySelectorAll('[data-testid="result-row"]')).toHaveLength(2),
    );
    // The full identity stays in the DOM but goes hidden; the compact chip
    // (Space icon + name) takes its place above the anchored input.
    expect(
      container.querySelector('[data-testid="newtab-identity"]')?.getAttribute('aria-hidden'),
    ).toBe('true');
    const chip = container.querySelector('[data-testid="newtab-identity-chip"]');
    expect(chip).not.toBeNull();
    expect(chip?.getAttribute('aria-hidden')).toBe('false');
    expect(chip?.textContent).toContain('Work');
  });

  test('Enter on a tab result dispatches focusTab', async () => {
    suggestResults = [
      { id: 'tab:11', source: 'tab', title: 'Tab one', url: 'https://one/', score: 3, tabId: 11 },
    ];
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK) },
    });
    await typeQuery(input(container), 'one');
    await waitFor(() =>
      expect(container.querySelector('[data-testid="result-row"]')).not.toBeNull(),
    );
    await fireEvent.keyDown(input(container), { key: 'Enter' });
    expect(lastCommand()).toEqual({ kind: 'focusTab', payload: { tabId: 11 } });
  });

  test('ArrowDown + Enter on a bookmark result dispatches openUrl in the window', async () => {
    suggestResults = [
      { id: 'tab:11', source: 'tab', title: 'Tab one', url: 'https://one/', score: 3, tabId: 11 },
      { id: 'bookmark:b', source: 'bookmark', title: 'Book', url: 'https://book/', score: 2 },
    ];
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK) },
    });
    await typeQuery(input(container), 'b');
    await waitFor(() =>
      expect(container.querySelectorAll('[data-testid="result-row"]')).toHaveLength(2),
    );
    await fireEvent.keyDown(input(container), { key: 'ArrowDown' });
    await fireEvent.keyDown(input(container), { key: 'Enter' });
    expect(lastCommand()).toEqual({
      kind: 'openUrl',
      payload: { url: 'https://book/', windowId: 100 },
    });
  });

  test('Enter on a websearch action result dispatches openUrl with the search url', async () => {
    suggestResults = [
      {
        id: 'websearch',
        source: 'websearch',
        title: 'Search Google for "react hooks"',
        url: 'https://www.google.com/search?q=react%20hooks',
        score: 0,
      },
    ];
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK) },
    });
    await typeQuery(input(container), 'react hooks');
    await waitFor(() =>
      expect(container.querySelector('[data-testid="result-row"]')).not.toBeNull(),
    );
    await fireEvent.keyDown(input(container), { key: 'Enter' });
    expect(lastCommand()).toEqual({
      kind: 'openUrl',
      payload: { url: 'https://www.google.com/search?q=react%20hooks', windowId: 100 },
    });
  });

  test('Enter on a navigate action result dispatches openUrl with the target url', async () => {
    suggestResults = [
      {
        id: 'navigate',
        source: 'navigate',
        title: 'Go to react.dev',
        url: 'https://react.dev',
        score: 0,
      },
    ];
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK) },
    });
    await typeQuery(input(container), 'react.dev');
    await waitFor(() =>
      expect(container.querySelector('[data-testid="result-row"]')).not.toBeNull(),
    );
    await fireEvent.keyDown(input(container), { key: 'Enter' });
    expect(lastCommand()).toEqual({
      kind: 'openUrl',
      payload: { url: 'https://react.dev', windowId: 100 },
    });
  });

  test('a dormant saved result dispatches openSavedTab; a bound one focusSavedTab', async () => {
    const state = stateWithActiveSpace(100, WORK);
    state.savedTabs.s1 = {
      id: 's1',
      spaceId: 'work',
      title: 'Saved',
      originalURL: 'https://saved/',
      currentURL: null,
    };
    state.tabBindings.s1 = {}; // dormant
    suggestResults = [
      {
        id: 'saved:s1',
        source: 'saved',
        title: 'Saved',
        url: 'https://saved/',
        score: 2,
        savedTabId: 's1',
      },
    ];
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: state },
    });
    await typeQuery(input(container), 'saved');
    await waitFor(() =>
      expect(container.querySelector('[data-testid="result-row"]')).not.toBeNull(),
    );
    await fireEvent.keyDown(input(container), { key: 'Enter' });
    expect(lastCommand()).toEqual({
      kind: 'openSavedTab',
      payload: { savedTabId: 's1', windowId: 100 },
    });
  });

  test('Escape clears the query back to the idle identity home', async () => {
    suggestResults = [
      { id: 'tab:11', source: 'tab', title: 'Tab one', url: 'https://one/', score: 3, tabId: 11 },
    ];
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK) },
    });
    await typeQuery(input(container), 'one');
    await waitFor(() =>
      expect(container.querySelector('[data-testid="result-list"]')).not.toBeNull(),
    );
    await fireEvent.keyDown(input(container), { key: 'Escape' });
    await waitFor(() => expect(container.querySelector('[data-testid="result-list"]')).toBeNull());
    expect(container.querySelector('[data-testid="newtab-name"]')?.textContent).toBe('Work');
  });

  test('empty (query, no matches) shows a quiet empty line, not a dead box', async () => {
    suggestResults = []; // any non-empty query resolves to no matches
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK) },
    });
    await typeQuery(input(container), 'zzz');
    await waitFor(() =>
      expect(container.querySelector('[data-testid="newtab-empty"]')?.textContent).toBe(
        'No matches',
      ),
    );
    expect(container.querySelectorAll('[data-testid="result-row"]')).toHaveLength(0);
  });
});

describe('NewTab (immersive surfaces)', () => {
  function searchInput(container: HTMLElement): HTMLInputElement {
    return container.querySelector('[data-testid="newtab-search"]') as HTMLInputElement;
  }

  test('renders the aurora backdrop and a frosted-glass icon tile with the hue glow', () => {
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK) },
    });
    expect(container.querySelector('[data-testid="aurora"]')).not.toBeNull();
    const tile = container.querySelector('[data-testid="newtab-icon"]');
    expect(tile?.getAttribute('data-variant')).toBe('glass');
    expect(tile?.getAttribute('data-glow')).toBe('true');
  });

  test('sets the canonical OKLCH from the active Space colour for the hue-derived chrome', () => {
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK) },
    });
    // `blue` → canonical { l: 0.55, c: 0.16, h: 252 } (colourToOklch), non-gray.
    const home = container.querySelector('[data-testid="newtab-home"]') as HTMLElement;
    expect(home.style.getPropertyValue('--space-h')).toBe('252');
    expect(home.style.getPropertyValue('--space-chroma')).toBe('0.16');
    expect(home.style.getPropertyValue('--space-l')).toBe('0.55');
  });

  test('renders the quiet meta line with this window/Space tab + pinned counts', () => {
    const state = stateWithActiveSpace(100, WORK);
    state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [1, 2], tempTabTitles: {} },
    };
    state.pinnedBySpace.work = [
      { kind: 'tab', id: 's1' },
      {
        kind: 'folder',
        id: 'f1',
        name: 'F',
        icon: 'folder',
        color: 'gray',
        children: ['s2', 's3'],
      },
    ];
    const { container } = render(NewTabHarness, { props: { windowId: 100, initialState: state } });
    expect(container.querySelector('[data-testid="newtab-meta"]')?.textContent).toBe(
      '2 tabs · 3 pinned',
    );
  });

  test('the SearchField input drives the query and the results sit in a glass card', async () => {
    suggestResults = [
      { id: 'tab:11', source: 'tab', title: 'Tab one', url: 'https://one/', score: 3, tabId: 11 },
    ];
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK) },
    });
    await fireEvent.input(searchInput(container), { target: { value: 'one' } });
    await waitFor(() =>
      expect(container.querySelector('[data-testid="result-row"]')).not.toBeNull(),
    );
    const card = container.querySelector('[data-testid="newtab-results"] [data-variant="glass"]');
    expect(card).not.toBeNull();
  });

  test('composes a motion-aware aurora (reduced-motion is honoured by the backdrop)', async () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true, // prefers-reduced-motion: reduce
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
    try {
      const { container } = render(NewTabHarness, {
        props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK) },
      });
      await waitFor(() =>
        expect(container.querySelector('[data-testid="aurora"]')?.getAttribute('data-motion')).toBe(
          'reduced',
        ),
      );
    } finally {
      window.matchMedia = original;
    }
  });

  test('the resolved tint reaches data-tint and the Aurora intensity', () => {
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK), tint: 'subtle' },
    });
    const home = container.querySelector('[data-testid="newtab-home"]') as HTMLElement;
    expect(home.getAttribute('data-tint')).toBe('subtle');
    // Aurora reflects its intensity prop as data-intensity (drives --aurora-opacity).
    expect(container.querySelector('[data-testid="aurora"]')?.getAttribute('data-intensity')).toBe(
      'subtle',
    );
  });

  test('meta line uses the singular "tab" when the Space has exactly one open tab', () => {
    const state = stateWithActiveSpace(100, WORK);
    state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: -1, tempTabIds: [1], tempTabTitles: {} },
    };
    const { container } = render(NewTabHarness, { props: { windowId: 100, initialState: state } });
    expect(container.querySelector('[data-testid="newtab-meta"]')?.textContent).toBe(
      '1 tab · 0 pinned',
    );
  });

  test('a gray Space still renders the full identity at a neutral chroma (unlike the overlay fallback)', () => {
    const gray = { id: 'g', name: 'Grey', color: 'gray', icon: 'briefcase' } as const;
    const { container } = render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, gray) },
    });
    // The new-tab home shows the Space identity regardless of colour; gray reads as
    // a true neutral via --space-chroma 0 (it does NOT hide like the overlay's hue
    // fallback — the page is the Space's home, not a tinted accent surface).
    expect(container.querySelector('[data-testid="newtab-name"]')?.textContent).toBe('Grey');
    const home = container.querySelector('[data-testid="newtab-home"]') as HTMLElement;
    expect(home.style.getPropertyValue('--space-chroma')).toBe('0');
  });
});

describe('NewTab (Tab-to-search)', () => {
  function input(container: HTMLElement): HTMLInputElement {
    return container.querySelector('[data-testid="newtab-search"]') as HTMLInputElement;
  }
  function chip(container: HTMLElement): HTMLElement | null {
    return container.querySelector('[data-testid="newtab-engine-chip"]');
  }
  function renderHome() {
    return render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK), engines: REGISTRY },
    });
  }

  test('a recognized keyword prefix shows the "⇥ Tab" hint and does NOT switch yet', async () => {
    const { container } = renderHome();
    await typeQuery(input(container), 'yt');
    await waitFor(() =>
      expect(container.querySelector('[data-testid="newtab-engine-hint"]')).not.toBeNull(),
    );
    expect(container.querySelector('[data-testid="newtab-engine-hint"]')?.textContent).toContain(
      'YouTube',
    );
    expect(chip(container)).toBeNull(); // no engine locked until Tab
  });

  test('Tab activates the engine: the chip shows and the query becomes the remainder', async () => {
    const { container } = renderHome();
    await typeQuery(input(container), 'yt lofi');
    await fireEvent.keyDown(input(container), { key: 'Tab' });
    await waitFor(() => expect(chip(container)).not.toBeNull());
    expect(chip(container)?.textContent).toContain('YouTube');
    // The single engine-mode row reads the remainder as the query.
    await waitFor(() =>
      expect(container.querySelector('[data-testid="result-row"]')?.textContent).toContain(
        'Search YouTube for "lofi"',
      ),
    );
    expect(container.querySelectorAll('[data-testid="result-row"]')).toHaveLength(1);
  });

  test('Enter in engine mode dispatches openUrl with the engine search URL', async () => {
    const { container } = renderHome();
    await typeQuery(input(container), 'yt lofi');
    await fireEvent.keyDown(input(container), { key: 'Tab' });
    await waitFor(() =>
      expect(container.querySelector('[data-testid="result-row"]')).not.toBeNull(),
    );
    await fireEvent.keyDown(input(container), { key: 'Enter' });
    expect(lastCommand()).toEqual({
      kind: 'openUrl',
      payload: { url: 'https://www.youtube.com/results?search_query=lofi', windowId: 100 },
    });
  });

  test('engine mode suppresses the finder + default row (only the single engine row)', async () => {
    // The suggestions channel would return matches, but engine mode never queries it.
    suggestResults = [
      { id: 'tab:1', source: 'tab', title: 'Tab one', url: 'https://one/', score: 3, tabId: 1 },
    ];
    const { container } = renderHome();
    await typeQuery(input(container), 'yt lofi');
    await fireEvent.keyDown(input(container), { key: 'Tab' });
    await waitFor(() =>
      expect(container.querySelector('[data-testid="result-row"]')).not.toBeNull(),
    );
    const rows = container.querySelectorAll('[data-testid="result-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toContain('Search YouTube for "lofi"');
  });

  test('an empty query in engine mode shows the chip with no action row', async () => {
    const { container } = renderHome();
    await typeQuery(input(container), 'yt'); // bare keyword
    await fireEvent.keyDown(input(container), { key: 'Tab' });
    await waitFor(() => expect(chip(container)).not.toBeNull());
    expect(container.querySelector('[data-testid="result-row"]')).toBeNull();
    expect(container.querySelector('[data-testid="newtab-results"]')).toBeNull();
  });

  test('Backspace on an empty engine-mode query pops the chip', async () => {
    const { container } = renderHome();
    await typeQuery(input(container), 'yt lofi');
    await fireEvent.keyDown(input(container), { key: 'Tab' });
    await waitFor(() => expect(chip(container)).not.toBeNull());
    // Clear the query, then Backspace pops the chip.
    await typeQuery(input(container), '');
    await fireEvent.keyDown(input(container), { key: 'Backspace' });
    await waitFor(() => expect(chip(container)).toBeNull());
  });

  test('the chip × control pops the engine, keeping the typed query as a plain search', async () => {
    suggestResults = [
      {
        id: 'websearch',
        source: 'websearch',
        title: 'Search Google for "lofi"',
        url: 'https://www.google.com/search?q=lofi',
        score: 0,
      },
    ];
    const { container } = renderHome();
    await typeQuery(input(container), 'yt lofi');
    await fireEvent.keyDown(input(container), { key: 'Tab' });
    await waitFor(() => expect(chip(container)).not.toBeNull());
    await fireEvent.click(container.querySelector('[data-testid="chip-remove"]') as HTMLElement);
    await waitFor(() => expect(chip(container)).toBeNull());
    // Back in default mode the remaining query searches normally.
    await waitFor(() =>
      expect(container.querySelector('[data-testid="result-row"]')?.textContent).toContain(
        'Search Google',
      ),
    );
  });

  test('an ambiguous prefix cycles engines on repeated Tab', async () => {
    const { container } = renderHome();
    await typeQuery(input(container), 'b'); // prefix of Bing AND Brave
    await fireEvent.keyDown(input(container), { key: 'Tab' });
    await waitFor(() => expect(chip(container)?.textContent).toContain('Bing'));
    await fireEvent.keyDown(input(container), { key: 'Tab' });
    await waitFor(() => expect(chip(container)?.textContent).toContain('Brave'));
    await fireEvent.keyDown(input(container), { key: 'Tab' }); // wraps
    await waitFor(() => expect(chip(container)?.textContent).toContain('Bing'));
  });

  test('a recognized keyword does NOT auto-activate on plain Enter (searches the default)', async () => {
    suggestResults = [
      {
        id: 'websearch',
        source: 'websearch',
        title: 'Search Google for "g force"',
        url: 'https://www.google.com/search?q=g%20force',
        score: 0,
      },
    ];
    const { container } = renderHome();
    await typeQuery(input(container), 'g force');
    await waitFor(() =>
      expect(container.querySelector('[data-testid="result-row"]')).not.toBeNull(),
    );
    await fireEvent.keyDown(input(container), { key: 'Enter' });
    expect(chip(container)).toBeNull(); // never entered engine mode
    expect(lastCommand()).toEqual({
      kind: 'openUrl',
      payload: { url: 'https://www.google.com/search?q=g%20force', windowId: 100 },
    });
  });

  test('Shift+Tab on a recognized prefix does NOT activate the engine (focus traverses)', async () => {
    const { container } = renderHome();
    await typeQuery(input(container), 'yt lofi');
    const notPrevented = await fireEvent.keyDown(input(container), { key: 'Tab', shiftKey: true });
    expect(chip(container)).toBeNull(); // never entered engine mode
    expect(input(container).value).toBe('yt lofi'); // query untouched
    expect(notPrevented).toBe(true); // the event was not consumed — focus can traverse
  });

  test('clicking the chip × restores keyboard focus to the input', async () => {
    const { container } = renderHome();
    await typeQuery(input(container), 'yt lofi');
    await fireEvent.keyDown(input(container), { key: 'Tab' });
    await waitFor(() => expect(chip(container)).not.toBeNull());
    await fireEvent.click(container.querySelector('[data-testid="chip-remove"]') as HTMLElement);
    // popEngine refocuses the input once the leading slot (the × button) unmounts.
    await waitFor(() => expect(document.activeElement).toBe(input(container)));
  });

  test('engine favicons render in the chip and beside each name in the Tab hint', async () => {
    const { container } = renderHome();
    await typeQuery(input(container), 'b'); // ambiguous → Bing + Brave in the hint
    await waitFor(() =>
      expect(container.querySelector('[data-testid="newtab-engine-hint"]')).not.toBeNull(),
    );
    expect(
      container.querySelectorAll('[data-testid="newtab-engine-hint"] .engine-hint-icon').length,
    ).toBeGreaterThanOrEqual(2);
    await fireEvent.keyDown(input(container), { key: 'Tab' });
    await waitFor(() =>
      expect(
        container.querySelector('[data-testid="newtab-engine-chip"] .chip-icon'),
      ).not.toBeNull(),
    );
  });

  test('Escape clears an active engine back to the idle home', async () => {
    const { container } = renderHome();
    await typeQuery(input(container), 'yt lofi');
    await fireEvent.keyDown(input(container), { key: 'Tab' });
    await waitFor(() => expect(chip(container)).not.toBeNull());
    await fireEvent.keyDown(input(container), { key: 'Escape' });
    await waitFor(() => expect(chip(container)).toBeNull());
    expect(container.querySelector('[data-testid="newtab-name"]')?.textContent).toBe('Work');
  });
});

// The Alt+L fallback (launcher-reach) focuses an already-open new-tab via
// chrome.tabs.update — the page is NOT remounted, so the input's mount-time
// `autofocus` never re-runs. NewTab refocuses its idle-home input when the page
// is reactivated (visibilitychange → visible, or window focus), so a reused
// launcher is immediately typeable — guarded to the idle home so a mid-search
// state (locked engine / typed query) is never disturbed (design D5).
describe('NewTab (refocus on reactivation, launcher-reach)', () => {
  function input(container: HTMLElement): HTMLInputElement {
    return container.querySelector('[data-testid="newtab-search"]') as HTMLInputElement;
  }
  function chip(container: HTMLElement): HTMLElement | null {
    return container.querySelector('[data-testid="newtab-engine-chip"]');
  }
  function renderHome() {
    return render(NewTabHarness, {
      props: { windowId: 100, initialState: stateWithActiveSpace(100, WORK), engines: REGISTRY },
    });
  }
  // The refocus is deferred one requestAnimationFrame; wait two frames so a guard
  // assertion proves the guard rejected the refocus, not merely that the rAF had
  // not fired yet.
  function nextFrame(): Promise<void> {
    return new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  }

  test('reactivation (visibilitychange) refocuses the idle-home input', async () => {
    const { container } = renderHome();
    input(container).blur(); // simulate the caret left in <body> on a reused tab
    expect(document.activeElement).not.toBe(input(container));
    document.dispatchEvent(new Event('visibilitychange'));
    await waitFor(() => expect(document.activeElement).toBe(input(container)));
  });

  test('reactivation (window focus) refocuses the idle-home input', async () => {
    const { container } = renderHome();
    input(container).blur();
    window.dispatchEvent(new Event('focus'));
    await waitFor(() => expect(document.activeElement).toBe(input(container)));
  });

  test('reactivation does NOT steal focus from a locked engine', async () => {
    const { container } = renderHome();
    await typeQuery(input(container), 'yt lofi');
    await fireEvent.keyDown(input(container), { key: 'Tab' });
    await waitFor(() => expect(chip(container)).not.toBeNull());
    input(container).blur(); // user moved focus off the input mid-engine-mode
    document.dispatchEvent(new Event('visibilitychange'));
    await nextFrame();
    expect(document.activeElement).not.toBe(input(container));
  });

  test('reactivation does NOT refocus when a non-empty query was left typed', async () => {
    const { container } = renderHome();
    await typeQuery(input(container), 'hello world');
    input(container).blur();
    document.dispatchEvent(new Event('visibilitychange'));
    await nextFrame();
    expect(document.activeElement).not.toBe(input(container));
  });

  test('a visibilitychange to hidden does NOT refocus (early-return guard)', async () => {
    const { container } = renderHome();
    input(container).blur();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    try {
      document.dispatchEvent(new Event('visibilitychange'));
      await nextFrame();
      expect(document.activeElement).not.toBe(input(container));
    } finally {
      // Drop the instance shadow → access falls back to the prototype getter ('visible').
      delete (document as unknown as Record<string, unknown>).visibilityState;
    }
  });

  test('listeners are removed on unmount (no refocus, no throw after teardown)', async () => {
    const { container, unmount } = renderHome();
    const el = input(container);
    unmount();
    el.blur();
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
    await nextFrame();
    expect(document.activeElement).not.toBe(el);
  });
});
