import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getCurrentWindowId } from './window-id';

interface ChromeWindowsMock {
  getCurrent: ReturnType<typeof vi.fn>;
}

function installChrome(mock: ChromeWindowsMock): void {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    windows: { getCurrent: mock.getCurrent },
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
});

describe('getCurrentWindowId', () => {
  test('happy path: returns chrome.windows.getCurrent().id', async () => {
    const mock: ChromeWindowsMock = {
      getCurrent: vi.fn(async () => ({ id: 42 }) as chrome.windows.Window),
    };
    installChrome(mock);
    await expect(getCurrentWindowId()).resolves.toBe(42);
    expect(mock.getCurrent).toHaveBeenCalledTimes(1);
    expect(mock.getCurrent).toHaveBeenCalledWith({});
  });

  test('rejects when chrome.windows.getCurrent throws', async () => {
    const mock: ChromeWindowsMock = {
      getCurrent: vi.fn(async () => {
        throw new Error('no current window');
      }),
    };
    installChrome(mock);
    await expect(getCurrentWindowId()).rejects.toThrow(/chrome\.windows\.getCurrent failed/);
  });

  test('rejects when chrome.windows.getCurrent returns no id', async () => {
    const mock: ChromeWindowsMock = {
      getCurrent: vi.fn(async () => ({}) as chrome.windows.Window),
    };
    installChrome(mock);
    await expect(getCurrentWindowId()).rejects.toThrow(/no id/);
  });
});
