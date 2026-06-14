/**
 * The single foundation wrapper over `chrome.permissions` (least-privilege-
 * permissions, design D1). `shared/` imports nothing else in `src/` and every
 * layer may import it, so this one module is reachable by the background (which
 * queries/observes) and by extension-page surfaces (which request under a user
 * gesture). It is a thin, typed mapping carrying NO policy beyond origin-pattern
 * derivation — connectors decide which origins they need (the
 * `SourceConnector.requiredOrigins` contract, design D8).
 *
 * Two platform constraints shape the surface (design Context):
 *   1. `chrome.permissions.request()` requires a user gesture and runs only in a
 *      context that has one — so the gesture-bound `request*` functions are
 *      called only from a click handler in an extension-page surface (sidebar,
 *      options, new-tab launcher). The service worker has NO gesture; it MUST
 *      NOT call them — it `has*`-queries and observes via `onPermissionsChange`.
 *   2. No programmatic-removal helper is exported: revocation happens through
 *      Chrome's own UI and is observed via `onPermissionsChange`, never
 *      initiated by Lunma.
 *
 * No other module SHALL touch `chrome.permissions.*` directly.
 */

/** The two optional API permissions Lunma requests at runtime. */
export type OptionalApiPermission = 'history' | 'bookmarks';

/** Whether an optional API permission is currently granted. Never throws. */
export async function hasApiPermission(name: OptionalApiPermission): Promise<boolean> {
  try {
    return await chrome.permissions.contains({ permissions: [name] });
  } catch {
    return false;
  }
}

/**
 * Request an optional API permission. MUST be invoked from a user-gesture
 * handler in an extension-page context (never the SW — constraint #1). Resolves
 * to whether the grant was given.
 */
export async function requestApiPermission(name: OptionalApiPermission): Promise<boolean> {
  try {
    return await chrome.permissions.request({ permissions: [name] });
  } catch {
    return false;
  }
}

/**
 * True only when EVERY origin in the set is granted — a connector may fetch more
 * than one (e.g. nothing for github.com folders today, but the set is the unit).
 * `chrome.permissions.contains({ origins })` already requires all listed origins,
 * so the set is passed whole. An empty set is vacuously granted. Never throws (a
 * malformed pattern resolves to `false`, i.e. ungranted).
 */
export async function hasHostPermissions(origins: string[]): Promise<boolean> {
  if (origins.length === 0) return true;
  try {
    return await chrome.permissions.contains({ origins });
  } catch {
    return false;
  }
}

/**
 * Request a set of host origins. MUST be invoked from a user-gesture handler in
 * an extension-page context (never the SW — constraint #1). Chrome grants a
 * single request all-or-nothing, so the resolution is the whole set's outcome.
 * An empty set is a no-op grant. Never throws.
 */
export async function requestHostPermissions(origins: string[]): Promise<boolean> {
  if (origins.length === 0) return true;
  try {
    return await chrome.permissions.request({ origins });
  } catch {
    return false;
  }
}

/**
 * Derive a host match pattern from a connector `baseUrl`: `new
 * URL(baseUrl).origin + '/*'` (scheme + host + any non-default port preserved).
 * A building block, not the gate input — connectors decide which origins they
 * need (design D8). A malformed `baseUrl` never throws; it yields `''`, an empty
 * pattern that `hasHostPermissions` treats as ungranted (the connectors validate
 * `baseUrl` on create/update, so this is defensive only).
 */
export function originPatternForBaseUrl(baseUrl: string): string {
  try {
    return `${new URL(baseUrl).origin}/*`;
  } catch {
    return '';
  }
}

/** A permission-set change observed from `chrome.permissions` — a grant
 * (`'added'`) or a revoke (`'removed'`), carrying the changed permission set. */
export interface PermissionsChange {
  type: 'added' | 'removed';
  permissions: chrome.permissions.Permissions;
}

/**
 * Subscribe to permission grants/revocations, wrapping
 * `chrome.permissions.onAdded`/`onRemoved` behind one listener and returning an
 * unsubscribe that detaches both. The background observes this to heal/refetch
 * gated smart folders without a reload (design D5/D9); surfaces observe it to
 * re-query on grant.
 */
export function onPermissionsChange(listener: (change: PermissionsChange) => void): () => void {
  const onAdded = (permissions: chrome.permissions.Permissions): void =>
    listener({ type: 'added', permissions });
  const onRemoved = (permissions: chrome.permissions.Permissions): void =>
    listener({ type: 'removed', permissions });
  chrome.permissions.onAdded.addListener(onAdded);
  chrome.permissions.onRemoved.addListener(onRemoved);
  return () => {
    chrome.permissions.onAdded.removeListener(onAdded);
    chrome.permissions.onRemoved.removeListener(onRemoved);
  };
}
