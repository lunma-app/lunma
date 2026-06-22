<script lang="ts">
import { dispatch } from '../shared/bus';
import { requiredOriginsForConfig } from '../shared/connector-origins';
import { parseOpml } from '../shared/opml';
import { requestHostPermissions } from '../shared/permissions';
import type { PinNode, SmartQuery, SmartSource, SmartSourceConfig, SpaceId } from '../shared/types';
import Button from '../ui/Button.svelte';
import Chip from '../ui/Chip.svelte';
import Icon from '../ui/Icon.svelte';
import Select from '../ui/Select.svelte';
import TextInput from '../ui/TextInput.svelte';

/**
 * Smart-folder config editor — the menu drill-in panel behind "New smart
 * folder…" and a smart row's Edit…. Name-first, then a list of in-place
 * editable **source cards** (each = one connector instance: source + host +
 * queue filter multi-select, or an OPML importer), then folder settings, then a
 * single Create/Save action. Editing a card mutates `sources` directly; there is
 * no separate add-source sub-form (redesign-smart-folder-editor).
 */

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

interface Props {
  spaceId: SpaceId;
  node?: SmartNode | undefined;
  onDone?: (() => void) | undefined;
}

const { spaceId, node, onDone }: Props = $props();

type AddSourceType = SmartSource | 'opml';

type DraftSource = {
  id: string;
  source: AddSourceType;
  baseUrl: string;
  queries: SmartQuery[];
  /** Set (to a chosen File) only while an `opml` importer card awaits expansion. */
  file: File | null;
};

/** Canonical filter order — keeps section order stable regardless of tick order. */
const QUERY_ORDER: SmartQuery[] = ['authored', 'assigned', 'review-requested'];

const DEFAULT_BASE_URL: Record<SmartSource, string> = {
  gitlab: 'https://gitlab.com',
  github: 'https://github.com',
  jira: 'https://your-site.atlassian.net',
  rss: '',
};

