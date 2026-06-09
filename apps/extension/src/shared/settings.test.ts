import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DEFAULTS, readSettings, watchSettings, writeSetting } from './settings';

type StorageListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string,
) => void;

interface ChromeSyncMock {
  data: Record<string, unknown>;
  listeners: StorageListener[];
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  /** Emit an onChanged event as Chrome would (after a set). */
  emit: (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void;
}

function installChromeMock(): ChromeSyncMock {
  const mock: ChromeSyncMock = {
    data: {},
    listeners: [],
    get: vi.fn(async (key: string | null) => {
      if (key === null) return { ...mock.data };
      const value = mock.data[key];
      return value === undefined ? {} : { [key]: value };
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(mock.data, items);
    }),
    emit: (changes, areaName) => {
      for (const l of mock.listeners) l(changes, areaName);
    },
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      sync: { get: mock.get, set: mock.set },
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

let chromeMock: ChromeSyncMock;

beforeEach(() => {
  chromeMock = installChromeMock();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('readSettings', () => {
  test('returns DEFAULTS on first read (no saved settings)', async () => {
    const settings = await readSettings();
    expect(settings).toEqual(DEFAULTS);
    expect(settings.density).toBe('normal');
  });

  test('unknown enum value falls back to the declared default', async () => {
    chromeMock.data['lunma.settings'] = { density: 'ultra' };
    const settings = await readSettings();
    expect(settings.density).toBe('normal');
  });

  test('malformed (non-object) stored value yields DEFAULTS', async () => {
    chromeMock.data['lunma.settings'] = 'nonsense';
    expect(await readSettings()).toEqual(DEFAULTS);
  });

  test('absent object yields DEFAULTS without throwing', async () => {
    expect(await readSettings()).toEqual(DEFAULTS);
  });

  test('reads a valid saved value', async () => {
    chromeMock.data['lunma.settings'] = { density: 'compact' };
    expect((await readSettings()).density).toBe('compact');
  });

  test('storage-failure read returns DEFAULTS', async () => {
    chromeMock.get.mockRejectedValueOnce(new Error('unavailable'));
    expect(await readSettings()).toEqual(DEFAULTS);
  });
});

describe('writeSetting', () => {
  test('merges one field and persists it', async () => {
    await writeSetting('density', 'comfort');
    // The merge reads current (defaults) then overrides, so the stored object
    // carries every field — including the `tint` and Search defaults.
    expect(chromeMock.data['lunma.settings']).toEqual({
      density: 'comfort',
      tint: 'vivid',
      pinnedTabBoundaryDefault: 'off',
      defaultSearchEngine: 'google',
      customSearchUrl: '',
      customSearchKeyword: '',
      autoArchiveEnabled: true,
      autoArchiveIdleMinutes: 720,
      autoArchiveRetentionDays: 7,
    });
  });

  test('preserves other fields when merging', async () => {
    chromeMock.data['lunma.settings'] = { density: 'compact', tint: 'subtle' };
    await writeSetting('density', 'comfort');
    // The merge reads-current-then-overrides: only `density` changes; `tint`
    // is preserved from the stored object (and the absent boundary default +
    // Search keys settle to their declared defaults).
    expect(chromeMock.data['lunma.settings']).toEqual({
      density: 'comfort',
      tint: 'subtle',
      pinnedTabBoundaryDefault: 'off',
      defaultSearchEngine: 'google',
      customSearchUrl: '',
      customSearchKeyword: '',
      autoArchiveEnabled: true,
      autoArchiveIdleMinutes: 720,
      autoArchiveRetentionDays: 7,
    });
  });

  test('does not reject when storage set fails', async () => {
    chromeMock.set.mockRejectedValueOnce(new Error('quota'));
    await expect(writeSetting('density', 'compact')).resolves.toBeUndefined();
  });
});

describe('watchSettings', () => {
  test('fires on the right key + sync area', async () => {
    const cb = vi.fn();
    watchSettings(cb);
    chromeMock.emit(
      {
        'lunma.settings': { oldValue: undefined, newValue: { density: 'comfort', tint: 'vivid' } },
      },
      'sync',
    );
    expect(cb).toHaveBeenCalledWith({
      density: 'comfort',
      tint: 'vivid',
      pinnedTabBoundaryDefault: 'off',
      defaultSearchEngine: 'google',
      customSearchUrl: '',
      customSearchKeyword: '',
      autoArchiveEnabled: true,
      autoArchiveIdleMinutes: 720,
      autoArchiveRetentionDays: 7,
    });
  });

  test('ignores the local area', () => {
    const cb = vi.fn();
    watchSettings(cb);
    chromeMock.emit(
      { 'lunma.settings': { oldValue: undefined, newValue: { density: 'comfort' } } },
      'local',
    );
    expect(cb).not.toHaveBeenCalled();
  });

  test('ignores changes to other keys', () => {
    const cb = vi.fn();
    watchSettings(cb);
    chromeMock.emit({ 'lunma.state': { oldValue: undefined, newValue: { foo: 1 } } }, 'sync');
    expect(cb).not.toHaveBeenCalled();
  });

  test('stops firing after unsubscribe', () => {
    const cb = vi.fn();
    const unsubscribe = watchSettings(cb);
    unsubscribe();
    chromeMock.emit(
      { 'lunma.settings': { oldValue: undefined, newValue: { density: 'comfort' } } },
      'sync',
    );
    expect(cb).not.toHaveBeenCalled();
  });

  test('falls back to DEFAULTS when the new value is malformed', () => {
    const cb = vi.fn();
    watchSettings(cb);
    chromeMock.emit(
      { 'lunma.settings': { oldValue: undefined, newValue: { density: 'ultra' } } },
      'sync',
    );
    expect(cb).toHaveBeenCalledWith({
      density: 'normal',
      tint: 'vivid',
      pinnedTabBoundaryDefault: 'off',
      defaultSearchEngine: 'google',
      customSearchUrl: '',
      customSearchKeyword: '',
      autoArchiveEnabled: true,
      autoArchiveIdleMinutes: 720,
      autoArchiveRetentionDays: 7,
    });
  });
});

describe('tint setting', () => {
  test('defaults to vivid when no value is stored', async () => {
    const settings = await readSettings();
    expect(settings.tint).toBe('vivid');
    expect(DEFAULTS.tint).toBe('vivid');
  });

  test('reads a valid stored tint', async () => {
    chromeMock.data['lunma.settings'] = { density: 'normal', tint: 'subtle' };
    expect((await readSettings()).tint).toBe('subtle');
  });

  test('out-of-range stored tint falls back to vivid (not failing the whole read)', async () => {
    chromeMock.data['lunma.settings'] = { density: 'compact', tint: 'ultra' };
    const settings = await readSettings();
    expect(settings.tint).toBe('vivid');
    // The valid sibling field still parses — the per-field `.catch` is isolated.
    expect(settings.density).toBe('compact');
  });

  test('writeSetting persists a tint change', async () => {
    await writeSetting('tint', 'standard');
    expect((chromeMock.data['lunma.settings'] as { tint: string }).tint).toBe('standard');
  });

  test('watchSettings fires on a tint change', () => {
    const cb = vi.fn();
    watchSettings(cb);
    chromeMock.emit(
      {
        'lunma.settings': {
          oldValue: undefined,
          newValue: { density: 'normal', tint: 'standard' },
        },
      },
      'sync',
    );
    expect(cb).toHaveBeenCalledWith({
      density: 'normal',
      tint: 'standard',
      pinnedTabBoundaryDefault: 'off',
      defaultSearchEngine: 'google',
      customSearchUrl: '',
      customSearchKeyword: '',
      autoArchiveEnabled: true,
      autoArchiveIdleMinutes: 720,
      autoArchiveRetentionDays: 7,
    });
  });
});

describe('pinnedTabBoundaryDefault setting', () => {
  test('defaults to off when no value is stored', async () => {
    const settings = await readSettings();
    expect(settings.pinnedTabBoundaryDefault).toBe('off');
    expect(DEFAULTS.pinnedTabBoundaryDefault).toBe('off');
  });

  test('reads a valid stored value', async () => {
    chromeMock.data['lunma.settings'] = { density: 'normal', pinnedTabBoundaryDefault: 'domain' };
    expect((await readSettings()).pinnedTabBoundaryDefault).toBe('domain');
  });

  test('an unknown stored value falls back to off', async () => {
    chromeMock.data['lunma.settings'] = { pinnedTabBoundaryDefault: 'bogus' };
    expect((await readSettings()).pinnedTabBoundaryDefault).toBe('off');
  });

  test('writeSetting persists a boundary-default change', async () => {
    await writeSetting('pinnedTabBoundaryDefault', 'domain');
    expect(
      (chromeMock.data['lunma.settings'] as { pinnedTabBoundaryDefault: string })
        .pinnedTabBoundaryDefault,
    ).toBe('domain');
  });
});

describe('Search settings (defaultSearchEngine + customSearchUrl)', () => {
  test('the text default derives from the declaration (empty string)', async () => {
    const settings = await readSettings();
    expect(settings.customSearchUrl).toBe('');
    expect(DEFAULTS.customSearchUrl).toBe('');
  });

  test('the default engine defaults to google', async () => {
    const settings = await readSettings();
    expect(settings.defaultSearchEngine).toBe('google');
    expect(DEFAULTS.defaultSearchEngine).toBe('google');
  });

  test('reads a valid stored engine + custom template', async () => {
    chromeMock.data['lunma.settings'] = {
      defaultSearchEngine: 'custom',
      customSearchUrl: 'https://kagi.com/search?q=%s',
    };
    const settings = await readSettings();
    expect(settings.defaultSearchEngine).toBe('custom');
    expect(settings.customSearchUrl).toBe('https://kagi.com/search?q=%s');
  });

  test('an out-of-type stored customSearchUrl falls back to the empty default', async () => {
    chromeMock.data['lunma.settings'] = { customSearchUrl: 123 };
    const settings = await readSettings();
    expect(settings.customSearchUrl).toBe('');
  });

  test('an out-of-range defaultSearchEngine falls back to google', async () => {
    chromeMock.data['lunma.settings'] = { defaultSearchEngine: 'altavista' };
    const settings = await readSettings();
    expect(settings.defaultSearchEngine).toBe('google');
  });

  test('writeSetting persists a defaultSearchEngine change', async () => {
    await writeSetting('defaultSearchEngine', 'duckduckgo');
    expect(
      (chromeMock.data['lunma.settings'] as { defaultSearchEngine: string }).defaultSearchEngine,
    ).toBe('duckduckgo');
  });

  test('writeSetting persists a customSearchUrl change', async () => {
    await writeSetting('customSearchUrl', 'https://kagi.com/search?q=%s');
    expect((chromeMock.data['lunma.settings'] as { customSearchUrl: string }).customSearchUrl).toBe(
      'https://kagi.com/search?q=%s',
    );
  });
});

describe('customSearchKeyword setting (launcher-tab-to-search)', () => {
  test('defaults to the empty string when no value is stored', async () => {
    const settings = await readSettings();
    expect(settings.customSearchKeyword).toBe('');
    expect(DEFAULTS.customSearchKeyword).toBe('');
  });

  test('reads a valid stored keyword', async () => {
    chromeMock.data['lunma.settings'] = { customSearchKeyword: 'k' };
    expect((await readSettings()).customSearchKeyword).toBe('k');
  });

  test('an out-of-type stored keyword falls back to the empty default (read still succeeds)', async () => {
    chromeMock.data['lunma.settings'] = { customSearchKeyword: 42, density: 'compact' };
    const settings = await readSettings();
    expect(settings.customSearchKeyword).toBe('');
    // The per-field `.catch` is isolated — the valid sibling still parses.
    expect(settings.density).toBe('compact');
  });

  test('writeSetting persists a customSearchKeyword change', async () => {
    await writeSetting('customSearchKeyword', 'k');
    expect(
      (chromeMock.data['lunma.settings'] as { customSearchKeyword: string }).customSearchKeyword,
    ).toBe('k');
  });
});

describe('auto-archive settings (toggle + number)', () => {
  test('the toggle + number defaults derive from their declarations', async () => {
    const settings = await readSettings();
    expect(settings.autoArchiveEnabled).toBe(true);
    expect(settings.autoArchiveIdleMinutes).toBe(720);
    expect(settings.autoArchiveRetentionDays).toBe(7);
    expect(DEFAULTS.autoArchiveEnabled).toBe(true);
    expect(DEFAULTS.autoArchiveIdleMinutes).toBe(720);
    expect(DEFAULTS.autoArchiveRetentionDays).toBe(7);
  });

  test('retention-days reads, clamps to the floor (1), and round-trips', async () => {
    chromeMock.data['lunma.settings'] = { autoArchiveRetentionDays: 7 };
    expect((await readSettings()).autoArchiveRetentionDays).toBe(7);

    chromeMock.data['lunma.settings'] = { autoArchiveRetentionDays: 0 };
    expect((await readSettings()).autoArchiveRetentionDays).toBe(1);

    await writeSetting('autoArchiveRetentionDays', 14);
    expect((await readSettings()).autoArchiveRetentionDays).toBe(14);
  });

  test('reads valid stored values for both keys', async () => {
    chromeMock.data['lunma.settings'] = { autoArchiveEnabled: false, autoArchiveIdleMinutes: 15 };
    const settings = await readSettings();
    expect(settings.autoArchiveEnabled).toBe(false);
    expect(settings.autoArchiveIdleMinutes).toBe(15);
  });

  test('a non-boolean stored toggle falls back to the declared default (read still succeeds)', async () => {
    chromeMock.data['lunma.settings'] = { autoArchiveEnabled: 'yes', density: 'compact' };
    const settings = await readSettings();
    expect(settings.autoArchiveEnabled).toBe(true);
    // The per-field `.catch` is isolated — the valid sibling still parses.
    expect(settings.density).toBe('compact');
  });

  test('a non-numeric stored idle-minutes falls back to the declared default', async () => {
    chromeMock.data['lunma.settings'] = { autoArchiveIdleMinutes: 'soon' };
    expect((await readSettings()).autoArchiveIdleMinutes).toBe(720);
  });

  test('a non-integer stored idle-minutes falls back to the declared default', async () => {
    chromeMock.data['lunma.settings'] = { autoArchiveIdleMinutes: 12.5 };
    expect((await readSettings()).autoArchiveIdleMinutes).toBe(720);
  });

  test('a sub-min stored idle-minutes clamps up to the declared floor (1)', async () => {
    chromeMock.data['lunma.settings'] = { autoArchiveIdleMinutes: 0 };
    expect((await readSettings()).autoArchiveIdleMinutes).toBe(1);
  });

  test('writeSetting round-trips the toggle key', async () => {
    await writeSetting('autoArchiveEnabled', false);
    expect(
      (chromeMock.data['lunma.settings'] as { autoArchiveEnabled: boolean }).autoArchiveEnabled,
    ).toBe(false);
    expect((await readSettings()).autoArchiveEnabled).toBe(false);
  });

  test('writeSetting round-trips the number key', async () => {
    await writeSetting('autoArchiveIdleMinutes', 30);
    expect(
      (chromeMock.data['lunma.settings'] as { autoArchiveIdleMinutes: number })
        .autoArchiveIdleMinutes,
    ).toBe(30);
    expect((await readSettings()).autoArchiveIdleMinutes).toBe(30);
  });
});
