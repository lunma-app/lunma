<script lang="ts">
import { accountLabel, hostLabel, isFeedProvider, normalizeBaseUrl } from '../shared/account-ui';
import { deriveAuthStatus } from '../shared/auth-method';
import { dispatch } from '../shared/bus';
import { requiredOriginsForConfig } from '../shared/connector-origins';
import { readAccountTokens } from '../shared/connectors';
import { entitiesForSource, type LensEntity } from '../shared/lens-entity';
import { m } from '../shared/paraglide/messages';
import { requestHostPermissions } from '../shared/permissions';
import type {
  LensProvider,
  LensQuery,
  LensSourceRef,
  PinNode,
  SourceAccount,
  SpaceId,
  WindowId,
} from '../shared/types';
import AccountChip from '../ui/AccountChip.svelte';
import Button from '../ui/Button.svelte';
import Icon from '../ui/Icon.svelte';
import MultiSelect, { type MultiSelectOption } from '../ui/MultiSelect.svelte';
import Select from '../ui/Select.svelte';
import ServiceConnectPicker from '../ui/ServiceConnectPicker.svelte';
import { scrollFade } from '../ui/scroll-fade';
import TextInput from '../ui/TextInput.svelte';
import { openOptionsAt } from './open-options';
import { useStore } from './store-context.svelte';

/**
 * Lens editor (sources-redesign, D4) — **connection-first assembly**. There is
 * NO kind picker: the user names the lens and ticks the **connections** it reads
 * from (all of their sources, accounts and feeds alike); a derived preview names
 * the canonical entities those connections produce; the SW derives `lensKind`.
 * Connect a new source inline via the shared `ServiceConnectPicker`. Create
 * dispatches `createLens` (a client-minted id) and opens the lens's overview page.
 */

type LensNode = Extract<PinNode, { kind: 'lens' }>;

interface Props {
  spaceId: SpaceId;
  /** This window — Create opens the new lens's overview page in it. */
  windowId: WindowId;
  node?: LensNode | undefined;
  onDone?: (() => void) | undefined;
}

const { spaceId, windowId, node, onDone }: Props = $props();

const store = useStore();

/** Canonical query order — keeps section order stable regardless of tick order. */
const QUERY_ORDER: LensQuery[] = ['authored', 'assigned', 'review-requested'];

/** Whether an account is Bitbucket Cloud (host bitbucket.org) — the deployment
 * that supports `authored` only (add-bitbucket-connector, D4). A malformed
 * baseUrl is treated as not-Cloud (Server/DC). */
function isCloudBitbucket(account: Pick<SourceAccount, 'provider' | 'baseUrl'>): boolean {
  if (account.provider !== 'bitbucket') return false;
  try {
    return new URL(account.baseUrl).host === 'bitbucket.org';
  } catch {
    return false;
  }
}

/** The queries an account actually supports. Bitbucket's set is deployment-bounded
 * (add-bitbucket-connector, D4): Cloud → `authored` only; Server/DC → `authored` +
 * `review-requested`; never `assigned` (Bitbucket has no assignee). Every other
 * queue provider offers all three. */
function supportedQueriesFor(account: Pick<SourceAccount, 'provider' | 'baseUrl'>): LensQuery[] {
  if (account.provider === 'bitbucket') {
    return isCloudBitbucket(account) ? ['authored'] : ['authored', 'review-requested'];
  }
  return [...QUERY_ORDER];
}

/** Including a source contributes ALL of its SUPPORTED queries (D7, "a lens is all
 * your stuff from its sources, narrowed in the overview"): the deployment-bounded
 * relation set for a git/jira account, none for an rss feed. Filtering to the
 * supported set keeps the editor from ever minting a ref the SW rejects (a Cloud
 * Bitbucket `review-requested`, or any Bitbucket `assigned`). Used by `confirm`,
 * the section count, and the entity preview so they always agree. */
function queriesFor(account: SourceAccount): LensQuery[] {
  return account.provider === 'rss' ? [] : supportedQueriesFor(account);
}

const CADENCE_OPTIONS = [
  { value: '5', label: m.sidebar_lensCadence5() },
  { value: '10', label: m.sidebar_lensCadence10() },
  { value: '30', label: m.sidebar_lensCadence30() },
  { value: '60', label: m.sidebar_lensCadenceHour() },
];
const MAX_ITEMS_VALUES = ['10', '20', '30', '50'];

