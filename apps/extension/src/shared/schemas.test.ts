import { describe, expect, test } from 'vitest';
import { AppStateV5Schema, CURRENT_SCHEMA_VERSION, EnvelopeSchema } from './schemas';
import { createInitialState } from './store.svelte';

// Validates the freshly-minted initial state against the persisted schema.
// `createInitialState()` carries the `faviconRow` placement (favicon-row-model,
// ADR 0010), a nullable `spaceId` shape, and the optional per-Space `autoArchive`
// override (auto-archive) — all part of the current `AppStateV5Schema` shape.
describe('AppStateV5Schema validation', () => {
  test('valid initial AppState parses', () => {
    const state = createInitialState();
    const result = AppStateV5Schema.safeParse(state);
    expect(result.success).toBe(true);
  });

  test('missing required field rejects', () => {
    const state = createInitialState() as unknown as Record<string, unknown>;
    delete state.spaces;
    const result = AppStateV5Schema.safeParse(state);
    expect(result.success).toBe(false);
  });

  test('unknown extra field rejects (strict)', () => {
    const state = { ...createInitialState(), extra: 'nope' };
    const result = AppStateV5Schema.safeParse(state);
    expect(result.success).toBe(false);
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
