import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { migrations } from '../migrations';
import { CURRENT_SCHEMA_VERSION } from '../schemas';
import { createInitialState } from '../store.svelte';
import {
  dedupePersistedState,
  persist,
  readPersistedState,
  salvagePersistedState,
  toPersistable,
} from './storage';

/** A full, structurally-valid persisted state object — callers corrupt one slice
 * to exercise the salvage path while keeping the rest valid. */
function validPersistedState(): Record<string, unknown> {
  return {
    schemaVersion: 6,
    spaces: [],
    activeSpaceByWindow: {},
    spaceInstancesByWindow: {},
    tabBindings: {},
    savedTabs: {},
    lastActivatedSpaceId: null,
    tabLastActivity: {},
    archivedTabs: [],
    trash: {},
    pinnedBySpace: {},
  };
}

interface ChromeStorageMock {
  data: Record<string, unknown>;
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
}

function installChromeMock(): ChromeStorageMock {
  const mock: ChromeStorageMock = {
    data: {},
    get: vi.fn(async (key: string | null) => {
      if (key === null) return { ...mock.data };
      const value = mock.data[key];
      return value === undefined ? {} : { [key]: value };
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(mock.data, items);
    }),
    remove: vi.fn(async (keys: string | string[]) => {
      const list = Array.isArray(keys) ? keys : [keys];
      for (const k of list) delete mock.data[k];
    }),
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { local: { get: mock.get, set: mock.set, remove: mock.remove } },
  };
  return mock;
}

let chromeMock: ChromeStorageMock;

// The REAL migration chain (the smart-folders v1→v2, github-connector v2→v3,
// smart-folder-item-bindings v3→v4, jira-connector v4→v5, and rss-connector
// v5→v6 pass-throughs), captured at module load and restored around every test
// so cases that push a synthetic migration never leak it — and never wipe the
// real chain for later tests.
const realMigrations = [...migrations];

beforeEach(() => {
  chromeMock = installChromeMock();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  migrations.length = 0;
  migrations.push(...realMigrations);
  vi.restoreAllMocks();
});

