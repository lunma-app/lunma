import { describe, expect, test } from 'vitest';
import {
  isRootTransition,
  PROVENANCE_EDGE_CAP,
  PROVENANCE_MAX_DEPTH,
  PROVENANCE_SESSION_MARKER_KEY,
  TAB_TOKEN_KEY,
} from './provenance';

describe('isRootTransition', () => {
  test('treats every documented root transition as a root', () => {
    for (const t of [
      'start_page',
      'auto_toplevel',
      'typed',
      'auto_bookmark',
      'generated',
      'reload',
      'keyword',
    ]) {
      expect(isRootTransition(t), `${t} should be a root`).toBe(true);
    }
  });

  test('a link transition is not a root — it is the attributable case', () => {
    expect(isRootTransition('link')).toBe(false);
  });

  test('an unrecognised transition is treated as a root (fail open)', () => {
    // A wrong parent is worse than no parent, so anything unfamiliar is a root.
    expect(isRootTransition('form_submit')).toBe(true);
    expect(isRootTransition('')).toBe(true);
  });
});

describe('provenance constants', () => {
  test('the page key and session marker key are the specified literals', () => {
    expect(TAB_TOKEN_KEY).toBe('lunma.tabToken');
    expect(PROVENANCE_SESSION_MARKER_KEY).toBe('lunma.provenanceSession');
  });

  test('the caps carry their specified values', () => {
    expect(PROVENANCE_EDGE_CAP).toBe(2000);
    expect(PROVENANCE_MAX_DEPTH).toBe(5);
  });
});
