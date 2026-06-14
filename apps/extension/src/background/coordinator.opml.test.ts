import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { makeCoordinator, sidebar } from './coordinator.test-helpers';
import { resetSmartFoldersInflight } from './smart-folders';

interface OPMLChromeStub {
  storage: { local: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> } };
  alarms: { create: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };
}

function installChrome(): void {
  const stub: OPMLChromeStub = {
    storage: {
      local: {
        get: vi.fn(async () => ({})),
        set: vi.fn(async () => undefined),
      },
    },
    alarms: { create: vi.fn(), clear: vi.fn(async () => true) },
  };
  (globalThis as unknown as { chrome: OPMLChromeStub }).chrome = stub;
}

function makeWithSpace() {
  const made = makeCoordinator();
  made.store.state.spaces.push({ id: 's1', name: 'Work', color: 'blue', icon: 'star' });
  return made;
}

beforeEach(() => {
  installChrome();
  resetSmartFoldersInflight();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ status: 200, ok: true, json: async () => [] })),
  );
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('importOpml handler', () => {
  test('all valid feeds: creates N smart folders, acks ok', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();

    coordinator.enqueue(
      sidebar(
        {
          kind: 'importOpml',
          payload: {
            spaceId: 's1',
            feeds: [
              { name: 'HN', feedUrl: 'https://hnrss.org/frontpage' },
              { name: 'Lobsters', feedUrl: 'https://lobste.rs/rss' },
              { name: 'Julia Evans', feedUrl: 'https://jvns.ca/atom.xml' },
            ],
          },
        },
        'c1',
      ),
    );
    await coordinator.idle();

    const nodes = store.state.pinnedBySpace.s1 ?? [];
    const smartNodes = nodes.filter((n) => n.kind === 'smart');
    expect(smartNodes).toHaveLength(3);
    // addSmartFolder inserts at the top, so the order is reversed.
    expect(smartNodes.map((n) => (n.kind === 'smart' ? n.name : '')).sort()).toEqual([
      'HN',
      'Julia Evans',
      'Lobsters',
    ]);
    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', result: 'ok' }));
  });

  test('invalid feedUrl is skipped and counted', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();

    coordinator.enqueue(
      sidebar(
        {
          kind: 'importOpml',
          payload: {
            spaceId: 's1',
            feeds: [
              { name: 'HN', feedUrl: 'https://hnrss.org/frontpage' },
              { name: 'Bad', feedUrl: 'not-a-url' },
              { name: 'Lobsters', feedUrl: 'https://lobste.rs/rss' },
            ],
          },
        },
        'c2',
      ),
    );
    await coordinator.idle();

    const nodes = (store.state.pinnedBySpace.s1 ?? []).filter((n) => n.kind === 'smart');
    expect(nodes).toHaveLength(2);
    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c2', result: 'ok' }));
  });

  test('unknown spaceId throws and acks error', async () => {
    const { coordinator, emitAck } = makeWithSpace();

    coordinator.enqueue(
      sidebar(
        {
          kind: 'importOpml',
          payload: {
            spaceId: 'no-such-space',
            feeds: [{ name: 'HN', feedUrl: 'https://hnrss.org/frontpage' }],
          },
        },
        'c3',
      ),
    );
    await coordinator.idle();

    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c3',
        result: expect.objectContaining({ error: expect.stringContaining('no-such-space') }),
      }),
    );
  });

  test('empty feeds array is a no-op: acks ok, no folders created', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();

    coordinator.enqueue(
      sidebar(
        {
          kind: 'importOpml',
          payload: { spaceId: 's1', feeds: [] },
        },
        'c4',
      ),
    );
    await coordinator.idle();

    const nodes = store.state.pinnedBySpace.s1 ?? [];
    expect(nodes).toHaveLength(0);
    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c4', result: 'ok' }));
  });
});
