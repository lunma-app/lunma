import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { LauncherResult } from '../shared/launcher-contract';
import { buildEngineRegistry, type SearchEngine } from '../shared/search-engines';

// Built-ins-only registry the SW would push (yt/g/bing/brave/…).
const ENGINES: SearchEngine[] = buildEngineRegistry({
  customSearchUrl: '',
  customSearchKeyword: '',
});

// The overlay attaches a CLOSED shadow root + a constructable stylesheet — both
// jsdom-hostile. Production stays faithful; the test installs seams: a
// CSSStyleSheet polyfill, attachShadow forced to `open` so we can introspect,
// a no-op scrollIntoView, and a faked chrome transport. The IIFE runs on import
// and registers a runtime.onMessage listener, so we capture it per test.

interface ChromeStub {
  runtime: {
    sendMessage: ReturnType<typeof vi.fn>;
    getURL: (p: string) => string;
    onMessage: {
      addListener: (l: MessageListener) => void;
      removeListener: ReturnType<typeof vi.fn>;
    };
  };
  storage: {
    sync: { get: ReturnType<typeof vi.fn> };
    onChanged: {
      addListener: (l: StorageListener) => void;
      removeListener: ReturnType<typeof vi.fn>;
    };
  };
}
type MessageListener = (msg: unknown) => void;
type StorageListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  area: string,
) => void;

let suggestResults: LauncherResult[] = [];
let resolvedWindowId = 55;
// Optional Space hue/chroma the faked `current-window` response carries (the SW
// resolves these from the sender tab's active Space on the keydown path).
let resolvedSpaceHue: number | undefined;
let resolvedSpaceChroma: number | undefined;
// Optional Tab-to-search registry the faked `current-window` response carries
// (the keydown path learns it here, like the hue).
let resolvedEngines: SearchEngine[] | undefined;
// When `deferSuggest` is set, the faked suggestions channel returns a pending
// promise instead of resolving immediately; `pendingSuggest()` resolves it. Used
// to drive the stale-in-flight-response race deterministically.
let deferSuggest = false;
let pendingSuggest: (() => void) | null = null;
let listener: MessageListener | undefined;
// The density (launcher-density-rows) the faked `chrome.storage.sync` reports,
// and the captured `storage.onChanged` listener for driving live changes.
let storedDensity: string | undefined;
let storageListener: StorageListener | undefined;
let chromeStub: ChromeStub;
let realAttachShadow: typeof Element.prototype.attachShadow;
// The overlay registers a capture-phase `document` keydown listener (the Alt+L
// fallback). jsdom's `document` persists across the file, so we override
// `addEventListener` to capture that handler and remove it in `afterEach` —
// otherwise stale per-test listeners accumulate and toggle stale overlays.
let realDocAdd: typeof document.addEventListener;
let globalKeydown: EventListener | undefined;
// The overlay also registers a window 'blur' listener (dismiss-on-blur). jsdom's
// window persists across the file, so capture + detach it like the keydown above.
let realWinAdd: typeof window.addEventListener;
let windowBlur: EventListener | undefined;

