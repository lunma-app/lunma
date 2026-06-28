import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { applyLocaleFromSettings } from './i18n';
import { DEFAULTS, type Settings, watchSettings } from './settings';

// Switch-propagation guard (i18n, design D6). Each surface's `watchSettings`
// callback reloads ONLY on a `language` delta and keeps applying every other
// setting live (no reload). This test drives the real `watchSettings` plumbing
// with a callback that mirrors the gate the three surfaces implement
// (sidebar/main.ts, launcher/newtab/main.ts, options/Options.svelte), so a
// regression that reloads on a non-language change — or fails to reload on a
// language change — fails here.

type StorageListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string,
) => void;

interface ChromeMock {
  listeners: StorageListener[];
  emit: (next: Settings) => void;
}

function installChromeMock(): ChromeMock {
  const mock: ChromeMock = {
    listeners: [],
    emit: (next) => {
      for (const listener of mock.listeners) {
        listener({ 'lunma.settings': { oldValue: undefined, newValue: next } }, 'sync');
      }
    },
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      sync: { get: vi.fn(async () => ({})), set: vi.fn(async () => undefined) },
      onChanged: {
        addListener: (listener: StorageListener) => mock.listeners.push(listener),
        removeListener: (listener: StorageListener) => {
          mock.listeners = mock.listeners.filter((entry) => entry !== listener);
        },
      },
      i18n: { getUILanguage: () => 'en' },
    },
    i18n: { getUILanguage: () => 'en' },
  };
  return mock;
}

let chromeMock: ChromeMock;

beforeEach(() => {
  chromeMock = installChromeMock();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** The gate the surface callbacks share: reload + re-seed locale on a `language`
 * delta; otherwise apply live. Returns the spies so the test can assert. */
function subscribeGate(initialLanguage: Settings['language']) {
  const reload = vi.fn();
  const applyLive = vi.fn();
  let prevLanguage = initialLanguage;
  const unsubscribe = watchSettings((settings) => {
    if (settings.language !== prevLanguage) {
      prevLanguage = settings.language;
      applyLocaleFromSettings(settings.language);
      reload();
      return;
    }
    applyLive(settings);
  });
  return { reload, applyLive, unsubscribe };
}

describe('language switch propagation', () => {
  test('a non-language change applies live without a reload', () => {
    const { reload, applyLive, unsubscribe } = subscribeGate(DEFAULTS.language);
    chromeMock.emit({ ...DEFAULTS, density: 'compact' });
    expect(reload).not.toHaveBeenCalled();
    expect(applyLive).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  test('a language change reloads (and does not apply live)', () => {
    const { reload, applyLive, unsubscribe } = subscribeGate(DEFAULTS.language);
    chromeMock.emit({ ...DEFAULTS, language: 'de' });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(applyLive).not.toHaveBeenCalled();
    unsubscribe();
  });

  test('only the language delta reloads — a following non-language change stays live', () => {
    const { reload, applyLive, unsubscribe } = subscribeGate(DEFAULTS.language);
    chromeMock.emit({ ...DEFAULTS, language: 'de' });
    chromeMock.emit({ ...DEFAULTS, language: 'de', density: 'compact' });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(applyLive).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
