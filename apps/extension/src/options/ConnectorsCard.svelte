<script lang="ts">
import { onMount, tick } from 'svelte';
import { readConnectors, setConnectorToken } from '../shared/connectors';
import Button from '../ui/Button.svelte';
import SettingsCard from '../ui/SettingsCard.svelte';
import TextInput from '../ui/TextInput.svelte';

// ── Connectors (smart-folders, design D10) ────────────────────────────────────
// Per-instance access tokens for smart folders — a custom, storage.local-backed
// section OUTSIDE the sync settings registry (tokens must not ride a Google
// account across machines). Reads/writes go only through `shared/connectors.ts`.
// The stored token value is NEVER echoed back into the page — only the hosts are
// listed, each with a token-set indicator and a "Token set — replace?"
// affordance. Changes take effect on the connector's next poll, no reload. The
// `<section id="connectors">` anchor is a cross-surface deep-link target (the
// sidebar SmartFolder + the launcher overlay route here via the SW).

/** Hosts with a stored token. The VALUES never leave `readConnectors`' scope. */
let connectorHosts = $state<string[]>([]);
// The add-form draft (host + token) and the host whose token is being replaced
// (its inline password field is open).
let newConnectorHost = $state('');
let newConnectorToken = $state('');
let replacingHost = $state<string | null>(null);
let replacementToken = $state('');
// The currently-open inline replace row (only one host replaces at a time), so
// the options inline-reveal focus guarantee can move focus to the password field
// on open and back to that row's "replace?" trigger on cancel.
let replaceEl = $state<HTMLElement>();

async function refreshConnectorHosts(): Promise<void> {
  const record = await readConnectors();
  connectorHosts = Object.keys(record).sort();
}

/** Open the inline token-replace field for a host and focus the password input. */
async function openReplace(host: string): Promise<void> {
  replacingHost = host;
  replacementToken = '';
  await tick();
  replaceEl?.querySelector<HTMLInputElement>('input')?.focus();
}

/** Cancel the replace reveal and restore focus to that row's trigger. */
async function cancelReplace(): Promise<void> {
  const row = replaceEl?.closest('.connector-row') as HTMLElement | null;
  replacingHost = null;
  replacementToken = '';
  await tick();
  row?.querySelector<HTMLButtonElement>('[data-testid="connector-replace-trigger"]')?.focus();
}

/** Normalize a host entry: a bare host passes through; a pasted URL collapses
 * to its host (the engine's PAT lookup key is `new URL(baseUrl).host`). */
function normalizeHost(raw: string): string {
  const trimmed = raw.trim();
  try {
    return new URL(trimmed).host;
  } catch {
    return trimmed;
  }
}

async function addConnector(): Promise<void> {
  const host = normalizeHost(newConnectorHost);
  const token = newConnectorToken.trim();
  if (host === '' || token === '') return;
  await setConnectorToken(host, token);
  newConnectorHost = '';
  newConnectorToken = '';
  await refreshConnectorHosts();
}

async function replaceConnector(host: string): Promise<void> {
  const token = replacementToken.trim();
  if (token === '') return;
  await setConnectorToken(host, token);
  replacingHost = null;
  replacementToken = '';
  await refreshConnectorHosts();
}

async function clearConnector(host: string): Promise<void> {
  await setConnectorToken(host, null);
  if (replacingHost === host) replacingHost = null;
  replacementToken = '';
  await refreshConnectorHosts();
}

onMount(() => {
  void refreshConnectorHosts();
});
</script>

<SettingsCard heading="Connectors" id="connectors" testid="connectors-section">
  <p class="connector-intro">
    GitLab folders ride your browser's sign-in by default; GitHub folders always need a
    token. Add a per-host access token (GitLab: <code>read_api</code> scope; GitHub: a
    token that can read pull requests) — it stays on this machine and applies on the next
    refresh.
  </p>

  {#each connectorHosts as host (host)}
    <div class="connector-row" data-testid="connector-row">
      <div class="connector-host-cell">
        <span class="connector-host">{host}</span>
        <span class="connector-indicator" data-testid="connector-token-set">Token set</span>
      </div>
      {#if replacingHost === host}
        <div class="connector-replace" bind:this={replaceEl}>
          <TextInput
            type="password"
            ariaLabel={`New token for ${host}`}
            placeholder="glpat-…"
            bind:value={replacementToken}
            testid="connector-replace-input"
            onenter={() => void replaceConnector(host)}
          />
          <Button variant="primary" onclick={() => void replaceConnector(host)}>Save</Button>
          <Button onclick={() => void cancelReplace()}>Cancel</Button>
        </div>
      {:else}
        <div class="connector-actions">
          <Button testid="connector-replace-trigger" onclick={() => void openReplace(host)}>
            Token set — replace?
          </Button>
          <Button onclick={() => void clearConnector(host)}>Remove</Button>
        </div>
      {/if}
    </div>
  {/each}

  <div class="connector-add">
    <TextInput
      label="Instance host"
      placeholder="gitlab.example.com"
      bind:value={newConnectorHost}
      testid="connector-host-input"
    />
    <TextInput
      label="Access token"
      type="password"
      placeholder="glpat-…"
      bind:value={newConnectorToken}
      testid="connector-token-input"
      onenter={() => void addConnector()}
    />
    <div class="connector-add-action">
      <Button
        variant="primary"
        disabled={newConnectorHost.trim() === '' || newConnectorToken.trim() === ''}
        onclick={() => void addConnector()}
      >
        Add token
      </Button>
    </div>
  </div>
</SettingsCard>

<style>
  /* Connectors (smart-folders D10): host rows + the add form. Quiet, list-like —
   * a host name with a token-set indicator pill and plain-button actions. */
  .connector-intro {
    margin: 0 0 var(--space-3);
    font: var(--weight-regular) var(--text-sm) / 1.45 var(--font-sans);
    color: var(--text-muted);
  }
  .connector-intro code {
    font-family: var(--font-mono);
  }
  .connector-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--divider);
  }
  .connector-host-cell {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }
  .connector-host {
    font: var(--weight-medium) var(--text-base) / 1.2 var(--font-sans);
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .connector-indicator {
    flex-shrink: 0;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--r-pill);
    background: var(--surface-2);
    color: var(--text-faint);
    font: var(--weight-medium) var(--text-2xs) / 1 var(--font-sans);
  }
  .connector-actions,
  .connector-replace {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .connector-replace {
    flex: 1;
    max-width: 320px;
  }
  .connector-add {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding-top: var(--space-3);
  }
  .connector-add-action {
    display: flex;
    justify-content: flex-end;
  }
</style>
