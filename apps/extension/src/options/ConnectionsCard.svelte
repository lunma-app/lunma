<script lang="ts">
import { onMount } from 'svelte';
import {
  accountLabel,
  hostLabel,
  isFeedProvider,
  tokenHelpUrl,
  tokenRequirement,
} from '../shared/account-ui';
import { type AuthStatus, deriveAuthStatus } from '../shared/auth-method';
import { bus } from '../shared/bus';
import { readPersistedState, STATE_STORAGE_KEY } from '../shared/chrome/storage';
import { readAccountTokens, setAccountToken } from '../shared/connectors';
import { entityForSource, type LensEntity } from '../shared/lens-entity';
import { log } from '../shared/logger';
import { buildOpml, type LensNode } from '../shared/opml';
import { m } from '../shared/paraglide/messages';
import type { AppState, LensProvider, PinNode, SourceAccount, SpaceId } from '../shared/types';
import AccountConnectField from '../ui/AccountConnectField.svelte';
import Button from '../ui/Button.svelte';
import Icon from '../ui/Icon.svelte';
import InlineError from '../ui/InlineError.svelte';
import Menu, { type MenuItem } from '../ui/Menu.svelte';
import ServiceConnectPicker from '../ui/ServiceConnectPicker.svelte';
import SettingsCard from '../ui/SettingsCard.svelte';
import TextInput from '../ui/TextInput.svelte';
import Toast from '../ui/Toast.svelte';

// ConnectionsCard (sources-redesign, D1): the single Options home for every
// connected source — an **Accounts** group + a **Feeds** group, matching the
// redesign comp: a `+ Connect` affordance on the card header, ledger rows that
// lead with an identity tile + bold name + status, an "Used in N lenses · powers
// …" reach subline, a floating ⋯ menu (Menu primitive), and an inline editor that
// opens below the row for rename / replace-token / disconnect. Reach reads
// `pinnedBySpace[*]`; tokens go straight to `shared/connectors.ts`.

let accounts = $state<SourceAccount[]>([]);
let feeds = $state<SourceAccount[]>([]);
let pinnedBySpace = $state<{ [spaceId: string]: PinNode[] }>({});
let spaces = $state<{ id: SpaceId; name: string }[]>([]);
let sources = $state<AppState['sources']>({});
let tokenIds = $state<Set<string>>(new Set());

let showPicker = $state(false);
let toast = $state<{ message: string } | null>(null);
let exportError = $state<string | null>(null);

// One inline editor at a time, opening below its row.
type EditorMode = 'replace' | 'rename' | 'disconnect';
let activeEditor = $state<{ account: SourceAccount; mode: EditorMode } | null>(null);
let renameDraft = $state('');

/** Two-letter provider mark for an account's identity tile (the comp's GH/GL/JR);
 * feeds render the rss glyph instead. */
const PROVIDER_ABBREV: Record<LensProvider, string> = {
  github: 'GH',
  gitlab: 'GL',
  jira: 'JR',
  rss: '',
};

/** The overview entity an account/feed feeds (sources-redesign): what its lenses
 * render it as. Drives the "powers …" reach phrase. */
const ENTITY_LABEL: Record<LensEntity, string> = {
  change: m.entity_changes(),
  ticket: m.entity_issues(),
  article: m.entity_articles(),
  generic: m.entity_other(),
};
function poweredEntity(provider: LensProvider): string {
  return ENTITY_LABEL[entityForSource(provider)];
}

async function read(): Promise<void> {
  try {
    const persisted = await readPersistedState();
    if (persisted.kind === 'ok' || persisted.kind === 'salvaged') {
      sources = persisted.state.sources;
      const all = Object.values(persisted.state.sources).sort((a, b) =>
        accountLabel(a).localeCompare(accountLabel(b)),
      );
      accounts = all.filter((a) => !isFeedProvider(a.provider));
      feeds = all.filter((a) => isFeedProvider(a.provider));
      pinnedBySpace = persisted.state.pinnedBySpace;
      spaces = persisted.state.spaces.map((s) => ({ id: s.id, name: s.name }));
    } else {
      accounts = [];
      feeds = [];
      sources = {};
      pinnedBySpace = {};
      spaces = [];
    }
  } catch (err) {
    log.error('ConnectionsCard: read failed', { err });
  }
  tokenIds = new Set(Object.keys(await readAccountTokens()));
}

