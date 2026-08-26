import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TAB_TOKEN_KEY } from '../shared/provenance';

/** Install a sessionStorage spy that records EVERY interaction, so "no read and
 * no write while provenance is off" is observable rather than asserted. */
function spyStorage() {
  const calls: string[] = [];
  const store = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => {
      calls.push(`get:${k}`);
      return store.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      calls.push(`set:${k}`);
      store.set(k, v);
    },
    removeItem: (k: string) => {
      calls.push(`remove:${k}`);
      store.delete(k);
    },
  });
  return { calls, store };
}

let listener: ((msg: unknown) => void) | undefined;
const sendMessage = vi.fn();

async function loadScript(): Promise<void> {
  listener = undefined;
  vi.stubGlobal('chrome', {
    runtime: {
      onMessage: {
        addListener: (fn: (msg: unknown) => void) => {
          listener = fn;
        },
      },
      sendMessage,
    },
  });
  vi.resetModules();
  await import('./tab-token');
}

describe('tab-token content script', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    sendMessage.mockReset();
    delete (window as unknown as { __lunmaTokenInstalled?: boolean }).__lunmaTokenInstalled;
  });

  test('touches sessionStorage NOT AT ALL until the SW messages it', async () => {
    const { calls } = spyStorage();
    await loadScript();
    expect(listener).toBeDefined();
    // Loading alone must not read or write — a user who never enables provenance
    // is indistinguishable, from the page's view, from one without the feature.
    expect(calls).toEqual([]);
  });

  test('an unrelated message still touches nothing', async () => {
    const { calls } = spyStorage();
    await loadScript();
    listener?.({ type: 'lunma/boundary-config', allow: null });
    expect(calls).toEqual([]);
  });

  test('a page carrying a token keeps it and reports it, discarding the candidate', async () => {
    const { store } = spyStorage();
    store.set(TAB_TOKEN_KEY, 'ORIGINAL');
    await loadScript();
    listener?.({ type: 'lunma/provenance-sync', token: 'CANDIDATE' });
    expect(store.get(TAB_TOKEN_KEY)).toBe('ORIGINAL');
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'lunma/provenance-token',
      token: 'ORIGINAL',
    });
  });

  test('a page with no token takes the candidate and reports it', async () => {
    const { store } = spyStorage();
    await loadScript();
    listener?.({ type: 'lunma/provenance-sync', token: 'CANDIDATE' });
    expect(store.get(TAB_TOKEN_KEY)).toBe('CANDIDATE');
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'lunma/provenance-token',
      token: 'CANDIDATE',
    });
  });

  test('clear removes the marker', async () => {
    const { store, calls } = spyStorage();
    store.set(TAB_TOKEN_KEY, 'ORIGINAL');
    await loadScript();
    listener?.({ type: 'lunma/provenance-clear' });
    expect(store.has(TAB_TOKEN_KEY)).toBe(false);
    expect(calls).toContain(`remove:${TAB_TOKEN_KEY}`);
  });

  test('never mints its own token', async () => {
    const { store } = spyStorage();
    await loadScript();
    listener?.({ type: 'lunma/provenance-sync' }); // malformed: no token
    expect(store.size).toBe(0);
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
