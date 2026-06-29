import { PROVIDER_AUTH_METHODS } from './auth-method';
import type { LensProvider, SourceAccount } from './types';

/**
 * Surface-side account presentation helpers (connector-accounts). Pure, DAG-legal
 * for every surface (no `background/` import): the editor account picker, the
 * Options Accounts manager, and the signed-out reconnect lane share these so the
 * provider vocabulary, default hosts, token-requirement, and help links never
 * drift between surfaces.
 */

/** The shipped providers, in editor/picker display order. */
export const PROVIDERS: readonly LensProvider[] = ['github', 'gitlab', 'bitbucket', 'jira', 'rss'];

/**
 * A Source is one of two KINDS (the Account-vs-Feed model). **Accounts** are
 * connected identities with derived auth (github/gitlab/bitbucket/jira) — managed in
 * Options → Accounts, added via "Connect an account". **Feeds** are public RSS
 * subscriptions (`rss`) — managed in Options → Feed subscriptions, added via
 * "Add a feed". Both are persisted uniformly as `SourceAccount` in
 * `AppState.sources` and referenced by lenses the same way; only their
 * presentation/management differs.
 */
export const ACCOUNT_PROVIDERS: readonly LensProvider[] = ['github', 'gitlab', 'bitbucket', 'jira'];

/** Whether a provider is a Feed (public URL) rather than an auth Account. */
export function isFeedProvider(provider: LensProvider): boolean {
  return provider === 'rss';
}

/**
 * Normalize + validate a source's base URL (connector-accounts): an absolute
 * http(s) URL with a single trailing slash stripped. Throws on a relative or
 * non-http(s) URL. Lives in `shared/` (not `background/`) so the surface-side
 * find-or-mint (the editor's OPML "add to this lens" path) and the SW handlers
 * (`createAccount`, `importOpml`) normalize identically — find-or-mint dedupes
 * by normalized baseUrl, so a divergent normalization would mint duplicate
 * accounts for one feed.
 */
export function normalizeBaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`invalid base URL '${raw}': not an absolute URL`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`invalid base URL '${raw}': must be http(s)`);
  }
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

export const PROVIDER_LABEL: Record<LensProvider, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
  jira: 'Jira',
  rss: 'RSS feed',
};

/** The editor's per-provider base-URL seed (mirrors each connector's
 * `defaultBaseUrl`; rss has none — the user pastes the feed URL). */
export const DEFAULT_BASE_URL: Record<LensProvider, string> = {
  github: 'https://github.com',
  gitlab: 'https://gitlab.com',
  bitbucket: 'https://bitbucket.org',
  jira: 'https://your-site.atlassian.net',
  rss: '',
};

/** The host label for an account (the section/identity label falls back to this
 * when the account is unnamed — design open-question: unnamed-defaults-to-host). */
export function hostLabel(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl;
  }
}

/** The account's display label: its name, else its host. */
export function accountLabel(account: Pick<SourceAccount, 'name' | 'baseUrl'>): string {
  return account.name && account.name.trim() !== '' ? account.name : hostLabel(account.baseUrl);
}

/**
 * The token requirement for a provider's connect affordance (connector-accounts,
 * design D3/D8): `none` for a public provider (rss — no token field), `optional`
 * for a session-capable provider (the token is an upgrade), `required` for a
 * `pat`-only provider.
 */
export function tokenRequirement(provider: LensProvider): 'none' | 'optional' | 'required' {
  const methods = PROVIDER_AUTH_METHODS[provider];
  if (methods.length === 0) return 'none';
  if (methods.includes('session')) return 'optional';
  return 'required';
}

/** The provider's token-creation docs URL (the "How to create one ↗" helper).
 * `undefined` for providers that need no token (rss) or whose page we don't link. */
export function tokenHelpUrl(provider: LensProvider, baseUrl: string): string | undefined {
  switch (provider) {
    case 'github': {
      // github.com vs GHE — the settings path is the same under each host.
      const root = baseUrl.replace(/\/+$/, '');
      return `${root}/settings/tokens`;
    }
    case 'gitlab': {
      const root = baseUrl.replace(/\/+$/, '');
      return `${root}/-/user_settings/personal_access_tokens`;
    }
    case 'bitbucket': {
      // Cloud (bitbucket.org) tokens are created from the support docs flow;
      // Server / Data Center exposes a personal HTTP access-token page on-host.
      let host: string;
      try {
        host = new URL(baseUrl).host;
      } catch {
        host = '';
      }
      if (host === 'bitbucket.org') {
        return 'https://support.atlassian.com/bitbucket-cloud/docs/repository-access-tokens/';
      }
      const root = baseUrl.replace(/\/+$/, '');
      return `${root}/plugins/servlet/access-tokens/manage`;
    }
    default:
      return undefined;
  }
}