onMount(() => {
  void read();
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string): void => {
    if (area === 'local' && (changes[STATE_STORAGE_KEY] || changes['lunma.connectors']))
      void read();
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
});

/** Reach: distinct lens nodes across EVERY Space that reference this source. */
function reachOf(id: string): number {
  let count = 0;
  for (const nodes of Object.values(pinnedBySpace)) {
    for (const node of nodes) {
      if (node.kind === 'lens' && node.sources.some((r) => r.sourceId === id)) count += 1;
    }
  }
  return count;
}
function reachPhrase(id: string): string {
  const n = reachOf(id);
  return n === 0 ? m.options_reachNotUsed() : m.options_reachUsed({ count: n });
}

function statusOf(account: SourceAccount): AuthStatus {
  return deriveAuthStatus(account.provider, tokenIds.has(account.id));
}

// The comp keeps two independent signals on an account row: the **auth method**
// (a label — how we authenticate) and the **connection health** (a pip — whether
// the connection is good). Both are derived from the one `AuthStatus` we track:
// a token is the confident `connected` (green); a provider needing action
// (`needs-token`/`signed-out`) is `attention` (amber); a browser session is
// `unknown` until a poll proves it (a hollow ring — never a confident colour).
type Health = 'connected' | 'attention' | 'unknown';
function healthOf(status: AuthStatus): Health {
  if (status === 'connected') return 'connected';
  if (status === 'needs-token' || status === 'signed-out') return 'attention';
  return 'unknown';
}
/** The auth-method label shown beside the pip. */
function authMethodLabel(status: AuthStatus): string {
  switch (status) {
    case 'connected':
      return m.options_authMethodPersonalToken();
    case 'browser-session':
      return m.options_authMethodBrowserSession();
    case 'needs-token':
      return m.options_authMethodTokenNeeded();
    case 'signed-out':
      return m.options_authMethodSignInNeeded();
    case 'public':
      return m.options_authMethodPublic();
  }
}

