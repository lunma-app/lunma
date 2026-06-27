import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { makeCoordinator, sidebar } from './coordinator.test-helpers';
import { resetLensesInflight } from './lenses';

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
  resetLensesInflight();
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
    const lensNodes = nodes.filter((n) => n.kind === 'lens');
    // One folder aggregating all 3 feeds.
    expect(lensNodes).toHaveLength(1);
    const folder = lensNodes[0];
    if (folder?.kind !== 'lens') throw new Error('not smart');
    expect(folder.name).toBe('Feeds');
    expect(folder.sources).toHaveLength(3);
    // Each reference resolves to a minted rss account (connector-accounts).
    expect(folder.sources.map((ref) => store.state.sources[ref.sourceId]?.provider)).toEqual([
      'rss',
      'rss',
      'rss',
    ]);
    // The accounts carry the feed URLs as their baseUrl.
    expect(folder.sources.map((ref) => store.state.sources[ref.sourceId]?.baseUrl)).toEqual([
      'https://hnrss.org/frontpage',
      'https://lobste.rs/rss',
      'https://jvns.ca/atom.xml',
    ]);
    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', result: 'ok' }));
  });

  test('a repeated feed URL reuses one minted account', async () => {
    const { coordinator, store, emitAck } = makeWithSpace();

    coordinator.enqueue(
      sidebar(
        {
          kind: 'importOpml',
          payload: {
            spaceId: 's1',
            feeds: [
              { name: 'HN', feedUrl: 'https://hnrss.org/frontpage' },
              { name: 'HN again', feedUrl: 'https://hnrss.org/frontpage' },
            ],
          },
        },
        'c-dupe',
      ),
    );
    await coordinator.idle();

    const lensNodes = (store.state.pinnedBySpace.s1 ?? []).filter((n) => n.kind === 'lens');
    const folder = lensNodes[0];
    if (folder?.kind !== 'lens') throw new Error('not a lens');
    // Two references, both pointing at the SAME minted account (dedupe by URL).
    expect(folder.sources).toHaveLength(2);
    expect(folder.sources[0]?.sourceId).toBe(folder.sources[1]?.sourceId);
    // Exactly one rss account was minted for the repeated URL.
    const rssAccounts = Object.values(store.state.sources).filter((a) => a.provider === 'rss');
    expect(rssAccounts).toHaveLength(1);
    expect(emitAck).toHaveBeenCalledWith(expect.objectContaining({ id: 'c-dupe', result: 'ok' }));
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

    const lensNodes = (store.state.pinnedBySpace.s1 ?? []).filter((n) => n.kind === 'lens');
    expect(lensNodes).toHaveLength(1);
    const folder = lensNodes[0];
    if (folder?.kind !== 'lens') throw new Error('not smart');
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

    const lensNodes = (store.state.pinnedBySpace.s1 ?? []).filter((n) => n.kind === 'lens');
    expect(lensNodes).toHaveLength(1);
    const folder = lensNodes[0];
    if (folder?.kind !== 'lens') throw new Error('not smart');
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