function installEnv(): void {
  (globalThis as unknown as { CSSStyleSheet: unknown }).CSSStyleSheet = class {
    replaceSync(): void {
      /* no-op */
    }
  };
  realAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function attachShadow(init: ShadowRootInit): ShadowRoot {
    return realAttachShadow.call(this, { ...init, mode: 'open' });
  };
  Element.prototype.scrollIntoView = vi.fn();

  // Capture the overlay's capture-phase document keydown listener so afterEach
  // can detach it (mirrors the attachShadow override above).
  globalKeydown = undefined;
  realDocAdd = document.addEventListener;
  document.addEventListener = function addEventListener(
    type: string,
    handler: EventListenerOrEventListenerObject,
    opts?: boolean | AddEventListenerOptions,
  ): void {
    if (type === 'keydown' && opts === true) globalKeydown = handler as EventListener;
    realDocAdd.call(document, type, handler, opts);
  } as typeof document.addEventListener;

  windowBlur = undefined;
  realWinAdd = window.addEventListener;
  window.addEventListener = function addEventListener(
    type: string,
    handler: EventListenerOrEventListenerObject,
    opts?: boolean | AddEventListenerOptions,
  ): void {
    if (type === 'blur') windowBlur = handler as EventListener;
    realWinAdd.call(window, type, handler, opts);
  } as typeof window.addEventListener;

  listener = undefined;
  chromeStub = {
    runtime: {
      sendMessage: vi.fn((msg: { type?: string; requestId?: string }) => {
        if (msg?.type === 'lunma/launcher-suggestions-request') {
          const respond = () => ({
            type: 'lunma/launcher-suggestions-response',
            requestId: msg.requestId,
            results: suggestResults,
          });
          if (deferSuggest) {
            return new Promise((resolve) => {
              pendingSuggest = () => resolve(respond());
            });
          }
          return Promise.resolve(respond());
        }
        if (msg?.type === 'lunma/current-window') {
          return Promise.resolve({
            type: 'lunma/current-window-result',
            windowId: resolvedWindowId,
            ...(resolvedSpaceHue !== undefined ? { spaceHue: resolvedSpaceHue } : {}),
            ...(resolvedSpaceChroma !== undefined ? { spaceChroma: resolvedSpaceChroma } : {}),
            ...(resolvedEngines !== undefined ? { engines: resolvedEngines } : {}),
          });
        }
        return Promise.resolve();
      }),
      getURL: (p: string) => `chrome-extension://test/${p}`,
      onMessage: {
        addListener: (l: MessageListener) => {
          listener = l;
        },
        removeListener: vi.fn(),
      },
    },
    // Density is read directly from chrome.storage.sync (a GLOBAL setting), so
    // the overlay needs a storage seam. `get` reports the current `storedDensity`
    // under the settings key; `onChanged` is captured to drive live changes.
    storage: {
      sync: {
        get: vi.fn(async (key: string) =>
          storedDensity === undefined ? {} : { [key]: { density: storedDensity } },
        ),
      },
      onChanged: {
        addListener: (l: StorageListener) => {
          storageListener = l;
        },
        removeListener: vi.fn(),
      },
    },
  };
  (globalThis as unknown as { chrome: ChromeStub }).chrome = chromeStub;
}

/** Import the overlay fresh so its IIFE re-runs and re-registers the listener. */
async function loadOverlay(): Promise<void> {
  delete (window as unknown as { __lunmaLauncherInstalled?: boolean }).__lunmaLauncherInstalled;
  vi.resetModules();
  await import('./overlay');
}

function host(): HTMLElement | null {
  return document.querySelector('[data-lunma-launcher]');
}
function shadow(): ShadowRoot {
  const root = host()?.shadowRoot;
  if (!root) throw new Error('overlay shadow root not found');
  return root;
}
function overlayInput(): HTMLInputElement {
  return shadow().querySelector('.input') as HTMLInputElement;
}
function rows(): HTMLButtonElement[] {
  return Array.from(shadow().querySelectorAll('.row'));
}
function openOverlay(windowId = 100): void {
  listener?.({ type: 'lunma/toggle-launcher', windowId });
}
function openOverlayWithEngines(engines: SearchEngine[], windowId = 100): void {
  listener?.({ type: 'lunma/toggle-launcher', windowId, engines });
}
function chip(): HTMLElement | null {
  return shadow().querySelector('.chip');
}
function chipVisible(): boolean {
  const c = chip();
  return c !== null && c.style.display !== 'none';
}
function hintVisible(): boolean {
  const h = shadow().querySelector('.hint') as HTMLElement | null;
  return h !== null && h.style.display !== 'none';
}
function hintText(): string {
  return shadow().querySelector('.hint')?.textContent ?? '';
}
/** Set the input value + fire the input event (drives the hint + engine mode). */
function typeRaw(value: string): void {
  const i = overlayInput();
  i.value = value;
  i.dispatchEvent(new Event('input'));
}
async function typeAndAwaitRows(value: string, count: number): Promise<void> {
  const input = overlayInput();
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await vi.waitFor(() => expect(rows()).toHaveLength(count));
}
function key(k: string): void {
  overlayInput().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
}
/** Dispatch a page-level keydown (for the Alt+L capture-phase fallback). The
 * `target` defaults to `document.body`; pass an editable element to exercise the
 * editable-field guard. */
