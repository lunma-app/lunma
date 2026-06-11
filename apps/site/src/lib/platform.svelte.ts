import { browser } from '$app/environment';

// macOS labels the Alt key "Option" (⌥). The launcher fires on the physical key
// (launcher/overlay.ts matches `code === 'KeyL'` + `altKey`) and the manifest
// binds the toggle-launcher command to Alt+L on mac too — on a Mac the Option key
// sets `altKey`, so Option+L genuinely triggers it. So the label is a presentation
// detail, not a different shortcut.
//
// The site is statically prerendered: one HTML for everyone, so it ships the "Alt"
// default. We correct to "Option" on the client after hydration, for macOS only —
// `$state`, so the few visible mentions re-render when it flips (no SSR mismatch,
// since the flip happens in onMount, after hydration has matched the prerender).
let mac = $state(false);

/** Sample the platform once, on the client. Call from the root layout's onMount. */
export function initPlatform(): void {
  if (!browser) return;
  const n = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = n.userAgentData?.platform || n.platform || n.userAgent || '';
  mac = /mac/i.test(platform);
}

/** Prose label for the Alt/⌥ key: "Option" on macOS, "Alt" elsewhere. Use in
 *  running text (a sentence or heading) where a bare glyph reads terse. */
export function altKeyLabel(): string {
  return mac ? 'Option' : 'Alt';
}

/** Keycap glyph for the Alt/⌥ key: the "⌥" symbol on macOS (the menu-bar
 *  convention), the word "Alt" elsewhere (Windows has no Alt glyph). Use inside
 *  boxed <kbd> keycaps, not prose. */
export function altKeySymbol(): string {
  return mac ? '⌥' : 'Alt';
}

/** The full launcher chord as one inline badge — macOS concatenates ("⌥L"),
 *  Windows joins with a plus ("Alt+L"). */
export function launcherChord(): string {
  return mac ? '⌥L' : 'Alt+L';
}
