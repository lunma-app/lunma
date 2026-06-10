<script lang="ts">
import { bus } from '../shared/bus';
import { log } from '../shared/logger';
import type { PinnedTabBoundaryDefault } from '../shared/settings';
import type { SavedTabId, TabBoundary } from '../shared/types';
import { pageGlob } from '../shared/url-boundary';
import Button from '../ui/Button.svelte';
import Chip from '../ui/Chip.svelte';
import SegmentedControl from '../ui/SegmentedControl.svelte';
import TextInput from '../ui/TextInput.svelte';

interface Props {
  /** The saved tab being edited. */
  savedTabId: SavedTabId;
  /** The tab's current boundary (undefined ⇒ inheriting the global default). */
  boundary: TabBoundary | undefined;
  /** The tab's home URL — seeds the page glob when switching to Locked. */
  originalURL: string;
  /** The live global default, for the Inherit caption (pinned-tab-url-boundary). */
  globalDefault: PinnedTabBoundaryDefault;
}

const { savedTabId, boundary, originalURL, globalDefault }: Props = $props();

// The tri-state mode + locked allow-list are a pure projection of the `boundary`
// prop (which reflects authoritative store state after each dispatch round-trip).
const mode = $derived(boundary === undefined ? 'inherit' : boundary.mode);
const allow = $derived(boundary?.mode === 'locked' ? boundary.allow : []);

// Labels are user-facing ('Default'/'Off'/'On'); the underlying values stay the
// boundary modes ('inherit'/'off'/'locked').
const OPTIONS = [
  { value: 'inherit', label: 'Default' },
  { value: 'off', label: 'Off' },
  { value: 'locked', label: 'On' },
];

