import { describe, expect, test } from 'vitest';
import { buildBackup, parseBackup } from './backup';
import { CURRENT_SCHEMA_VERSION } from './schemas';
import type { Settings } from './settings';
import { DEFAULTS } from './settings';
import { createInitialState } from './store.svelte';
import type { AppState, BackupEnvelope } from './types';

function makeState(overrides: Partial<AppState> = {}): AppState {
  return { ...createInitialState(), ...overrides };
}

const SAMPLE_SETTINGS: Settings = { ...DEFAULTS, density: 'compact', tint: 'subtle' };

describe('buildBackup', () => {
  test('produces a valid BackupEnvelope for the initial state', () => {
    const state = makeState();
    const envelope = buildBackup(state);

    expect(envelope.formatVersion).toBe(1);
    expect(envelope.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(typeof envelope.exportedAt).toBe('number');
    expect(envelope.state.spaces).toEqual(state.spaces);
    expect(envelope.state.savedTabs).toEqual(state.savedTabs);
    expect(envelope.settings).toBeUndefined();
  });

  test('includes settings when passed', () => {
    const state = makeState();
    const envelope = buildBackup(state, SAMPLE_SETTINGS);
    expect(envelope.settings).toEqual(SAMPLE_SETTINGS);
  });

  test('excludes window-bound fields from the state slice', () => {
    const state = makeState({
      tabBindings: { 'st-1': { 1: 42 } },
      spaceInstancesByWindow: {
        1: { 'sp-1': { spaceId: 'sp-1', groupId: 99, tempTabIds: [42], tempTabTitles: {} } },
      },
      activeSpaceByWindow: { 1: 'sp-1' },
      tabLastActivity: { 42: Date.now() },
    });
    const envelope = buildBackup(state);

    // PortableAppState has no window-bound keys
    expect('tabBindings' in envelope.state).toBe(false);
    expect('spaceInstancesByWindow' in envelope.state).toBe(false);
    expect('activeSpaceByWindow' in envelope.state).toBe(false);
    expect('tabLastActivity' in envelope.state).toBe(false);
    expect('liveTabsById' in envelope.state).toBe(false);
    expect('lenses' in envelope.state).toBe(false);
    expect('lensItemBindings' in envelope.state).toBe(false);
  });
});

describe('parseBackup', () => {
  test('round-trips: buildBackup → parseBackup is identity on portable fields', () => {
    const state = makeState({
      spaces: [{ id: 'sp-1', name: 'Work', color: 'blue', icon: 'star' }],
      savedTabs: {
        'st-1': {
          id: 'st-1',
          spaceId: 'sp-1',
          title: 'Gmail',
          originalURL: 'https://mail.google.com',
          currentURL: null,
        },
      },
      lastActivatedSpaceId: 'sp-1',
    });
    const envelope = buildBackup(state);
    const result = parseBackup(envelope);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.state.spaces).toEqual(state.spaces);
    expect(result.state.savedTabs).toEqual(state.savedTabs);
    expect(result.state.lastActivatedSpaceId).toBe(state.lastActivatedSpaceId);
    expect(result.settings).toBeUndefined();
  });

  test('connected accounts (sources) travel with the backup and round-trip', () => {
    const state = makeState({
      sources: {
        'acc-1': { id: 'acc-1', provider: 'github', baseUrl: 'https://github.com', name: 'Work' },
      },
      pinnedBySpace: {
        'sp-1': [
          {
            kind: 'lens',
            id: 'lens-1',
            name: 'Reviews',
            icon: 'folder-git-2',
            lensKind: 'review',
            sources: [{ sourceId: 'acc-1', queries: ['review-requested'] }],
            maxItems: 20,
            hideRead: true,
            refreshMinutes: 10,
          },
        ],
      },
    });
    const envelope = buildBackup(state);
    // The account entity is carried in the portable state (no token).
    expect(envelope.state.sources).toEqual(state.sources);

    const result = parseBackup(envelope);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // The restored lens reference resolves against the restored account.
    expect(result.state.sources['acc-1']?.baseUrl).toBe('https://github.com');
    expect(result.state.pinnedBySpace['sp-1']?.[0]).toMatchObject({
      kind: 'lens',
      sources: [{ sourceId: 'acc-1', queries: ['review-requested'] }],
    });
  });

  test('round-trips settings when included', () => {
    const state = makeState();
    const envelope = buildBackup(state, SAMPLE_SETTINGS);
    const result = parseBackup(envelope);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.settings).toEqual(SAMPLE_SETTINGS);
  });

  test('a backup at an older schemaVersion migrates forward', () => {
    const state = makeState();
    const olderEnvelope: BackupEnvelope = {
      formatVersion: 1,
      schemaVersion: 1,
      exportedAt: Date.now(),
      state: {
        schemaVersion: 1,
        spaces: [],
        sources: {},
        savedTabs: {},
        pinnedBySpace: {},
        faviconRow: [],
        archivedTabs: [],
        trash: {},
        lastActivatedSpaceId: null,
      },
    };
    const result = parseBackup(olderEnvelope);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // After migration, the schemaVersion should be the current version
    expect(result.state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    void state;
  });

  test('a malformed payload returns { ok: false }', () => {
    expect(parseBackup(null).ok).toBe(false);
    expect(parseBackup({ formatVersion: 99 }).ok).toBe(false);
    expect(
      parseBackup({ formatVersion: 1, schemaVersion: 5, exportedAt: 0, state: 'bad' }).ok,
    ).toBe(false);
  });

  test('window-bound maps are reset to empty defaults on import', () => {
    const state = makeState({
      spaces: [{ id: 'sp-1', name: 'Work', color: 'blue', icon: 'star' }],
    });
    const envelope = buildBackup(state);
    const result = parseBackup(envelope);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.tabBindings).toEqual({});
    expect(result.state.spaceInstancesByWindow).toEqual({});
    expect(result.state.activeSpaceByWindow).toEqual({});
    expect(result.state.tabLastActivity).toEqual({});
    expect(result.state.liveTabsById).toEqual({});
    expect(result.state.lenses).toEqual({});
  });
});
