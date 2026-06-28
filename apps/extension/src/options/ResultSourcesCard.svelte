<script lang="ts">
import { onMount } from 'svelte';
import { m } from '../shared/paraglide/messages';
import {
  hasApiPermission,
  type OptionalApiPermission,
  onPermissionsChange,
  requestApiPermission,
} from '../shared/permissions';
import Button from '../ui/Button.svelte';
import SettingsCard from '../ui/SettingsCard.svelte';
import Toast from '../ui/Toast.svelte';

// ── Result sources (least-privilege-permissions D5) ───────────────────────────
// The launcher's history/bookmarks providers are OPTIONAL permissions, granted
// in-context. This is the canonical grant control: the new-tab launcher offers
// an inline "Enable …" affordance, and the Alt+L overlay (which can't call
// `chrome.permissions`) routes its "Enable …" here via the SW (`#result-sources`).
// Reads/requests go through `shared/permissions.ts`; `onPermissionsChange` keeps
// the indicators live when a grant is revoked in Chrome's own UI.

const RESULT_SOURCES: Array<{
  name: OptionalApiPermission;
  label: string;
  desc: string;
  cta: string;
}> = [
  {
    name: 'history',
    label: m.options_historyLabel(),
    desc: m.options_historyDescription(),
    cta: m.options_enableHistory(),
  },
  {
    name: 'bookmarks',
    label: m.options_bookmarksLabel(),
    desc: m.options_bookmarksDescription(),
    cta: m.options_enableBookmarks(),
  },
];

let resultSourceGranted = $state<Record<OptionalApiPermission, boolean>>({
  history: false,
  bookmarks: false,
});
// Announce a successful grant via the shared Toast so the button→pill swap isn't
// a silent change to assistive tech (options inline-reveals guarantee).
let toast = $state<{ message: string } | null>(null);

async function refreshResultSources(): Promise<void> {
  const [history, bookmarks] = await Promise.all([
    hasApiPermission('history'),
    hasApiPermission('bookmarks'),
  ]);
  resultSourceGranted = { history, bookmarks };
}

/** Grant an optional result source from this user gesture (extension page).
 * `onPermissionsChange` also refreshes, but refresh here too so the indicator
 * updates immediately on this surface. On success, announce the swap via Toast. */
async function enableResultSource(name: OptionalApiPermission): Promise<void> {
  const granted = await requestApiPermission(name);
  await refreshResultSources();
  if (granted) {
    const label = RESULT_SOURCES.find((s) => s.name === name)?.label ?? name;
    toast = { message: m.options_sourceEnabledToast({ label }) };
  }
}

onMount(() => {
  void refreshResultSources();
});

// Keep the result-source indicators live (least-privilege-permissions D5): a
// grant from the inline control here, or a revoke in Chrome's own UI, refreshes
// the row state without a reload.
onMount(() => onPermissionsChange(() => void refreshResultSources()));
</script>

<SettingsCard
  heading={m.options_resultSourcesHeading()}
  description={m.options_resultSourcesDescription()}
  id="result-sources"
  testid="result-sources-section"
>
  <p class="result-source-intro">
    {m.options_resultSourcesIntro()}
  </p>

  {#each RESULT_SOURCES as source (source.name)}
    <div class="result-source-row" data-testid={`result-source-${source.name}`}>
      <div class="result-source-cell">
        <span class="result-source-label">{source.label}</span>
        <span class="result-source-desc">{source.desc}</span>
      </div>
      {#if resultSourceGranted[source.name]}
        <span
          class="result-source-indicator"
          data-testid={`result-source-${source.name}-granted`}
        >
          {m.options_sourceEnabled()}
        </span>
      {:else}
        <Button variant="primary" onclick={() => void enableResultSource(source.name)}>
          {source.cta}
        </Button>
      {/if}
    </div>
  {/each}
</SettingsCard>

{#if toast}
  <Toast message={toast.message} onDismiss={() => (toast = null)} />
{/if}

<style>
  /* Result sources (least-privilege-permissions D5): one row per optional source
   * — a label + description on the left, an Enabled pill or the primary Enable
   * Button on the right. Mirrors the connector-row list rhythm. */
  .result-source-intro {
    margin: 0 0 var(--space-3);
    font: var(--weight-regular) var(--text-sm) / 1.45 var(--font-sans);
    color: var(--text-muted);
  }
  .result-source-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--divider);
  }
  .result-source-cell {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }
  .result-source-label {
    font: var(--weight-medium) var(--text-base) / 1.2 var(--font-sans);
    color: var(--text);
  }
  .result-source-desc {
    font: var(--weight-regular) var(--text-sm) / 1.35 var(--font-sans);
    color: var(--text-muted);
  }
  .result-source-indicator {
    flex-shrink: 0;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--r-pill);
    background: var(--surface-2);
    color: var(--text-faint);
    font: var(--weight-medium) var(--text-2xs) / 1 var(--font-sans);
  }
</style>
