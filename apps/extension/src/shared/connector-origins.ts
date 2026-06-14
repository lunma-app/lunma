import { originPatternForBaseUrl } from './permissions';
import type { SmartSource } from './types';

/**
 * The host match patterns a smart folder's connector ACTUALLY fetches for
 * `node` (least-privilege-permissions design D8) — the single source of truth
 * for the host-permission gate (background) AND the gesture-bound grant request
 * (surfaces). It lives in `shared/` because both the connector layer and the
 * sidebar/editor surfaces need it, and the layer DAG forbids a surface importing
 * `background/connectors` — the same reason the pure launcher providers live in
 * `launcher/shared`. The four `SourceConnector.requiredOrigins` members delegate
 * here, so there is exactly ONE derivation (no drift between SW and surface).
 *
 * Per source:
 *   - `github` on github.com fetches `api.github.com` (a DIFFERENT origin), so
 *     the gate must request `https://api.github.com/*`, never `github.com`;
 *     GitHub Enterprise Server fetches same-origin under `{baseUrl}/api/v3`.
 *   - `gitlab`, `jira`, and `rss` fetch their own `baseUrl` origin.
 *
 * Pure and total: a malformed `baseUrl` yields an empty pattern (treated as
 * ungranted by `hasHostPermissions`) rather than throwing.
 */
export function requiredOriginsForNode(node: { source: SmartSource; baseUrl: string }): string[] {
  if (node.source === 'github') {
    let isDotCom = false;
    try {
      isDotCom = new URL(node.baseUrl).host === 'github.com';
    } catch {
      // Malformed baseUrl → fall through to the baseUrl-origin pattern below.
    }
    if (isDotCom) return ['https://api.github.com/*'];
  }
  return [originPatternForBaseUrl(node.baseUrl)];
}
