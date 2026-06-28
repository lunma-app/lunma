import type { LensQuery, ResolvedLensSource } from './types';

export { hostOf } from './label-for';

/**
 * Canonical per-section identity key shared by the SW, sidebar, and overview
 * page. Keyed by the referenced account's `sourceId` (not host) so two accounts
 * on the same host occupy distinct sections (rekey-lens-sections-by-source-id,
 * D1): `${sourceId}:${query}` for a queue section, `${sourceId}` for a feed
 * (rss). Pure, no I/O — a malformed/port-bearing `baseUrl` no longer affects the
 * key (the account id carries the host identity).
 */
export function sourceKey(cfg: ResolvedLensSource): string {
  return cfg.query !== undefined ? `${cfg.sourceId}:${cfg.query}` : cfg.sourceId;
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
