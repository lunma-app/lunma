<script lang="ts">
import { dispatch } from '../shared/bus';
import { requiredOriginsForConfig } from '../shared/connector-origins';
import { parseOpml } from '../shared/opml';
import { requestHostPermissions } from '../shared/permissions';
import type { PinNode, SmartQuery, SmartSource, SmartSourceConfig, SpaceId } from '../shared/types';
import Button from '../ui/Button.svelte';
import Chip from '../ui/Chip.svelte';
import Select from '../ui/Select.svelte';
import TextInput from '../ui/TextInput.svelte';

/**
 * Smart-folder config editor — the menu drill-in panel behind "New smart
 * folder…" and a smart row's Edit…. A per-**instance** list: each entry is one
 * connector instance (source + host) carrying a **filter multi-select** of
 * canned filters (selectable `Chip` pills; hidden for rss). An inline "Add
 * source" form appends instances; re-adding an existing instance MERGES its
 * filter selections rather than dropping the add (multi-filter-smart-connectors
 * design D6).
 */

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

interface Props {
  spaceId: SpaceId;
  node?: SmartNode | undefined;
  onDone?: (() => void) | undefined;
}

const { spaceId, node, onDone }: Props = $props();

type DraftSource = {
  id: string;
  source: SmartSource;
  baseUrl: string;
  queries: SmartQuery[];
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

const SOURCE_LABELS: Record<SmartSource, string> = {
  gitlab: 'GitLab',
  github: 'GitHub',
  jira: 'Jira',
  rss: 'RSS',
};

type AddSourceType = SmartSource | 'opml';

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

function draftSourceKey(s: { source: SmartSource; baseUrl: string }): string {
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

// Capture config at mount — a live broadcast mid-edit must not clobber typing.
// svelte-ignore state_referenced_locally
let sources = $state<DraftSource[]>(
  (node?.sources ?? []).map((cfg, i) => ({
    id: String(i),
    source: cfg.source,
    baseUrl: cfg.baseUrl,
    queries: [...cfg.queries],
  })),
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

// svelte-ignore state_referenced_locally
let nextSourceId = node?.sources.length ?? 0;

// "Add source" inline form state — open by default when creating a new folder
// svelte-ignore state_referenced_locally
let addingSource = $state(node === undefined);
let addSource = $state<AddSourceType>('gitlab');
let addBaseUrl = $state(DEFAULT_BASE_URL.gitlab);
let addQueries = $state<SmartQuery[]>(['review-requested']);
let addOpmlFile = $state<File | null>(null);
let opmlImportNote = $state<string | null>(null);

// Total resolved sections: rss → 1, queue → one per selected filter. Drives the
// "per section" labels (≥ 2 sections) and matches the engine's section count.
const resolvedSectionCount = $derived(
  sources.reduce((n, s) => n + (s.source === 'rss' ? 1 : s.queries.length), 0),
);

const canConfirm = $derived(
  sources.length > 0 &&
    sources.every((s) => isValidBaseUrl(s.baseUrl.trim())) &&
    sources.every((s) => s.source === 'rss' || s.queries.length > 0),
);

const hint = $derived.by(() => {
  if (sources.length === 0) return 'Add at least one source.';
  if (sources.length === 1 && sources[0]) return HINT[sources[0].source];
  return 'Each source fetches independently. Grant access when prompted.';
});

const maxItemsLabel = $derived(
  resolvedSectionCount > 1
    ? 'Show per section'
    : sources[0]?.source === 'rss'
      ? 'Show up to'
      : 'Show at most',
);

const maxItemsAriaLabel = $derived(
  resolvedSectionCount > 1
    ? 'Maximum items per section'
    : sources[0]?.source === 'rss'
      ? 'Unread to show'
      : 'Maximum items',
);

const maxItemsOptions = $derived(
  MAX_ITEMS_VALUES.map((value) => {
    const isSingleFeed = resolvedSectionCount === 1 && sources[0]?.source === 'rss';
    return { value, label: `${value} ${isSingleFeed ? 'unread' : 'items'}` };
  }),
);

/** Toggle a filter on an existing instance card; rebuild from canonical order. */
function toggleQuery(index: number, q: SmartQuery): void {
  const s = sources[index];
  if (!s) return;
  const has = s.queries.includes(q);
  const next = new Set(s.queries);
  if (has) next.delete(q);
  else next.add(q);
  s.queries = QUERY_ORDER.filter((x) => next.has(x));
}

/** Toggle a filter in the add-source form's initial selection. */
function toggleAddQuery(q: SmartQuery): void {
  const next = new Set(addQueries);
  if (next.has(q)) next.delete(q);
  else next.add(q);
  addQueries = QUERY_ORDER.filter((x) => next.has(x));
}

async function addSourceEntry(): Promise<void> {
  if (addSource === 'opml') {
    if (!addOpmlFile) return;
    let text: string;
    try {
      text = await addOpmlFile.text();
    } catch {
      return;
    }
    const feeds = parseOpml(text);
    let imported = 0;
    for (const { name: feedName, feedUrl } of feeds) {
      try {
        new URL(feedUrl);
      } catch {
        continue;
      }
      const sk = `rss:${new URL(feedUrl).host}`;
      if (sources.some((s) => draftSourceKey(s) === sk)) continue;
      sources = [
        ...sources,
        { id: String(nextSourceId++), source: 'rss' as const, baseUrl: feedUrl, queries: [] },
      ];
      if (!nameTouched && sources.length === 1) name = feedName;
      imported++;
    }
    if (!nameTouched && sources.length > 1) name = 'Feeds';
    if (imported > 0 && !refreshTouched) refreshMinutes = '30';
    opmlImportNote =
      imported === 0
        ? 'No feeds found'
        : imported === 1
          ? '1 feed imported'
          : `${imported} feeds imported`;
    addOpmlFile = null;
    addingSource = false;
    return;
  }
  const trimmedUrl = addBaseUrl.trim();
  if (!isValidBaseUrl(trimmedUrl)) return;
  const isQueue = addSource !== 'rss';
  if (isQueue && addQueries.length === 0) return;
  const newSk = draftSourceKey({ source: addSource, baseUrl: trimmedUrl });
  // Merge into an existing instance (same source:host) rather than dropping —
  // queue filters union; rss has no filter axis so a re-add is a no-op.
  const existing = sources.find((s) => draftSourceKey(s) === newSk);
  if (existing) {
    if (isQueue) {
      const merged = new Set([...existing.queries, ...addQueries]);
      existing.queries = QUERY_ORDER.filter((q) => merged.has(q));
    }
  } else {
    sources = [
      ...sources,
      {
        id: String(nextSourceId++),
        source: addSource,
        baseUrl: trimmedUrl,
        queries: isQueue ? [...addQueries] : [],
      },
    ];
  }
  addingSource = false;
  addBaseUrl = DEFAULT_BASE_URL[addSource];
  if (!nameTouched && sources.length === 1 && isQueue) {
    const first = addQueries[0];
    if (first) {
      name = SUGGESTED_QUEUE_NAME[addSource as Exclude<SmartSource, 'rss'>][first] ?? '';
    }
  }
  if (!refreshTouched) {
    refreshMinutes = String(defaultRefreshForSources(sources));
  }
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
}

function onAddSourceChange(next: string): void {
  const nextSource = next as AddSourceType;
  addOpmlFile = null;
  if (nextSource !== 'opml') {
    const trimmed = addBaseUrl.trim();
    if ((Object.values(DEFAULT_BASE_URL) as string[]).includes(trimmed) || trimmed === '') {
      addBaseUrl = DEFAULT_BASE_URL[nextSource];
    }
  }
  addSource = nextSource;
}

/** Order-independent equality of two origin-pattern sets. */
function sameOrigins(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((o) => setB.has(o));
}

function confirm(): void {
  if (!canConfirm) return;
  const cleanSources: SmartSourceConfig[] = sources.map((s) => ({
    source: s.source,
    baseUrl: s.baseUrl.trim(),
    queries: s.source === 'rss' ? [] : [...s.queries],
  }));
  const payloadBase = {
    spaceId,
    name: name.trim() === '' ? 'Smart folder' : name.trim(),
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
  // Origins are query-independent, so the union dedups per connector instance.
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
  <!-- Per-instance list -->
  {#if sources.length > 0}
    <div class="source-list" data-testid="smart-source-list">
      {#each sources as s, i (s.id)}
        {@const isFirst = i === 0}
        {@const isLast = i === sources.length - 1}
        {@const displayHost = (() => { try { return new URL(s.baseUrl).host; } catch { return s.baseUrl || '—'; } })()}
        <div class="source-entry" data-testid="smart-source-entry">
          <div class="source-entry-top">
            <span class="source-chip" data-source={s.source}>{SOURCE_LABELS[s.source]}</span>
            <span class="source-url">{displayHost}</span>
            <div class="source-actions">
              <button
                type="button"
                class="icon-action"
                disabled={isFirst}
                aria-label="Move up"
                onclick={() => moveSource(i, -1)}
              >↑</button>
              <button
                type="button"
                class="icon-action"
                disabled={isLast}
                aria-label="Move down"
                onclick={() => moveSource(i, 1)}
              >↓</button>
              <button
                type="button"
                class="icon-action remove"
                aria-label="Remove source"
                onclick={() => removeSource(i)}
              >×</button>
            </div>
          </div>
          {#if s.source !== 'rss'}
            <div class="filter-pills" role="group" aria-label="Filters" data-testid="smart-filter-pills">
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
        </div>
      {/each}
    </div>
  {/if}

  <!-- "Add source" inline form -->
  {#if addingSource}
    <div class="add-source-form" data-testid="smart-add-source-form">
      <div class="field">
        <span class="field-label">Source</span>
        <Select
          options={SOURCE_OPTIONS}
          value={addSource}
          onchange={onAddSourceChange}
          ariaLabel="New source type"
          testid="smart-add-source-type"
        />
      </div>
      {#if addSource === 'opml'}
        <label class="file-field">
          <span class="field-label">File</span>
          <span class="file-pick" class:has-file={!!addOpmlFile}>
            <svg class="file-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 1.5h5l3 3V10.5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-9A.5.5 0 0 1 2 1.5Z" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
              <path d="M7 1.5V5h3" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
            </svg>
            <span class="file-name">{addOpmlFile ? addOpmlFile.name : 'No file chosen'}</span>
            <span class="file-sep" aria-hidden="true"></span>
            <span class="file-btn">Browse</span>
            <input
              type="file"
              accept=".opml,.xml"
              class="sr-only"
              onchange={(e) => {
                addOpmlFile = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
                (e.currentTarget as HTMLInputElement).value = '';
              }}
              data-testid="smart-opml-file-input"
            />
          </span>
        </label>
      {:else}
        <TextInput
          label={addSource === 'rss' ? 'Feed URL' : 'Instance URL'}
          bind:value={addBaseUrl}
          placeholder={addSource === 'rss' ? 'https://example.com/feed.xml' : DEFAULT_BASE_URL[addSource]}
          testid="smart-add-source-url"
        />
        {#if addSource !== 'rss'}
          <div class="field">
            <span class="field-label">Filters</span>
            <div class="filter-pills" role="group" aria-label="Filters" data-testid="smart-add-filter-pills">
              {#each queryOptionsFor(addSource) as opt (opt.value)}
                <Chip
                  label={opt.label}
                  selected={addQueries.includes(opt.value)}
                  onToggle={() => toggleAddQuery(opt.value)}
                  testid="smart-add-filter-pill"
                />
              {/each}
            </div>
          </div>
        {/if}
      {/if}
      <div class="add-source-actions">
        <Button variant="ghost" onclick={() => { addingSource = false; addOpmlFile = null; }}>Cancel</Button>
        <Button
          variant="primary"
          disabled={addSource === 'opml'
            ? addOpmlFile === null
            : !isValidBaseUrl(addBaseUrl.trim()) || (addSource !== 'rss' && addQueries.length === 0)}
          onclick={() => void addSourceEntry()}
          testid="smart-add-source-confirm"
        >
          Add
        </Button>
      </div>
    </div>
  {:else}
    <div class="source-add-row">
      <Button variant="ghost" onclick={() => { addingSource = true; opmlImportNote = null; }} testid="smart-add-source-open">
        + Add source
      </Button>
      {#if opmlImportNote}
        <span class="opml-note">{opmlImportNote}</span>
      {/if}
    </div>
  {/if}

  <TextInput
    label="Name"
    bind:value={name}
    testid="smart-folder-name"
    oninput={() => { nameTouched = true; }}
    onenter={confirm}
  />

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

  <p class="hint" data-testid="smart-folder-hint">{hint}</p>

  <div class="confirm-row">
    <Button variant="primary" disabled={!canConfirm} onclick={confirm} testid="smart-folder-confirm">
      {node ? 'Save' : 'Add smart folder'}
    </Button>
  </div>
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
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
    margin: 0;
    color: var(--text-faint);
    font: var(--weight-regular) var(--text-xs) / 1.4 var(--font-sans);
  }

  .confirm-row {
    display: flex;
    justify-content: flex-end;
  }

  /* Per-instance list */
  .source-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .source-entry {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    background: var(--surface-2);
    border-radius: var(--r-md);
  }

  .source-entry-top {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .source-chip {
    flex-shrink: 0;
    padding: 2px var(--space-1);
    background: var(--space-c-soft);
    border-radius: var(--r-sm);
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
    color: var(--text);
  }

  .source-url {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font: var(--weight-regular) var(--text-xs) / 1 var(--font-sans);
    color: var(--text-muted);
  }

  .source-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
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
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px 4px;
    border-radius: var(--r-sm);
    font-size: 12px;
    line-height: 1;
  }
  .icon-action:hover:not(:disabled) {
    background: var(--surface-3);
    color: var(--text);
  }
  .icon-action:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .icon-action.remove {
    font-size: 14px;
  }

  /* "Add source" inline form */
  .add-source-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-2);
    background: var(--surface-2);
    border-radius: var(--r-md);
  }

  .add-source-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
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
    height: 28px;
    background: var(--surface-2);
    border: 1px solid transparent;
    border-radius: var(--r-md);
    cursor: pointer;
    transition: border-color 150ms ease, background 150ms ease;
    overflow: hidden;
  }
  .file-pick:hover {
    border-color: color-mix(in srgb, var(--text) 12%, transparent);
  }
  .file-pick:focus-within {
    border-color: color-mix(in srgb, var(--text) 20%, transparent);
    outline: none;
  }

  .file-icon {
    flex-shrink: 0;
    margin-inline: var(--space-2) 4px;
    color: var(--text-dim);
    transition: color 150ms ease;
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
    background: color-mix(in srgb, var(--text) 10%, transparent);
    margin-inline: var(--space-2);
  }

  .file-btn {
    flex-shrink: 0;
    padding-inline: var(--space-2);
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
    color: var(--text-muted);
    transition: color 150ms ease;
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
</style>
