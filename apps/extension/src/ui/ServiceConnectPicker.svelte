<script lang="ts">
import { DEFAULT_BASE_URL, PROVIDER_LABEL, tokenRequirement } from '../shared/account-ui';
import { bus, dispatch } from '../shared/bus';
import { setAccountToken } from '../shared/connectors';
import { log } from '../shared/logger';
import { parseOpml } from '../shared/opml';
import type { LensProvider, SourceAccount, SpaceId } from '../shared/types';
import Button from './Button.svelte';
import InlineError from './InlineError.svelte';
import Select from './Select.svelte';
import TextInput from './TextInput.svelte';
import Toast from './Toast.svelte';

// ServiceConnectPicker (sources-redesign, D2/D10): the one cross-surface connect
// affordance, shared by the Options Connections manager and the lens editor. A
// Service `Select` (GitHub/GitLab/Jira/RSS feed) drives provider-appropriate
// fields; committing mints a `SourceAccount` via `createAccount` (client-minted
// id) + an optional off-bus `setAccountToken`, then returns the minted account to
// the host via `onConnected` (pre-selected in the editor). The RSS branch also
// offers OPML import as a bulk feed-add path, in one of two MODES set by the host:
//   • Options/Connections manager — passes `spaces`; the confirm step asks which
//     Space and dispatches `importOpml` (the SW bulk-creates ONE standalone feed
//     folder lens).
//   • Lens editor — passes `onImportFeeds`; the confirm step adds the parsed
//     feeds INTO the lens being assembled (the host mints/finds an account per
//     feed and pre-selects them), so no separate "Feeds" lens is spawned.
// It lives in `ui/` (imports `shared` only) because the import DAG forbids a
// cross-surface component under either surface — the same home as
// `AccountConnectField`.
interface Props {
  /** Called with the minted account after a successful connect (the host
   * pre-selects it / refreshes its list). */
  onConnected: (account: SourceAccount) => void;
  /** Spaces available as OPML-import targets (Options mode). When empty AND no
   * `onImportFeeds` is given, the RSS branch hides the "Import OPML" bulk option
   * (a surface with no import context). */
  spaces?: { id: SpaceId; name: string }[];
  /** Lens-editor mode: when provided, the RSS branch offers OPML import and the
   * confirm step calls this with the valid parsed feeds (to add INTO the lens
   * being built) instead of dispatching `importOpml`. Takes precedence over the
   * `spaces` standalone-import path. */
  onImportFeeds?: ((feeds: { name: string; feedUrl: string }[]) => void) | undefined;
  /** Optional close affordance (the host owns reveal/hide of the picker). */
  onCancel?: (() => void) | undefined;
  testid?: string | undefined;
}

const {
  onConnected,
  spaces = [],
  onImportFeeds,
  onCancel,
  testid = 'service-connect-picker',
}: Props = $props();

const SERVICE_OPTIONS = (['github', 'gitlab', 'jira', 'rss'] as const).map((p) => ({
  value: p,
  label: PROVIDER_LABEL[p],
}));

let service = $state<LensProvider>('github');
let baseUrl = $state(DEFAULT_BASE_URL.github);
let token = $state('');
let connectError = $state<string | null>(null);

const isFeed = $derived(service === 'rss');
const requirement = $derived(tokenRequirement(service));
const canConnect = $derived(
  baseUrl.trim() !== '' && (requirement !== 'required' || token.trim() !== ''),
);
// Field placeholders (the comp labels via placeholder, not a field label): host
// seeds from the provider default, the token hints at the expected prefix.
const hostPlaceholder = $derived(
  isFeed ? 'https://example.com/feed.xml' : DEFAULT_BASE_URL[service],
);
const tokenPlaceholder = $derived(
  requirement === 'optional' ? 'Token (optional) — glpat-…' : 'Token — ghp-…',
);

