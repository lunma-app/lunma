import { describe, expect, test } from 'vitest';
import { nextSpaceId } from './space-navigation';

const SPACES = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('nextSpaceId', () => {
  test('delta +1 advances to the next space', () => {
    expect(nextSpaceId(SPACES, 'a', 1)).toBe('b');
    expect(nextSpaceId(SPACES, 'b', 1)).toBe('c');
  });

  test('delta -1 advances to the previous space', () => {
    expect(nextSpaceId(SPACES, 'b', -1)).toBe('a');
    expect(nextSpaceId(SPACES, 'c', -1)).toBe('b');
  });

  test('returns null past the last Space (no wrap-around)', () => {
    expect(nextSpaceId(SPACES, 'c', 1)).toBeNull();
  });

  test('returns null before the first Space (no wrap-around)', () => {
    expect(nextSpaceId(SPACES, 'a', -1)).toBeNull();
  });

  test('returns null on an empty list', () => {
    expect(nextSpaceId([], 'a', 1)).toBeNull();
    expect(nextSpaceId([], null, -1)).toBeNull();
  });

  test('returns null when the only space is already current', () => {
    expect(nextSpaceId([{ id: 'a' }], 'a', 1)).toBeNull();
    expect(nextSpaceId([{ id: 'a' }], 'a', -1)).toBeNull();
  });

  test('with no active space, +1 lands on first and -1 on last', () => {
    expect(nextSpaceId(SPACES, null, 1)).toBe('a');
    expect(nextSpaceId(SPACES, null, -1)).toBe('c');
  });

  test('unknown current id is treated as no-current', () => {
    expect(nextSpaceId(SPACES, 'ghost', 1)).toBe('a');
    expect(nextSpaceId(SPACES, 'ghost', -1)).toBe('c');
  });
});