function dispatchKey(init: KeyboardEventInit, target: EventTarget = document.body): void {
  (target as Element).dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }),
  );
}
/** The most recent bus command the overlay dispatched. */
function lastCommand(): { kind: string; payload: Record<string, unknown> } | undefined {
  const cmds = chromeStub.runtime.sendMessage.mock.calls
    .map((c) => c[0] as { type?: string; cmd?: { kind: string; payload: Record<string, unknown> } })
    .filter((m) => m?.type === 'lunma/command');
  return cmds.at(-1)?.cmd;
}

beforeEach(() => {
  suggestResults = [];
  resolvedWindowId = 55;
  resolvedSpaceHue = undefined;
  resolvedSpaceChroma = undefined;
  resolvedEngines = undefined;
  deferSuggest = false;
  pendingSuggest = null;
  storedDensity = undefined;
  storageListener = undefined;
  installEnv();
});

afterEach(() => {
  for (const h of document.querySelectorAll('[data-lunma-launcher]')) h.remove();
  if (globalKeydown) document.removeEventListener('keydown', globalKeydown, true);
  globalKeydown = undefined;
  document.addEventListener = realDocAdd;
  if (windowBlur) window.removeEventListener('blur', windowBlur);
  windowBlur = undefined;
  window.addEventListener = realWinAdd;
  Element.prototype.attachShadow = realAttachShadow;
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
  vi.restoreAllMocks();
});

