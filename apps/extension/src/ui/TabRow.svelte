<script lang="ts">
import type { Snippet } from 'svelte';
import EditableLabel from './EditableLabel.svelte';
import Favicon from './Favicon.svelte';
import Icon from './Icon.svelte';
import Tooltip from './Tooltip.svelte';

interface Props {
  /** Tab title — the row's scan target. */
  title: string;
  /** Primary favicon URL (e.g. from `faviconFor`). Forwarded to the composed
   * `Favicon`, which retries `faviconFallbackSrc` then a globe on load error. */
  faviconSrc?: string | undefined;
  /** Fallback favicon URL — the Chrome `_favicon` endpoint (`faviconUrl`) — tried
   * by the composed `Favicon` when `faviconSrc` fails to load (staged fallback). */
  faviconFallbackSrc?: string | undefined;
  /** Active-tab treatment: soft Space-coloured background + leading accent bar. */
  active?: boolean | undefined;
  /** Loading treatment: favicon slot becomes a spinner, title dims. */
  loading?: boolean | undefined;
  /** Drift treatment: a Space-coloured dot at the favicon corner signalling the
   * bound tab has wandered off its home URL (`currentURL !== originalURL`). */
  drifted?: boolean | undefined;
  /** Optional short metadata pinned to the row's right edge (e.g. an archived age +
   * delete countdown). Muted, shown at rest. When `trailing` is ALSO supplied the
   * two share one cell and cross-fade in place — meta at rest, actions on hover —
   * so the actions need no reserved gutter (see `.row-end.has-swap`). */
  meta?: string | undefined;
  /** Whole-row click (the focus target). */
  onclick?: (() => void) | undefined;
  /** Trailing action slot (e.g. a close button), revealed on hover/focus. */
  trailing?: Snippet | undefined;
  /** Force the trailing slot fully visible regardless of hover (e.g. while a
   * row's actions menu is open and its trigger must stay shown). */
  trailingVisible?: boolean | undefined;
  /** Inline rename: when true the title becomes an editable field
   * (`EditableLabel`). The favicon and row chrome are preserved; the trailing
   * slot is hidden while editing. The parent owns this flag and the trigger. */
  editing?: boolean | undefined;
  /** Commit a renamed title (Enter or blur). */
  oncommitName?: ((next: string) => void) | undefined;
  /** Abandon a rename (Escape, or empty commit when `renameAllowEmpty` is off). */
  oncancelName?: (() => void) | undefined;
  /** Treat an empty rename commit as `oncommitName('')` (clear) rather than cancel. */
  renameAllowEmpty?: boolean | undefined;
}

const {
  title,
  faviconSrc,
  faviconFallbackSrc,
  active = false,
  loading = false,
  drifted = false,
  meta,
  onclick,
  trailing,
  trailingVisible = false,
  editing = false,
  oncommitName,
  oncancelName,
  renameAllowEmpty = false,
}: Props = $props();
</script>