function onServiceChange(value: string): void {
  service = value as LensProvider;
  baseUrl = DEFAULT_BASE_URL[service];
  token = '';
  connectError = null;
}

async function connect(): Promise<void> {
  if (!canConnect) return;
  connectError = null;
  const id = crypto.randomUUID();
  const trimmedBase = baseUrl.trim();
  // No inline name — the account labels by host; rename lives in the Connections
  // row menu (the comp's picker has no name field).
  const account: SourceAccount = { id, provider: service, baseUrl: trimmedBase };
  try {
    await bus.send({
      kind: 'createAccount',
      payload: { id, provider: service, baseUrl: trimmedBase },
    });
  } catch (err) {
    log.error('ServiceConnectPicker: createAccount failed', { err });
    connectError = err instanceof Error ? err.message : "Couldn't connect that service.";
    return;
  }
  const trimmedToken = token.trim();
  if (trimmedToken !== '') await setAccountToken(id, trimmedToken);
  // Reset for a possible next add; report the minted account to the host.
  baseUrl = DEFAULT_BASE_URL[service];
  token = '';
  onConnected(account);
}

// ── OPML import (rss branch — opml-import-export) ─────────────────────────────
let pendingFeeds = $state<{ name: string; feedUrl: string }[] | null>(null);
let importSpaceId = $state<SpaceId | ''>('');
let importError = $state<string | null>(null);
let toast = $state<{ message: string } | null>(null);
let fileInput = $state<HTMLInputElement>();

const spaceOptions = $derived(spaces.map((s) => ({ value: s.id, label: s.name })));

// OPML import is offered when the host gives EITHER a target Space (Options
// standalone import) or an `onImportFeeds` handler (lens-editor "add to this
// lens"). The editor mode takes precedence — no Space picker, no `importOpml`.
const editorImport = $derived(onImportFeeds !== undefined);
const canImport = $derived(editorImport || spaces.length > 0);

$effect(() => {
  if (importSpaceId === '' && spaces[0]) importSpaceId = spaces[0].id;
});

function isHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

async function onFilePicked(event: Event): Promise<void> {
  importError = null;
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  let text: string;
  try {
    text = await file.text();
  } catch (err) {
    log.error('ServiceConnectPicker: read OPML failed', { err });
    importError = "Couldn't read that file.";
    return;
  }
  const feeds = parseOpml(text);
  if (feeds.length === 0) {
    importError = 'No feeds found in that OPML file.';
    return;
  }
  pendingFeeds = feeds;
}

function cancelImport(): void {
  pendingFeeds = null;
  importError = null;
}

function confirmImport(): void {
  const feeds = pendingFeeds;
  if (!feeds) return;
  const validFeeds = feeds.filter((f) => isHttpUrl(f.feedUrl));
  const valid = validFeeds.length;
  const skipped = feeds.length - valid;
  if (editorImport) {
    // Lens-editor mode: hand the valid feeds to the host to add INTO the lens
    // being assembled (mint/find an account per feed + pre-select). No
    // `importOpml`, so no separate "Feeds" lens is spawned.
    onImportFeeds?.(validFeeds);
    pendingFeeds = null;
    if (valid === 0) toast = { message: 'No valid feed URLs found' };
    else if (skipped > 0) toast = { message: `Added ${valid} feeds (${skipped} skipped)` };
    else toast = { message: `Added ${valid} feeds to this lens` };
    return;
  }
  // Options mode: bulk-create one standalone feed folder lens in the chosen Space.
  const spaceId = importSpaceId;
  if (spaceId === '') return;
  dispatch({ kind: 'importOpml', payload: { spaceId, feeds } });
  pendingFeeds = null;
  if (valid === 0) toast = { message: 'No valid feed URLs found' };
  else if (skipped > 0)
    toast = { message: `Folder imported with ${valid} feeds (${skipped} skipped)` };
  else toast = { message: `Folder imported with ${valid} feeds` };
}
</script>

