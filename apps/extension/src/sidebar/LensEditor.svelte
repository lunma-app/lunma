<script lang="ts">
import { accountLabel, hostLabel, isFeedProvider, normalizeBaseUrl } from '../shared/account-ui';
import { deriveAuthStatus } from '../shared/auth-method';
import { dispatch } from '../shared/bus';
import { requiredOriginsForConfig } from '../shared/connector-origins';
import { readAccountTokens } from '../shared/connectors';
import { entitiesForSource, type LensEntity } from '../shared/lens-entity';
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
import Chip from '../ui/Chip.svelte';
import Icon from '../ui/Icon.svelte';
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

/** Canonical filter order — keeps section order stable regardless of tick order. */
const QUERY_ORDER: LensQuery[] = ['authored', 'assigned', 'review-requested'];

const SUGGESTED_QUEUE_NAME: Record<Exclude<LensProvider, 'rss'>, Record<LensQuery, string>> = {
  gitlab: {
    authored: 'My merge requests',
    assigned: 'Assigned to me',
    'review-requested': 'Review requests',
  },
  github: {
    authored: 'My pull requests',
    assigned: 'Assigned to me',
    'review-requested': 'Review requests',
  },
  jira: {
    authored: 'My reported issues',
    assigned: 'Assigned to me',
    'review-requested': 'Watching',
  },
};

const CADENCE_OPTIONS = [
  { value: '5', label: 'Every 5 minutes' },
  { value: '10', label: 'Every 10 minutes' },
  { value: '30', label: 'Every 30 minutes' },
  { value: '60', label: 'Every hour' },
];
const MAX_ITEMS_VALUES = ['10', '20', '30', '50'];

function queryOptionsFor(p: LensProvider): Array<{ value: LensQuery; label: string }> {
  return [
    { value: 'authored', label: 'Authored' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'review-requested', label: p === 'jira' ? 'Watching' : 'Reviewing' },
  ];
}

// The entity each canonical bucket shows, with its preview label + dot colour.
const ENTITY_LABEL: Record<LensEntity, string> = {
  change: 'Changes',
  ticket: 'Issues',
  article: 'Articles',
  generic: 'Other',
};

// ── selection model ────────────────────────────────────────────────────────────
// svelte-ignore state_referenced_locally
let selectedOrder = $state<string[]>(node ? node.sources.map((ref) => ref.sourceId) : []);
// svelte-ignore state_referenced_locally
let queriesById = $state<Record<string, LensQuery[]>>(
  node ? Object.fromEntries(node.sources.map((ref) => [ref.sourceId, [...ref.queries]])) : {},
);

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
// svelte-ignore state_referenced_locally
let nameTouched = $state(node !== undefined);

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

function isSelected(id: string): boolean {
  return selectedOrder.includes(id);
}

function toggleAccount(account: SourceAccount): void {
  if (isSelected(account.id)) {
    selectedOrder = selectedOrder.filter((id) => id !== account.id);
    const next = { ...queriesById };
    delete next[account.id];
    queriesById = next;
  } else {
    selectedOrder = [...selectedOrder, account.id];
    queriesById = {
      ...queriesById,
      [account.id]: account.provider === 'rss' ? [] : ['review-requested'],
    };
  }
}

function toggleQuery(id: string, q: LensQuery): void {
  const cur = new Set(queriesById[id] ?? []);
  if (cur.has(q)) cur.delete(q);
  else cur.add(q);
  queriesById = { ...queriesById, [id]: QUERY_ORDER.filter((x) => cur.has(x)) };
}

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
    queriesById = {
      ...queriesById,
      [account.id]: account.provider === 'rss' ? [] : ['review-requested'],
    };
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

const resolvedSectionCount = $derived(
  selectedOrder.reduce((n, id) => {
    const provider = accountById(id)?.provider;
    if (provider === 'rss') return n + 1;
    return n + (queriesById[id]?.length ?? 0);
  }, 0),
);

const suggestedName = $derived.by(() => {
  if (selectedOrder.length === 1) {
    const id = selectedOrder[0] as string;
    const account = accountById(id);
    const queries = queriesById[id] ?? [];
    if (account && account.provider !== 'rss' && queries.length === 1 && queries[0]) {
      return SUGGESTED_QUEUE_NAME[account.provider][queries[0]] ?? '';
    }
  }
  return '';
});

$effect(() => {
  if (nameTouched) return;
  if (name !== suggestedName) name = suggestedName;
});

const canConfirm = $derived.by(() => {
  if (showPicker) return false;
  if (selectedOrder.length === 0) return false;
  for (const id of selectedOrder) {
    const provider = accountById(id)?.provider;
    if (provider !== 'rss' && (queriesById[id]?.length ?? 0) === 0) return false;
  }
  return true;
});

