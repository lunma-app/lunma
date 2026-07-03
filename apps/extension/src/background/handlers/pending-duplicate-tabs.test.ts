import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  consumePendingDuplicateTab,
  markPendingDuplicateTab,
  resetPendingDuplicateTabs,
} from './pending-duplicate-tabs';

describe('pending-duplicate-tabs', () => {
  beforeEach(() => {
    resetPendingDuplicateTabs();
    vi.useRealTimers();
  });

  test('consuming a matching record returns the source tab id', () => {
    markPendingDuplicateTab(100, 'https://example.com/', 42);
    expect(consumePendingDuplicateTab(100, 'https://example.com/')).toBe(42);
  });

  test('consuming removes the record — a second consume returns null', () => {
    markPendingDuplicateTab(100, 'https://example.com/', 42);
    consumePendingDuplicateTab(100, 'https://example.com/');
    expect(consumePendingDuplicateTab(100, 'https://example.com/')).toBeNull();
  });

  test('returns null when there is no matching record', () => {
    expect(consumePendingDuplicateTab(100, 'https://example.com/')).toBeNull();
  });

  test('does not match a different windowId', () => {
    markPendingDuplicateTab(100, 'https://example.com/', 42);
    expect(consumePendingDuplicateTab(200, 'https://example.com/')).toBeNull();
  });

  test('does not match a different url', () => {
    markPendingDuplicateTab(100, 'https://example.com/', 42);
    expect(consumePendingDuplicateTab(100, 'https://other.example/')).toBeNull();
  });

  test('reset clears all pending records', () => {
    markPendingDuplicateTab(100, 'https://example.com/', 42);
    resetPendingDuplicateTabs();
    expect(consumePendingDuplicateTab(100, 'https://example.com/')).toBeNull();
  });

  test('a record expires after its TTL', () => {
    vi.useFakeTimers();
    try {
      markPendingDuplicateTab(100, 'https://example.com/', 42);
      vi.advanceTimersByTime(6000);
      expect(consumePendingDuplicateTab(100, 'https://example.com/')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