describe('readPersistedState', () => {
  test('clean read returns ok with parsed state', async () => {
    const state = createInitialState();
    chromeMock.data['lunma.state'] = { schemaVersion: CURRENT_SCHEMA_VERSION, state };
    const result = await readPersistedState();
    expect(result).toEqual({ kind: 'ok', state });
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeUndefined();
  });

  test('a materialized nested (window, Space) instance + pinned tab round-trips ok', async () => {
    // Regression: `readPersistedState` MUST validate against the CURRENT-version
    // schema. A realistic state — a Space with a materialized nested
    // `spaceInstancesByWindow[windowId][spaceId]` instance and a pinned tab —
    // previously failed because validation used the stale flat (V3) schema,
    // corrupting every restart and wiping state. The empty `createInitialState`
    // case above can't catch it (an empty state validates under either shape).
    const state = createInitialState();
    state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    state.activeSpaceByWindow[100] = 'work';
    state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 5, tempTabIds: [17], tempTabTitles: {} },
    };
    state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'Pinned',
      originalURL: 'https://x/',
      currentURL: 'https://x/',
    };
    state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];
    const { liveTabsById: _drop, ...persistable } = state;
    chromeMock.data['lunma.state'] = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      state: persistable,
    };

    const result = await readPersistedState();

    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.state.spaces.map((s) => s.name)).toEqual(['Work']);
      expect(result.state.spaceInstancesByWindow[100]?.work?.groupId).toBe(5);
      expect(result.state.pinnedBySpace.work).toEqual([{ kind: 'tab', id: 'st-1' }]);
    }
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeUndefined(); // no corruption
  });

  test('first-boot empty returns empty and writes no backup', async () => {
    const result = await readPersistedState();
    expect(result).toEqual({ kind: 'empty' });
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeUndefined();
  });

  test('quarantines envelope with non-numeric schemaVersion', async () => {
    const raw = { schemaVersion: 'oops', state: {} };
    chromeMock.data['lunma.state'] = raw;
    const result = await readPersistedState();
    expect(result).toEqual({ kind: 'corrupt' });
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeDefined();
    const record = chromeMock.data[backupKey as string] as Record<string, unknown>;
    expect(record).toMatchObject({
      reason: 'invalid envelope.schemaVersion',
      rawBytes: raw,
    });
    expect(record.capturedAt).toEqual(expect.any(Number));
    expect(record.rawBytes).toBe(raw);
  });

  test('migration throw quarantines and returns corrupt', async () => {
    migrations.push({
      toVersion: CURRENT_SCHEMA_VERSION,
      migrate: () => {
        throw new Error('bad migration');
      },
    });
    const raw = { schemaVersion: 0, state: { anything: true } };
    chromeMock.data['lunma.state'] = raw;
    const result = await readPersistedState();
    expect(result).toEqual({ kind: 'corrupt' });
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    const record = chromeMock.data[backupKey as string] as Record<string, unknown>;
    expect(record).toMatchObject({
      reason: 'migration threw',
      error: 'bad migration',
    });
    expect(record.rawBytes).toBe(raw);
  });

  test('schema parse failure on an unsalvageable (non-object) payload quarantines, captures zodIssues, and returns corrupt', async () => {
    // A non-object migrated state cannot be salvaged (`salvagePersistedState` →
    // null), so the read falls through to `corrupt` — still quarantined with the
    // captured `zodIssues`. (An object payload that fails validation now salvages
    // to a valid empty/partial state instead — see the salvage suite below.)
    const raw = { schemaVersion: CURRENT_SCHEMA_VERSION, state: 'not an object' };
    chromeMock.data['lunma.state'] = raw;
    const result = await readPersistedState();
    expect(result).toEqual({ kind: 'corrupt' });
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    const record = chromeMock.data[backupKey as string] as Record<string, unknown>;
    expect(record.reason).toBe('schema parse failed');
    expect(record.rawBytes).toBe(raw);
    expect(Array.isArray(record.zodIssues)).toBe(true);
    expect((record.zodIssues as unknown[]).length).toBeGreaterThan(0);
  });

  test('a one-off get throw recovers on retry and returns ok', async () => {
    const state = createInitialState();
    chromeMock.data['lunma.state'] = { schemaVersion: CURRENT_SCHEMA_VERSION, state };
    // First attempt rejects (a transient blip); the retry uses the real impl.
    chromeMock.get.mockRejectedValueOnce(new Error('transient'));

    const result = await readPersistedState();

    expect(result).toEqual({ kind: 'ok', state });
    expect(chromeMock.get).toHaveBeenCalledTimes(2); // initial throw + one retry
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeUndefined();
  });

  test('a sustained get failure returns unavailable and writes no backup', async () => {
    chromeMock.data['lunma.state'] = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      state: createInitialState(),
    };
    // Every attempt (initial + 2 retries) throws.
    chromeMock.get.mockRejectedValue(new Error('io down'));

    const result = await readPersistedState();

    expect(result).toEqual({ kind: 'unavailable' });
    expect(chromeMock.get).toHaveBeenCalledTimes(3); // initial + READ_RETRY_ATTEMPTS (2)
    // No payload was read, so nothing is ever quarantined on this path.
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeUndefined();
  });

  test('a resolved-undefined key is a clean first boot (empty), not unavailable', async () => {
    // The key genuinely resolves to absent — distinct from a thrown get.
    const result = await readPersistedState();
    expect(result).toEqual({ kind: 'empty' });
  });

  test('salvages valid Spaces when an unrelated slice is malformed (salvaged + quarantine + write-back)', async () => {
    const state = validPersistedState();
    state.spaces = [
      { id: 'a', name: 'Work', color: 'blue', icon: 'star' },
      { id: 'b', name: 'Personal', color: 'red', icon: 'star' },
    ];
    // A savedTabs record missing its required `originalURL` fails whole-state
    // validation, but the two Spaces are individually valid.
    state.savedTabs = { bad: { id: 'bad', spaceId: 'a', title: 'X', currentURL: null } };
    const raw = { schemaVersion: CURRENT_SCHEMA_VERSION, state };
    chromeMock.data['lunma.state'] = raw;
    chromeMock.set.mockClear();

    const result = await readPersistedState();

    expect(result.kind).toBe('salvaged');
    if (result.kind !== 'salvaged') return;
    expect(result.state.spaces.map((s) => s.name)).toEqual(['Work', 'Personal']);
    expect(result.state.savedTabs).toEqual({}); // the malformed slice was reset
    // The raw payload is still quarantined for diagnosis.
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeDefined();
    const record = chromeMock.data[backupKey as string] as Record<string, unknown>;
    expect(record.reason).toBe('schema parse failed');
    expect(record.rawBytes).toBe(raw);
    // The salvaged (clean) envelope is written back over the corrupt one (self-heal).
    expect(chromeMock.set).toHaveBeenCalled();
    const written = chromeMock.data['lunma.state'] as {
      schemaVersion: number;
      state: { spaces: Array<{ name: string }>; savedTabs: Record<string, unknown> };
    };
    expect(written.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(written.state.spaces.map((s) => s.name)).toEqual(['Work', 'Personal']);
    expect(written.state.savedTabs).toEqual({});
  });

  test('salvage drops only the invalid Space element and keeps the valid ones', async () => {
    const state = validPersistedState();
    state.spaces = [
      { id: 'a', name: 'Work', color: 'blue', icon: 'star' },
      { id: 'b', color: 'red', icon: 'star' }, // missing required `name`
    ];
    chromeMock.data['lunma.state'] = { schemaVersion: CURRENT_SCHEMA_VERSION, state };

    const result = await readPersistedState();

    expect(result.kind).toBe('salvaged');
    if (result.kind !== 'salvaged') return;
    expect(result.state.spaces).toEqual([{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }]);
  });

  test('quarantine record is shape-distinguishable from a live envelope', async () => {
    chromeMock.data['lunma.state'] = { schemaVersion: 'oops', state: {} };
    await readPersistedState();
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    const record = chromeMock.data[backupKey as string] as Record<string, unknown>;
    expect(record).toHaveProperty('capturedAt');
    expect(record).toHaveProperty('reason');
    expect(record).toHaveProperty('rawBytes');
    expect(record).not.toHaveProperty('state');
  });

  test('quarantine prunes oldest backups when over cap of 10', async () => {
    for (let i = 0; i < 10; i++) {
      const ts = `2026-01-01T00:00:${String(i).padStart(2, '0')}.000Z`;
      chromeMock.data[`__corrupt_backup_${ts}`] = { capturedAt: i, rawBytes: i, reason: 'old' };
    }
    chromeMock.data['lunma.state'] = { schemaVersion: 'oops', state: {} };
    await readPersistedState();

    const backupKeys = Object.keys(chromeMock.data).filter((k) =>
      k.startsWith('__corrupt_backup_'),
    );
    expect(backupKeys).toHaveLength(10);
    expect(chromeMock.remove).toHaveBeenCalled();
    expect(chromeMock.data['__corrupt_backup_2026-01-01T00:00:00.000Z']).toBeUndefined();
    expect(chromeMock.data['__corrupt_backup_2026-01-01T00:00:09.000Z']).toBeDefined();
  });

  test('quarantine does not prune when under cap', async () => {
    chromeMock.data['__corrupt_backup_2026-01-01T00:00:00.000Z'] = { rawBytes: 0 };
    chromeMock.data['lunma.state'] = { schemaVersion: 'oops', state: {} };
    await readPersistedState();
    expect(chromeMock.remove).not.toHaveBeenCalled();
    const backupKeys = Object.keys(chromeMock.data).filter((k) =>
      k.startsWith('__corrupt_backup_'),
    );
    expect(backupKeys).toHaveLength(2);
  });

  test('only lunma.state is read — pre-rename / unrelated keys are ignored (fresh empty)', async () => {
    // Pre-release cutover (rebrand-to-lunma, D1): the loader reads ONLY `lunma.state`,
    // so any data under an old pre-rename key is orphaned (not migrated) and the
    // first run is a clean empty boot.
    chromeMock.data['legacy.state'] = { schemaVersion: 1, state: createInitialState() };
    const result = await readPersistedState();
    expect(result).toEqual({ kind: 'empty' });
    expect(chromeMock.get).toHaveBeenCalledWith('lunma.state');
  });

  test('write-back when persistedVersion < CURRENT_SCHEMA_VERSION', async () => {
    const state = createInitialState();
    chromeMock.data['lunma.state'] = { schemaVersion: 0, state };
    chromeMock.set.mockClear();
    const result = await readPersistedState();
    expect(result.kind).toBe('ok');
    // Written envelope strips ephemeral fields via toPersistable.
    expect(chromeMock.set).toHaveBeenCalledWith({
      'lunma.state': { schemaVersion: CURRENT_SCHEMA_VERSION, state: toPersistable(state) },
    });
  });

  test('no write on equal version', async () => {
    const state = createInitialState();
    chromeMock.data['lunma.state'] = { schemaVersion: CURRENT_SCHEMA_VERSION, state };
    chromeMock.set.mockClear();
    const result = await readPersistedState();
    expect(result.kind).toBe('ok');
    expect(chromeMock.set).not.toHaveBeenCalled();
  });

  test('a v1 envelope chains through all ten entries and writes back as v11', async () => {
    // A faithful pre-smart-folders envelope: in-state schemaVersion 1, no
    // ephemeral slices on disk, no lensItemBindings / lensReadState (neither
    // existed yet), a Space with a pinned tab.
    const state = createInitialState();
    state.schemaVersion = 1;
    state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'Pinned',
      originalURL: 'https://x/',
      currentURL: null,
    };
    state.pinnedBySpace.work = [{ kind: 'tab', id: 'st-1' }];
    const { liveTabsById: _l, lenses: _s, ...persistable } = state;
    chromeMock.data['lunma.state'] = { schemaVersion: 1, state: persistable };
    chromeMock.set.mockClear();

    const result = await readPersistedState();

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    // Lossless: the pass-throughs change no content; the absent
    // `lensItemBindings` / `lensReadState` / `liveTabsById` / `lenses`
    // parse to their `{}` defaults.
    expect(result.state).toEqual({
      ...persistable,
      liveTabsById: {},
      lenses: {},
    });
    // The envelope is written back at the current (v11) version.
    expect(chromeMock.set).toHaveBeenCalledWith({
      'lunma.state': {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        state: persistable,
      },
    });
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeUndefined();
  });

  test('a v2 envelope (gitlab lens node) migrates and writes back as v11', async () => {
    // A pre-github-connector envelope: schemaVersion 2, a gitlab smart node
    // stored in the raw v2 format (`kind: 'smart'`). The v11 migration converts
    // it to `kind: 'lens'` + `lensKind: 'general'` and renames the binding keys.
    chromeMock.data['lunma.state'] = {
      schemaVersion: 2,
      state: {
        schemaVersion: 2,
        spaces: [{ id: 'work', name: 'Work', color: 'blue', icon: 'star' }],
        activeSpaceByWindow: {},
        spaceInstancesByWindow: {},
        tabBindings: {},
        savedTabs: {},
        lastActivatedSpaceId: null,
        tabLastActivity: {},
        archivedTabs: [],
        trash: {},
        pinnedBySpace: {
          work: [
            {
              kind: 'smart',
              id: 'sf-1',
              name: 'Review requests',
              icon: 'folder-git-2',
              source: 'gitlab',
              baseUrl: 'https://gitlab.example.com',
              query: 'review-requested',
              refreshMinutes: 10,
            },
          ],
        },
        faviconRow: [],
        smartItemBindings: {},
      },
    };
    chromeMock.set.mockClear();

    const result = await readPersistedState();

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    // v11 migration converts the smart node.
    expect(result.state.pinnedBySpace.work?.[0]).toMatchObject({
      kind: 'lens',
      lensKind: 'general',
      id: 'sf-1',
    });
    expect(result.state.lensItemBindings).toEqual({});
    expect(chromeMock.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'lunma.state': expect.objectContaining({ schemaVersion: CURRENT_SCHEMA_VERSION }),
      }),
    );
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeUndefined();
  });

  test('a v3 envelope (no smartItemBindings field) migrates and writes back as v11', async () => {
    // A pre-bindings envelope: schemaVersion 3, a smart node among the pins,
    // and no `smartItemBindings` key — the v11 migration renames to
    // `lensItemBindings` if present; absent means Zod default fills it.
    chromeMock.data['lunma.state'] = {
      schemaVersion: 3,
      state: {
        schemaVersion: 3,
        spaces: [{ id: 'work', name: 'Work', color: 'blue', icon: 'star' }],
        activeSpaceByWindow: {},
        spaceInstancesByWindow: {},
        tabBindings: {},
        savedTabs: {},
        lastActivatedSpaceId: null,
        tabLastActivity: {},
        archivedTabs: [],
        trash: {},
        pinnedBySpace: {
          work: [
            {
              kind: 'smart',
              id: 'sf-1',
              name: 'Review requests',
              icon: 'folder-git-2',
              source: 'gitlab',
              baseUrl: 'https://gitlab.example.com',
              query: 'review-requested',
              refreshMinutes: 10,
            },
          ],
        },
        faviconRow: [],
        // no smartItemBindings — the slice parses to {} via Zod default
      },
    };
    chromeMock.set.mockClear();

    const result = await readPersistedState();

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.state.pinnedBySpace.work?.[0]).toMatchObject({
      kind: 'lens',
      lensKind: 'general',
    });
    expect(result.state.lensItemBindings).toEqual({});
    expect(chromeMock.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'lunma.state': expect.objectContaining({ schemaVersion: CURRENT_SCHEMA_VERSION }),
      }),
    );
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeUndefined();
  });

  test('a v11 state with a gitlab lens node round-trips without quarantine', async () => {
    const state = createInitialState();
    state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    state.pinnedBySpace.work = [
      {
        kind: 'lens',
        lensKind: 'general',
        id: 'sf-1',
        name: 'Review requests',
        icon: 'folder-git-2',
        sources: [
          {
            source: 'gitlab',
            baseUrl: 'https://gitlab.example.com',
            queries: ['review-requested'],
          },
        ],
        maxItems: 20,
        hideRead: false,
        refreshMinutes: 10,
      },
      { kind: 'tab', id: 'st-1' },
    ];
    state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'work',
      title: 'Pinned',
      originalURL: 'https://x/',
      currentURL: null,
    };
    await persist(state);

    const result = await readPersistedState();

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.state.pinnedBySpace.work?.[0]).toEqual({
      kind: 'lens',
      lensKind: 'general',
      id: 'sf-1',
      name: 'Review requests',
      icon: 'folder-git-2',
      sources: [
        { source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['review-requested'] },
      ],
      maxItems: 20,
      hideRead: false,
      refreshMinutes: 10,
    });
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeUndefined();
  });

  test('a v4 envelope (github lens node) migrates and writes back as v11', async () => {
    // A pre-jira-connector envelope: schemaVersion 4, a github smart node.
    chromeMock.data['lunma.state'] = {
      schemaVersion: 4,
      state: {
        schemaVersion: 4,
        spaces: [{ id: 'work', name: 'Work', color: 'blue', icon: 'star' }],
        activeSpaceByWindow: {},
        spaceInstancesByWindow: {},
        tabBindings: {},
        savedTabs: {},
        lastActivatedSpaceId: null,
        tabLastActivity: {},
        archivedTabs: [],
        trash: {},
        pinnedBySpace: {
          work: [
            {
              kind: 'smart',
              id: 'sf-gh',
              name: 'My pull requests',
              icon: 'folder-git-2',
              source: 'github',
              baseUrl: 'https://github.com',
              query: 'authored',
              refreshMinutes: 10,
            },
          ],
        },
        faviconRow: [],
        smartItemBindings: {},
      },
    };
    chromeMock.set.mockClear();

    const result = await readPersistedState();

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    // v11 migration converts the smart node to lens.
    expect(result.state.pinnedBySpace.work?.[0]).toMatchObject({
      kind: 'lens',
      lensKind: 'general',
      id: 'sf-gh',
    });
    expect(result.state.lensItemBindings).toEqual({});
    expect(chromeMock.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'lunma.state': expect.objectContaining({ schemaVersion: CURRENT_SCHEMA_VERSION }),
      }),
    );
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeUndefined();
  });

  test('a v11 state with a jira lens node round-trips without quarantine', async () => {
    const state = createInitialState();
    state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    state.pinnedBySpace.work = [
      {
        kind: 'lens',
        lensKind: 'general',
        id: 'sf-jira',
        name: 'My reported issues',
        icon: 'folder-kanban',
        sources: [{ source: 'jira', baseUrl: 'https://acme.atlassian.net', queries: ['authored'] }],
        maxItems: 20,
        hideRead: false,
        refreshMinutes: 10,
      },
    ];
    await persist(state);

    const result = await readPersistedState();

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.state.pinnedBySpace.work?.[0]).toEqual({
      kind: 'lens',
      lensKind: 'general',
      id: 'sf-jira',
      name: 'My reported issues',
      icon: 'folder-kanban',
      sources: [{ source: 'jira', baseUrl: 'https://acme.atlassian.net', queries: ['authored'] }],
      maxItems: 20,
      hideRead: false,
      refreshMinutes: 10,
    });
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeUndefined();
  });

  test('a v11 state with a populated lens-item binding round-trips without quarantine', async () => {
    // The ids-only bindings slice (lens-item-bindings) IS persisted —
    // unlike the runtime `lenses` slice — and must survive the round-trip
    // intact, no migration, no write-back, no quarantine.
    const state = createInitialState();
    state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    state.pinnedBySpace.work = [
      {
        kind: 'lens',
        lensKind: 'general',
        id: 'sf-1',
        name: 'Review requests',
        icon: 'folder-git-2',
        sources: [
          {
            source: 'gitlab',
            baseUrl: 'https://gitlab.example.com',
            queries: ['review-requested'],
          },
        ],
        maxItems: 20,
        hideRead: false,
        refreshMinutes: 10,
      },
    ];
    state.lensItemBindings['sf-1'] = { '42': { 100: { tabId: 7, allowGlob: '' } } };
    await persist(state);
    chromeMock.set.mockClear();

    const result = await readPersistedState();

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.state.lensItemBindings).toEqual({
      'sf-1': { '42': { 100: { tabId: 7, allowGlob: '' } } },
    });
    expect(chromeMock.set).not.toHaveBeenCalled(); // already current — no write-back
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeUndefined();
  });

  test('a v11 state with lensReadState round-trips it (persisted) while lenses is stripped', async () => {
    // rss-connector design D3: the read-state slice is persisted ids-only (like
    // lensItemBindings), so it MUST survive the round-trip — while the ephemeral
    // `lenses` runtime slice is stripped before write and never read back.
    const state = createInitialState();
    state.spaces.push({ id: 'read', name: 'Reading', color: 'orange', icon: 'rss' });
    state.pinnedBySpace.read = [
      {
        kind: 'lens',
        lensKind: 'general',
        id: 'feed-1',
        name: 'Hacker News',
        icon: 'rss',
        sources: [{ source: 'rss', baseUrl: 'https://news.ycombinator.com/rss', queries: [] }],
        maxItems: 30,
        hideRead: false,
        refreshMinutes: 30,
      },
    ];
    state.lensReadState['feed-1'] = ['item-a', 'item-b'];
    // A populated ephemeral runtime — this MUST NOT reach disk.
    state.lenses['feed-1'] = {
      sections: {
        'rss:news.ycombinator.com': {
          state: 'ok',
          items: [{ id: 'item-a', title: 'A', url: 'https://example.com/a' }],
          fetchedAt: 123,
        },
      },
    };
    await persist(state);

    // The on-disk envelope keeps lensReadState, drops lenses.
    const onDisk = chromeMock.data['lunma.state'] as { state: Record<string, unknown> };
    expect(onDisk.state.lensReadState).toEqual({ 'feed-1': ['item-a', 'item-b'] });
    expect(onDisk.state).not.toHaveProperty('lenses');

    const result = await readPersistedState();
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.state.lensReadState).toEqual({ 'feed-1': ['item-a', 'item-b'] });
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeUndefined();
  });

  test('de-dupes a duplicate pinned id on load and heals it back to disk', async () => {
    const state = createInitialState();
    state.savedTabs.a = {
      id: 'a',
      spaceId: 'work',
      title: 'A',
      originalURL: 'https://a/',
      currentURL: 'https://a/',
    };
    state.pinnedBySpace.work = [
      { kind: 'tab', id: 'a' },
      { kind: 'tab', id: 'a' },
    ];
    const { liveTabsById: _drop, ...persistable } = state;
    chromeMock.data['lunma.state'] = { schemaVersion: CURRENT_SCHEMA_VERSION, state: persistable };
    chromeMock.set.mockClear();

    const result = await readPersistedState();
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.state.pinnedBySpace.work).toEqual([{ kind: 'tab', id: 'a' }]);
    // Even at the current version, a heal triggers a write-back so the duplicate
    // is gone from disk on this first load (not only after the next mutation).
    expect(chromeMock.set).toHaveBeenCalled();
    const written = chromeMock.data['lunma.state'] as {
      state: { pinnedBySpace: Record<string, unknown> };
    };
    expect(written.state.pinnedBySpace.work).toEqual([{ kind: 'tab', id: 'a' }]);
  });

  test('a locked boundary round-trips through persist + read', async () => {
    const state = createInitialState();
    state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    state.savedTabs.st1 = {
      id: 'st1',
      spaceId: 'work',
      title: 'Gmail',
      originalURL: 'https://mail.google.com/',
      currentURL: 'https://mail.google.com/',
      boundary: { mode: 'locked', allow: ['*.google.com'] },
    };
    await persist(state);

    const result = await readPersistedState();

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.state.savedTabs.st1?.boundary).toEqual({
      mode: 'locked',
      allow: ['*.google.com'],
    });
  });

  test('a malformed boundary fails whole-state validation and salvages (quarantine + slice reset)', async () => {
    const state = validPersistedState();
    state.spaces = [{ id: 'work', name: 'Work', color: 'blue', icon: 'star' }];
    state.savedTabs = {
      st1: {
        id: 'st1',
        spaceId: 'work',
        title: 'Gmail',
        originalURL: 'https://mail.google.com/',
        currentURL: null,
        boundary: { mode: 'bogus' }, // not a valid TabBoundary discriminant
      },
    };
    const raw = { schemaVersion: CURRENT_SCHEMA_VERSION, state };
    chromeMock.data['lunma.state'] = raw;

    const result = await readPersistedState();

    expect(result.kind).toBe('salvaged');
    if (result.kind !== 'salvaged') return;
    // The malformed savedTabs slice resets to {}; the valid Space survives.
    expect(result.state.spaces.map((s) => s.name)).toEqual(['Work']);
    expect(result.state.savedTabs).toEqual({});
    const backupKey = Object.keys(chromeMock.data).find((k) => k.startsWith('__corrupt_backup_'));
    expect(backupKey).toBeDefined();
  });
});