const SUGGESTED_QUEUE_NAME: Record<Exclude<SmartSource, 'rss'>, Record<SmartQuery, string>> = {
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

const HINT: Record<SmartSource, string> = {
  gitlab:
    "Signed in to GitLab in this browser? That's enough. Otherwise add an access token in Settings → Connectors.",
  github: 'GitHub needs an access token — add one in Settings → Connectors.',
  jira: "Signed in to Jira in this browser? That's enough.",
  rss: 'Public feed — no sign-in needed. Paste the feed URL.',
};

/** Collapsed-summary glyph per source (same family as the section headers). */
const SOURCE_GLYPH: Record<AddSourceType, string> = {
  gitlab: 'folder-git-2',
  github: 'folder-git-2',
  jira: 'folder-kanban',
  rss: 'rss',
  opml: 'rss',
};

const SOURCE_OPTIONS: Array<{ value: AddSourceType; label: string }> = [
  { value: 'gitlab', label: 'GitLab' },
  { value: 'github', label: 'GitHub' },
  { value: 'jira', label: 'Jira' },
  { value: 'rss', label: 'RSS' },
  { value: 'opml', label: 'OPML file' },
];

const CADENCE_OPTIONS = [
  { value: '5', label: 'Every 5 minutes' },
  { value: '10', label: 'Every 10 minutes' },
  { value: '30', label: 'Every 30 minutes' },
  { value: '60', label: 'Every hour' },
];

const MAX_ITEMS_VALUES = ['10', '20', '30', '50'];

function isValidBaseUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function draftSourceKey(s: { source: AddSourceType; baseUrl: string }): string {
  try {
    return `${s.source}:${new URL(s.baseUrl).host}`;
  } catch {
    return `${s.source}:${s.baseUrl}`;
  }
}

function queryOptionsFor(s: SmartSource): Array<{ value: SmartQuery; label: string }> {
  return [
    { value: 'authored', label: 'Authored' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'review-requested', label: s === 'jira' ? 'Watching' : 'Reviewing' },
  ];
}

function defaultRefreshForSources(srcs: DraftSource[]): number {
  return srcs.some((s) => s.source === 'rss') ? 30 : 10;
}

function newCard(source: AddSourceType): DraftSource {
  return {
    id: String(nextSourceId++),
    source,
    baseUrl: source === 'opml' || source === 'rss' ? '' : DEFAULT_BASE_URL[source],
    queries:
      source === 'gitlab' || source === 'github' || source === 'jira' ? ['review-requested'] : [],
    file: null,
  };
}

// svelte-ignore state_referenced_locally
let nextSourceId = node?.sources.length ?? 1;

// Capture config at mount — a live broadcast mid-edit must not clobber typing.
// Create seeds one default card so a single-source folder is fill-and-create.
// svelte-ignore state_referenced_locally
let sources = $state<DraftSource[]>(
  node
    ? node.sources.map((cfg, i) => ({
        id: String(i),
        source: cfg.source,
        baseUrl: cfg.baseUrl,
        queries: [...cfg.queries],
        file: null,
      }))
    : [
        {
          id: '0',
          source: 'gitlab' as const,
          baseUrl: DEFAULT_BASE_URL.gitlab,
          queries: ['review-requested'] as SmartQuery[],
          file: null,
        },
      ],
);
// svelte-ignore state_referenced_locally
let name = $state(node?.name ?? '');
// svelte-ignore state_referenced_locally
let maxItems = $state(String(node?.maxItems ?? 10));
// svelte-ignore state_referenced_locally
let refreshMinutes = $state(
  String(node?.refreshMinutes ?? (node ? 10 : defaultRefreshForSources([]))),
);
// svelte-ignore state_referenced_locally
let nameTouched = $state(node !== undefined);
// svelte-ignore state_referenced_locally
let refreshTouched = $state(node !== undefined);
let opmlImportNote = $state<string | null>(null);

// Total resolved sections: rss → 1, queue → one per selected filter, opml → 0
// (transient). Drives the "per section" labels and matches the engine's count.
const resolvedSectionCount = $derived(
  sources.reduce(
    (n, s) => n + (s.source === 'opml' ? 0 : s.source === 'rss' ? 1 : s.queries.length),
    0,
  ),
);

function cardIncomplete(s: DraftSource): boolean {
  if (s.source === 'opml') return true; // an un-expanded importer blocks confirm
  if (!isValidBaseUrl(s.baseUrl.trim())) return true;
  if (s.source !== 'rss' && s.queries.length === 0) return true;
  return false;
}

const canConfirm = $derived(sources.length > 0 && sources.every((s) => !cardIncomplete(s)));

const firstRealSource = $derived(sources.find((s) => s.source !== 'opml'));

const hint = $derived.by(() => {
  const opmlPending = sources.some((s) => s.source === 'opml');
  if (opmlPending) return 'Choose an OPML file, or change the source.';
  const real = sources.filter((s) => s.source !== 'opml');
  if (real.length === 0) return 'Add at least one source.';
  if (real.length === 1 && real[0]) return HINT[real[0].source as SmartSource];
  return 'Each source fetches independently. Grant access when prompted.';
});

const maxItemsLabel = $derived(
  resolvedSectionCount > 1
    ? 'Show per section'
    : firstRealSource?.source === 'rss'
      ? 'Show up to'
      : 'Show at most',
);

const maxItemsAriaLabel = $derived(
  resolvedSectionCount > 1
    ? 'Maximum items per section'
    : firstRealSource?.source === 'rss'
      ? 'Unread to show'
      : 'Maximum items',
);

const maxItemsOptions = $derived(
  MAX_ITEMS_VALUES.map((value) => {
    const isSingleFeed = resolvedSectionCount === 1 && firstRealSource?.source === 'rss';
    return { value, label: `${value} ${isSingleFeed ? 'unread' : 'items'}` };
  }),
);

// Suggested folder name for a single queue source — shown until the user types.
const suggestedName = $derived.by(() => {
  if (sources.length === 1 && sources[0]) {
    const s = sources[0];
    if (s.source !== 'rss' && s.source !== 'opml' && s.queries[0]) {
      return SUGGESTED_QUEUE_NAME[s.source][s.queries[0]] ?? '';
    }
  }
  return '';
});

$effect(() => {
  if (nameTouched) return;
  if (name !== suggestedName) name = suggestedName;
});

$effect(() => {
  if (refreshTouched) return;
  const next = String(defaultRefreshForSources(sources));
  if (refreshMinutes !== next) refreshMinutes = next;
});

/** Toggle a queue filter on a card; rebuild from canonical order. */
function toggleQuery(index: number, q: SmartQuery): void {
  const s = sources[index];
  if (!s) return;
  const next = new Set(s.queries);
  if (next.has(q)) next.delete(q);
  else next.add(q);
  s.queries = QUERY_ORDER.filter((x) => next.has(x));
}

/** Switch a card's source type; reset its URL/filters/file to that type's shape. */
function changeCardSource(index: number, next: string): void {
  const s = sources[index];
  if (!s) return;
  const nextSource = next as AddSourceType;
  const trimmed = s.baseUrl.trim();
  // Replace the URL only when it is still a default/empty (don't clobber a typed one).
  if (nextSource !== 'opml') {
    if ((Object.values(DEFAULT_BASE_URL) as string[]).includes(trimmed) || trimmed === '') {
      s.baseUrl = DEFAULT_BASE_URL[nextSource];
    }
  } else {
    s.baseUrl = '';
  }
  s.queries =
    nextSource === 'gitlab' || nextSource === 'github' || nextSource === 'jira'
      ? s.queries.length > 0
        ? s.queries
        : ['review-requested']
      : [];
  s.file = null;
  s.source = nextSource;
  opmlImportNote = null;
}

// Per-card expand state: a card is editable (expanded) when it is the sole card,
// when it is incomplete (so it can always be fixed), or when the user opened it.
// Collapsible cards default to a scannable summary row (OPML-imported feeds, the
// non-active cards) until clicked.
let userExpanded = $state<Set<string>>(new Set());

function isExpanded(s: DraftSource): boolean {
  return sources.length === 1 || cardIncomplete(s) || userExpanded.has(s.id);
}
function collapsible(s: DraftSource): boolean {
  return sources.length > 1 && !cardIncomplete(s);
}
function toggleExpand(id: string): void {
  const next = new Set(userExpanded);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  userExpanded = next;
}
function cardHost(s: DraftSource): string {
  try {
    return new URL(s.baseUrl).host;
  } catch {
    return s.baseUrl.trim() || '—';
  }
}
function filterSummary(s: DraftSource): string {
  if (s.source === 'rss' || s.source === 'opml') return '';
  return queryOptionsFor(s.source)
    .filter((o) => s.queries.includes(o.value))
    .map((o) => o.label)
    .join(', ');
}

function addSourceCard(): void {
  const c = newCard('gitlab');
  sources = [...sources, c];
  userExpanded = new Set(userExpanded).add(c.id); // open the new card for editing
  opmlImportNote = null;
}

function moveSource(index: number, delta: -1 | 1): void {
  const target = index + delta;
  if (target < 0 || target >= sources.length) return;
  const next = [...sources];
  const tmp = next[index] as DraftSource;
  next[index] = next[target] as DraftSource;
  next[target] = tmp;
  sources = next;
}

function removeSource(index: number): void {
  sources = sources.filter((_, i) => i !== index);
  opmlImportNote = null;
}

/** Expand an OPML importer card into one rss card per feed (dedup by host). */
async function pickOpml(index: number, file: File): Promise<void> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return;
  }
  const feeds = parseOpml(text);
  const seen = new Set(sources.map((s) => draftSourceKey(s)));
  const added: DraftSource[] = [];
  let firstName = '';
  for (const { name: feedName, feedUrl } of feeds) {
    try {
      new URL(feedUrl);
    } catch {
      continue;
    }
    const sk = `rss:${new URL(feedUrl).host}`;
    if (seen.has(sk)) continue;
    seen.add(sk);
    if (added.length === 0) firstName = feedName;
    added.push({
      id: String(nextSourceId++),
      source: 'rss',
      baseUrl: feedUrl,
      queries: [],
      file: null,
    });
  }
  if (added.length === 0) {
    opmlImportNote = 'No feeds found';
    return;
  }
  // Replace the importer card with the imported feed cards.
  sources = [...sources.slice(0, index), ...added, ...sources.slice(index + 1)];
  if (!nameTouched) {
    name = sources.filter((s) => s.source === 'rss').length > 1 ? 'Feeds' : firstName;
    nameTouched = true;
  }
  if (!refreshTouched) refreshMinutes = '30';
  opmlImportNote = added.length === 1 ? '1 feed imported' : `${added.length} feeds imported`;
}