describe('Alt+L overlay', () => {
  test('toggle opens then closes the overlay', async () => {
    await loadOverlay();
    expect(host()).toBeNull(); // dormant until toggled
    openOverlay();
    expect(host()).not.toBeNull();
    expect(overlayInput()).not.toBeNull();
    openOverlay(); // toggle again
    expect(host()).toBeNull();
  });

  test('typing queries the suggestions channel and renders rows', async () => {
    suggestResults = [
      { id: 'tab:1', source: 'tab', title: 'One', url: 'https://one/', score: 3, tabId: 1 },
      { id: 'bookmark:b', source: 'bookmark', title: 'Book', url: 'https://book/', score: 2 },
    ];
    await loadOverlay();
    openOverlay(100);
    await typeAndAwaitRows('o', 2);
    expect(chromeStub.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'lunma/launcher-suggestions-request', windowId: 100 }),
    );
    expect(shadow().querySelector('.badge')?.textContent).toBe('tab');
  });

  test('Enter on a tab result dispatches focusTab and closes', async () => {
    suggestResults = [
      { id: 'tab:9', source: 'tab', title: 'Nine', url: 'https://nine/', score: 3, tabId: 9 },
    ];
    await loadOverlay();
    openOverlay();
    await typeAndAwaitRows('n', 1);
    key('Enter');
    expect(lastCommand()).toEqual({ kind: 'focusTab', payload: { tabId: 9 } });
    expect(host()).toBeNull(); // closes after acting
  });

  test('ArrowDown + Enter on a bookmark dispatches openUrl in the window', async () => {
    suggestResults = [
      { id: 'tab:1', source: 'tab', title: 'One', url: 'https://one/', score: 3, tabId: 1 },
      { id: 'bookmark:b', source: 'bookmark', title: 'Book', url: 'https://book/', score: 2 },
    ];
    await loadOverlay();
    openOverlay(77);
    await typeAndAwaitRows('b', 2);
    key('ArrowDown');
    key('Enter');
    expect(lastCommand()).toEqual({
      kind: 'openUrl',
      payload: { url: 'https://book/', windowId: 77 },
    });
  });

  test('a bound saved result dispatches focusSavedTab; a dormant one openSavedTab', async () => {
    suggestResults = [
      {
        id: 'saved:s1',
        source: 'saved',
        title: 'Bound',
        url: 'https://b/',
        score: 3,
        savedTabId: 's1',
        tabId: 5,
      },
    ];
    await loadOverlay();
    openOverlay();
    await typeAndAwaitRows('b', 1);
    key('Enter');
    expect(lastCommand()).toEqual({
      kind: 'focusSavedTab',
      payload: { savedTabId: 's1', windowId: 100 },
    });

    suggestResults = [
      {
        id: 'saved:s2',
        source: 'saved',
        title: 'Dormant',
        url: 'https://d/',
        score: 3,
        savedTabId: 's2',
      },
    ];
    openOverlay(100); // reopen
    await typeAndAwaitRows('d', 1);
    key('Enter');
    expect(lastCommand()).toEqual({
      kind: 'openSavedTab',
      payload: { savedTabId: 's2', windowId: 100 },
    });
  });

  test('a websearch action row renders a "search" badge and Enter opens its url', async () => {
    suggestResults = [
      {
        id: 'websearch',
        source: 'websearch',
        title: 'Search Google for "react hooks"',
        url: 'https://www.google.com/search?q=react%20hooks',
        score: 0,
      },
    ];
    await loadOverlay();
    openOverlay(100);
    await typeAndAwaitRows('react hooks', 1);
    expect(shadow().querySelector('.badge')?.textContent).toBe('search');
    key('Enter');
    expect(lastCommand()).toEqual({
      kind: 'openUrl',
      payload: { url: 'https://www.google.com/search?q=react%20hooks', windowId: 100 },
    });
  });

  test('a navigate action row renders an "open" badge and Enter opens its url', async () => {
    suggestResults = [
      {
        id: 'navigate',
        source: 'navigate',
        title: 'Go to react.dev',
        url: 'https://react.dev',
        score: 0,
      },
    ];
    await loadOverlay();
    openOverlay(100);
    await typeAndAwaitRows('react.dev', 1);
    expect(shadow().querySelector('.badge')?.textContent).toBe('open');
    key('Enter');
    expect(lastCommand()).toEqual({
      kind: 'openUrl',
      payload: { url: 'https://react.dev', windowId: 100 },
    });
  });

  test('keys typed in the open overlay do not leak to host-page keyboard handlers', async () => {
    const leaked: string[] = [];
    const onDocKeydown = (e: Event): void => {
      leaked.push((e as KeyboardEvent).key);
    };
    document.addEventListener('keydown', onDocKeydown);
    try {
      await loadOverlay();
      openOverlay(100);
      // Sanity: a page-level keydown IS seen by a document (bubble) handler.
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      expect(leaked).toContain('a');
      leaked.length = 0;
      // A single-key shortcut char typed into the launcher must NOT reach the
      // page handler (the overlay swallows it at its root so a host app's "q"/"b"
      // shortcut can't fire and can't preventDefault the character).
      const input = overlayInput();
      input.value = 'q';
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'q', bubbles: true, composed: true }),
      );
      expect(leaked).not.toContain('q');
    } finally {
      document.removeEventListener('keydown', onDocKeydown);
    }
  });

  test('Escape closes the overlay', async () => {
    suggestResults = [
      { id: 'tab:1', source: 'tab', title: 'One', url: 'https://one/', score: 3, tabId: 1 },
    ];
    await loadOverlay();
    openOverlay();
    await typeAndAwaitRows('o', 1);
    key('Escape');
    expect(host()).toBeNull();
  });
});