// The entity each canonical bucket shows, with its preview label + dot colour.
const ENTITY_LABEL: Record<LensEntity, string> = {
  change: 'Changes',
  ticket: 'Issues',
  article: 'Articles',
  generic: 'Other',
};

// ── selection model ────────────────────────────────────────────────────────────
// Just the chosen source ids (in pick order); each contributes its full query set
// at confirm time (D7), so there is no per-source query state to track.
// svelte-ignore state_referenced_locally
let selectedOrder = $state<string[]>(node ? node.sources.map((ref) => ref.sourceId) : []);

// Accounts minted in THIS editing session (the picker dispatched `createAccount`)
// — shown before the SW broadcast round-trips back into `store.state.sources`.
let pendingAccounts = $state<SourceAccount[]>([]);
let tokenIds = $state<Set<string>>(new Set());
void readAccountTokens().then((rec) => {
  tokenIds = new Set(Object.keys(rec));
});

// svelte-ignore state_referenced_locally
let name = $state(node?.name ?? '');
// svelte-ignore state_referenced_locally
let maxItems = $state(String(node?.maxItems ?? 10));
// svelte-ignore state_referenced_locally
let refreshMinutes = $state(String(node?.refreshMinutes ?? 10));

// The picker list: ALL connected sources (no provider filtering — connection-first),
// live + this-session pending, sorted by label.
const pickerAccounts = $derived.by<SourceAccount[]>(() => {
  const byId = new Map<string, SourceAccount>();
  for (const account of Object.values(store.state.sources)) byId.set(account.id, account);
  for (const account of pendingAccounts) if (!byId.has(account.id)) byId.set(account.id, account);
  return [...byId.values()].sort((a, b) => accountLabel(a).localeCompare(accountLabel(b)));
});

function accountById(id: string): SourceAccount | undefined {
  return store.state.sources[id] ?? pendingAccounts.find((a) => a.id === id);
}

// The inline MultiSelect rows: one per connected source, the account name driving
// search + the option's accessible name. The visible identity is the `leading`
// AccountChip (the plain label span is suppressed when a leading snippet is set).
// `keywords` folds the provider/type + host into the fuzzy search corpus, so typing a
// type (e.g. "rss", "git") or host finds sources whose visible name doesn't contain it.
const sourceOptions = $derived<MultiSelectOption[]>(
  pickerAccounts.map((account) => ({
    value: account.id,
    label: accountLabel(account),
    keywords: `${account.provider} ${hostLabel(account.baseUrl)}`,
  })),
);

function statusOf(account: SourceAccount): ReturnType<typeof deriveAuthStatus> {
  return deriveAuthStatus(account.provider, tokenIds.has(account.id));
}

// ── inline connect (shared Service-dropdown picker, D2) ──────────────────────────
let showPicker = $state(false);

/** A minted source returns from the picker PRE-SELECTED (the picker already
 * dispatched `createAccount`; we mirror it into `pendingAccounts` so it renders
 * before the broadcast). */
function onConnected(account: SourceAccount): void {
  if (!pendingAccounts.some((a) => a.id === account.id)) {
    pendingAccounts = [...pendingAccounts, account];
  }
  if (!selectedOrder.includes(account.id)) {
    selectedOrder = [...selectedOrder, account.id];
  }
  showPicker = false;
}

/** OPML "add to this lens" (the picker's editor-mode import): find-or-mint an
 * rss account per parsed feed and pre-select each INTO this lens — the bulk
 * sibling of `onConnected`, so importing feeds while building a lens fills the
 * lens instead of spawning a separate "Feeds" lens (the Options-only behavior).
 * Dedupes by normalized baseUrl (rss `sourceKey` is host-derived) — within the
 * batch and against already-connected accounts — so repeats reuse one account.
 * Mirrors `importOpml`'s find-or-mint, client-side with client-minted ids. */
