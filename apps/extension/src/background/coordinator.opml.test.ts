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
  test('3 valid feeds → 1 folder with 3 sources named "Feeds"', async () => {
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
    // One folder aggregating all 3 feeds.
    expect(smartNodes).toHaveLength(1);
    const folder = smartNodes[0];
    if (folder?.kind !== 'smart') throw new Error('not smart');
    expect(folder.name).toBe('Feeds');
    expect(folder.sources).toHaveLength(3);
    expect(folder.sources.map((s) => s.source)).toEqual(['rss', 'rss', 'rss']);
    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', result: 'ok' }));
  });

  test('1 valid feed → 1 folder named after the feed', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();

    coordinator.enqueue(
      sidebar(
        {
          kind: 'importOpml',
          payload: {
            spaceId: 's1',
            feeds: [{ name: 'HN', feedUrl: 'https://hnrss.org/frontpage' }],
          },
        },
        'c-single',
      ),
    );
    await coordinator.idle();

    const smartNodes = (store.state.pinnedBySpace.s1 ?? []).filter((n) => n.kind === 'smart');
    expect(smartNodes).toHaveLength(1);
    const folder = smartNodes[0];
    if (folder?.kind !== 'smart') throw new Error('not smart');
    expect(folder.name).toBe('HN');
    expect(folder.sources).toHaveLength(1);
    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c-single', result: 'ok' }));
  });

  test('2 valid + 1 invalid → 1 folder with 2 sources (invalid URL skipped)', async () => {
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

    const smartNodes = (store.state.pinnedBySpace.s1 ?? []).filter((n) => n.kind === 'smart');
    expect(smartNodes).toHaveLength(1);
    const folder = smartNodes[0];
    if (folder?.kind !== 'smart') throw new Error('not smart');
    expect(folder.sources).toHaveLength(2);
    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c2', result: 'ok' }));
  });

  test('all invalid URLs → no folder, acks ok', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();

    coordinator.enqueue(
      sidebar(
        {
          kind: 'importOpml',
          payload: {
            spaceId: 's1',
            feeds: [
              { name: 'Bad1', feedUrl: 'not-a-url' },
              { name: 'Bad2', feedUrl: 'also-bad' },
            ],
          },
        },
        'c-invalid',
      ),
    );
    await coordinator.idle();

    const nodes = store.state.pinnedBySpace.s1 ?? [];
    expect(nodes).toHaveLength(0);
    expect(emitAck).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c-invalid', result: 'ok' }),
    );
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