describe('Alt+L keydown fallback', () => {
  test('Alt+L toggles the overlay open then closed without the command path', async () => {
    await loadOverlay();
    expect(host()).toBeNull(); // dormant; no toggle-launcher command sent
    dispatchKey({ code: 'KeyL', altKey: true });
    expect(host()).not.toBeNull();
    dispatchKey({ code: 'KeyL', altKey: true });
    expect(host()).toBeNull();
  });

  test('keydown-open requests the current window id from the SW', async () => {
    await loadOverlay();
    dispatchKey({ code: 'KeyL', altKey: true });
    expect(chromeStub.runtime.sendMessage).toHaveBeenCalledWith({ type: 'lunma/current-window' });
  });

  test('the resolved window id scopes the suggestions query', async () => {
    resolvedWindowId = 321;
    suggestResults = [
      { id: 'tab:1', source: 'tab', title: 'One', url: 'https://one/', score: 3, tabId: 1 },
    ];
    await loadOverlay();
    dispatchKey({ code: 'KeyL', altKey: true });
    await typeAndAwaitRows('o', 1);
    expect(chromeStub.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'lunma/launcher-suggestions-request', windowId: 321 }),
    );
  });

  test('Alt+L is ignored while closed and focus is in a page editable field', async () => {
    await loadOverlay();
    const field = document.createElement('input');
    document.body.appendChild(field);
    dispatchKey({ code: 'KeyL', altKey: true }, field);
    expect(host()).toBeNull(); // the page kept the key
    field.remove();
  });

  test('Alt+L still closes the overlay when open even with editable focus', async () => {
    await loadOverlay();
    dispatchKey({ code: 'KeyL', altKey: true }); // open
    expect(host()).not.toBeNull();
    const field = document.createElement('input');
    document.body.appendChild(field);
    dispatchKey({ code: 'KeyL', altKey: true }, field); // guard applies only when closed
    expect(host()).toBeNull();
    field.remove();
  });

  test('plain L and Ctrl/Meta+Alt+L do not toggle', async () => {
    await loadOverlay();
    dispatchKey({ code: 'KeyL' }); // no Alt
    dispatchKey({ code: 'KeyL', altKey: true, ctrlKey: true });
    dispatchKey({ code: 'KeyL', altKey: true, metaKey: true });
    expect(host()).toBeNull();
  });
});

describe('Alt+L overlay — active-Space tint', () => {
  test('tints in the active Space canonical OKLCH the SW provides on the open message', async () => {
    await loadOverlay();
    listener?.({
      type: 'lunma/toggle-launcher',
      windowId: 100,
      spaceHue: 252,
      spaceChroma: 0.16,
      spaceL: 0.55,
    });
    // --space-h / --space-chroma / --space-l cross the shadow boundary; the
    // canonical-triple --accent / --accent-soft / card wash recolour from them so
    // the overlay reads the Space's TRUE colour, not a flat lightness.
    expect(host()?.style.getPropertyValue('--space-h')).toBe('252');
    expect(host()?.style.getPropertyValue('--space-chroma')).toBe('0.16');
    expect(host()?.style.getPropertyValue('--space-l')).toBe('0.55');
  });

  test('falls back to the default accent (no hue set) when the SW provides none', async () => {
    await loadOverlay();
    openOverlay(100); // no spaceHue/spaceChroma — e.g. no active Space or a gray one
    expect(host()?.style.getPropertyValue('--space-h')).toBe('');
    expect(host()?.style.getPropertyValue('--space-chroma')).toBe('');
  });

  test('clears a previous Space hue when reopened without one', async () => {
    await loadOverlay();
    listener?.({ type: 'lunma/toggle-launcher', windowId: 100, spaceHue: 250, spaceChroma: 0.15 });
    expect(host()?.style.getPropertyValue('--space-h')).toBe('250');
    listener?.({ type: 'lunma/toggle-launcher', windowId: 100 }); // toggle closed
    expect(host()).toBeNull();
    listener?.({ type: 'lunma/toggle-launcher', windowId: 100 }); // reopen, no hue
    expect(host()?.style.getPropertyValue('--space-h')).toBe('');
    expect(host()?.style.getPropertyValue('--space-chroma')).toBe('');
  });

  test('the keydown-opened overlay tints from the current-window response', async () => {
    resolvedSpaceHue = 330;
    resolvedSpaceChroma = 0.15;
    await loadOverlay();
    dispatchKey({ code: 'KeyL', altKey: true }); // opens; resolves window + hue async
    await vi.waitFor(() => expect(host()?.style.getPropertyValue('--space-h')).toBe('330'));
    expect(host()?.style.getPropertyValue('--space-chroma')).toBe('0.15');
  });
});

