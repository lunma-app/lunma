/**
 * Shared surface-boot helpers used by every document-level surface entry point
 * (sidebar, newtab, options). Extracted here to avoid repeating identical logic
 * in three separate main.ts / Options.svelte files.
 */

import type { DensityMode, ThemeMode } from './settings';

/**
 * Reflect the density preference onto `<html>` so `tokens.css`'s
 * `:root[data-density=…]` overrides (and `ResultRow`'s Comfort two-line layout)
 * apply. `normal` is the token default so the attribute is omitted for it,
 * keeping the DOM clean.
 */
export function applyDensityToDocument(density: DensityMode): void {
  if (density === 'normal') {
    delete document.documentElement.dataset.density;
  } else {
    document.documentElement.dataset.density = density;
  }
}

/**
 * Reflect the light/dark theme onto `<html>` so `tokens.css`'s
 * `:root[data-theme="light"]` set takes over. `dark` is the token default, so the
 * attribute is omitted for it (keeping the DOM clean); `color-scheme` is set both
 * ways so native form controls / scrollbars match the surface.
 */
export function applyThemeToDocument(theme: ThemeMode): void {
  if (theme === 'light') {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
  } else {
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = 'dark';
  }
}