describe('dedupePersistedState', () => {
  test('removes a duplicate top-level pinned id (first wins, order preserved)', () => {
    const state = createInitialState();
    state.pinnedBySpace.work = [
      { kind: 'tab', id: 'a' },
      { kind: 'tab', id: 'b' },
      { kind: 'tab', id: 'a' },
    ];
    const { state: out, changed } = dedupePersistedState(state);
    expect(changed).toBe(true);
    expect(out.pinnedBySpace.work).toEqual([
      { kind: 'tab', id: 'a' },
      { kind: 'tab', id: 'b' },
    ]);
  });

  test('removes a child id that also appears top-level, and a repeated child', () => {
    const state = createInitialState();
    state.pinnedBySpace.work = [
      { kind: 'tab', id: 'a' },
      {
        kind: 'folder',
        id: 'f1',
        name: 'F',
        icon: 'folder',
        color: 'gray',
        children: ['a', 'b', 'b'],
      },
    ];
    const { state: out, changed } = dedupePersistedState(state);
    expect(changed).toBe(true);
    const work = out.pinnedBySpace.work ?? [];
    expect(work[0]).toEqual({ kind: 'tab', id: 'a' });
    expect(work[1]).toMatchObject({ kind: 'folder', id: 'f1', children: ['b'] });
  });

  test('removes duplicate folder ids (first wins)', () => {
    const state = createInitialState();
    state.pinnedBySpace.work = [
      { kind: 'folder', id: 'f1', name: 'First', icon: 'folder', color: 'gray', children: [] },
      { kind: 'folder', id: 'f1', name: 'Second', icon: 'folder', color: 'gray', children: [] },
    ];
    const { state: out, changed } = dedupePersistedState(state);
    expect(changed).toBe(true);
    const work = out.pinnedBySpace.work ?? [];
    expect(work).toHaveLength(1);
    expect(work[0]).toMatchObject({ id: 'f1', name: 'First' });
  });

  test('de-dupes tempTabIds per instance (first wins)', () => {
    const state = createInitialState();
    state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [5, 6, 5], tempTabTitles: {} },
    };
    const { state: out, changed } = dedupePersistedState(state);
    expect(changed).toBe(true);
    expect(out.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([5, 6]);
  });

  test('de-dupes spaces by id (first wins)', () => {
    const state = createInitialState();
    state.spaces = [
      { id: 'work', name: 'Work', color: 'blue', icon: 'star' },
      { id: 'work', name: 'Dup', color: 'red', icon: 'book' },
      { id: 'read', name: 'Read', color: 'orange', icon: 'book' },
    ];
    const { state: out, changed } = dedupePersistedState(state);
    expect(changed).toBe(true);
    expect(out.spaces.map((s) => s.id)).toEqual(['work', 'read']);
    expect(out.spaces[0]?.name).toBe('Work');
  });

  test('a clean state is returned unchanged (same reference, changed=false)', () => {
    const state = createInitialState();
    state.pinnedBySpace.work = [
      { kind: 'tab', id: 'a' },
      { kind: 'folder', id: 'f1', name: 'F', icon: 'folder', color: 'gray', children: ['b'] },
    ];
    const { state: out, changed } = dedupePersistedState(state);
    expect(changed).toBe(false);
    expect(out).toBe(state);
  });
});

