import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import { registerStateSnapshotHandler } from './state-snapshot-handler';

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
  deliver: (msg: unknown, send?: (r: unknown) => void) => unknown;
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
    deliver: (msg, sendResponse) => registered?.(msg, {}, sendResponse ?? (() => undefined)),
  };
}

describe('registerStateSnapshotHandler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('responds with store.snapshot() for lunma/state-request', () => {
    const { deliver } = installChromeStub();
    const store = new LunmaStore({ idFactory: () => 'id-1' });
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    registerStateSnapshotHandler(store);
    const sendResponse = vi.fn();
    deliver({ type: 'lunma/state-request' }, sendResponse);
    expect(sendResponse).toHaveBeenCalledTimes(1);
    const reply = sendResponse.mock.calls[0]?.[0] as { type: string; state: { spaces: unknown[] } };
    expect(reply.type).toBe('lunma/state-snapshot');
    expect(reply.state.spaces).toHaveLength(1);
  });

  test('does not call any LunmaStore mutator', () => {
    const { deliver } = installChromeStub();
    const store = new LunmaStore({ idFactory: () => 'id-1' });
    const mutatorNames = [
      'createSpace',
      'renameSpace',
      'recolourSpace',
      'changeSpaceIcon',
      'deleteSpace',
      'activateSpace',
      'onTabCreated',
      'onTabRemoved',
      'onTabUpdated',
      'bindSavedTab',
      'unbindSavedTab',
      'makeSavedTabHomeCurrent',
      'applyRestartRecovery',
      'registerSavedTab',
      'removeSavedTab',
      'removeTrashedSpace',
      'setPinned',
      'addPinned',
      'removePinned',
      'restoreSpaceFromTrash',
      'onWindowOpened',
      'onWindowClosed',
    ] as const;
    type MutatorKey = (typeof mutatorNames)[number];
    const storeForSpy = store as Pick<LunmaStore, MutatorKey>;
    const spies = mutatorNames.map((name) => {
      const spy = vi.spyOn(storeForSpy, name);
      spy.mockImplementation(() => undefined);
      return spy;
    });
    registerStateSnapshotHandler(store);
    deliver({ type: 'lunma/state-request' }, vi.fn());
    for (const spy of spies) {
      expect(spy).not.toHaveBeenCalled();
    }
  });

  test('static analysis: handler module imports no Coordinator/persist/broadcast', () => {
    const source = readFileSync(resolve(__dirname, 'state-snapshot-handler.ts'), 'utf-8');
    expect(source).not.toMatch(/\bCoordinator\b/);
    expect(source).not.toMatch(/from ['"].*chrome\/storage['"]/);
    expect(source).not.toMatch(/broadcastState/);
    expect(source).not.toMatch(/\bpersist\(/);
  });

  test('concurrent-with-drain: response is synchronous, does not await', () => {
    const { deliver } = installChromeStub();
    const store = new LunmaStore({ idFactory: () => 'id-1' });
    registerStateSnapshotHandler(store);
    const sendResponse = vi.fn();
    const result = deliver({ type: 'lunma/state-request' }, sendResponse);
    // Listener returns false (not true), meaning synchronous response — no
    // async wait on a drain.
    expect(result).toBe(false);
    expect(sendResponse).toHaveBeenCalledTimes(1);
  });
});
