import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  reportSidebarFocus,
  requestNewTabLauncher,
  requestStateSnapshot,
  respondWithCurrentWindow,
  respondWithStateSnapshot,
} from './messages';
import { createInitialState } from './store.svelte';
import type { AppState } from './types';

interface ChromeStub {
  runtime: {
    sendMessage: ReturnType<typeof vi.fn>;
    onMessage: {
      addListener: ReturnType<typeof vi.fn>;
      removeListener: ReturnType<typeof vi.fn>;
    };
  };
}

function installChromeStub(): {
  chrome: ChromeStub;
  deliver: (
    msg: unknown,
    sender?: chrome.runtime.MessageSender,
    sendResponse?: (r: unknown) => void,
  ) => unknown;
} {
  let registered: ((raw: unknown, sender: unknown, send: unknown) => unknown) | null = null;
  const chromeStub: ChromeStub = {
    runtime: {
      sendMessage: vi.fn(() => Promise.resolve()),
      onMessage: {
        addListener: vi.fn((l: typeof registered) => {
          registered = l;
        }),
        removeListener: vi.fn(),
      },
    },
  };
  (globalThis as unknown as { chrome: ChromeStub }).chrome = chromeStub;
  return {
    chrome: chromeStub,
    deliver: (msg, sender, sendResponse) =>
      registered?.(msg, sender ?? {}, sendResponse ?? (() => undefined)),
  };
}

describe('requestStateSnapshot', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('resolves with state from lunma/state-snapshot response', async () => {
    const { chrome } = installChromeStub();
    const state: AppState = createInitialState();
    chrome.runtime.sendMessage.mockResolvedValueOnce({
      type: 'lunma/state-snapshot',
      state,
    });
    const result = await requestStateSnapshot();
    expect(result).toEqual(state);
  });

  test('rejects with descriptive Error on transport failure', async () => {
    const { chrome } = installChromeStub();
    chrome.runtime.sendMessage.mockRejectedValueOnce(new Error('disconnected'));
    await expect(requestStateSnapshot()).rejects.toThrow(/transport failure.*disconnected/);
  });

  test('rejects on malformed response', async () => {
    const { chrome } = installChromeStub();
    chrome.runtime.sendMessage.mockResolvedValueOnce({ type: 'wrong' });
    await expect(requestStateSnapshot()).rejects.toThrow(/malformed response/);
  });
});

describe('respondWithStateSnapshot', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('responds with handler output for lunma/state-request', () => {
    const { deliver } = installChromeStub();
    const state = createInitialState();
    respondWithStateSnapshot(() => state);
    const sendResponse = vi.fn();
    deliver({ type: 'lunma/state-request' }, undefined, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith({ type: 'lunma/state-snapshot', state });
  });

  test('ignores non-state-request messages', () => {
    const { deliver } = installChromeStub();
    const handler = vi.fn(() => createInitialState());
    respondWithStateSnapshot(handler);
    const sendResponse = vi.fn();
    deliver(
      { type: 'lunma/state-broadcast', method: 'x', state: createInitialState() },
      undefined,
      sendResponse,
    );
    expect(handler).not.toHaveBeenCalled();
    expect(sendResponse).not.toHaveBeenCalled();
  });

  test('ignores non-object messages', () => {
    const { deliver } = installChromeStub();
    const handler = vi.fn(() => createInitialState());
    respondWithStateSnapshot(handler);
    deliver(null);
    deliver('string');
    expect(handler).not.toHaveBeenCalled();
  });

  test('unregister removes the listener', () => {
    const { chrome } = installChromeStub();
    const unregister = respondWithStateSnapshot(() => createInitialState());
    unregister();
    expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalledTimes(1);
  });
});

