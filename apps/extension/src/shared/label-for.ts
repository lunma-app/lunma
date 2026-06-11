/**
 * Returns `title` when non-empty, otherwise falls back to the hostname of `url`,
 * or `'Untitled'` when the URL is unparseable or has no hostname.
 *
 * Used by every surface that renders a tab row to avoid blank labels.
 */
export function labelFor(title: string, url: string): string {
  if (title) return title;
  try {
    return new URL(url).hostname || 'Untitled';
  } catch {
    return 'Untitled';
  }
}

/**
 * Returns the bare hostname of `url` (e.g. `figma.com`), or `''` when the URL is
 * unparseable or carries no hostname (e.g. `blob:`). Mirrors `labelFor`'s
 * try/catch but degrades to an empty string instead of a label fallback, so a
 * caller can suppress an affordance (the drift subtitle/tooltip) on an empty host
 * rather than render a placeholder.
 */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
