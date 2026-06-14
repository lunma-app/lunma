<script lang="ts">
import { dispatch } from '../shared/bus';
import { requiredOriginsForNode } from '../shared/connector-origins';
import { requestHostPermissions } from '../shared/permissions';
import type { PinNode, SmartQuery, SmartSource, SpaceId } from '../shared/types';
import Button from '../ui/Button.svelte';
import SegmentedControl from '../ui/SegmentedControl.svelte';
import Select from '../ui/Select.svelte';
import TextInput from '../ui/TextInput.svelte';

/**
 * Smart-folder config editor (smart-folders design D9; source picker by
 * github-connector D8, third source by jira-connector D9, fourth (RSS) by
 * rss-connector D7) — the menu drill-in panel behind "New smart folder…"
 * (pinned-header kebab) and a smart row's Edit…, both reached through RowMenu's
 * `panel`/`panelTitle` drill-in (the host renders the back-arrow header).
 *
 * Source-adaptive: the source picker is the `Select` primitive (it scales past
 * four sources — rss is the fourth). For the queue sources it shows the canned
 * query control; for the FEED source (`rss`) the query is hidden, the URL field
 * is "Feed URL", the Refresh default is 30 minutes, and the hint says no sign-in
 * is needed. The "Show at most" `Select` (→ `maxItems`) shows for every source.
 */

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

interface Props {
  spaceId: SpaceId;
  /** Present = edit mode (fields pre-filled, confirm dispatches
   * `updateSmartFolder`); absent = create mode (`createSmartFolder`). */
  node?: SmartNode | undefined;
  /** Invoked after a confirm dispatches, so the host dismisses the panel/menu. */
  onDone?: (() => void) | undefined;
}

const { spaceId, node, onDone }: Props = $props();

/** Each source's canonical base-URL default — the editor seed, and the swap
 * rule's whole vocabulary (a custom URL matches none and never swaps). Jira's is
 * a template placeholder; `rss` has NO canonical host (the user pastes the feed
 * URL), so its default is empty (design D6/D2). */
const DEFAULT_BASE_URL: Record<SmartSource, string> = {
  gitlab: 'https://gitlab.com',
  github: 'https://github.com',
  jira: 'https://your-site.atlassian.net',
  rss: '',
};

/** Auto-suggested names per (source, query) — used until the user touches the
 * field. The feed source has no canned query, so its name is not derived: it
 * stays empty until typed (design D2/D7). */
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

/** The name a blank field falls back to: the queue suggestion, or '' for a feed
 * (no query to derive from). */
function suggestedName(s: SmartSource, q: SmartQuery): string {
  return s === 'rss' ? '' : SUGGESTED_QUEUE_NAME[s][q];
}

/** Per-source hint: GitLab's session-or-token line, GitHub's token-required
 * line, Jira's session-only line, and the feed's no-sign-in line (design
 * D8/D9; rss D11). */
const HINT: Record<SmartSource, string> = {
  gitlab:
    "Signed in to GitLab in this browser? That's enough. Otherwise add an access token in Settings → Connectors.",
  github: 'GitHub needs an access token — add one in Settings → Connectors.',
  jira: "Signed in to Jira in this browser? That's enough.",
  rss: 'Public feed — no sign-in needed. Paste the feed URL.',
};

const SOURCE_OPTIONS: Array<{ value: SmartSource; label: string }> = [
  { value: 'gitlab', label: 'GitLab' },
  { value: 'github', label: 'GitHub' },
  { value: 'jira', label: 'Jira' },
  { value: 'rss', label: 'RSS' },
];

const CADENCE_OPTIONS = [
  { value: '5', label: 'Every 5 minutes' },
  { value: '10', label: 'Every 10 minutes' },
  { value: '30', label: 'Every 30 minutes' },
  { value: '60', label: 'Every hour' },
];

/** The per-folder `maxItems` options (design D5). For a QUEUE it caps the total
 * results ("10 items"); for the FEED it is the UNREAD budget ("10 unread" — the
 * draining-queue model surfaces the newest N unread and backfills as you read).
 * Source-adaptive labels keep the meaning honest. */