describe('Alt+L overlay — Tab-to-search', () => {
  test('a recognized keyword prefix shows the "⇥ Tab" hint, no chip yet', async () => {
    await loadOverlay();
    openOverlayWithEngines(ENGINES, 100);
    typeRaw('yt');
    expect(hintVisible()).toBe(true);
    expect(hintText()).toContain('YouTube');
    expect(chipVisible()).toBe(false);
  });

  test('Tab activates the engine: chip + single engine-mode row from the remainder', async () => {
    await loadOverlay();
    openOverlayWithEngines(ENGINES, 100);
    typeRaw('yt lofi');
    key('Tab');
    expect(chipVisible()).toBe(true);
    expect(shadow().querySelector('.chip-label')?.textContent).toBe('YouTube');
    expect(overlayInput().value).toBe('lofi');
    const rowsEls = rows();
    expect(rowsEls).toHaveLength(1);
    expect(rowsEls[0]?.querySelector('.title')?.textContent).toBe('Search YouTube for "lofi"');
  });

  test('Enter in engine mode opens the engine search URL and closes', async () => {
    await loadOverlay();
    openOverlayWithEngines(ENGINES, 100);
    typeRaw('yt lofi');
    key('Tab');
    key('Enter');
    expect(lastCommand()).toEqual({
      kind: 'openUrl',
      payload: { url: 'https://www.youtube.com/results?search_query=lofi', windowId: 100 },
    });
    expect(host()).toBeNull(); // closes after acting
  });

  test('engine mode never queries the suggestions channel (single local row)', async () => {
    suggestResults = [
      { id: 'tab:1', source: 'tab', title: 'One', url: 'https://one/', score: 3, tabId: 1 },
    ];
    await loadOverlay();
    openOverlayWithEngines(ENGINES, 100);
    typeRaw('yt lofi');
    key('Tab');
    const rowsEls = rows();
    expect(rowsEls).toHaveLength(1);
    expect(rowsEls[0]?.querySelector('.title')?.textContent).toBe('Search YouTube for "lofi"');
  });

  test('a bare keyword + Tab shows the chip with no action row (empty query)', async () => {
    await loadOverlay();
    openOverlayWithEngines(ENGINES, 100);
    typeRaw('yt');
    key('Tab');
    expect(chipVisible()).toBe(true);
    expect(rows()).toHaveLength(0);
  });

  test('Backspace on an empty engine-mode query pops the chip', async () => {
    await loadOverlay();
    openOverlayWithEngines(ENGINES, 100);
    typeRaw('yt');
    key('Tab');
    expect(chipVisible()).toBe(true);
    // input is now empty (bare keyword) — Backspace pops.
    key('Backspace');
    expect(chipVisible()).toBe(false);
  });

  test('the chip × control pops the engine', async () => {
    await loadOverlay();
    openOverlayWithEngines(ENGINES, 100);
    typeRaw('yt lofi');
    key('Tab');
    expect(chipVisible()).toBe(true);
    (shadow().querySelector('.chip-remove') as HTMLElement).dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
    );
    expect(chipVisible()).toBe(false);
  });

  test('an ambiguous prefix cycles engines on repeated Tab', async () => {
    await loadOverlay();
    openOverlayWithEngines(ENGINES, 100);
    typeRaw('b'); // prefix of Bing AND Brave
    key('Tab');
    expect(shadow().querySelector('.chip-label')?.textContent).toBe('Bing');
    key('Tab');
    expect(shadow().querySelector('.chip-label')?.textContent).toBe('Brave');
    key('Tab'); // wraps
    expect(shadow().querySelector('.chip-label')?.textContent).toBe('Bing');
  });

  test('without a recognized keyword Tab does not enter engine mode', async () => {
    await loadOverlay();
    openOverlayWithEngines(ENGINES, 100);
    typeRaw('react hooks');
    key('Tab');
    expect(chipVisible()).toBe(false);
  });

  test('a reopened overlay starts clean (no stale engine)', async () => {
    await loadOverlay();
    openOverlayWithEngines(ENGINES, 100);
    typeRaw('yt');
    key('Tab');
    expect(chipVisible()).toBe(true);
    openOverlayWithEngines(ENGINES, 100); // toggle closed
    expect(host()).toBeNull();
    openOverlayWithEngines(ENGINES, 100); // reopen
    expect(chipVisible()).toBe(false);
  });

  test('Shift+Tab on a recognized prefix does NOT activate the engine (focus traverses)', async () => {
    await loadOverlay();
    openOverlayWithEngines(ENGINES, 100);
    typeRaw('yt lofi');
    overlayInput().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }),
    );
    expect(chipVisible()).toBe(false); // never entered engine mode
    expect(overlayInput().value).toBe('yt lofi'); // untouched
  });

  test('a stale in-flight default-mode response does not clobber the engine-mode row', async () => {
    // A suggestions request is left pending; locking an engine via Tab must
    // invalidate it so the late response cannot overwrite the engine row.
    deferSuggest = true;
    suggestResults = [
      { id: 'tab:1', source: 'tab', title: 'Stale tab', url: 'https://one/', score: 3, tabId: 1 },
    ];
    await loadOverlay();
    openOverlayWithEngines(ENGINES, 100);
    typeRaw('yt lofi'); // schedules a debounced default-mode runQuery
    await vi.waitFor(() => expect(pendingSuggest).not.toBeNull()); // request in-flight
    key('Tab'); // lock YouTube — bumps `latest`, builds the engine row
    expect(shadow().querySelector('.chip-label')?.textContent).toBe('YouTube');
    pendingSuggest?.(); // the stale 're' response lands now
    await Promise.resolve();
    await Promise.resolve();
    // The single engine row stands; the stale default-mode tab row is dropped.
    const rowsEls = rows();
    expect(rowsEls).toHaveLength(1);
    expect(rowsEls[0]?.querySelector('.title')?.textContent).toBe('Search YouTube for "lofi"');
  });

  test('engine favicons render in the chip and beside each name in the Tab hint', async () => {
    await loadOverlay();
    openOverlayWithEngines(ENGINES, 100);
    typeRaw('b'); // ambiguous → Bing + Brave with icons
    expect(shadow().querySelectorAll('.hint .hint-icon').length).toBeGreaterThanOrEqual(2);
    key('Tab');
    const icon = shadow().querySelector('.chip .chip-icon') as HTMLImageElement;
    expect(icon).not.toBeNull();
    expect(icon.getAttribute('src')).toContain('_favicon');
  });

  test('the keydown-opened overlay learns the registry from the current-window response', async () => {
    resolvedEngines = ENGINES;
    await loadOverlay();
    dispatchKey({ code: 'KeyL', altKey: true }); // opens; registry resolves async
    typeRaw('yt');
    await vi.waitFor(() => expect(hintVisible()).toBe(true));
    expect(hintText()).toContain('YouTube');
    key('Tab');
    expect(chipVisible()).toBe(true);
    expect(shadow().querySelector('.chip-label')?.textContent).toBe('YouTube');
  });
});

