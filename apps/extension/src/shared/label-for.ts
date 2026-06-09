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