<div class="picker" data-testid={testid}>
  <!-- Stacked, full-width fields (the comp): a labelled Service select, then the
       host, then the token — each on its own line. -->
  <label class="field">
    <span class="field-label">Service</span>
    <Select
      options={SERVICE_OPTIONS}
      value={service}
      ariaLabel="Service"
      testid="connect-service"
      onchange={onServiceChange}
    />
  </label>

  <TextInput
    ariaLabel={isFeed ? 'Feed URL' : 'Host'}
    placeholder={hostPlaceholder}
    bind:value={baseUrl}
    testid="connect-host"
  />

  {#if requirement !== 'none'}
    <TextInput
      type="password"
      ariaLabel="Token"
      placeholder={tokenPlaceholder}
      bind:value={token}
      testid="connect-token"
      onenter={() => void connect()}
    />
  {/if}

  <div class="actions">
    <span class="actions-note">
      {#if isFeed}
        {#if canImport}
          Have a lot?
          <button type="button" class="link" data-testid="connect-import-opml" onclick={() => fileInput?.click()}>
            Import OPML…
          </button>
        {:else}
          Public feed — no auth needed.
        {/if}
      {:else if requirement === 'none'}
        Public — no auth needed.
      {:else}
        Tokens stay on this machine, never shown again.
      {/if}
    </span>
    {#if onCancel}
      <Button variant="ghost" testid="connect-cancel" onclick={() => onCancel?.()}>Cancel</Button>
    {/if}
    <Button variant="primary" disabled={!canConnect} testid="connect-commit" onclick={() => void connect()}>
      Connect
    </Button>
  </div>

  {#if connectError}
    <InlineError message={connectError} testid="connect-error" />
  {/if}

  <!-- OPML bulk-add: a file picker reveals the "Found N feeds — import as one
       folder into:" confirm step (opml-import-export). -->
  <input
    bind:this={fileInput}
    type="file"
    accept=".opml,.xml"
    class="sr-only"
    data-testid="connect-import-file"
    onchange={(e) => void onFilePicked(e)}
  />

  {#if pendingFeeds}
    <div class="import-confirm" data-testid="connect-import-confirm">
      <span class="import-found">
        Found {pendingFeeds.length}
        {pendingFeeds.length === 1 ? 'feed' : 'feeds'} —
        {editorImport ? 'add to this lens:' : 'import as one folder into:'}
      </span>
      {#if !editorImport}
        <Select
          options={spaceOptions}
          value={importSpaceId}
          ariaLabel="Import into Space"
          testid="connect-import-space"
          onchange={(v) => {
            importSpaceId = v;
          }}
        />
      {/if}
      <div class="import-actions">
        <Button variant="ghost" onclick={cancelImport}>Cancel</Button>
        <Button variant="primary" testid="connect-import-button" onclick={confirmImport}>
          {editorImport ? 'Add' : 'Import'}
        </Button>
      </div>
    </div>
  {/if}

  {#if importError}
    <InlineError message={importError} testid="connect-import-error" />
  {/if}
</div>

{#if toast}
  <Toast message={toast.message} onDismiss={() => (toast = null)} />
{/if}

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  /* Stacked field: a label above a full-width control (the comp's "Service"). */
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  .field-label {
    color: var(--text-muted);
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
  }
  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  /* The footer note sits left, Connect right (the comp). */
  .actions-note {
    flex: 1 1 auto;
    min-width: 0;
    color: var(--text-dim);
    font: var(--weight-regular) var(--text-xs) / 1.3 var(--font-sans);
  }
  .link {
    appearance: none;
    border: 0;
    background: transparent;
    padding: 0;
    cursor: pointer;
    color: var(--text-muted);
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .link:hover {
    color: var(--text);
  }
  .link:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
  .import-confirm {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid var(--divider);
  }
  .import-found {
    color: var(--text-muted);
    font: var(--weight-regular) var(--text-sm) / 1.4 var(--font-sans);
  }
  .import-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
