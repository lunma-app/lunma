import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { openOptionsAtResultSources, RESULT_SOURCES_HASH } from './open-options-grant';

// The SW handler the Alt+L overlay routes its "Enable …" affordance to
// (least-privilege-permissions D5). It opens the options page at the Result
// sources grant control — reusing an open options tab, else creating one.

interface ChromeStub {
  runtime: { getURL: ReturnType<typeof vi.fn> };
  tabs: {
    query: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  windows: { update: ReturnType<typeof vi.fn> };
}

const OPTIONS_BASE = 'chrome-extension://abc/src/options/index.html';
let chromeStub: ChromeStub;

function install(tabs: Array<{ id?: number; url?: string; windowId?: number }>): void {
  chromeStub = {
    runtime: { getURL: vi.fn((p: string) => `chrome-extension://abc/${p}`) },
    tabs: {
      query: vi.fn(async () => tabs),
      update: vi.fn(async () => ({})),
      create: vi.fn(async () => ({})),
    },
    windows: { update: vi.fn(async () => ({})) },
  };
  (globalThis as unknown as { chrome: unknown }).chrome = chromeStub;
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'debug').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('openOptionsAtResultSources', () => {
  test('reuses an open options tab, navigating it to the grant location', async () => {
    install([{ id: 7, url: `${OPTIONS_BASE}#connectors`, windowId: 3 }]);
    await openOptionsAtResultSources();
    expect(chromeStub.tabs.update).toHaveBeenCalledWith(7, {
      active: true,
      url: `${OPTIONS_BASE}${RESULT_SOURCES_HASH}`,
    });
    expect(chromeStub.windows.update).toHaveBeenCalledWith(3, { focused: true });
    expect(chromeStub.tabs.create).not.toHaveBeenCalled();
  });

  test('creates a fresh options tab at the grant location when none is open', async () => {
    install([{ id: 1, url: 'https://example.com/' }]);
    await openOptionsAtResultSources();
    expect(chromeStub.tabs.update).not.toHaveBeenCalled();
    expect(chromeStub.tabs.create).toHaveBeenCalledWith({
      url: `${OPTIONS_BASE}${RESULT_SOURCES_HASH}`,
    });
  });

  test('falls back to creating a tab when the reuse query throws', async () => {
    install([]);
    chromeStub.tabs.query.mockRejectedValueOnce(new Error('boom'));
    await openOptionsAtResultSources();
    expect(chromeStub.tabs.create).toHaveBeenCalledWith({
      url: `${OPTIONS_BASE}${RESULT_SOURCES_HASH}`,
    });
  });
});
