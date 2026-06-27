import type { LensQuery, ResolvedLensSource } from './types';

export { hostOf } from './label-for';

/**
 * Canonical per-section identity key shared by the SW, sidebar, and overview
 * page. Uses `new URL(baseUrl).host` (port-bearing, per D1); a malformed
 * `baseUrl` degrades to the raw string for the host segment (D3) so all three
 * surfaces produce the same key rather than throwing or returning ''.
 */
export function sourceKey(cfg: ResolvedLensSource): string {
  let host: string;
  try {
    host = new URL(cfg.baseUrl).host;
  } catch {
    host = cfg.baseUrl;
  }
  const base = `${cfg.source}:${host}`;
  return cfg.query !== undefined ? `${base}:${cfg.query}` : base;
}

export const ICON_BY_SOURCE: Record<string, string> = {
  gitlab: 'folder-git-2',
  github: 'folder-git-2',
  jira: 'folder-kanban',
  rss: 'rss',
};

export function sourceIcon(source: string): string {
  return ICON_BY_SOURCE[source] ?? 'folder';
}

export function filterLabel(source: string, query: LensQuery): string {
  if (query === 'authored') return 'authored';
  if (query === 'assigned') return 'assigned';
  return source === 'jira' ? 'Watching' : 'reviewing';
}