const MAX_ITEMS_VALUES = ['10', '20', '30', '50'];
const maxItemsOptions = $derived(
  MAX_ITEMS_VALUES.map((value) => ({ value, label: `${value} ${isFeed ? 'unread' : 'items'}` })),
);

/** Refresh default by source: feeds move slowly (30 min); queues poll at 10. */
function defaultRefresh(s: SmartSource): number {
  return s === 'rss' ? 30 : 10;
}

// The draft fields intentionally capture the node's config AT MOUNT: the
// editor is a fresh instance per drill-in (the menu drawer unmounts on close),
// and a live broadcast mid-edit must not clobber in-progress typing.
// svelte-ignore state_referenced_locally
let source = $state<SmartSource>(node?.source ?? 'gitlab');
// svelte-ignore state_referenced_locally
let baseUrl = $state(node?.baseUrl ?? DEFAULT_BASE_URL[node?.source ?? 'gitlab']);
// svelte-ignore state_referenced_locally
let query = $state<SmartQuery>(node?.query ?? 'review-requested');
// svelte-ignore state_referenced_locally
let maxItems = $state(String(node?.maxItems ?? 10));
// svelte-ignore state_referenced_locally
let refreshMinutes = $state(
  String(node?.refreshMinutes ?? defaultRefresh(node?.source ?? 'gitlab')),
);
// svelte-ignore state_referenced_locally
let name = $state(
  node?.name ?? suggestedName(node?.source ?? 'gitlab', node?.query ?? 'review-requested'),
);
// Editing an existing folder keeps its name/cadence; in create mode the
// suggestion + the cadence follow the source until the user changes them.
// svelte-ignore state_referenced_locally
let nameTouched = $state(node !== undefined);
// svelte-ignore state_referenced_locally
let refreshTouched = $state(node !== undefined);

const isFeed = $derived(source === 'rss');

// QUERY_OPTIONS is source-aware (design D9): the third slot reads "Watching" for
// Jira and "Review" for the forges. The `SmartQuery` value stays
// 'review-requested' — only the displayed label (and the connector's JQL) differ.
const queryOptions = $derived<Array<{ value: SmartQuery; label: string }>>([
  { value: 'authored', label: 'Authored' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'review-requested', label: source === 'jira' ? 'Watching' : 'Review' },
]);

/** Absolute http(s) URL — mirrors the SW's `normalizeBaseUrl` acceptance (the
 * SW re-validates and rejects with an error ack as the backstop). */
function isValidBaseUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

const urlValid = $derived(isValidBaseUrl(baseUrl.trim()));
// The quiet inline message renders only once the field holds something — an
// untouched default (or the feed source's empty seed) never scolds.
const showUrlError = $derived(!urlValid && baseUrl.trim() !== '');

function onSourceChange(next: string): void {
  const nextSource = next as SmartSource;
  if (nextSource === source) return;
  // The canonical-default swap rule (design D8, four-valued by rss D7): swap the
  // URL whenever the current value equals ANY source's canonical default — an
  // untouched create-mode field and an on-default edit-mode folder both follow
  // the switch (including to/from the feed source's empty seed), while a
  // custom/self-hosted URL is never clobbered.
  const trimmed = baseUrl.trim();
  if ((Object.values(DEFAULT_BASE_URL) as string[]).includes(trimmed)) {
    baseUrl = DEFAULT_BASE_URL[nextSource];
  }
  source = nextSource;
  if (!nameTouched) name = suggestedName(source, query);
  if (!refreshTouched) refreshMinutes = String(defaultRefresh(source));
}

function onQueryChange(next: string): void {
  query = next as SmartQuery;
  if (!nameTouched) name = suggestedName(source, query);
}

/** Order-independent equality of two origin-pattern sets (each is normally one
 * element; compared as sets so a future multi-origin connector still works). */
function sameOrigins(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((o) => setB.has(o));
}

