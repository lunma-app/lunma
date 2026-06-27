import { describe, expect, test } from 'vitest';
import {
  AppStateV7Schema,
  AppStateV11Schema,
  AppStateV12Schema,
  AppStateV13Schema,
  CURRENT_SCHEMA_VERSION,
  EnvelopeSchema,
} from './schemas';
import { createInitialState } from './store.svelte';

// Validates the freshly-minted initial state against the current persisted
// schema (v13 — `createInitialState` now seeds the `sources` account map).
describe('AppStateV13Schema validation', () => {
  test('valid initial AppState parses', () => {
    const state = createInitialState();
    const result = AppStateV13Schema.safeParse(state);
    expect(result.success).toBe(true);
  });

  test('missing required field rejects', () => {
    const state = createInitialState() as unknown as Record<string, unknown>;
    delete state.spaces;
    const result = AppStateV13Schema.safeParse(state);
    expect(result.success).toBe(false);
  });

  test('unknown extra field rejects (strict)', () => {
    const state = { ...createInitialState(), extra: 'nope' };
    const result = AppStateV13Schema.safeParse(state);
    expect(result.success).toBe(false);
  });

  // connector-accounts: an account in the broadcast-safe `sources` map carries NO
  // secret — a `token` field on the account is rejected (the schema is strict),
  // so a token can never ride `AppState` / a state broadcast.
  test('a SourceAccount carrying a token is rejected (no secret reaches AppState)', () => {
    const state = createInitialState() as unknown as Record<string, unknown>;
    state.sources = {
      'acc-1': {
        id: 'acc-1',
        provider: 'github',
        baseUrl: 'https://github.com',
        token: 'ghp-leaked',
      },
    };
    const result = AppStateV13Schema.safeParse(state);
    expect(result.success).toBe(false);
  });

  test('a tokenless SourceAccount round-trips in the broadcast-safe sources map', () => {
    const state = createInitialState() as unknown as Record<string, unknown>;
    state.sources = {
      'acc-1': { id: 'acc-1', provider: 'github', baseUrl: 'https://github.com', name: 'Work' },
    };
    const result = AppStateV13Schema.safeParse(state);
    expect(result.success).toBe(true);
  });
});

describe('EnvelopeSchema', () => {
  test('parses a valid envelope', () => {
    const envelope = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      state: createInitialState(),
    };
    const result = EnvelopeSchema.safeParse(envelope);
    expect(result.success).toBe(true);
  });
});

// review-lens: the v12 schema widens the persisted lens node's `lensKind` enum.
describe('AppStateV12Schema lensKind enum widening', () => {
  function stateWithLens(lensKind: string) {
    const state = createInitialState() as unknown as Record<string, unknown>;
    // V12 is frozen pre-`sources` (strict) — drop the v13 account map and the
    // ephemeral peek slice so the historical schema validates the embedded lens shape.
    delete state.sources;
    delete state.lensPeekByWindow;
    state.spaces = [{ id: 'work', name: 'Work', color: 'blue', icon: 'star' }];
    state.pinnedBySpace = {
      work: [
        {
          kind: 'lens',
          lensKind,
          id: 'f1',
          name: 'Review',
          icon: 'folder-git-2',
          sources: [
            { source: 'github', baseUrl: 'https://github.com', queries: ['review-requested'] },
          ],
          maxItems: 20,
          hideRead: true,
          refreshMinutes: 10,
        },
      ],
    };
    return state;
  }

  test('a general lens node round-trips under v12', () => {
    expect(AppStateV12Schema.safeParse(stateWithLens('general')).success).toBe(true);
  });

  test('a review lens node validates under v12 (widened enum)', () => {
    expect(AppStateV12Schema.safeParse(stateWithLens('review')).success).toBe(true);
  });

  test('the frozen v11 schema rejects a review node (downgrade detectable)', () => {
    expect(AppStateV11Schema.safeParse(stateWithLens('review')).success).toBe(false);
  });

  test('an unknown lensKind rejects under v12 (closed enum)', () => {
    expect(AppStateV12Schema.safeParse(stateWithLens('tickets')).success).toBe(false);
  });
});

describe('saved-tab boundary', () => {
  function envelopeWithSavedTab(boundary?: unknown) {
    const state = createInitialState() as unknown as Record<string, unknown>;
    state.savedTabs = {
      st1: {
        id: 'st1',
        spaceId: 'work',
        title: 'Gmail',
        originalURL: 'https://mail.google.com/',
        currentURL: null,
        ...(boundary !== undefined ? { boundary } : {}),
      },
    };
    return { schemaVersion: CURRENT_SCHEMA_VERSION, state };
  }

  test('accepts a saved tab with no boundary (absent = inherit)', () => {
    expect(EnvelopeSchema.safeParse(envelopeWithSavedTab()).success).toBe(true);
  });

  test('accepts a locked boundary with host globs', () => {
    const env = envelopeWithSavedTab({ mode: 'locked', allow: ['*.example.com'] });
    expect(EnvelopeSchema.safeParse(env).success).toBe(true);
  });

  test('accepts a locked boundary with URL-pattern globs', () => {
    const env = envelopeWithSavedTab({
      mode: 'locked',
      allow: ['https://gitlab.com/dashboard/merge_requests*', 'gitlab.com'],
    });
    expect(EnvelopeSchema.safeParse(env).success).toBe(true);
  });

  test('accepts an explicit off boundary', () => {
    expect(EnvelopeSchema.safeParse(envelopeWithSavedTab({ mode: 'off' })).success).toBe(true);
  });

  test('rejects an unknown boundary mode (strict discriminant)', () => {
    expect(EnvelopeSchema.safeParse(envelopeWithSavedTab({ mode: 'bogus' })).success).toBe(false);
  });

  test('rejects a locked boundary missing its allow list', () => {
    expect(EnvelopeSchema.safeParse(envelopeWithSavedTab({ mode: 'locked' })).success).toBe(false);
  });
});

describe('AppStateV7Schema smartItemBindings slot shape', () => {
  function stateWithBindings(bindings: unknown) {
    const state = createInitialState() as unknown as Record<string, unknown>;
    // V7Schema uses old field names; strip V11/V13 fields and add V7-compatible ones.
    delete state.sources;
    delete state.lensPeekByWindow;
    delete state.lensItemBindings;
    delete state.lensReadState;
    delete state.lenses;
    state.smartItemBindings = bindings;
    state.smartReadState = {};
    state.smartFolders = {};
    return state;
  }

  test('valid { tabId, allowGlob } slot parses', () => {
    const result = AppStateV7Schema.safeParse(
      stateWithBindings({ folder1: { item1: { 1: { tabId: 42, allowGlob: 'example.com' } } } }),
    );
    expect(result.success).toBe(true);
  });

  test('bare-number slot rejects (v6 shape not accepted by v7)', () => {
    const result = AppStateV7Schema.safeParse(stateWithBindings({ folder1: { item1: { 1: 42 } } }));
    expect(result.success).toBe(false);
  });

  test('missing allowGlob rejects', () => {
    const result = AppStateV7Schema.safeParse(
      stateWithBindings({ folder1: { item1: { 1: { tabId: 42 } } } }),
    );
    expect(result.success).toBe(false);
  });
});