/** Order-independent equality of two origin-pattern sets. */
function sameOrigins(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((o) => setB.has(o));
}

/** Collapse duplicate source:host cards, unioning queue filters in canonical order. */
function dedupedSources(): SmartSourceConfig[] {
  const byKey = new Map<string, SmartSourceConfig>();
  for (const s of sources) {
    if (s.source === 'opml') continue;
    const key = draftSourceKey(s);
    const existing = byKey.get(key);
    if (existing) {
      if (s.source !== 'rss') {
        const merged = new Set([...existing.queries, ...s.queries]);
        existing.queries = QUERY_ORDER.filter((q) => merged.has(q));
      }
    } else {
      byKey.set(key, {
        source: s.source,
        baseUrl: s.baseUrl.trim(),
        queries: s.source === 'rss' ? [] : [...s.queries],
      });
    }
  }
  return [...byKey.values()];
}

function confirm(): void {
  if (!canConfirm) return;
  const cleanSources = dedupedSources();
  const payloadBase = {
    spaceId,
    name: name.trim() === '' ? suggestedName || 'Smart folder' : name.trim(),
    sources: cleanSources,
    maxItems: Number(maxItems),
    refreshMinutes: Number(refreshMinutes),
  };
  // Save first (least-privilege-permissions design D4): create/update before
  // the permission dialog so a deny never loses the user's config.
  if (node) {
    dispatch({ kind: 'updateSmartFolder', payload: { ...payloadBase, folderId: node.id } });
  } else {
    dispatch({ kind: 'createSmartFolder', payload: payloadBase });
  }
  // Request the union of all sub-source required origins from this user gesture.
  // On a create, always request; on an edit, only when the origin set changed.
  const nextOrigins = [...new Set(cleanSources.flatMap((cfg) => requiredOriginsForConfig(cfg)))];
  const prevOrigins = node
    ? [...new Set(node.sources.flatMap((cfg) => requiredOriginsForConfig(cfg)))]
    : [];
  if (!node || !sameOrigins(prevOrigins, nextOrigins)) {
    if (nextOrigins.length > 0) void requestHostPermissions(nextOrigins);
  }
  onDone?.();
}
</script>