describe('respondWithCurrentWindow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('responds with the sender tab window id for lunma/current-window', () => {
    const { deliver } = installChromeStub();
    respondWithCurrentWindow();
    const sendResponse = vi.fn();
    const result = deliver(
      { type: 'lunma/current-window' },
      { tab: { windowId: 42 } } as chrome.runtime.MessageSender,
      sendResponse,
    );
    // Synchronous response — reads sender only, never awaits.
    expect(result).toBe(false);
    expect(sendResponse).toHaveBeenCalledWith({
      type: 'lunma/current-window-result',
      windowId: 42,
    });
  });

  test('responds with -1 when the sender has no tab', () => {
    const { deliver } = installChromeStub();
    respondWithCurrentWindow();
    const sendResponse = vi.fn();
    deliver({ type: 'lunma/current-window' }, {} as chrome.runtime.MessageSender, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith({
      type: 'lunma/current-window-result',
      windowId: -1,
    });
  });

  test("carries the resolver's Space canonical OKLCH alongside the window id", () => {
    const { deliver } = installChromeStub();
    const resolveTint = vi.fn(() => ({ hue: 252, chroma: 0.16, l: 0.55 }));
    respondWithCurrentWindow(resolveTint);
    const sendResponse = vi.fn();
    deliver(
      { type: 'lunma/current-window' },
      { tab: { windowId: 42 } } as chrome.runtime.MessageSender,
      sendResponse,
    );
    expect(resolveTint).toHaveBeenCalledWith(42);
    expect(sendResponse).toHaveBeenCalledWith({
      type: 'lunma/current-window-result',
      windowId: 42,
      spaceHue: 252,
      spaceChroma: 0.16,
      spaceL: 0.55,
    });
  });

  test('omits hue/chroma when the resolver returns null (no active / neutral Space)', () => {
    const { deliver } = installChromeStub();
    const resolveTint = vi.fn(() => null);
    respondWithCurrentWindow(resolveTint);
    const sendResponse = vi.fn();
    deliver(
      { type: 'lunma/current-window' },
      { tab: { windowId: 7 } } as chrome.runtime.MessageSender,
      sendResponse,
    );
    expect(resolveTint).toHaveBeenCalledWith(7);
    expect(sendResponse).toHaveBeenCalledWith({
      type: 'lunma/current-window-result',
      windowId: 7,
    });
  });

  test('does not consult the resolver when the sender has no tab (windowId -1)', () => {
    const { deliver } = installChromeStub();
    const resolveTint = vi.fn(() => ({ hue: 252, chroma: 0.16, l: 0.55 }));
    respondWithCurrentWindow(resolveTint);
    const sendResponse = vi.fn();
    deliver({ type: 'lunma/current-window' }, {} as chrome.runtime.MessageSender, sendResponse);
    expect(resolveTint).not.toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({
      type: 'lunma/current-window-result',
      windowId: -1,
    });
  });

  test('ignores non-current-window messages', () => {
    const { deliver } = installChromeStub();
    respondWithCurrentWindow();
    const sendResponse = vi.fn();
    deliver({ type: 'lunma/state-request' }, undefined, sendResponse);
    expect(sendResponse).not.toHaveBeenCalled();
  });

  const ENGINES = [
    { id: 'google', name: 'Google', keyword: 'g', urlTemplate: 'https://g/?q=%s' },
    { id: 'youtube', name: 'YouTube', keyword: 'yt', urlTemplate: 'https://yt/?q=%s' },
  ];

  test('carries the Tab-to-search registry (async) when an engines resolver is provided', async () => {
    const { deliver } = installChromeStub();
    const resolveEngines = vi.fn(() => Promise.resolve(ENGINES));
    respondWithCurrentWindow(undefined, resolveEngines);
    const sendResponse = vi.fn();
    const result = deliver(
      { type: 'lunma/current-window' },
      { tab: { windowId: 9 } } as chrome.runtime.MessageSender,
      sendResponse,
    );
    // The engines source is async (a settings read) — the channel is kept open.
    expect(result).toBe(true);
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
    expect(sendResponse).toHaveBeenCalledWith({
      type: 'lunma/current-window-result',
      windowId: 9,
      engines: ENGINES,
    });
  });

  test('omits the registry when the engines resolver yields an empty list', async () => {
    const { deliver } = installChromeStub();
    const resolveEngines = vi.fn(() => Promise.resolve([]));
    respondWithCurrentWindow(undefined, resolveEngines);
    const sendResponse = vi.fn();
    deliver(
      { type: 'lunma/current-window' },
      { tab: { windowId: 9 } } as chrome.runtime.MessageSender,
      sendResponse,
    );
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
    expect(sendResponse).toHaveBeenCalledWith({
      type: 'lunma/current-window-result',
      windowId: 9,
    });
  });

  test('carries the Space tint and the engine registry together', async () => {
    const { deliver } = installChromeStub();
    const resolveTint = vi.fn(() => ({ hue: 252, chroma: 0.16, l: 0.55 }));
    const resolveEngines = vi.fn(() => Promise.resolve(ENGINES));
    respondWithCurrentWindow(resolveTint, resolveEngines);
    const sendResponse = vi.fn();
    deliver(
      { type: 'lunma/current-window' },
      { tab: { windowId: 9 } } as chrome.runtime.MessageSender,
      sendResponse,
    );
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
    expect(sendResponse).toHaveBeenCalledWith({
      type: 'lunma/current-window-result',
      windowId: 9,
      spaceHue: 252,
      spaceChroma: 0.16,
      spaceL: 0.55,
      engines: ENGINES,
    });
  });

  test('still replies (registry omitted) when the engines resolver rejects', async () => {
    const { deliver } = installChromeStub();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const resolveEngines = vi.fn(() => Promise.reject(new Error('settings unavailable')));
    respondWithCurrentWindow(undefined, resolveEngines);
    const sendResponse = vi.fn();
    deliver(
      { type: 'lunma/current-window' },
      { tab: { windowId: 9 } } as chrome.runtime.MessageSender,
      sendResponse,
    );
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
    expect(sendResponse).toHaveBeenCalledWith({
      type: 'lunma/current-window-result',
      windowId: 9,
    });
  });

  test('unregister removes the listener', () => {
    const { chrome } = installChromeStub();
    const unregister = respondWithCurrentWindow();
    unregister();
    expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalledTimes(1);
  });
});

describe('sidebar → SW fire-and-forget senders (launcher-sidebar-focus-reach)', () => {
  test('reportSidebarFocus sends the panel focus state keyed by window', () => {
    const { chrome } = installChromeStub();
    reportSidebarFocus(7, true);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'lunma/sidebar-focus',
      windowId: 7,
      focused: true,
    });
    reportSidebarFocus(7, false);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'lunma/sidebar-focus',
      windowId: 7,
      focused: false,
    });
  });

  test('requestNewTabLauncher asks the SW to open the launcher in the window', () => {
    const { chrome } = installChromeStub();
    requestNewTabLauncher(9);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'lunma/open-newtab-launcher',
      windowId: 9,
    });
  });

  test('a "Receiving end does not exist" rejection is swallowed (SW asleep)', async () => {
    const { chrome } = installChromeStub();
    chrome.runtime.sendMessage.mockRejectedValueOnce(new Error('Receiving end does not exist'));
    expect(() => reportSidebarFocus(1, true)).not.toThrow();
    await Promise.resolve(); // let the handled rejection settle
  });
});
