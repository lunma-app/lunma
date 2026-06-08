import type { WindowId } from './types';

/**
 * Resolve the WindowId of the Chrome window hosting this side panel. Called
 * once at sidebar boot — the side panel does not migrate windows during its
 * lifetime.
 */
export async function getCurrentWindowId(): Promise<WindowId> {
  let win: chrome.windows.Window;
  try {
    win = await chrome.windows.getCurrent({});
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(`getCurrentWindowId: chrome.windows.getCurrent failed: ${cause}`);
  }
  if (win.id === undefined) {
    throw new Error('getCurrentWindowId: chrome.windows.getCurrent returned no id');
  }
  return win.id;
}
