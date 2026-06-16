/**
 * Returns the platform-appropriate modifier label for the launcher shortcut.
 * macOS shows the Option glyph (⌥); Windows / Linux / ChromeOS shows "Alt+".
 */
export function getModifierLabel(): string {
  return navigator.userAgent.includes('Mac') ? '⌥' : 'Alt+';
}

/** Convenience constant — evaluated once at module load time. */
export const modifierLabel: string = getModifierLabel();

/**
 * The host browser's own internal scheme. Each Chromium fork namespaces its
 * internal pages under its own scheme; only Edge is special-cased (it does not
 * alias `chrome://`). Detected from `navigator.userAgent` (`Edg/` is Edge's
 * marker) for consistency with `getModifierLabel` and trivial Vitest mocking.
 */
function getBrowserScheme(): 'chrome' | 'edge' {
  return navigator.userAgent.includes('Edg/') ? 'edge' : 'chrome';
}

/**
 * The host browser's extensions keyboard-shortcuts page — the only place a
 * `chrome.commands` shortcut can be (re)bound. Returns `edge://extensions/shortcuts`
 * on Edge, else `chrome://extensions/shortcuts` (correct for Chrome, and Brave /
 * Vivaldi, which accept the `chrome://` scheme).
 */
export function getExtensionsShortcutsUrl(): string {
  return `${getBrowserScheme()}://extensions/shortcuts`;
}
