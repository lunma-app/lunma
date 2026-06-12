<script lang="ts">
import { dispatch } from '../shared/bus';
import type { PinNode, SmartQuery, SmartSource, SpaceId } from '../shared/types';
import Button from '../ui/Button.svelte';
import SegmentedControl from '../ui/SegmentedControl.svelte';
import Select from '../ui/Select.svelte';
import TextInput from '../ui/TextInput.svelte';

/**
 * Smart-folder config editor (smart-folders design D9; source picker by
 * github-connector design D8) — the menu drill-in panel behind "New smart
 * folder…" (pinned-header kebab) and a smart row's Edit…, both reached through
 * RowMenu's `panel`/`panelTitle` drill-in (the host renders the back-arrow
 * header). Five fields: source (GitLab | GitHub, ABOVE the URL it seeds),
 * instance base URL, query, cadence, name (auto-suggested per source from the
 * query until the user types).
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
 * rule's whole vocabulary (a custom URL matches neither and never swaps). */
const DEFAULT_BASE_URL: Record<SmartSource, string> = {
  gitlab: 'https://gitlab.com',
  github: 'https://github.com',
};

/** Auto-suggested names per (source, query) — used until the user touches the
 * field. `authored` follows each forge's vocabulary; the rest are shared. */
const SUGGESTED_NAME: Record<SmartSource, Record<SmartQuery, string>> = {
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
};

/** Per-source token hint: GitLab's session-or-token line vs GitHub's
 * token-required line (design D8). */
const HINT: Record<SmartSource, string> = {
  gitlab:
    "Signed in to GitLab in this browser? That's enough. Otherwise add an access token in Settings → Connectors.",
  github: 'GitHub needs an access token — add one in Settings → Connectors.',
};

const SOURCE_OPTIONS: Array<{ value: SmartSource; label: string }> = [
  { value: 'gitlab', label: 'GitLab' },
  { value: 'github', label: 'GitHub' },
];

const QUERY_OPTIONS: Array<{ value: SmartQuery; label: string }> = [
  { value: 'authored', label: 'Authored' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'review-requested', label: 'Review' },
];

const CADENCE_OPTIONS = [
  { value: '5', label: 'Every 5 minutes' },
  { value: '10', label: 'Every 10 minutes' },
  { value: '30', label: 'Every 30 minutes' },
  { value: '60', label: 'Every hour' },
];

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
let refreshMinutes = $state(String(node?.refreshMinutes ?? 10));
// svelte-ignore state_referenced_locally
let name = $state(
  node?.name ?? SUGGESTED_NAME[node?.source ?? 'gitlab'][node?.query ?? 'review-requested'],
);
// Editing an existing folder keeps its name; in create mode the suggestion
// follows the source + query until the user types a name of their own.
// svelte-ignore state_referenced_locally
let nameTouched = $state(node !== undefined);

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
// untouched default never scolds.
const showUrlError = $derived(!urlValid && baseUrl.trim() !== '');

function onSourceChange(next: string): void {
  const nextSource = next as SmartSource;
  if (nextSource === source) return;
  // The canonical-default swap rule (design D8): swap the URL whenever the
  // current value equals EITHER source's canonical default — an untouched
  // create-mode field and an on-default edit-mode folder both follow the
  // switch, while a custom/self-hosted URL is never clobbered.
  const trimmed = baseUrl.trim();
  if (trimmed === DEFAULT_BASE_URL.gitlab || trimmed === DEFAULT_BASE_URL.github) {
    baseUrl = DEFAULT_BASE_URL[nextSource];
  }
  source = nextSource;
  if (!nameTouched) name = SUGGESTED_NAME[source][query];
}

function onQueryChange(next: string): void {
  query = next as SmartQuery;
  if (!nameTouched) name = SUGGESTED_NAME[source][query];
}

function confirm(): void {
  if (!urlValid) return; // blocked — the inline message explains
  const payloadBase = {
    spaceId,
    source,
    name: name.trim() === '' ? SUGGESTED_NAME[source][query] : name.trim(),
    baseUrl: baseUrl.trim(),
    query,
    refreshMinutes: Number(refreshMinutes),
  };
  if (node) {
    dispatch({ kind: 'updateSmartFolder', payload: { ...payloadBase, folderId: node.id } });
  } else {
    dispatch({ kind: 'createSmartFolder', payload: payloadBase });
  }
  onDone?.();
}
</script>

<div class="editor" data-testid="smart-folder-editor">
  <div class="field">
    <span class="field-label">Source</span>
    <SegmentedControl
      name={`smart-folder-source-${spaceId}-${node?.id ?? 'new'}`}
      options={SOURCE_OPTIONS}
      value={source}
      onchange={onSourceChange}
      block
    />
  </div>

  <TextInput
    label="Instance URL"
    bind:value={baseUrl}
    placeholder={DEFAULT_BASE_URL[source]}
    invalid={showUrlError}
    testid="smart-folder-url"
    onenter={confirm}
  />
  {#if showUrlError}
    <p class="url-error" data-testid="smart-folder-url-error">
      Needs a full URL, like https://gitlab.example.com
    </p>
  {/if}

  <div class="field">
    <span class="field-label" id="smart-folder-query-label">Show</span>
    <SegmentedControl
      name={`smart-folder-query-${spaceId}-${node?.id ?? 'new'}`}
      options={QUERY_OPTIONS}
      value={query}
      onchange={onQueryChange}
      block
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

  /* Mirrors TextInput's own label treatment so the five fields read as one form. */
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