/** A feed's identity URL without the scheme (the comp's "news.ycombinator.com/rss"). */
function feedUrl(account: SourceAccount): string {
  return account.baseUrl.replace(/^https?:\/\//, '');
}

// Lenses referencing an rss account — gates the Export OPML utility + feeds it.
const rssNodes = $derived.by<LensNode[]>(() => {
  const out: LensNode[] = [];
  for (const nodes of Object.values(pinnedBySpace)) {
    for (const node of nodes) {
      if (
        node.kind === 'lens' &&
        node.sources.some((r) => sources[r.sourceId]?.provider === 'rss')
      ) {
        out.push(node);
      }
    }
  }
  return out;
});

function setEditor(account: SourceAccount, mode: EditorMode): void {
  if (mode === 'rename') renameDraft = account.name ?? '';
  activeEditor = { account, mode };
}
function closeEditor(): void {
  activeEditor = null;
}

async function onConnected(): Promise<void> {
  showPicker = false;
  await read();
}

async function replaceToken(id: string, token: string): Promise<void> {
  await setAccountToken(id, token);
  closeEditor();
  await read();
}

async function commitRename(account: SourceAccount): Promise<void> {
  const name = renameDraft.trim();
  if (name !== '') {
    try {
      await bus.send({ kind: 'renameAccount', payload: { id: account.id, name } });
    } catch (err) {
      log.error('ConnectionsCard: renameAccount failed', { err });
    }
  }
  closeEditor();
  await read();
}

async function removeSource(id: string): Promise<void> {
  try {
    await bus.send({ kind: 'deleteAccount', payload: { id } });
  } catch (err) {
    log.error('ConnectionsCard: deleteAccount failed', { err });
    return;
  }
  await setAccountToken(id, null);
  closeEditor();
  await read();
}

async function copyUrl(account: SourceAccount): Promise<void> {
  try {
    await navigator.clipboard?.writeText(account.baseUrl);
    toast = { message: m.options_feedUrlCopied() };
  } catch (err) {
    log.error('ConnectionsCard: copy URL failed', { err });
  }
}

function accountMenuItems(account: SourceAccount): MenuItem[] {
  return [
    {
      id: 'replace',
      label: tokenIds.has(account.id)
        ? m.options_accountReplaceToken()
        : m.options_accountAddToken(),
      icon: 'key-round',
      onSelect: () => setEditor(account, 'replace'),
    },
    {
      id: 'rename',
      label: m.options_accountRename(),
      icon: 'pencil',
      onSelect: () => setEditor(account, 'rename'),
    },
    {
      id: 'disconnect',
      label: m.options_accountDisconnect(),
      icon: 'unplug',
      danger: true,
      onSelect: () => setEditor(account, 'disconnect'),
    },
  ];
}
function feedMenuItems(feed: SourceAccount): MenuItem[] {
  return [
    {
      id: 'rename',
      label: m.options_feedRename(),
      icon: 'pencil',
      onSelect: () => setEditor(feed, 'rename'),
    },
    {
      id: 'copy',
      label: m.options_feedCopyUrl(),
      icon: 'link',
      onSelect: () => void copyUrl(feed),
    },
    {
      id: 'remove',
      label: m.options_feedRemove(),
      icon: 'trash-2',
      danger: true,
      onSelect: () => setEditor(feed, 'remove' as EditorMode),
    },
  ];
}

function handleExport(): void {
  exportError = null;
  try {
    const xml = buildOpml(rssNodes, sources);
    const date = new Date().toISOString().slice(0, 10);
    const url = URL.createObjectURL(new Blob([xml], { type: 'text/xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `lunma-feeds-${date}.opml`;
    a.click();
    URL.revokeObjectURL(url);
    toast = { message: m.options_feedsExported() };
  } catch (err) {
    log.error('ConnectionsCard: export failed', { err });
    exportError = err instanceof Error ? err.message : 'Export failed.';
  }
}
</script>

<SettingsCard
  heading={m.options_connectionsHeading()}
  id="connectors"
  testid="connections-section"
  description={m.options_connectionsDescription()}
  actions={connectAction}
  flush
>
  {#if showPicker}
    <div class="picker-reveal" data-testid="connect-picker">
      <ServiceConnectPicker {spaces} onConnected={() => void onConnected()} />
    </div>
  {/if}

  <!-- Accounts group -->
  <div class="group" data-testid="accounts-group">
    <div class="group-head">
      <h3 class="group-title">{m.options_accountsGroupTitle()}</h3>
      <span class="group-meta">{m.options_accountsMetaDescription()}</span>
    </div>
    {#if accounts.length === 0}
      <p class="group-empty">{m.options_noAccounts()}</p>
    {/if}
    {#each accounts as account (account.id)}
      {@const status = statusOf(account)}
      {@const health = healthOf(status)}
      <div class="conn-row" data-testid="account-row" data-account-id={account.id}>
        <div class="row-top">
          <span class="tile" aria-hidden="true">{PROVIDER_ABBREV[account.provider]}</span>
          <div class="row-id">
            <span class="row-name-line">
              <span class="row-name">{accountLabel(account)}</span>
              <span class="status" data-health={health} data-testid="account-status">
                <span class="pip" data-health={health} aria-hidden="true"></span>
                {authMethodLabel(status)}
              </span>
            </span>
            <span class="row-sub" data-testid="account-reach">
              {m.options_accountReachLine({
                reach: reachPhrase(account.id),
                entity: poweredEntity(account.provider),
              })}
            </span>
          </div>
          <span class="row-menu">
            <Menu trigger="kebab" label={`Actions for ${accountLabel(account)}`} items={accountMenuItems(account)} />
          </span>
        </div>
        {#if activeEditor?.account.id === account.id}
          {@render editorBelow(account)}
        {/if}
      </div>
    {/each}
  </div>

  <!-- Feeds group -->
  <div class="group" data-testid="feeds-group">
    <div class="group-head">
      <h3 class="group-title">{m.options_feedsGroupTitle()}</h3>
      {#if rssNodes.length > 0}
        <button type="button" class="group-action" data-testid="export-opml" onclick={handleExport}>
          {m.options_exportOpml()}
        </button>
      {/if}
    </div>
    {#if feeds.length === 0}
      <p class="group-empty">{m.options_noFeeds()}</p>
    {/if}
    {#each feeds as feed (feed.id)}
      <div class="conn-row" data-testid="feed-row" data-account-id={feed.id}>
        <div class="row-top">
          <span class="tile feed" aria-hidden="true"><Icon name="rss" size={16} /></span>
          <div class="row-id">
            <span class="row-name-line">
              <span class="row-name">{accountLabel(feed)}</span>
            </span>
            <span class="row-sub" data-testid="feed-meta">
              {m.options_feedReachLine({
                feedUrl: feedUrl(feed),
                reach: reachPhrase(feed.id),
                entity: m.entity_articles(),
              })}
            </span>
          </div>
          <span class="row-menu">
            <Menu trigger="kebab" label={`Actions for ${accountLabel(feed)}`} items={feedMenuItems(feed)} />
          </span>
        </div>
        {#if activeEditor?.account.id === feed.id}
          {@render editorBelow(feed)}
        {/if}
      </div>
    {/each}
  </div>

  {#if exportError}
    <div class="card-foot">
      <InlineError message={exportError} testid="export-error" />
    </div>
  {/if}
</SettingsCard>

{#if toast}
  <Toast message={toast.message} onDismiss={() => (toast = null)} />
{/if}

{#snippet connectAction()}
  <!-- Header toggle (comp): an accent-tinted outline pill for "+ Connect" that
       flips to a neutral grey "Close" while the picker is open. -->
  <button
    type="button"
    class="connect-toggle"
    class:open={showPicker}
    data-testid="connect-open"
    onclick={() => (showPicker = !showPicker)}
  >
    {showPicker ? m.options_connectToggleClose() : m.options_connectToggleConnect()}
  </button>
{/snippet}

<!-- The inline editor that opens below the active row (rename / replace-token /
     disconnect confirm), matching the Accounts-manager pattern. -->
{#snippet editorBelow(account: SourceAccount)}
  {@const reach = reachOf(account.id)}
  {#if activeEditor?.mode === 'replace'}
    <div class="row-editor" data-testid="account-editor">
      <AccountConnectField
        host={hostLabel(account.baseUrl)}
        requirement={tokenRequirement(account.provider) === 'optional' ? 'optional' : 'required'}
        hasToken={false}
        helpUrl={tokenHelpUrl(account.provider, account.baseUrl)}
        onConnect={(t) => void replaceToken(account.id, t)}
        onCancel={closeEditor}
      />
    </div>
  {:else if activeEditor?.mode === 'rename'}
    <div class="row-editor" data-testid="rename-editor">
      <TextInput
        ariaLabel={`New name for ${hostLabel(account.baseUrl)}`}
        placeholder={m.common_name()}
        bind:value={renameDraft}
        testid="rename-input"
        onenter={() => void commitRename(account)}
      />
      <Button variant="primary" size="sm" onclick={() => void commitRename(account)}
        >{m.common_save()}</Button
      >
      <Button size="sm" onclick={closeEditor}>{m.common_cancel()}</Button>
    </div>
  {:else}
    <div class="row-editor" data-testid="remove-confirm">
      {#if reach > 0}
        <span class="warn-text">{m.options_removeConfirmWarn({ count: reach })}</span>
      {/if}
      <Button variant="primary" size="sm" testid="remove-confirm-button" onclick={() => void removeSource(account.id)}>
        {isFeedProvider(account.provider) ? m.options_feedRemove() : m.options_accountDisconnect()}
      </Button>
      <Button size="sm" onclick={closeEditor}>{m.common_cancel()}</Button>
    </div>
  {/if}
{/snippet}

<style>
  /* Header "+ Connect" toggle (comp): a cool-primary outline pill — primary
     border + faint primary fill + light-primary text — flipping to a neutral grey
     "Close" while the picker is open. The redesign reserves the SOLID `--primary`
     for commit buttons; this affordance is the soft/outline form. */
  .connect-toggle {
    flex-shrink: 0;
    height: var(--control-h-md);
    padding: 0 var(--space-3);
    border-radius: var(--r-md);
    border: 1px solid var(--primary-border);
    background: var(--primary-soft);
    color: var(--primary-text);
    font: var(--weight-semibold) var(--text-base) / 1 var(--font-sans);
    cursor: pointer;
    transition:
      background var(--motion-fast) var(--ease-standard),
      border-color var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard);
  }
  .connect-toggle:hover {
    background: color-mix(in oklch, var(--primary) 24%, transparent);
  }
  .connect-toggle:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
  .connect-toggle.open {
    border-color: var(--border);
    background: var(--surface-2);
    color: var(--text-2);
  }

  /* The connect picker reveals as its own bordered panel below the header,
     inset by the card's `--space-5` gutter. It sits a step ABOVE the recessed
     `--bg` input fields inside it, so the dark bordered inputs read as inset
     (the comp's card › panel › input depth). */
  .picker-reveal {
    margin: 0 var(--space-5) var(--space-4);
    padding: var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    background: var(--bg-elev);
  }

  /* Flush group header: a full-bleed uppercase micro-label + meta, separated from
     what's above by an edge-to-edge divider (the comp). */
  .group-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-5) var(--space-2);
    border-top: 1px solid var(--border-soft);
  }
  .group-title {
    margin: 0;
    font: var(--weight-semibold) var(--text-2xs) / 1.4 var(--font-sans);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .group-meta {
    font: var(--weight-regular) var(--text-xs) / 1.2 var(--font-sans);
    color: var(--text-faint);
  }
  .group-action {
    appearance: none;
    border: 0;
    background: transparent;
    cursor: pointer;
    padding: 0;
    color: var(--text-dim);
    font: var(--weight-medium) var(--text-xs) / 1.2 var(--font-sans);
    transition: color var(--motion-fast) var(--ease-standard);
  }
  .group-action:hover {
    color: var(--text);
  }
  .group-action:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
  .group-empty {
    margin: 0;
    padding: var(--space-2) var(--space-5) var(--space-3);
    color: var(--text-dim);
    font: var(--weight-regular) var(--text-sm) / 1.3 var(--font-sans);
  }

  /* Rows divide between each other (not at the group-head boundary, which the
     group-head's own border-top already draws). */
  .conn-row + .conn-row {
    border-top: 1px solid var(--border-soft);
  }
  .row-top {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-5);
  }
  /* Identity tile — a compact rounded square leading each row (comp: 30px, the
   * surface-3 step, mono initials). */
  .tile {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: var(--r-md);
    background: var(--surface-3);
    color: var(--text-2);
    font: var(--weight-bold) var(--text-xs) / 1 var(--font-mono);
  }
  /* Feed tile carries the warm rss wash (comp's orange-tinted square) — its own
     `--rss` hue, distinct from the amber attention `--warning`. */
  .tile.feed {
    background: var(--rss-soft);
    color: var(--rss);
  }
  .row-id {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .row-name-line {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }
  .row-name {
    font: var(--weight-semibold) var(--text-base) / 1.2 var(--font-sans);
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* Connection-health pip: a confident dot when connected (green) or needing
     action (amber), and a hollow ring while unverified — never a confident
     colour for a state we haven't proved. */
  .status {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    flex: 0 0 auto;
    font: var(--weight-regular) var(--text-xs) / 1 var(--font-sans);
    color: var(--text-muted);
  }
  .status[data-health='attention'] {
    color: var(--warning);
  }
  .pip {
    flex: 0 0 auto;
    box-sizing: border-box;
    width: 7px;
    height: 7px;
    border-radius: var(--r-pill);
    background: transparent;
    border: 1.5px solid var(--text-faint);
  }
  .pip[data-health='connected'] {
    background: var(--success);
    border: 0;
  }
  .pip[data-health='attention'] {
    background: var(--warning);
    border: 0;
  }
  .row-sub {
    color: var(--text-dim);
    font: var(--weight-regular) var(--text-xs) / 1.3 var(--font-sans);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row-menu {
    flex: 0 0 auto;
  }
  /* A card-footer slot (e.g. the export-error box) keeps the card's gutter. */
  .card-foot {
    padding: 0 var(--space-5) var(--space-4);
  }

  .row-editor {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-2);
    /* Inset under the row text: card gutter + the 30px tile + its gap, so the
       editor aligns beneath the name rather than the tile. */
    padding: 0 var(--space-5) var(--space-3) calc(var(--space-5) + 30px + var(--space-3));
  }
  .row-editor > :global(.field) {
    flex: 1 1 12rem;
    min-width: 0;
  }
  .warn-text {
    flex-basis: 100%;
    color: var(--warning);
    font: var(--weight-medium) var(--text-xs) / 1.3 var(--font-sans);
  }
</style>