describe('salvagePersistedState', () => {
  test('returns null for a non-object payload (string, number, array, null)', () => {
    expect(salvagePersistedState('nope')).toBeNull();
    expect(salvagePersistedState(42)).toBeNull();
    expect(
      salvagePersistedState([{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }]),
    ).toBeNull();
    expect(salvagePersistedState(null)).toBeNull();
  });

  test('preserves valid Spaces while resetting a malformed unrelated slice', () => {
    const out = salvagePersistedState({
      ...validPersistedState(),
      spaces: [{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }],
      savedTabs: { bad: { id: 'bad' } }, // malformed → reset to {}
    });
    expect(out).not.toBeNull();
    expect(out?.spaces).toEqual([{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }]);
    expect(out?.savedTabs).toEqual({});
  });

  test('drops only the invalid Space element, preserving order of the rest', () => {
    const out = salvagePersistedState({
      ...validPersistedState(),
      spaces: [
        { id: 'a', name: 'Work', color: 'blue', icon: 'star' },
        { id: 'b', color: 'red', icon: 'star' }, // missing required `name`
        { id: 'c', name: 'Read', color: 'orange', icon: 'book' },
      ],
    });
    expect(out?.spaces).toEqual([
      { id: 'a', name: 'Work', color: 'blue', icon: 'star' },
      { id: 'c', name: 'Read', color: 'orange', icon: 'book' },
    ]);
  });

  test('a non-array spaces slice salvages to []', () => {
    const out = salvagePersistedState({ ...validPersistedState(), spaces: 'not an array' });
    expect(out).not.toBeNull();
    expect(out?.spaces).toEqual([]);
  });

  test('a pinned tree containing a lens node survives slice-wise salvage intact (either source)', () => {
    // The scenario admits BOTH shipped sources — run the same salvage for each.
    for (const source of ['gitlab', 'github'] as const) {
      const lensNode = {
        kind: 'lens',
        lensKind: 'general',
        id: 'sf-1',
        name: 'Assigned to me',
        icon: 'folder-git-2',
        sources: [{ source, baseUrl: 'https://forge.example.com', queries: ['assigned'] }],
        maxItems: 20,
        hideRead: false,
        refreshMinutes: 5,
      };
      const out = salvagePersistedState({
        ...validPersistedState(),
        spaces: [{ id: 'work', name: 'Work', color: 'blue', icon: 'star' }],
        pinnedBySpace: { work: [lensNode, { kind: 'tab', id: 'st-1' }] },
        savedTabs: { bad: { id: 'bad' } }, // malformed → whole-state validation fails
      });
      expect(out, `salvage with source ${source}`).not.toBeNull();
      expect(out?.pinnedBySpace.work).toEqual([lensNode, { kind: 'tab', id: 'st-1' }]);
      expect(out?.savedTabs).toEqual({});
    }
  });

  test('a pinned tree containing a lens node survives slice-wise salvage intact', () => {
    const lensNode = {
      kind: 'lens',
      lensKind: 'general',
      id: 'sf-1',
      name: 'Assigned to me',
      icon: 'folder-git-2',
      sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['assigned'] }],
      maxItems: 20,
      hideRead: false,
      refreshMinutes: 5,
    };
    const out = salvagePersistedState({
      ...validPersistedState(),
      spaces: [{ id: 'work', name: 'Work', color: 'blue', icon: 'star' }],
      pinnedBySpace: { work: [lensNode, { kind: 'tab', id: 'st-1' }] },
      savedTabs: { bad: { id: 'bad' } }, // malformed → whole-state validation fails
    });
    expect(out).not.toBeNull();
    // The valid pinnedBySpace slice — lens node config included — is preserved,
    // not reset by stale v1 slice validation.
    expect(out?.pinnedBySpace.work).toEqual([lensNode, { kind: 'tab', id: 'st-1' }]);
    expect(out?.savedTabs).toEqual({});
  });

  test('a valid lensItemBindings slice survives an unrelated slice failure', () => {
    const out = salvagePersistedState({
      ...validPersistedState(),
      lensItemBindings: { 'sf-1': { '42': { 100: { tabId: 7, allowGlob: '' } } } },
      savedTabs: { bad: { id: 'bad' } }, // malformed → whole-state validation fails
    });
    expect(out).not.toBeNull();
    expect(out?.lensItemBindings).toEqual({
      'sf-1': { '42': { 100: { tabId: 7, allowGlob: '' } } },
    });
    expect(out?.savedTabs).toEqual({});
  });

  test('a malformed lensItemBindings slice resets to {}', () => {
    const out = salvagePersistedState({
      ...validPersistedState(),
      spaces: [{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }],
      lensItemBindings: { 'sf-1': { '42': 'not a window record' } },
    });
    expect(out).not.toBeNull();
    expect(out?.lensItemBindings).toEqual({});
    expect(out?.spaces).toEqual([{ id: 'a', name: 'Work', color: 'blue', icon: 'star' }]);
  });
});