const hint = $derived.by(() => {
  if (showPicker) return 'Finish connecting the service, or cancel.';
  if (pickerAccounts.length === 0) return 'Connect a service to build a lens.';
  if (selectedOrder.length === 0) return 'Pick a connection to continue.';
  const needsFilter = selectedOrder.some((id) => {
    const provider = accountById(id)?.provider;
    return provider !== 'rss' && (queriesById[id]?.length ?? 0) === 0;
  });
  if (needsFilter) return 'Pick at least one filter for each queue account.';
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
  const refs: LensSourceRef[] = selectedOrder.map((id) => ({
    sourceId: id,
    queries: queriesById[id] ?? [],
  }));
  const base = {
    spaceId,
    name: name.trim() === '' ? suggestedName || 'Lens' : name.trim(),
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
      <span class="field-label">Name</span>
      <TextInput
        ariaLabel="Name"
        bind:value={name}
        placeholder={suggestedName || 'Lens'}
        testid="smart-folder-name"
        oninput={() => {
          nameTouched = true;
        }}
        onenter={confirm}
      />
    </div>
  </div>

  <div class="editor-body" use:scrollFade>
    <div class="field">
    <span class="field-label">Read from</span>
    <p class="field-help">Pick the connections this lens watches — its type is derived.</p>
    <div class="account-list" data-testid="smart-source-list">
      {#each pickerAccounts as account (account.id)}
        {@const selected = isSelected(account.id)}
        <div class="account-pick" class:selected data-testid="account-pick-row" data-account-id={account.id}>
          <button
            type="button"
            class="account-pick-toggle"
            role="checkbox"
            aria-checked={selected}
            data-testid="account-pick-toggle"
            onclick={() => toggleAccount(account)}
          >
            <span class="check" class:on={selected} aria-hidden="true">
              {#if selected}<Icon name="check" size={12} />{/if}
            </span>
            <AccountChip
              bare
              provider={account.provider}
              label={accountLabel(account)}
              status={isFeedProvider(account.provider) ? undefined : statusOf(account)}
              title={hostLabel(account.baseUrl)}
            />
          </button>
          {#if selected && account.provider !== 'rss'}
            <div class="filter-pills" role="group" aria-label="Filters">
              {#each queryOptionsFor(account.provider) as opt (opt.value)}
                <Chip
                  label={opt.label}
                  selected={(queriesById[account.id] ?? []).includes(opt.value)}
                  onToggle={() => toggleQuery(account.id, opt.value)}
                  testid="smart-filter-pill"
                />
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>

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
          + Connect a service
        </Button>
        <span class="add-spacer"></span>
        <button type="button" class="manage-link" data-testid="manage-accounts" onclick={manageAccounts}>
          Manage <Icon name="external-link" size={12} />
        </button>
      </div>
    {/if}
    </div>
  </div>

  <div class="editor-foot">
  {#if previewEntities.length > 0}
    <div class="field">
      <span class="field-label">This lens will show</span>
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
      ariaLabel="Maximum items"
      testid="smart-folder-max-items"
    />
  </div>

  <div class="field">
    <span class="field-label">Refresh</span>
    <Select
      options={CADENCE_OPTIONS}
      value={refreshMinutes}
      onchange={(v) => {
        refreshMinutes = v;
      }}
      ariaLabel="Refresh cadence"
      testid="smart-folder-cadence"
    />
  </div>

  <div class="confirm-row">
    <p class="hint" data-testid="smart-folder-hint">{hint}</p>
    <span class="confirm-spacer"></span>
    {#if onDone}
      <Button variant="secondary" onclick={() => onDone?.()}>Cancel</Button>
    {/if}
    <Button variant="primary" disabled={!canConfirm} onclick={confirm} testid="smart-folder-confirm">
      {node ? 'Save changes' : 'Create lens'}
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

  .account-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    /* No own height cap — the `.editor-body` region is the scroll bound now, so
     * the list, the inline picker, and the add-row all scroll together while the
     * Name head and the settings/action foot stay pinned. */
  }
  .account-pick {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-1);
    border-radius: var(--r-md);
    transition: background var(--motion-fast) var(--ease-standard);
  }
  .account-pick:hover {
    background: var(--surface-2);
  }
  .account-pick-toggle {
    appearance: none;
    border: 0;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0;
    text-align: left;
    min-width: 0;
  }
  .account-pick-toggle:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
    border-radius: var(--r-sm);
  }
  .check {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: var(--r-2xs);
    box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--text-faint) 32%, transparent);
    color: var(--space-c);
  }
  .check.on {
    background: var(--space-c-soft);
    box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--space-c) 45%, transparent);
  }

  .filter-pills {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    padding-left: var(--space-2);
    margin-top: var(--space-1);
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
    .account-pick {
      transition: none;
    }
    .connect-flow {
      animation: none;
    }
  }
</style>