function confirm(): void {
  if (!urlValid) return; // blocked — the inline message explains
  const trimmedBaseUrl = baseUrl.trim();
  const payloadBase = {
    spaceId,
    source,
    name: name.trim() === '' ? suggestedName(source, query) : name.trim(),
    baseUrl: trimmedBaseUrl,
    maxItems: Number(maxItems),
    refreshMinutes: Number(refreshMinutes),
    // A feed has no canned query — omit it entirely (design D2).
    ...(isFeed ? {} : { query }),
  };
  // Save FIRST (least-privilege-permissions design D4): the folder is created/
  // updated before the permission dialog, so a deny/dismiss never loses the
  // user's config — it simply lands in `needs-access` with the inline Grant
  // affordance on its card.
  if (node) {
    dispatch({ kind: 'updateSmartFolder', payload: { ...payloadBase, folderId: node.id } });
  } else {
    dispatch({ kind: 'createSmartFolder', payload: payloadBase });
  }
  // Then request the connector's required host origins from THIS user gesture
  // (the SW can't request — design D1). Only on a create or an origin-changing
  // edit; an edit that leaves the origins unchanged shows no dialog. Fired
  // synchronously (no await before it) so the gesture is preserved; the grant's
  // `onPermissionsChange` heals the folder in the SW, no reload.
  const nextOrigins = requiredOriginsForNode({ source, baseUrl: trimmedBaseUrl });
  const prevOrigins = node
    ? requiredOriginsForNode({ source: node.source, baseUrl: node.baseUrl })
    : [];
  if (!node || !sameOrigins(prevOrigins, nextOrigins)) {
    void requestHostPermissions(nextOrigins);
  }
  onDone?.();
}
</script>

<div class="editor" data-testid="smart-folder-editor">
  <div class="field">
    <span class="field-label">Source</span>
    <Select
      options={SOURCE_OPTIONS}
      value={source}
      onchange={onSourceChange}
      ariaLabel="Source"
      testid="smart-folder-source"
    />
  </div>

  <TextInput
    label={isFeed ? 'Feed URL' : 'Instance URL'}
    bind:value={baseUrl}
    placeholder={isFeed ? 'https://example.com/feed.xml' : DEFAULT_BASE_URL[source]}
    invalid={showUrlError}
    testid="smart-folder-url"
    onenter={confirm}
  />
  {#if showUrlError}
    <p class="url-error" data-testid="smart-folder-url-error">
      {#if isFeed}
        Needs a full feed URL, like https://example.com/feed.xml
      {:else}
        Needs a full URL, like https://gitlab.example.com
      {/if}
    </p>
  {/if}

  {#if !isFeed}
    <div class="field">
      <span class="field-label" id="smart-folder-query-label">Show</span>
      <SegmentedControl
        name={`smart-folder-query-${spaceId}-${node?.id ?? 'new'}`}
        options={queryOptions}
        value={query}
        onchange={onQueryChange}
        block
      />
    </div>
  {/if}

  <div class="field">
    <span class="field-label">{isFeed ? 'Show up to' : 'Show at most'}</span>
    <Select
      options={maxItemsOptions}
      value={maxItems}
      onchange={(v) => {
        maxItems = v;
      }}
      ariaLabel={isFeed ? 'Unread to show' : 'Maximum items'}
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
        refreshTouched = true;
      }}
      ariaLabel="Refresh cadence"
      testid="smart-folder-cadence"
    />
  </div>

  <TextInput
    label="Name"
    bind:value={name}
    testid="smart-folder-name"
    oninput={() => {
      nameTouched = true;
    }}
    onenter={confirm}
  />

  <p class="hint" data-testid="smart-folder-hint">{HINT[source]}</p>

  <div class="confirm-row">
    <Button variant="primary" disabled={!urlValid} onclick={confirm}>
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

  /* Mirrors TextInput's own label treatment so the fields read as one form. */
  .field-label {
    color: var(--text-muted);
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
  }

  .url-error {
    margin: 0;
    color: var(--danger);
    font: var(--weight-regular) var(--text-xs) / 1.3 var(--font-sans);
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
</style>
