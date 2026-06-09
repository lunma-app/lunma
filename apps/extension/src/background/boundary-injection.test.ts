import { beforeEach, describe, expect, test, vi } from 'vitest';
import { injectBoundary } from './boundary-injection';

interface ChromeStub {
  runtime: { getManifest: ReturnType<typeof vi.fn> };
  scripting: { executeScript: ReturnType<typeof vi.fn> };
}

const OVERLAY = ['src/launcher/overlay.ts'];
const BOUNDARY = ['src/content/tab-boundary.ts'];

function installChrome(opts: {
  contentScripts?: Array<{ js?: string[] }>;
  reject?: boolean;
}): ChromeStub {
  const executeScript = vi.fn(() =>
    opts.reject
      ? Promise.reject(new Error('Cannot access contents of the page'))
      : Promise.resolve([]),
  );
  const contentScripts = opts.contentScripts ?? [{ js: OVERLAY }, { js: BOUNDARY }];
  const stub: ChromeStub = {
    runtime: { getManifest: vi.fn(() => ({ content_scripts: contentScripts })) },
    scripting: { executeScript },
  };
  (globalThis as unknown as { chrome: ChromeStub }).chrome = stub;
  return stub;
}

beforeEach(() => {
  vi.spyOn(console, 'debug').mockImplementation(() => undefined);
});

describe('injectBoundary', () => {
  test('injects the boundary entry selected by filename (not the overlay)', async () => {
    const stub = installChrome({});
    await injectBoundary(7);
    expect(stub.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 7 },
      files: BOUNDARY,
    });
  });

  test('selects by filename even when the content-scripts order is swapped', async () => {
    const stub = installChrome({ contentScripts: [{ js: BOUNDARY }, { js: OVERLAY }] });
    await injectBoundary(3);
    expect(stub.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 3 },
      files: BOUNDARY,
    });
  });

  test('a forbidden page rejects executeScript without throwing the caller', async () => {
    const stub = installChrome({ reject: true });
    await expect(injectBoundary(9)).resolves.toBeUndefined();
    expect(stub.scripting.executeScript).toHaveBeenCalled();
  });

  test('throws when no boundary script is declared in the manifest', async () => {
    installChrome({ contentScripts: [{ js: OVERLAY }] });
    await expect(injectBoundary(1)).rejects.toThrow(/no boundary content script/);
  });
});
