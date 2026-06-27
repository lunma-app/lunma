<script lang="ts" module>
import type { LensProvider } from '../shared/types';

/** The account display-status vocabulary (connector-accounts, design D3/D8) — the
 * single mapping shared with `deriveAuthStatus`. Each status pairs a colour with
 * a WORD (never colour-only) for WCAG-AA. */
export type AccountStatus =
  | 'connected'
  | 'browser-session'
  | 'needs-token'
  | 'signed-out'
  | 'public';

/** The provider glyph (connector-accounts, design D8) — a lucide name the Icon
 * primitive lazy-loads. Both git forges share `folder-git-2` (lucide ships no
 * GitHub brand glyph), matching the connectors' `mintedIcon`. */
export const PROVIDER_GLYPH: Record<LensProvider, string> = {
  github: 'folder-git-2',
  gitlab: 'folder-git-2',
  jira: 'folder-kanban',
  rss: 'rss',
};

/** The status pip word (connector-accounts, design D8). */
export const STATUS_WORD: Record<AccountStatus, string> = {
  connected: 'Connected',
  'browser-session': 'Browser session',
  'needs-token': 'Add a token',
  'signed-out': 'Reconnect',
  public: 'Public',
};
</script>

<script lang="ts">
import Icon from './Icon.svelte';

interface Props {
  /** The account's provider — selects the leading glyph. */
  provider: LensProvider;
  /** The identity text (account name, else host). */
  label: string;
  /** The derived display status (connector-accounts) — drives the pip colour +
   * word. OMIT it for a Feed (a public URL has no auth status): the chip then
   * shows just the glyph + identity. */
  status?: AccountStatus | undefined;
  /** Optional tooltip / accessible title on the chip root. */
  title?: string | undefined;
  /**
   * `bare` drops the filled-pill background so the chip reads as quiet inline
   * identity text (used in the ledger/picker rows where the row itself carries
   * the affordance); the default filled treatment stays for standalone chips.
   */
  bare?: boolean | undefined;
  /** `data-testid` for the chip root. Default `'account-chip'`. */
  testid?: string | undefined;
}

const { provider, label, status, title, bare = false, testid = 'account-chip' }: Props = $props();
</script>

<span class="account-chip" class:bare data-status={status} data-testid={testid} {title}>
  <span class="glyph" aria-hidden="true"><Icon name={PROVIDER_GLYPH[provider]} size={14} /></span>
  <span class="label">{label}</span>
  {#if status !== undefined}
    <span class="pip" data-status={status} aria-hidden="true"></span>
    <span class="status" data-testid="account-chip-status">{STATUS_WORD[status]}</span>
  {/if}
</span>

<style>
  .account-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    max-width: 100%;
    height: var(--control-h-sm);
    padding: 0 var(--space-2);
    border-radius: var(--r-md);
    background: var(--surface-2);
    color: var(--text);
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
  }
  /* Bare: no fill — quiet inline identity for ledger/picker rows. The name leads
   * (a touch larger/medium), the status word recedes. */
  .account-chip.bare {
    height: auto;
    padding: 0;
    background: transparent;
    gap: var(--space-2);
  }
  .account-chip.bare .label {
    font: var(--weight-medium) var(--text-sm) / 1.2 var(--font-sans);
  }

  .glyph {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
  }

  .label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text);
  }

  /* The status pip: a colour STEP (never a pulse — design D8), always paired with
   * the word beside it so it never carries meaning by colour alone. */
  .pip {
    flex: 0 0 auto;
    width: 8px;
    height: 8px;
    margin-left: var(--space-1);
    border-radius: var(--r-pill);
    background: var(--text-dim);
  }
  .pip[data-status='connected'] {
    background: var(--success);
  }
  .pip[data-status='browser-session'],
  .pip[data-status='public'] {
    background: var(--text-dim);
  }
  .pip[data-status='needs-token'],
  .pip[data-status='signed-out'] {
    background: var(--warning);
  }

  .status {
    flex: 0 0 auto;
    color: var(--text-dim);
    font: var(--weight-medium) var(--text-2xs) / 1 var(--font-sans);
    white-space: nowrap;
  }
  .account-chip[data-status='needs-token'] .status,
  .account-chip[data-status='signed-out'] .status {
    color: var(--warning);
  }
</style>