describe('persist', () => {
  test('writes envelope to lunma.state (without the ephemeral liveTabsById/lenses slices)', async () => {
    const state = createInitialState();
    const { liveTabsById: _drop, lenses: _drop2, ...persistable } = state;
    await persist(state);
    expect(chromeMock.data['lunma.state']).toEqual({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      state: persistable,
    });
  });

  test('strips a populated liveTabsById before writing', async () => {
    const state = createInitialState();
    state.liveTabsById[17] = {
      tabId: 17,
      windowId: 100,
      title: 'Example',
      url: 'https://example.com/',
      active: true,
      status: 'complete',
    };
    await persist(state);
    const envelope = chromeMock.data['lunma.state'] as { state: Record<string, unknown> };
    expect(envelope.state).not.toHaveProperty('liveTabsById');
  });

  test('strips a populated lenses before writing; the rest is unchanged', async () => {
    const state = createInitialState();
    state.lenses['sf-1'] = {
      sections: {
        'gitlab:gitlab.com': {
          state: 'ok',
          items: [{ id: 'mr-1', title: 'Fix the build', url: 'https://gitlab.com/g/p/-/mr/1' }],
          fetchedAt: 1234,
        },
      },
    };
    await persist(state);
    const envelope = chromeMock.data['lunma.state'] as { state: Record<string, unknown> };
    expect(envelope.state).not.toHaveProperty('lenses');
    // The rest of the persisted state is exactly what it would be without the slice.
    const { liveTabsById: _l, lenses: _s, ...persistable } = createInitialState();
    expect(envelope.state).toEqual(persistable);
  });

  test('persisted shape does not bump CURRENT_SCHEMA_VERSION', async () => {
    await persist(createInitialState());
    const envelope = chromeMock.data['lunma.state'] as { schemaVersion: number };
    expect(envelope.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  test('loaded state carries no liveTabsById from disk', async () => {
    // Realistic on-disk envelope: written via persist(), so already stripped.
    await persist(createInitialState());
    const result = await readPersistedState();
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    // liveTabsById is ephemeral — absent from disk, present as `{}` in the
    // parsed in-memory state thanks to the Zod `.default({})`.
    expect(result.state.liveTabsById).toEqual({});
  });
});

describe('persist + readPersistedState round-trip from a live LunmaStore', () => {
  test('LunmaStore.snapshot() persists and reads back without STORAGE_CORRUPT', async () => {
    const { LunmaStore } = await import('../store.svelte');
    const store = new LunmaStore({ idFactory: () => 'sp-1' });
    store.createSpace({ name: 'A', color: 'red', icon: 'star' });
    store.state.tabBindings['st-1'] = { 100: 42 };
    store.state.savedTabs['st-1'] = {
      id: 'st-1',
      spaceId: 'sp-1',
      title: 'X',
      originalURL: 'https://x/',
      currentURL: null,
    };

    // The bug this guards against: persisting the raw $state proxy turned
    // `spaces` into `{}` on disk. Always go through snapshot().
    await persist(store.snapshot());

    const read = await readPersistedState();
    expect(read.kind).toBe('ok');
    if (read.kind !== 'ok') return;
    expect(Array.isArray(read.state.spaces)).toBe(true);
    expect(read.state.spaces).toHaveLength(1);
    expect(read.state.spaces[0]?.name).toBe('A');
    expect(read.state.tabBindings['st-1']).toEqual({ 100: 42 });
  });

  // NOTE on the underlying bug: this test environment cannot reproduce it.
  // Both jsdom's `structuredClone` and the in-memory mock preserve Svelte 5
  // `$state` array proxies as arrays. The actual chrome.storage.local.set
  // serializer in real Chrome turns those proxies into `{}` (verified
  // manually — see openspec/changes/typed-message-bus/tasks.md §9.4). The
  // round-trip test above proves the fix shape works; the bug shape is
  // covered by the manual verification recorded in tasks.md.
});