function importFeedsIntoLens(feeds: { name: string; feedUrl: string }[]): void {
  const mintedByBaseUrl = new Map<string, SourceAccount>();
  for (const { name, feedUrl } of feeds) {
    let baseUrl: string;
    try {
      baseUrl = normalizeBaseUrl(feedUrl);
    } catch {
      continue; // the picker pre-filters http(s), but stay defensive
    }
    const reused =
      mintedByBaseUrl.get(baseUrl) ??
      pickerAccounts.find((a) => a.provider === 'rss' && a.baseUrl === baseUrl);
    if (reused) {
      onConnected(reused);
      continue;
    }
    const id = crypto.randomUUID();
    const named = name.trim() !== '' ? { name } : {};
    const account: SourceAccount = { id, provider: 'rss', baseUrl, ...named };
    dispatch({ kind: 'createAccount', payload: { id, provider: 'rss', baseUrl, ...named } });
    mintedByBaseUrl.set(baseUrl, account);
    onConnected(account);
  }
  showPicker = false;
}

function manageAccounts(): void {
  void openOptionsAt('#connectors');
}

// ── derived: entity preview, name, validation ───────────────────────────────────
// The canonical entities the chosen connections will show (D4 preview), in order.
const previewEntities = $derived.by<LensEntity[]>(() => {
  const present = new Set<LensEntity>();
  for (const id of selectedOrder) {
    const provider = accountById(id)?.provider;
    // Every entity the source MAY emit — a github/gitlab source surfaces both
    // Changes (PRs/MRs) AND Issues (tickets), so the preview must list both.
    if (provider) for (const e of entitiesForSource(provider)) present.add(e);
  }
  return (['change', 'ticket', 'article', 'generic'] as LensEntity[]).filter((e) => present.has(e));
});

// One section per included query (git/jira) or per rss feed — i.e. the full query
// set each chosen source contributes (D7).
const resolvedSectionCount = $derived(
  selectedOrder.reduce((n, id) => {
    const account = accountById(id);
    if (!account) return n;
    return n + (account.provider === 'rss' ? 1 : queriesFor(account).length);
  }, 0),
);

// Confirm gates only on having a source (and no half-finished connect flow); a
// chosen source always contributes its full query set, so there is no per-source
// "pick a filter" gate any more (D7).
const canConfirm = $derived(!showPicker && selectedOrder.length > 0);

const hint = $derived.by(() => {
  if (showPicker) return 'Finish connecting the service, or cancel.';
  if (pickerAccounts.length === 0) return 'Connect a service to build a lens.';
  if (selectedOrder.length === 0) return 'Pick a connection to continue.';
  return 'Each connection fetches independently. Grant access when prompted.';
});

const maxItemsLabel = $derived(resolvedSectionCount > 1 ? 'Show per section' : 'Show at most');
const maxItemsOptions = MAX_ITEMS_VALUES.map((value) => ({ value, label: `${value} items` }));

/** Order-independent equality of two origin-pattern sets. */
function sameOrigins(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((o) => setB.has(o));
}

/** Minimal origin configs for the gesture-bound grant (reads only source/baseUrl). */
function originCfgs(refs: LensSourceRef[]): { source: LensProvider; baseUrl: string }[] {
  return refs.flatMap((ref) => {
    const account = accountById(ref.sourceId);
    return account ? [{ source: account.provider, baseUrl: account.baseUrl }] : [];
  });
}

function requestOrigins(refs: LensSourceRef[], prev: LensNode | undefined): void {
  const nextOrigins = [
    ...new Set(originCfgs(refs).flatMap((cfg) => requiredOriginsForConfig(cfg))),
  ];
  const prevOrigins = prev
    ? [...new Set(originCfgs(prev.sources).flatMap((cfg) => requiredOriginsForConfig(cfg)))]
    : [];
  if (!prev || !sameOrigins(prevOrigins, nextOrigins)) {
    if (nextOrigins.length > 0) void requestHostPermissions(nextOrigins);
  }
}

