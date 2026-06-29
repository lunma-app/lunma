<script lang="ts">
import Button from './Button.svelte';
import Icon from './Icon.svelte';
import InlineError from './InlineError.svelte';
import TextInput from './TextInput.svelte';

interface Props {
  /** The account host (labels/aria; the "How to create one" target is `helpUrl`). */
  host: string;
  /**
   * Method-awareness (connector-accounts, design D8): `required` for a `pat`-only
   * provider (the token is needed to reach a ready state), `optional` for a
   * session-capable provider (the field is framed as an "add a token" upgrade).
   */
  requirement: 'required' | 'optional';
  /** Whether a token is already stored for this account. When true the field
   * collapses to a "Token set · Replace" control and NEVER echoes the value. */
  hasToken: boolean;
  /** Called with the entered (trimmed) token when the user confirms. The field
   * clears its local value immediately after — the token is never re-read into
   * the input. */
  onConnect: (token: string) => void;
  /** Optional — fired when the user opens the replace field (so a parent can
   * track the in-flight state). */
  onReplace?: (() => void) | undefined;
  /** Optional — when provided, a Cancel button renders next to Connect so the
   * affordance can be dismissed (used where the field is an inline editor, e.g.
   * the Options replace-token row). Omitted in the signed-out reconnect lanes,
   * where there is nothing to cancel back to. */
  onCancel?: (() => void) | undefined;
  /** A bad-token error to render under the field (e.g. "That token didn't work …"). */
  error?: string | undefined;
  /** The provider's token-creation docs URL — renders the "How to create one ↗"
   * helper when present. */
  helpUrl?: string | undefined;
  /** `data-testid` for the root. Default `'account-connect-field'`. */
  testid?: string | undefined;
}

const {
  host,
  requirement,
  hasToken,
  onConnect,
  onReplace,
  onCancel,
  error,
  helpUrl,
  testid = 'account-connect-field',
}: Props = $props();

// A stored token collapses to the "Token set · Replace" control until the user
// opens the field; a tokenless account is expanded by default. `collapsed`
// derives from the live `hasToken` prop so a parent that sets/clears the token
// flips the view without the field holding a stale initial copy.
let replaceOpened = $state(false);
let token = $state('');
const collapsed = $derived(hasToken && !replaceOpened);

// Stable per-instance id linking the token input to its error text via
// `aria-describedby`, so the error re-announces on refocus, not just on inject
// (ACF-03). Unique so multiple fields on a page never collide.
const errorId = `account-token-error-${crypto.randomUUID()}`;

function openReplace(): void {
  replaceOpened = true;
  onReplace?.();
}

function confirm(): void {
  const trimmed = token.trim();
  if (trimmed === '') return;
  onConnect(trimmed);
  // Never echo the value back — clear immediately and re-collapse so a now-set
  // token shows the "Token set" control again.
  token = '';
  replaceOpened = false;
}
</script>

<div class="connect-field" data-testid={testid}>
  {#if collapsed}
    <div class="token-set" data-testid="account-token-set">
      <span class="token-set-label">Token set</span>
      <span class="dot" aria-hidden="true">·</span>
      <Button size="sm" variant="ghost" testid="account-replace-trigger" onclick={openReplace}>
        Replace
      </Button>
    </div>
  {:else}
    <div class="reveal">
      <TextInput
        type="password"
        label={requirement === 'optional' ? 'Add a token (optional)' : 'Token'}
        ariaLabel={`Token for ${host}`}
        placeholder="ghp-… / glpat-…"
        bind:value={token}
        invalid={error !== undefined}
        required={requirement === 'required'}
        describedById={error !== undefined ? errorId : undefined}
        testid="account-token-input"
        onenter={confirm}
      />
      <div class="reveal-action">
        <Button
          variant="primary"
          disabled={token.trim() === ''}
          testid="account-connect-button"
          onclick={confirm}
        >
          Connect
        </Button>
        {#if onCancel}
          <Button size="sm" testid="account-connect-cancel" onclick={() => onCancel?.()}>
            Cancel
          </Button>
        {/if}
      </div>
    </div>
    {#if helpUrl !== undefined}
      <a class="help" href={helpUrl} target="_blank" rel="noreferrer" data-testid="account-help">
        How to create one <Icon name="external-link" size={12} />
      </a>
    {/if}
    {#if error !== undefined}
      <InlineError id={errorId} message={error} testid="account-connect-error" />
    {/if}
  {/if}
</div>

<style>
  .connect-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .token-set {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }
  .token-set-label {
    color: var(--text-muted);
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
  }
  .dot {
    color: var(--text-faint);
  }

  .reveal {
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
  }
  .reveal :global(.field) {
    flex: 1;
    min-width: 0;
  }
  .reveal-action {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .help {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--text-muted);
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
    text-decoration: none;
  }
  .help:hover {
    color: var(--text);
  }
  .help:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
    border-radius: var(--r-2xs);
  }
</style>
