import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Boot mounts a Svelte app and talks to the SW. We stub those so the test can
// focus on the density side-effect: `mount` is a no-op, `NewTab` never renders,
// and the messages / window-id deps resolve trivially so `boot()` takes the
// normal (window-resolved) path. Only `chrome.storage` is real-ish — `boot()`
// reads density through the real `readSettings` / `watchSettings`.
const mountMock = vi.fn();
vi.mock('svelte', () => ({ mount: mountMock }));
vi.mock('./NewTab.svelte', () => ({ default: {} }));
vi.mock('../../shared/window-id', () => ({ getCurrentWindowId: vi.fn(async () => 1) }));
vi.mock('../../shared/messages', () => ({
  onStateBroadcast: vi.fn(() => () => undefined),
  requestStateSnapshot: vi.fn(async () => null),
}));

type StorageListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string,
) => void;

interface ChromeSyncMock {
  data: Record<string, unknown>;
  listeners: StorageListener[];
  emit: (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void;
}

function installChromeMock(): ChromeSyncMock {
  const mock: ChromeSyncMock = {
    data: {},
    listeners: [],
    emit: (changes, areaName) => {
      for (const l of mock.listeners) l(changes, areaName);
    },
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      sync: {
        get: vi.fn(async (key: string | null) => {
          if (key === null) return { ...mock.data };
          const value = mock.data[key];
          return value === undefined ? {} : { [key]: value };
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(mock.data, items);
        }),
      },
      onChanged: {
        addListener: (l: StorageListener) => mock.listeners.push(l),
        removeListener: (l: StorageListener) => {
          mock.listeners = mock.listeners.filter((x) => x !== l);
        },
      },
    },
  };
  return mock;
}

const SETTINGS_KEY = 'lunma.settings';

function seedSettings(mock: ChromeSyncMock, density: string): void {
  mock.data[SETTINGS_KEY] = {
    density,
    tint: 'vivid',
    pinnedTabBoundaryDefault: 'off',
    defaultSearchEngine: 'google',
    customSearchUrl: '',
    customSearchKeyword: '',
  };
}

let chromeMock: ChromeSyncMock;

/** Re-import `main` so its `boot()` IIFE re-runs against the current stubs. */
async function loadMain(): Promise<void> {
  vi.resetModules();
  await import('./main');
}

beforeEach(() => {
  chromeMock = installChromeMock();
  mountMock.mockClear();
  delete document.documentElement.dataset.density;
  const app = document.createElement('div');
  app.id = 'app';
  document.body.appendChild(app);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'debug').mockImplementation(() => undefined);
});

afterEach(() => {
  for (const el of document.querySelectorAll('#app')) el.remove();
  delete document.documentElement.dataset.density;
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
  vi.restoreAllMocks();
});

describe('new-tab boot — density', () => {
  test('applies data-density from the saved setting before mount', async () => {
    seedSettings(chromeMock, 'comfort');
    await loadMain();
    // boot() reads settings then mounts; the attribute is set before mount.
    await vi.waitFor(() => expect(mountMock).toHaveBeenCalled());
    expect(document.documentElement.dataset.density).toBe('comfort');
  });

  test('omits data-density for the Normal default', async () => {
    seedSettings(chromeMock, 'normal');
    await loadMain();
    await vi.waitFor(() => expect(mountMock).toHaveBeenCalled());
    expect(document.documentElement.dataset.density).toBeUndefined();
  });

  test('re-applies data-density on a watchSettings change (no reload)', async () => {
    seedSettings(chromeMock, 'normal');
    await loadMain();
    await vi.waitFor(() => expect(mountMock).toHaveBeenCalled());
    expect(document.documentElement.dataset.density).toBeUndefined();

    // The user switches to Comfort in the options page → a sync storage change.
    seedSettings(chromeMock, 'comfort');
    chromeMock.emit({ [SETTINGS_KEY]: { newValue: chromeMock.data[SETTINGS_KEY] } }, 'sync');
    expect(document.documentElement.dataset.density).toBe('comfort');

    // …and back to Normal clears the attribute.
    seedSettings(chromeMock, 'normal');
    chromeMock.emit({ [SETTINGS_KEY]: { newValue: chromeMock.data[SETTINGS_KEY] } }, 'sync');
    expect(document.documentElement.dataset.density).toBeUndefined();
  });
});