<div class="editor" data-testid="smart-folder-editor">
  <TextInput
    label="Name"
    bind:value={name}
    placeholder={suggestedName || 'Smart folder'}
    testid="smart-folder-name"
    oninput={() => { nameTouched = true; }}
    onenter={confirm}
  />

  <div class="field">
    <span class="field-label">Sources</span>
    <div class="source-list" data-testid="smart-source-list">
      {#each sources as s, i (s.id)}
        {@const isFirst = i === 0}
        {@const isLast = i === sources.length - 1}
        {@const expanded = isExpanded(s)}
        {#snippet rowActions()}
          <div class="source-actions">
            <button type="button" class="icon-action" disabled={isFirst} aria-label="Move up" onclick={() => moveSource(i, -1)}>↑</button>
            <button type="button" class="icon-action" disabled={isLast} aria-label="Move down" onclick={() => moveSource(i, 1)}>↓</button>
            {#if sources.length > 1}
              <button type="button" class="icon-action remove" aria-label="Remove source" onclick={() => removeSource(i)} data-testid="smart-source-remove">×</button>
            {/if}
          </div>
        {/snippet}
        <div
          class="source-card"
          data-testid="smart-source-entry"
          class:invalid={cardIncomplete(s) && s.source !== 'opml'}
          class:collapsed={!expanded}
        >
          {#if !expanded}
            <div class="source-summary-row">
              <button
                type="button"
                class="source-summary"
                aria-expanded="false"
                onclick={() => toggleExpand(s.id)}
                data-testid="smart-source-summary"
              >
                <span class="summary-glyph"><Icon name={SOURCE_GLYPH[s.source]} size={16} /></span>
                <span class="summary-host">{cardHost(s)}</span>
                {#if filterSummary(s)}
                  <span class="summary-filters">{filterSummary(s)}</span>
                {/if}
                <span class="summary-chevron" aria-hidden="true"><Icon name="chevron-right" size={14} /></span>
              </button>
              {@render rowActions()}
            </div>
          {:else}
          <div class="source-card-head">
            {#if collapsible(s)}
              <button
                type="button"
                class="disclosure expanded"
                aria-label="Collapse source"
                aria-expanded="true"
                onclick={() => toggleExpand(s.id)}
              >
                <Icon name="chevron-right" size={14} />
              </button>
            {/if}
            <Select
              options={SOURCE_OPTIONS}
              value={s.source}
              onchange={(v) => changeCardSource(i, v)}
              ariaLabel="Source type"
              testid="smart-source-type"
            />
            {@render rowActions()}
          </div>

          {#if s.source === 'opml'}
            <label class="file-field">
              <span class="field-label">File</span>
              <span class="file-pick" class:has-file={!!s.file}>
                <svg class="file-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 1.5h5l3 3V10.5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-9A.5.5 0 0 1 2 1.5Z" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
                  <path d="M7 1.5V5h3" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
                </svg>
                <span class="file-name">{s.file ? s.file.name : 'No file chosen'}</span>
                <span class="file-sep" aria-hidden="true"></span>
                <span class="file-btn">Browse</span>
                <input
                  type="file"
                  accept=".opml,.xml"
                  class="sr-only"
                  onchange={(e) => {
                    const f = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
                    (e.currentTarget as HTMLInputElement).value = '';
                    s.file = f;
                    if (f) void pickOpml(i, f);
                  }}
                  data-testid="smart-opml-file-input"
                />
              </span>
            </label>
          {:else}
            <TextInput
              label={s.source === 'rss' ? 'Feed URL' : 'Instance URL'}
              bind:value={s.baseUrl}
              placeholder={s.source === 'rss' ? 'https://example.com/feed.xml' : DEFAULT_BASE_URL[s.source]}
              testid="smart-source-url"
            />
            {#if s.source !== 'rss'}
              <div class="filter-pills" role="group" aria-label="Filters">
                {#each queryOptionsFor(s.source) as opt (opt.value)}
                  <Chip
                    label={opt.label}
                    selected={s.queries.includes(opt.value)}
                    onToggle={() => toggleQuery(i, opt.value)}
                    testid="smart-filter-pill"
                  />
                {/each}
              </div>
            {/if}
          {/if}
          {/if}
        </div>
      {/each}
    </div>
    <div class="source-add-row">
      <Button variant="ghost" size="sm" onclick={addSourceCard} testid="smart-add-source">
        + Add source
      </Button>
      {#if opmlImportNote}
        <span class="opml-note">{opmlImportNote}</span>
      {/if}
    </div>
  </div>

  <div class="field">
    <span class="field-label">{maxItemsLabel}</span>
    <Select
      options={maxItemsOptions}
      value={maxItems}
      onchange={(v) => { maxItems = v; }}
      ariaLabel={maxItemsAriaLabel}
      testid="smart-folder-max-items"
    />
  </div>

  <div class="field">
    <span class="field-label">Refresh</span>
    <Select
      options={CADENCE_OPTIONS}
      value={refreshMinutes}
      onchange={(v) => { refreshMinutes = v; refreshTouched = true; }}
      ariaLabel="Refresh cadence"
      testid="smart-folder-cadence"
    />
  </div>

  <div class="confirm-row">
    <p class="hint" data-testid="smart-folder-hint">{hint}</p>
    <span class="confirm-spacer"></span>
    {#if onDone}
      <Button variant="ghost" onclick={() => onDone?.()}>Cancel</Button>
    {/if}
    <Button variant="primary" disabled={!canConfirm} onclick={confirm} testid="smart-folder-confirm">
      {node ? 'Save' : 'Create'}
    </Button>
  </div>
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-width: 216px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .field-label {
    color: var(--text-muted);
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
  }

  .hint {
    flex: 1;
    margin: 0;
    color: var(--text-faint);
    font: var(--weight-regular) var(--text-xs) / 1.4 var(--font-sans);
  }

  .confirm-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .confirm-spacer {
    flex-shrink: 0;
  }

  .source-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    /* Bounded + scrollable so the list never pushes the primary action out of
     * the panel, however many sources (e.g. a big OPML import). Name stays above
     * and the settings + actions stay below — both outside this scroll region. */
    max-height: min(46vh, 420px);
    overflow-y: auto;
    /* Room for the scrollbar so it never overlaps the card content. */
    padding-right: var(--space-1);
  }

  /* Collapsed summary row — a scannable one-line digest; click to expand+edit. */
  .source-summary-row {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
  .source-summary {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    appearance: none;
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
    padding: 2px 0;
    color: var(--text);
  }
  .summary-glyph {
    flex-shrink: 0;
    display: inline-flex;
    color: var(--text-dim);
  }
  .summary-host {
    flex-shrink: 0;
    max-width: 55%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font: var(--weight-medium) var(--text-sm) / 1 var(--font-sans);
  }
  .summary-filters {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font: var(--weight-regular) var(--text-xs) / 1 var(--font-sans);
    color: var(--text-dim);
  }
  .summary-chevron {
    flex-shrink: 0;
    display: inline-flex;
    color: var(--text-dim);
  }

  /* Disclosure caret in an expanded card's head (collapse back to summary). */
  .disclosure {
    flex-shrink: 0;
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    padding: 2px;
    border-radius: var(--r-sm);
    transition: transform var(--motion-fast) var(--ease-standard);
  }
  .disclosure:hover {
    color: var(--text);
  }
  .disclosure.expanded {
    transform: rotate(90deg);
  }

  /* Expanded = a clearly-bordered box so the Select + URL + filters read as one
   * contained editor (the "glue"); collapsed = a clean, borderless list row. */
  .source-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-2);
    background: var(--surface-2);
    border: 1px solid color-mix(in oklch, var(--text-faint) 16%, transparent);
    border-radius: var(--r-md);
    transition:
      border-color var(--motion-fast) var(--ease-standard),
      background var(--motion-fast) var(--ease-standard);
    animation: source-card-in var(--motion-base) var(--ease-emphasised);
  }
  .source-card.collapsed {
    padding: var(--space-1) var(--space-2);
    background: transparent;
    border-color: transparent;
    animation: none;
  }
  .source-card.collapsed:hover {
    background: var(--surface-2);
    border-color: color-mix(in oklch, var(--text-faint) 12%, transparent);
  }
  .source-card.invalid {
    border-color: color-mix(in oklch, var(--danger) 45%, transparent);
  }

  /* The body grows in beneath the head when a card expands, so the open box
   * reads as continuous with its summary rather than snapping in. */
  @keyframes source-card-in {
    from {
      opacity: 0;
      transform: translateY(-2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .source-card-head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .source-card-head :global(.select) {
    flex: 1;
    min-width: 0;
  }

  .source-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex-shrink: 0;
  }

  .filter-pills {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .icon-action {
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
    padding: 2px 4px;
    border-radius: var(--r-sm);
    font-size: var(--text-sm);
    line-height: 1;
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard);
  }
  .icon-action:hover:not(:disabled) {
    background: var(--surface-3);
    color: var(--text);
  }
  .icon-action:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .icon-action.remove:hover:not(:disabled) {
    color: var(--danger);
  }

  .source-add-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .file-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .file-pick {
    display: flex;
    align-items: center;
    gap: 0;
    height: var(--control-h-sm);
    background: var(--surface-2);
    border: 1px solid transparent;
    border-radius: var(--r-md);
    cursor: pointer;
    transition:
      border-color var(--motion-fast) var(--ease-standard),
      background var(--motion-fast) var(--ease-standard);
    overflow: hidden;
  }
  .file-pick:hover {
    border-color: color-mix(in oklch, var(--text) 12%, transparent);
  }
  .file-pick:focus-within {
    border-color: color-mix(in oklch, var(--text) 20%, transparent);
    outline: none;
  }

  .file-icon {
    flex-shrink: 0;
    margin-inline: var(--space-2) 4px;
    color: var(--text-dim);
  }
  .file-pick:hover .file-icon,
  .file-pick.has-file .file-icon {
    color: var(--text-muted);
  }

  .file-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font: var(--weight-regular) var(--text-xs) / 1 var(--font-sans);
    color: var(--text-dim);
  }
  .file-pick.has-file .file-name {
    color: var(--text-muted);
  }

  .file-sep {
    flex-shrink: 0;
    width: 1px;
    height: 16px;
    background: color-mix(in oklch, var(--text) 10%, transparent);
    margin-inline: var(--space-2);
  }

  .file-btn {
    flex-shrink: 0;
    padding-inline: var(--space-2);
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
    color: var(--text-muted);
  }
  .file-pick:hover .file-btn {
    color: var(--text);
  }

  .opml-note {
    font: var(--weight-regular) var(--text-xs) / 1 var(--font-sans);
    color: var(--text-muted);
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

  @media (prefers-reduced-motion: reduce) {
    .source-card,
    .icon-action,
    .file-pick,
    .disclosure {
      transition: none;
    }
    .source-card {
      animation: none;
    }
  }
</style>
