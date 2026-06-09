/**
 * Returns the platform-appropriate modifier label for the launcher shortcut.
 * macOS shows the Option glyph (⌥); Windows / Linux / ChromeOS shows "Alt+".
 */
export function getModifierLabel(): string {
  return navigator.userAgent.includes('Mac') ? '⌥' : 'Alt+';
}

/** Convenience constant — evaluated once at module load time. */
export const modifierLabel: string = getModifierLabel();