// A host glob: an exact host, or a leading `*.` wildcard. Kept permissive but
// enough to reject whitespace / obviously-malformed entries.
const HOST_GLOB_RE =
  /^(\*\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/;

/** Lower-case only the host portion of a URL glob (host matching is
 * case-insensitive; path matching is not), for validation + dedup — the design's
 * `lower-cased-host` normalized form. */
function normalizeUrlGlob(entry: string): string {
  const e = entry.trim();
  if (!e.includes('/')) return e.toLowerCase(); // bare host
  const scheme = e.match(/^(\*|https?):\/\//)?.[0] ?? '';
  const rest = e.slice(scheme.length);
  const slash = rest.indexOf('/');
  if (slash === -1) return e.toLowerCase();
  return `${scheme.toLowerCase()}${rest.slice(0, slash).toLowerCase()}${rest.slice(slash)}`;
}

/** A URL glob is valid when it is either a bare host glob or a URL pattern
 * (`(*://|https?://)?<host-glob>/<path-glob>`, the path may contain `*`). Kept
 * permissive — enough to reject whitespace and obviously-malformed input; the
 * matcher tolerates a bad entry by simply not matching, so no chip can brick a
 * tab. Operates on the normalized (host-lower-cased) form. */
function isValidUrlGlob(entry: string): boolean {
  if (entry === '' || /\s/.test(entry)) return false;
  if (!entry.includes('/')) return HOST_GLOB_RE.test(entry); // bare host
  const rest = entry.replace(/^(\*|https?):\/\//, '');
  const slash = rest.indexOf('/');
  if (slash <= 0) return false; // a non-empty host must precede the path
  return HOST_GLOB_RE.test(rest.slice(0, slash));
}

let draft = $state('');
const normalized = $derived(normalizeUrlGlob(draft));
const wellFormed = $derived(isValidUrlGlob(normalized));
const isDuplicate = $derived(wellFormed && allow.some((p) => normalizeUrlGlob(p) === normalized));
const canAdd = $derived(wellFormed && !isDuplicate);
// Tint the field invalid once the user has typed something that can't be added.
const showInvalid = $derived(draft.trim() !== '' && !canAdd);

const inheritCaption = $derived(
  globalDefault === 'domain'
    ? 'Following the global default — locked to its site.'
    : globalDefault === 'page'
      ? 'Following the global default — locked to this page.'
      : 'Following the global default — off (this tab navigates freely).',
);

function send(next: TabBoundary | null): void {
  bus
    .send({ kind: 'setTabBoundary', payload: { savedTabId, boundary: next } })
    .catch((err: unknown) => log.error('TAB_BOUNDARY_DISPATCH_FAILED', { err, savedTabId }));
}

function selectMode(next: string): void {
  if (next === 'inherit') {
    send(null);
  } else if (next === 'off') {
    send({ mode: 'off' });
  } else if (next === 'locked') {
    // Already locked → keep its list. Freshly locked → seed the current view's
    // page glob (`origin + pathname + '*'`) so the tab works with zero config (an
    // empty list would divert everything). A non-http(s) home yields no glob → an
    // empty list.
    if (boundary?.mode === 'locked') return;
    const glob = pageGlob(originalURL);
    send({ mode: 'locked', allow: glob ? [glob] : [] });
  }
}

function addPattern(): void {
  if (!canAdd) return;
  send({ mode: 'locked', allow: [...allow, normalized] });
  draft = '';
}

function removePattern(pattern: string): void {
  send({ mode: 'locked', allow: allow.filter((p) => p !== pattern) });
}

/** Open the extension's Options page, where the global `pinnedTabBoundaryDefault`
 * lives — so "Default" is discoverable and changeable from right here. */
function openOptions(): void {
  chrome.runtime.openOptionsPage?.();
}
</script>

<div class="boundary-editor" data-testid="tab-boundary-editor">
  <SegmentedControl
    name={`boundary-mode-${savedTabId}`}
    options={OPTIONS}
    value={mode}
    onchange={selectMode}
    block
  />

  {#if mode === 'inherit'}
    <p class="caption" data-testid="boundary-inherit-caption">{inheritCaption}</p>
    <button
      type="button"
      class="options-link"
      data-testid="boundary-options-link"
      onclick={openOptions}
    >
      Change the default in Settings
    </button>
  {:else if mode === 'off'}
    <p class="caption">This tab navigates freely.</p>
  {:else}
    <p class="caption">Links off this page open in a new tab.</p>
    <span class="list-label">Pages this tab stays on</span>
    {#if allow.length > 0}
      <div class="chips" data-testid="boundary-allow-list">
        {#each allow as pattern (pattern)}
          <Chip label={pattern} onRemove={() => removePattern(pattern)} />
        {/each}
      </div>
    {/if}
    <div class="add-row">
      <TextInput
        ariaLabel="Add a URL pattern"
        placeholder="https://example.com/inbox*"
        bind:value={draft}
        invalid={showInvalid}
        onenter={addPattern}
        testid="boundary-pattern-input"
      />
      <Button variant="secondary" disabled={!canAdd} onclick={addPattern}>Add</Button>
    </div>
  {/if}
</div>

<style>
  .boundary-editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .caption {
    margin: 0;
    font: var(--weight-medium) var(--text-xs) / 1.4 var(--font-sans);
    color: var(--text-muted);
  }

  .list-label {
    font: var(--weight-semibold) var(--text-xs) / 1.2 var(--font-sans);
    letter-spacing: 0.01em;
    color: var(--text-muted);
  }

  /* Quiet link to the Options page (where the global default lives), tinted in
   * the Space accent. Left-aligned under the caption. */
  .options-link {
    align-self: flex-start;
    appearance: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--accent);
    font: var(--weight-medium) var(--text-xs) / 1.3 var(--font-sans);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
    border-radius: var(--r-xs);
  }
  .options-link:hover {
    filter: brightness(1.1);
  }
  .options-link:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .add-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  /* Let the field grow; the Add button keeps its intrinsic width. */
  .add-row :global(.field) {
    flex: 1 1 auto;
    min-width: 0;
  }
</style>
