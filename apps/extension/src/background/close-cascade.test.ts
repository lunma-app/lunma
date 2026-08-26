import { beforeEach, describe, expect, test } from 'vitest';
import { clearCascading, isCascading, markCascading, resetCloseCascade } from './close-cascade';

beforeEach(() => {
  resetCloseCascade();
});

describe('close-cascade re-entrancy registry', () => {
  test('a marked tab reads as cascading', () => {
    markCascading([1, 2]);
    expect(isCascading(1)).toBe(true);
    expect(isCascading(2)).toBe(true);
  });

  test('an unmarked tab does not', () => {
    markCascading([1]);
    expect(isCascading(9)).toBe(false);
  });

  test('clearing one id leaves the rest of the batch marked', () => {
    // Removals arrive one at a time; clearing the first must not un-suppress the
    // others, or the second report would start a second cascade.
    markCascading([1, 2, 3]);
    clearCascading(1);
    expect(isCascading(1)).toBe(false);
    expect(isCascading(2)).toBe(true);
    expect(isCascading(3)).toBe(true);
  });

  test('clearing a whole batch clears every member', () => {
    markCascading([1, 2, 3]);
    clearCascading([1, 2, 3]);
    expect([1, 2, 3].some(isCascading)).toBe(false);
  });

  test('clearing an unmarked id is a no-op', () => {
    markCascading([1]);
    expect(() => clearCascading(9)).not.toThrow();
    expect(isCascading(1)).toBe(true);
  });

  test('clearing twice is a no-op', () => {
    // The per-removal clear and the batch clear race by design; whichever lands
    // second must not throw.
    markCascading([1]);
    clearCascading(1);
    expect(() => clearCascading([1])).not.toThrow();
    expect(isCascading(1)).toBe(false);
  });

  test('reset empties the registry', () => {
    markCascading([1, 2]);
    resetCloseCascade();
    expect([1, 2].some(isCascading)).toBe(false);
  });
});
