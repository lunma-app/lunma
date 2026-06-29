import type { AuthMethod, LensProvider } from './types';

/**
 * The per-provider declared auth methods (connector-accounts, design D3). The
 * SINGLE source of truth: the `SourceConnector.authMethods` field references this
 * map (so the contract carries it for the engine), and the DAG-restricted
 * surfaces (`sidebar`/`options`/`launcher`, which may not import `background/`)
 * derive an account's effective method/status from it without reaching the
 * connector objects.
 */
export const PROVIDER_AUTH_METHODS: Record<LensProvider, AuthMethod[]> = {
  github: ['pat'],
  gitlab: ['session', 'pat'],
  // bitbucket (add-bitbucket-connector): token-only — Cloud's API lives on
  // `api.bitbucket.org`, a host distinct from the `bitbucket.org` browser
  // session, so a cookie ride is impossible (no `session` rung, like github).
  bitbucket: ['pat'],
  jira: ['session'],
  rss: [],
};

/** The effective, DERIVED method for an account (connector-accounts, design D3).
 * `public` (no auth) and `needs-token` (a `pat`-only provider with no token) are
 * the terminal states; `session` is the zero-config default when supported. */
export type DerivedAuthMethod = 'public' | 'pat' | 'session' | 'needs-token';

/**
 * Derive an account's effective auth method by the design-D3 precedence:
 * 1. provider declares no methods (`rss`) → `public`;
 * 2. a per-source token exists → `pat` (a token always wins);
 * 3. provider supports `session` → `session` (rides the browser sign-in);
 * 4. otherwise (`pat`-only, no token) → `needs-token`.
 */
export function deriveAuthMethod(provider: LensProvider, hasToken: boolean): DerivedAuthMethod {
  const methods = PROVIDER_AUTH_METHODS[provider];
  if (methods.length === 0) return 'public';
  if (hasToken) return 'pat';
  if (methods.includes('session')) return 'session';
  return 'needs-token';
}

/** The account display-status vocabulary (the `AccountChip` statuses). A runtime
 * `signed-out` (a poll that failed to authenticate) overrides the config-time
 * status. */
export type AuthStatus = 'connected' | 'browser-session' | 'public' | 'needs-token' | 'signed-out';

/**
 * Map a derived method onto the account display status (connector-accounts,
 * design D3 — the single mapping shared by the connectors, the status
 * derivation, and the `AccountChip`): `pat` → `connected`, `session` →
 * `browser-session`, `public` → `public`, `needs-token` → `needs-token`. A
 * runtime `signed-out` (a poll that failed at runtime) overrides the lot.
 */
export function deriveAuthStatus(
  provider: LensProvider,
  hasToken: boolean,
  runtimeSignedOut = false,
): AuthStatus {
  if (runtimeSignedOut) return 'signed-out';
  switch (deriveAuthMethod(provider, hasToken)) {
    case 'pat':
      return 'connected';
    case 'session':
      return 'browser-session';
    case 'public':
      return 'public';
    case 'needs-token':
      return 'needs-token';
  }
}