describe('Alt+L overlay — density', () => {
  test('reads lunma.settings.density and applies Comfort to the host', async () => {
    storedDensity = 'comfort';
    await loadOverlay();
    openOverlay(100);
    // The read is async (lazy on first open); the host picks up the attribute
    // once it resolves. The settings key is read directly from sync storage.
    await vi.waitFor(() => expect(host()?.dataset.density).toBe('comfort'));
    expect(chromeStub.storage.sync.get).toHaveBeenCalledWith('lunma.settings');
  });

  test('Normal density leaves the host without a data-density attribute', async () => {
    storedDensity = 'normal';
    await loadOverlay();
    openOverlay(100);
    // Normal is the token default → no attribute, before or after the read.
    expect(host()?.dataset.density).toBeUndefined();
    await vi.waitFor(() =>
      expect(chromeStub.storage.sync.get).toHaveBeenCalledWith('lunma.settings'),
    );
    expect(host()?.dataset.density).toBeUndefined();
  });

  test('a live density change updates the host (storage.onChanged)', async () => {
    storedDensity = 'comfort';
    await loadOverlay();
    openOverlay(100);
    await vi.waitFor(() => expect(host()?.dataset.density).toBe('comfort'));
    // The user switches to Normal in the options page → a sync storage change
    // clears the attribute without reopening.
    storageListener?.({ 'lunma.settings': { newValue: { density: 'normal' } } }, 'sync');
    expect(host()?.dataset.density).toBeUndefined();
    // …and back to Comfort re-applies it.
    storageListener?.({ 'lunma.settings': { newValue: { density: 'comfort' } } }, 'sync');
    expect(host()?.dataset.density).toBe('comfort');
  });

  test('a malformed stored density falls back to Normal (no attribute)', async () => {
    storedDensity = 'roomy'; // not one of compact|normal|comfort
    await loadOverlay();
    openOverlay(100);
    await vi.waitFor(() =>
      expect(chromeStub.storage.sync.get).toHaveBeenCalledWith('lunma.settings'),
    );
    expect(host()?.dataset.density).toBeUndefined();
  });
});