{#snippet faviconSlot()}
  <span class="favicon">
    {#if loading}
      <span class="spin"><Icon name="loader-circle" size={16} /></span>
    {:else}
      <Favicon src={faviconSrc} fallbackSrc={faviconFallbackSrc} size={16} />
    {/if}
    {#if drifted}
      <Tooltip label="Off home" side="top">
        {#snippet children(props)}
          <span
            {...props}
            class="drift-dot"
            data-testid="drift-dot"
            aria-label="Off home"
          ></span>
        {/snippet}
      </Tooltip>
    {/if}
  </span>
{/snippet}

<div
  class="tab-row"
  class:active
  class:loading
  class:editing
  class:trailing-visible={trailingVisible}
  data-testid="tab-row"
  data-active={active}
>
  {#if editing}
    <div class="hit editing">
      {@render faviconSlot()}
      <EditableLabel
        value={title}
        editing
        ariaLabel="Tab name"
        testid="tab-rename-input"
        allowEmpty={renameAllowEmpty}
        oncommit={(next) => oncommitName?.(next)}
        oncancel={() => oncancelName?.()}
      />
    </div>
  {:else}
    <button type="button" class="hit" title={title} onclick={() => onclick?.()}>
      {@render faviconSlot()}
      <span class="title">{title}</span>
    </button>
  {/if}
  {#if (meta || trailing) && !editing}
    <span class="row-end" class:has-swap={!!meta && !!trailing}>
      {#if meta}<span class="meta" data-testid="tab-row-meta">{meta}</span>{/if}
      {#if trailing}<span class="trailing">{@render trailing()}</span>{/if}
    </span>
  {/if}
</div>

<style>
  .tab-row {
    position: relative;
    display: flex;
    align-items: center;
    height: var(--row-h);
    padding: 0 var(--space-3);
    border-radius: var(--r-md);
    /* Active background + the leading accent bar glide on the slower curve;
     * height eases too so a density change reflows rather than snaps (reduced
     * motion collapses --motion-base to the fast tick via the global rule). */
    transition:
      background var(--motion-base) var(--ease-emphasised),
      height var(--motion-base) var(--ease-standard);
  }

  /* Leading accent indicator for the active tab. Inset off the row edge (so it
   * floats inside the highlight pill rather than doubling the sidebar's own
   * edge stripe) and faded at top/bottom so it blends instead of reading as a
   * hard bar. */
  .tab-row::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 50%;
    transform: translateY(-50%) scaleY(0);
    width: 3px;
    height: 18px;
    border-radius: var(--r-pill);
    background: linear-gradient(
      180deg,
      transparent 0%,
      var(--space-c) 28%,
      var(--space-c) 72%,
      transparent 100%
    );
    opacity: 0.9;
    transition: transform var(--motion-base) var(--ease-emphasised);
  }

  .tab-row:hover {
    background: var(--surface-2);
  }

  /* Active fill is a soft Space-coloured wash. The accent bar is absolutely
   * positioned and sits left of the content, so it needs NO content inset —
   * shifting padding on activation would reflow the favicon/title (a visible
   * jump). Identity comes from the wash + bar, never from moving content. */
  .tab-row.active {
    background: var(--space-c-soft);
  }
  .tab-row.active::before {
    transform: translateY(-50%) scaleY(1);
  }

  /* The clickable body: favicon + title. Fills the row so the whole thing
   * reads as the hit target; the trailing slot sits outside it. */
  .hit {
    appearance: none;
    border: 0;
    margin: 0;
    padding: 0;
    background: transparent;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: 100%;
    cursor: pointer;
    color: var(--text-2);
    transition: color var(--motion-fast) var(--ease-standard);
  }
  .tab-row:hover .hit,
  .tab-row.active .hit {
    color: var(--text);
  }
  .tab-row.loading .hit {
    color: var(--text-muted);
  }

  .hit:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
    border-radius: var(--r-sm);
  }

  /* While renaming, the row lights up in the Space's hue — a soft wash plus a
   * single crisp ring — and EditableLabel renders chromeless inside it, so this
   * ring is the sole focus affordance (no competing input outline). The editing
   * container is a div (not a button), so drop the pointer cursor. */
  .tab-row.editing {
    background: var(--surface-2);
    box-shadow: inset 0 0 0 1.5px color-mix(in oklch, var(--space-c) 55%, transparent);
  }
  .hit.editing {
    cursor: default;
  }

  .favicon {
    position: relative;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--favicon-size);
    height: var(--favicon-size);
    color: var(--text-muted);
    /* Rest favicons sit a touch back; hover/active bring them fully forward so
     * the active row clearly owns the foreground. */
    opacity: 0.85;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  .tab-row:hover .favicon,
  .tab-row.active .favicon {
    opacity: 1;
  }

  /* Drift indicator: a small Space-coloured dot at the favicon's bottom-right
   * corner, ringed in the row's background so it reads cleanly over any
   * favicon. Fades in over 150ms when drift begins. */
  .drift-dot {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 7px;
    height: 7px;
    border-radius: var(--r-pill);
    background: var(--space-c);
    box-shadow: 0 0 0 1.5px var(--bg);
    animation: tab-row-drift-in 150ms var(--ease-standard);
  }

  @keyframes tab-row-drift-in {
    from {
      opacity: 0;
      transform: scale(0.4);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .drift-dot {
      animation: none;
    }
  }

  .title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
    font: var(--weight-regular) var(--text-base) / 1 var(--font-sans);
    color: inherit;
    transition: font-weight var(--motion-fast) var(--ease-standard);
  }
  /* Active row's title carries a little more weight — reinforces which tab is
   * focused without relying on colour alone. */
  .tab-row.active .title {
    font-weight: var(--weight-semibold);
  }

  /* Right-edge region holding the at-rest metadata and/or the hover-revealed
   * action(s). When BOTH are present (.has-swap) they stack in one grid cell and
   * cross-fade in place — muted meta at rest, actions on hover — so the actions
   * claim NO reserved gutter (an always-present icon column left an awkward gap).
   * Trailing-only rows (e.g. a live tab's close button) keep the classic
   * reveal-on-hover behaviour; meta-only rows just show the metadata. */
  .row-end {
    flex: 0 0 auto;
    margin-left: var(--space-2);
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
  }
  .row-end.has-swap {
    display: grid;
    align-items: center;
    justify-items: end;
  }
  /* Overlap the two in a single grid cell so the region is as wide as the wider of
   * the two and the actions land exactly where the meta was. */
  .row-end.has-swap > .meta,
  .row-end.has-swap > .trailing {
    grid-area: 1 / 1;
  }

  /* At-rest metadata (e.g. an archived age + delete countdown), quiet and
   * right-aligned. Tabular numerals so a column of ages doesn't jitter. */
  .meta {
    color: var(--text-faint);
    font: var(--weight-regular) var(--text-xs) / 1 var(--font-sans);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    pointer-events: none;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }

  /* Trailing action(s): quiet until the row is hovered or focused. */
  .trailing {
    display: inline-flex;
    align-items: center;
    opacity: 0;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  /* Reveal the actions on row hover, when forced visible, or when an action is
   * keyboard-focused (so it's reachable by Tab) — but NOT on row :focus-within,
   * which would keep them stuck visible after a click focuses the row body. */
  .tab-row:hover .trailing,
  .tab-row.trailing-visible .trailing,
  .row-end:focus-within .trailing {
    opacity: 1;
  }
  /* In swap mode the meta fades out as the actions fade in (same cell). */
  .tab-row:hover .row-end.has-swap .meta,
  .tab-row.trailing-visible .row-end.has-swap .meta,
  .row-end.has-swap:focus-within .meta {
    opacity: 0;
  }
  /* Reduced motion: collapse the cross-fade to an instant swap (opacity-only, so
   * trailing-only rows keep their gentle reveal). */
  @media (prefers-reduced-motion: reduce) {
    .row-end.has-swap > .meta,
    .row-end.has-swap > .trailing {
      transition: none;
    }
  }

  .spin {
    display: inline-flex;
    animation: tab-row-spin 0.8s linear infinite;
    color: var(--space-c);
  }

  @keyframes tab-row-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spin {
      animation-duration: 1.6s;
    }
  }
</style>
