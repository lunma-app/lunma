import { afterEach, describe, expect, test, vi } from 'vitest';
import { backfillOverlayIntoOpenTabs, injectOverlay } from './overlay-injection';

const FILES = ['src/launcher/overlay.ts'];

interface ChromeStub {
  runtime: { getManifest: ReturnType<typeof vi.fn> };
  tabs: { query: ReturnType<typeof vi.fn> };
  scripting: { executeScript: ReturnType<typeof vi.fn> };
}

function installChrome(opts: {
  tabs?: Array<Partial<chrome.tabs.Tab>>;
  files?: string[] | undefined;
  reject?: (tabId: number) => boolean;
}): ChromeStub {
  const files = opts.files === undefined ? FILES : opts.files;
  const executeScript = vi.fn((arg: { target: { tabId: number } }) =>
    opts.reject?.(arg.target.tabId)
      ? Promise.reject(new Error('Cannot access contents of the page'))
      : Promise.resolve([]),
  );
  const stub: ChromeStub = {
    runtime: {
      getManifest: vi.fn(() => ({ content_scripts: files ? [{ js: files }] : [{}] })),
    },
    tabs: { query: vi.fn(() => Promise.resolve(opts.tabs ?? [])) },
    scripting: { executeScript },
  };
  (globalThis as unknown as { chrome: ChromeStub }).chrome = stub;
  return stub;
}

/** tabIds executeScript was called with. */
function injectedTabIds(stub: ChromeStub): number[] {
  return stub.scripting.executeScript.mock.calls.map((c) => c[0].target.tabId);
}

afterEach(() => {
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
  vi.restoreAllMocks();
});

describe('injectOverlay', () => {
  test('injects the manifest content-script files into the tab', async () => {
    const stub = installChrome({});
    await injectOverlay(7);
    expect(stub.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 7 },
      files: FILES,
    });
  });

  test('throws when the manifest declares no overlay content script', async () => {
    installChrome({ files: [] }); // manifest entry with an empty js list
    await expect(injectOverlay(7)).rejects.toThrow(/no overlay content script/);
  });

  test('propagates an executeScript rejection (forbidden page)', async () => {
    installChrome({ tabs: [], reject: () => true });
    await expect(injectOverlay(7)).rejects.toThrow(/Cannot access/);
  });
});

describe('backfillOverlayIntoOpenTabs', () => {
  test('injects http(s) tabs and skips chrome://, extension, and new-tab pages', async () => {
    const stub = installChrome({
      tabs: [
        { id: 1, url: 'https://example.com/' },
        { id: 2, url: 'http://localhost:3000/' },
        { id: 3, url: 'chrome://extensions/' },
        { id: 4, url: 'chrome-extension://abc/src/launcher/newtab/index.html' },
        { id: 5, url: 'https://news.ycombinator.com/' },
        { id: 6 }, // no url
      ],
    });
    await backfillOverlayIntoOpenTabs();
    expect(injectedTabIds(stub).sort((a, b) => a - b)).toEqual([1, 2, 5]);
  });

  test('isolates a per-tab failure so the rest of the sweep still injects', async () => {
    const stub = installChrome({
      tabs: [
        { id: 1, url: 'https://a/' },
        { id: 2, url: 'https://b/' },
        { id: 3, url: 'https://c/' },
      ],
      reject: (tabId) => tabId === 2, // tab 2 forbids injection
    });
    await backfillOverlayIntoOpenTabs();
    // All three are attempted; tab 2's rejection does not abort 1 and 3.
    expect(injectedTabIds(stub).sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  test('does nothing when there are no injectable tabs', async () => {
    const stub = installChrome({ tabs: [{ id: 9, url: 'chrome://newtab/' }] });
    await backfillOverlayIntoOpenTabs();
    expect(stub.scripting.executeScript).not.toHaveBeenCalled();
  });
});