function confirm(): void {
  if (!canConfirm) return;
  // Each chosen source contributes its full query set (D7): the canonical relation
  // set for git/jira, none for rss. Sources whose account can't be resolved are
  // dropped (defensive — a selected id should always resolve).
  const refs: LensSourceRef[] = selectedOrder.flatMap((id) => {
    const account = accountById(id);
    return account ? [{ sourceId: id, queries: queriesFor(account) }] : [];
  });
  const base = {
    spaceId,
    name: name.trim() === '' ? m.sidebar_lensNamePlaceholder() : name.trim(),
    sources: refs,
    maxItems: Number(maxItems),
    refreshMinutes: Number(refreshMinutes),
  };
  // No `lensKind` on the wire (sources-redesign) — the SW derives it.
  if (node) {
    dispatch({ kind: 'updateLens', payload: { ...base, folderId: node.id } });
    requestOrigins(refs, node);
  } else {
    // Client-mint the id (mirrors createAccount) so we can open the new lens's
    // overview page without awaiting an ack.
    const newId = crypto.randomUUID();
    dispatch({ kind: 'createLens', payload: { ...base, id: newId } });
    requestOrigins(refs, undefined);
    dispatch({ kind: 'openLensPage', payload: { spaceId, folderId: newId, windowId } });
  }
  onDone?.();
}
</script>

<!-- Three pinned regions (lenses spec / D4): Name stays pinned above, the
     connections picker scrolls independently in the middle, and the settings +
     primary action stay pinned below — so Create is always reachable in a narrow
     side panel no matter how long the connections list grows. -->