describe('overlay dismiss-on-blur (launcher-sidebar-focus-reach)', () => {
  test('shouldDismissOnFocusOut: dismiss only when focus left the overlay', async () => {
    await loadOverlay();
    const { shouldDismissOnFocusOut } = await import('./overlay');
    const h = document.createElement('div');
    const child = document.createElement('button');
    h.appendChild(child);
    const outside = document.createElement('div');
    // Focus left the overlay → dismiss.
    expect(shouldDismissOnFocusOut(h, null)).toBe(true);
    expect(shouldDismissOnFocusOut(h, outside)).toBe(true);
    // Stayed within (the closed-shadow retarget produces the host itself) → keep.
    expect(shouldDismissOnFocusOut(h, h)).toBe(false);
    expect(shouldDismissOnFocusOut(h, child)).toBe(false);
    // No overlay built → never dismiss.
    expect(shouldDismissOnFocusOut(null, outside)).toBe(false);
  });

  test('window blur dismisses the open overlay', async () => {
    await loadOverlay();
    openOverlay();
    expect(host()).not.toBeNull();
    window.dispatchEvent(new Event('blur'));
    expect(host()).toBeNull();
  });

  test('a focusout that leaves the overlay dismisses it', async () => {
    await loadOverlay();
    openOverlay();
    const h = host();
    expect(h).not.toBeNull();
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    h?.dispatchEvent(new FocusEvent('focusout', { relatedTarget: outside, bubbles: true }));
    expect(host()).toBeNull();
    outside.remove();
  });

  test('the never-got-focus guard does not self-close a normally focused overlay', async () => {
    await loadOverlay();
    openOverlay();
    expect(host()).not.toBeNull();
    // Two animation frames: the input received focus, so the guard keeps it open.
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r(undefined))),
    );
    expect(host()).not.toBeNull();
  });
});
