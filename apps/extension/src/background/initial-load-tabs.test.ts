import { beforeEach, describe, expect, test } from 'vitest';
import {
  clearInitialLoad,
  isInitialLoad,
  markInitialLoad,
  resetInitialLoadTabs,
} from './initial-load-tabs';

describe('initial-load-tabs', () => {
  beforeEach(() => resetInitialLoadTabs());

  test('a marked tab is initial-load', () => {
    markInitialLoad(42);
    expect(isInitialLoad(42)).toBe(true);
  });

  test('an unmarked tab is not initial-load', () => {
    expect(isInitialLoad(42)).toBe(false);
  });

  test('clearing removes the mark', () => {
    markInitialLoad(42);
    clearInitialLoad(42);
    expect(isInitialLoad(42)).toBe(false);
  });

  test('clearing an unmarked tab is a no-op', () => {
    expect(() => clearInitialLoad(42)).not.toThrow();
    expect(isInitialLoad(42)).toBe(false);
  });

  test('marks are independent per tab id', () => {
    markInitialLoad(1);
    expect(isInitialLoad(1)).toBe(true);
    expect(isInitialLoad(2)).toBe(false);
  });

  test('reset clears every mark', () => {
    markInitialLoad(1);
    markInitialLoad(2);
    resetInitialLoadTabs();
    expect(isInitialLoad(1)).toBe(false);
    expect(isInitialLoad(2)).toBe(false);
  });
});