<div class="editor" data-testid="smart-folder-editor">
  <div class="editor-head">
    <div class="field">
      <span class="field-label">{m.common_name()}</span>
      <TextInput
        ariaLabel={m.common_name()}
        bind:value={name}
        placeholder={m.sidebar_lensNamePlaceholder()}
        testid="smart-folder-name"
        onenter={confirm}
      />
    </div>
  </div>

  <div class="editor-body" use:scrollFade>
    <div class="field">
    <span class="field-label">{m.sidebar_lensReadFrom()}</span>
    <p class="field-help">{m.sidebar_lensReadFromHelp()}</p>
    <!-- Connection picker (D7): an inline MultiSelect of every connected source.
         Ticking a source includes it (and all its queries); the leading AccountChip
         is the row's identity (glyph + name + auth status). Rendered only once a
         source exists — before that the "+ Connect a service" row is the entry. -->
    {#if pickerAccounts.length > 0}
      <MultiSelect
        mode="inline"
        options={sourceOptions}
        values={selectedOrder}
        onchange={(vals) => (selectedOrder = vals)}
        label=""
        ariaLabel={m.sidebar_lensReadFrom()}
        searchPlaceholder={m.sidebar_lensSourceSearch()}
        selectAllLabel={m.common_selectAll()}
        clearLabel={m.common_deselectAll()}
        testid="smart-source-list"
      >
        {#snippet leading(option)}
          {@const account = accountById(option.value)}
          {#if account}
            <AccountChip
              bare
              provider={account.provider}
              label={accountLabel(account)}
              status={isFeedProvider(account.provider) ? undefined : statusOf(account)}
              title={hostLabel(account.baseUrl)}
            />
          {/if}
        {/snippet}
      </MultiSelect>
    {/if}

    {#if showPicker}
      <div class="connect-flow" data-testid="connect-flow">
        <ServiceConnectPicker
          {onConnected}
          onImportFeeds={importFeedsIntoLens}
          onCancel={() => (showPicker = false)}
        />
      </div>
    {:else}
      <div class="source-add-row">
        <Button variant="ghost" size="sm" onclick={() => (showPicker = true)} testid="smart-add-source">
          {m.sidebar_lensConnectService()}
        </Button>
        <span class="add-spacer"></span>
        <button type="button" class="manage-link" data-testid="manage-accounts" onclick={manageAccounts}>
          {m.common_manage()} <Icon name="external-link" size={12} />
        </button>
      </div>
    {/if}
    </div>
  </div>

  <div class="editor-foot">
  {#if previewEntities.length > 0}
    <div class="field">
      <span class="field-label">{m.sidebar_lensWillShow()}</span>
      <div class="entity-preview" data-testid="entity-preview">
        {#each previewEntities as entity (entity)}
          <span class="entity-chip" data-entity={entity} data-testid="entity-chip">
            <span class="entity-dot" data-entity={entity} aria-hidden="true"></span>
            {ENTITY_LABEL[entity]}
          </span>
        {/each}
      </div>
    </div>
  {/if}

  <div class="field">
    <span class="field-label">{maxItemsLabel}</span>
    <Select
      options={maxItemsOptions}
      value={maxItems}
      onchange={(v) => {
        maxItems = v;
      }}
      ariaLabel={m.sidebar_lensMaxItems()}
      testid="smart-folder-max-items"
    />
  </div>

  <div class="field">
    <span class="field-label">{m.common_refresh()}</span>
    <Select
      options={CADENCE_OPTIONS}
      value={refreshMinutes}
      onchange={(v) => {
        refreshMinutes = v;
      }}
      ariaLabel={m.sidebar_lensRefreshCadence()}
      testid="smart-folder-cadence"
    />
  </div>

  <div class="confirm-row">
    <p class="hint" data-testid="smart-folder-hint">{hint}</p>
    <span class="confirm-spacer"></span>
    {#if onDone}
      <Button variant="secondary" onclick={() => onDone?.()}>{m.common_cancel()}</Button>
    {/if}
    <Button variant="primary" disabled={!canConfirm} onclick={confirm} testid="smart-folder-confirm">
      {node ? m.sidebar_spaceEditorConfirmSave() : m.sidebar_lensEditorCreate()}
    </Button>
  </div>
  </div>
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-width: 216px;
    /* Bound the editor to the panel viewport so the pinned head + foot hold and
     * only the connections region scrolls (D4). The RowMenu drawer measures this
     * capped height, so Create never scrolls off below a long source list. */
    max-height: min(72vh, 560px);
  }
  /* Pinned head (Name) + pinned foot (settings + action); the middle scrolls. */
  .editor-head,
  .editor-foot {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .editor-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    /* Comp §8 section rhythm (~16px), matching SpaceEditor. */
    gap: var(--space-4);
    padding-right: var(--space-1);
  }

  .field {
    display: flex;
    flex-direction: column;
    /* ~8px eyebrow→control, matching SpaceEditor. */
    gap: var(--space-2);
  }

  .field-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    line-height: 1.2;
    font-family: var(--font-sans);
    color: var(--text-dim);
  }

  /* One-line helper under an eyebrow (comp: faint caption beneath "Read from"). */
  .field-help {
    margin: 0;
    font: var(--weight-medium) var(--text-xs) / 1.4 var(--font-sans);
    color: var(--text-faint);
  }

  .hint {
    flex: 1;
    margin: 0;
    color: var(--text-faint);
    font: var(--weight-medium) var(--text-xs) / 1.4 var(--font-sans);
  }

  .confirm-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-1);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border-soft);
  }
  .confirm-spacer {
    flex-shrink: 0;
  }

  /* Derived entity preview (D4) — entity-coloured chips naming what the chosen
   * connections produce. */
  .entity-preview {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }
  .entity-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: 2px var(--space-2);
    border-radius: var(--r-pill);
    background: var(--surface-2);
    color: var(--text-2);
    font: var(--weight-medium) var(--text-xs) / 1.2 var(--font-sans);
  }
  .entity-dot {
    width: 8px;
    height: 8px;
    border-radius: var(--r-pill);
    background: var(--text-faint);
  }
  .entity-dot[data-entity='change'] {
    background: var(--info);
  }
  .entity-dot[data-entity='ticket'] {
    background: oklch(0.58 0.16 295);
  }
  .entity-dot[data-entity='article'] {
    background: var(--success);
  }

  .source-add-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  .add-spacer {
    flex: 1 1 auto;
  }
  .manage-link {
    appearance: none;
    border: 0;
    background: transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: 2px 4px;
    border-radius: var(--r-2xs);
    color: var(--text-dim);
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
    transition: color var(--motion-fast) var(--ease-standard);
  }
  .manage-link:hover {
    color: var(--text);
  }
  .manage-link:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  .connect-flow {
    padding: var(--space-2);
    background: var(--surface-2);
    border: 1px solid color-mix(in oklch, var(--text-faint) 16%, transparent);
    border-radius: var(--r-md);
    animation: connect-in var(--motion-base) var(--ease-emphasised);
  }

  @keyframes connect-in {
    from {
      opacity: 0;
      transform: translateY(-2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .connect-flow {
      animation: none;
    }
  }
</style>
