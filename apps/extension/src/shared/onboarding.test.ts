import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DEFAULTS, loadOnboarding, setAutoArchiveNoticeDismissed } from './onboarding';

interface ChromeSyncMock {
  data: Record<string, unknown>;
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
}

function installChromeMock(): ChromeSyncMock {
  const mock: ChromeSyncMock = {
    data: {},
    get: vi.fn(async (key: string | null) => {
      if (key === null) return { ...mock.data };
      const value = mock.data[key];
      return value === undefined ? {} : { [key]: value };
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(mock.data, items);
    }),
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { sync: { get: mock.get, set: mock.set } },
  };
  return mock;
}

let chromeMock: ChromeSyncMock;

beforeEach(() => {
  chromeMock = installChromeMock();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('loadOnboarding', () => {
  test('returns DEFAULTS (not-dismissed) on first read with no record', async () => {
    const onboarding = await loadOnboarding();
    expect(onboarding).toEqual(DEFAULTS);
    expect(onboarding.autoArchiveNoticeDismissed).toBe(false);
  });

  test('reads a valid saved value', async () => {
    chromeMock.data['lunma.onboarding'] = { autoArchiveNoticeDismissed: true };
    expect((await loadOnboarding()).autoArchiveNoticeDismissed).toBe(true);
  });

  test('malformed (non-object) stored value falls back to DEFAULTS', async () => {
    chromeMock.data['lunma.onboarding'] = 'nonsense';
    expect(await loadOnboarding()).toEqual(DEFAULTS);
  });

  test('wrong-typed field falls back to its default', async () => {
    chromeMock.data['lunma.onboarding'] = { autoArchiveNoticeDismissed: 'yes' };
    expect((await loadOnboarding()).autoArchiveNoticeDismissed).toBe(false);
  });

  test('storage-failure read returns DEFAULTS without throwing', async () => {
    chromeMock.get.mockRejectedValueOnce(new Error('unavailable'));
    expect(await loadOnboarding()).toEqual(DEFAULTS);
  });
});

describe('setAutoArchiveNoticeDismissed', () => {
  test('round-trips: writing true is read back as dismissed', async () => {
    await setAutoArchiveNoticeDismissed(true);
    expect(chromeMock.set).toHaveBeenCalledWith({
      'lunma.onboarding': { autoArchiveNoticeDismissed: true },
    });
    expect((await loadOnboarding()).autoArchiveNoticeDismissed).toBe(true);
  });

  test('merges onto the existing record rather than replacing it', async () => {
    chromeMock.data['lunma.onboarding'] = { autoArchiveNoticeDismissed: true };
    await setAutoArchiveNoticeDismissed(false);
    expect((await loadOnboarding()).autoArchiveNoticeDismissed).toBe(false);
  });

  test('a write failure is swallowed (never rejects to the caller)', async () => {
    chromeMock.set.mockRejectedValueOnce(new Error('quota'));
    await expect(setAutoArchiveNoticeDismissed(true)).resolves.toBeUndefined();
  });
});
