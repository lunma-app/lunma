<script lang="ts">
import type { ChangeData, LensItem } from '../../shared/types';
import Avatar from '../../ui/Avatar.svelte';
import Diffstat from '../../ui/Diffstat.svelte';
import ReviewerRail from '../../ui/ReviewerRail.svelte';

// ChangeRow (review-lens, D8): one Change rendered as a triage row — CI light ·
// title · `host/owner/repo · @author` · reviewer rail · diffstat · warming age.
// Composes Avatar / Diffstat / ReviewerRail (never re-rolls disc/bar/cluster).
// Read-only: activation is delegated to `onactivate` (the queue owns the bus).
interface Props {
  /** The change item — `change` is the canonical bag, `status` the CI tone. */
  item: LensItem;
  /** The owning source's base URL — the subline host derives from it. */
  baseUrl: string;
  /** Bound-tab-active in this window (drives the active treatment). */
  active?: boolean | undefined;
  /** Fired on click/Enter — the queue dispatches `openLensItem`. */
  onactivate: () => void;
}

const { item, baseUrl, active = false, onactivate }: Props = $props();

const change = $derived<ChangeData | undefined>(item.change);

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** 1–2 char initials from a login (`octocat` → `OC`, `a` → `A`). */
function initialsOf(login: string): string {
  const cleaned = login.replace(/[^a-zA-Z0-9]/g, '');
  return (cleaned.slice(0, 2) || login.slice(0, 2)).toUpperCase();
}

const host = $derived(hostOf(baseUrl));
const reviewers = $derived(
  (change?.reviewers ?? []).map((r) => ({
    initials: initialsOf(r.login),
    state: r.state,
    title: r.login,
  })),
);

// CI light: the existing `status` tone, with `draft` shown as a distinct hollow
// glyph override (D6 — `status` still carries the pipeline tone underneath).
const ciTone = $derived(change?.draft ? 'draft' : (item.status?.tone ?? 'none'));
const ciLabel = $derived(change?.draft ? 'Draft' : (item.status?.label ?? ''));

const HOUR = 3_600_000;
const DAY = 86_400_000;
// Past this age a review has gone stale — the age warms to `--warning` (D-visual).
const STALE_MS = 3 * DAY;

const age = $derived.by(() => {
  if (change === undefined) return null;
  const diff = Date.now() - change.updatedAt;
  const label =
    diff < HOUR
      ? `${Math.max(1, Math.round(diff / 60_000))}m`
      : diff < DAY
        ? `${Math.round(diff / HOUR)}h`
        : `${Math.round(diff / DAY)}d`;
  return { label, stale: diff >= STALE_MS };
});

const ariaLabel = $derived(item.status ? `${item.title} — ${item.status.label}` : item.title);
</script>

<button
  type="button"
  class="row"
  class:active
  data-testid="change-row"
  aria-label={ariaLabel}
  onclick={onactivate}
>
  <span class="ci" data-tone={ciTone} title={ciLabel} aria-hidden="true"></span>

  <span class="main">
    <span class="title-line">
      <span class="title">{item.title}</span>
      {#if change?.draft}<span class="tag-draft">draft</span>{/if}
    </span>
    <span class="subline">
      {#if change}
        <span class="repo"><span class="host">{host}</span>/{change.repo}</span>
        <span class="sep">·</span>
        <span class="author">
          <Avatar initials={initialsOf(change.author)} size="sm" title={change.author} />@{change.author}
        </span>
      {:else}
        <span class="repo"><span class="host">{host}</span></span>
      {/if}
    </span>
  </span>

  <span class="signals">
    <span class="rail-cell">
      {#if reviewers.length > 0}<ReviewerRail {reviewers} />{/if}
    </span>
    <span class="diff-cell">
      <Diffstat additions={change?.additions} deletions={change?.deletions} />
    </span>
    <span class="age-cell" class:stale={age?.stale}>{age?.label ?? ''}</span>
  </span>
</button>

<style>
  .row {
    appearance: none;
    border: 0;
    width: 100%;
    box-sizing: border-box;
    text-align: left;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: start;
    column-gap: var(--space-3);
    padding: var(--space-3);
    border-radius: var(--r-md);
    background: transparent;
    color: var(--text-2);
    cursor: pointer;
    transition: background var(--motion-fast) var(--ease-standard);
  }
  .row + :global(.row),
  :global(.rows) > :global(.change-row-cell) + :global(.change-row-cell) .row {
    box-shadow: inset 0 1px 0 color-mix(in oklch, var(--text-faint) 12%, transparent);
  }
  .row:hover {
    background: var(--surface-2);
  }
  .row:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
  /* Active = the bound tab is open in this window (matches the card's treatment). */
  .row.active {
    background: var(--space-c-soft);
  }

  /* col 1 — CI light. `draft` is a hollow split glyph, not colour. */
  .ci {
    margin-top: 5px;
    width: 10px;
    height: 10px;
    border-radius: var(--r-pill);
    flex-shrink: 0;
  }
  .ci[data-tone='ok'] {
    background: var(--success);
  }
  .ci[data-tone='fail'] {
    background: var(--danger);
  }
  .ci[data-tone='warn'] {
    background: var(--warning);
  }
  .ci[data-tone='pending'] {
    background: var(--info);
  }
  .ci[data-tone='none'] {
    background: var(--surface-3);
  }
  .ci[data-tone='draft'] {
    background: transparent;
    box-shadow: inset 0 0 0 2px var(--text-dim);
  }

  /* col 2 — title + subline */
  .main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .title-line {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    min-width: 0;
  }
  .title {
    font: var(--weight-medium) var(--text-base) / 1.3 var(--font-sans);
    color: var(--text);
    overflow-wrap: anywhere;
  }
  .tag-draft {
    flex-shrink: 0;
    padding: 1px 6px;
    border-radius: var(--r-xs);
    font: var(--weight-semibold) var(--text-2xs) / 1.4 var(--font-mono);
    letter-spacing: 0.04em;
    color: var(--text-dim);
    background: var(--surface-3);
    text-transform: uppercase;
  }
  .subline {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
    font: var(--weight-regular) var(--text-xs) / 1.3 var(--font-sans);
    color: var(--text-dim);
  }
  .repo {
    font-family: var(--font-mono);
    color: var(--text-muted);
  }
  .repo .host {
    color: var(--text-dim);
  }
  .sep {
    color: var(--text-faint);
  }
  .author {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--text-muted);
  }

  /* col 3 — fixed signal tracks so rail/diff/age align down the queue. */
  .signals {
    display: grid;
    grid-template-columns: auto 96px 30px;
    align-items: center;
    column-gap: var(--space-4);
    padding-top: 2px;
  }
  .rail-cell {
    justify-self: end;
  }
  .diff-cell {
    justify-self: end;
  }
  .age-cell {
    justify-self: end;
    text-align: right;
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-mono);
    color: var(--text-faint);
  }
  .age-cell.stale {
    color: var(--warning);
  }

  @media (prefers-reduced-motion: reduce) {
    .row {
      transition: none;
    }
  }
</style>
