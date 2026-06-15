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
  /** Active-tab treatment: a soft Space-coloured background wash (no accent bar). */
  active?: boolean | undefined;
  /** Loading treatment: favicon slot becomes a spinner, title dims. */
  loading?: boolean | undefined;
  /** Drift treatment: the bound tab has wandered off its home URL
   * (`currentURL !== originalURL`). A drifted row grows a home-host subtitle and
   * turns its favicon into a one-click "return home" affordance (see `onGoHome` /
   * `homeHost`). Non-drifted rows stay single-line with a plain favicon. */
  drifted?: boolean | undefined;
  /** One-click "return home" for a drifted row — fired by a LEFT-CLICK on the
   * favicon while `drifted`. When absent, or the row is not drifted, the favicon
   * click falls through to `onclick` (focus the tab), so non-drifted behaviour is
   * unchanged. The rest of the row (title) always focuses via `onclick`. */
  onGoHome?: (() => void) | undefined;
  /** Home hostname (`hostOf(originalURL)`, e.g. `figma.com`) shown in the drift
   * subtitle and the favicon's "Return to <host>" tooltip/label. An empty or
   * absent host suppresses the subtitle and the return affordance even while
   * drifted (a weird URL degrades to "no subtitle", never a crash). */
  homeHost?: string | undefined;
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
  onGoHome,
  homeHost,
  meta,
  onclick,
  trailing,
  trailingVisible = false,
  editing = false,
  oncommitName,
  oncancelName,
  renameAllowEmpty = false,
}: Props = $props();

// A row is "returnable" (favicon → return-home affordance + subtitle) only when
// drifted AND it has a resolvable home host; an empty host degrades to a plain,
// non-drifted-looking favicon rather than a broken affordance (Risks: odd URLs).
const returnable = $derived(drifted && !!homeHost);
</script>

<!-- The plain favicon visual (image or spinner). Shared by the editing-mode
     markup and the favicon button below; carries no drift signal of its own —
     the drift affordance (return glyph / subtitle) is layered around it. -->
{#snippet faviconVisual()}
  <span class="favicon">
    {#if loading}
      <span class="spin"><Icon name="loader-circle" size={16} /></span>
    {:else}
      <Favicon src={faviconSrc} fallbackSrc={faviconFallbackSrc} size={16} />
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
      {@render faviconVisual()}
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
    <!-- D1: favicon and title are SEPARATE click targets under one row body. The
         favicon returns home when drifted (else falls through to focus); the title
         always focuses the tab. The whole-row focus layer below catches every
         OTHER pixel (the min-height gap above/below the text, the inter-control
         gaps) so the entire row — not just the label — focuses on click. -->
    <div class="hit">
      <!-- Mouse-only full-row focus target. Painted behind the favicon/title (it
           is the first child, so they sit above it and keep their own clicks) and
           kept out of the tab order (the title/favicon buttons are the keyboard
           focus targets), so it adds reach without an extra tab stop or changing
           the row's natural height — drift still grows the row. -->
      <button
        type="button"
        class="row-focus"
        tabindex="-1"
        aria-hidden="true"
        data-testid="tab-row-focus"
        onclick={() => onclick?.()}
      ></button>
      <Tooltip label={returnable ? `Return to ${homeHost}` : ''} side="top" enabled={returnable}>
        {#snippet children(props)}
          <button
            {...props}
            type="button"
            class="favicon-btn"
            class:returnable
            data-testid="tab-favicon-btn"
            aria-label={returnable ? `Return to ${homeHost}` : title}
            onclick={() => (returnable ? onGoHome?.() : onclick?.())}
          >
            {@render faviconVisual()}
            {#if returnable}
              <span class="return-glyph" aria-hidden="true">
                <Icon name="corner-up-left" size={16} />
              </span>
            {/if}
          </button>
        {/snippet}
      </Tooltip>
      <button
        type="button"
        class="title-btn"
        title={title}
        aria-label={title}
        onclick={() => onclick?.()}
      >
        <span class="title">{title}</span>
        <!-- Drifted-only home-host subtitle. The grid-rows shell stays mounted so
             the grow/shrink animates both ways; the inner line renders only while
             drifted so a calm row carries no second line (and no DOM subtitle). -->
        <span class="subtitle-wrap" class:open={returnable}>
          {#if returnable}
            <span class="subtitle" data-testid="drift-subtitle">
              <Icon name="corner-up-left" size={12} />
              <span class="subtitle-host">{homeHost}</span>
            </span>
          {/if}
        </span>
      </button>
    </div>
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
    /* `min-height` (not a fixed `height`) so a drifted row can grow a second
     * line — the home-host subtitle's grid-rows tween drives the visible grow;
     * a non-drifted row stays exactly one --row-h tall. */
    min-height: var(--row-h);
    padding: 0 var(--space-3);
    border-radius: var(--r-md);
    /* Active background glides on the slower curve; min-height eases too so a
     * density change reflows rather than snaps (reduced motion collapses
     * --motion-base to the fast tick via the global rule). */
    transition:
      background var(--motion-base) var(--ease-emphasised),
      min-height var(--motion-base) var(--ease-standard);
  }

  .tab-row:hover {
    background: var(--surface-2);
  }

  /* Active fill is a soft Space-coloured wash — distinct in HUE from the neutral
   * hover (`--surface-2`), so the two never read alike. The wash plus the
   * heavier active title (below) carry the active identity on their own; there is
   * deliberately no leading accent bar (a short floated tick read as a stray
   * artifact against the wash). Identity comes from colour + weight, never from
   * moving content, so activation never reflows the favicon/title. */
  .tab-row.active {
    background: var(--space-c-soft);
  }

  /* The row body: a container holding the favicon button + the title button as
   * SEPARATE hit targets (D1). Fills the row width; the trailing slot sits
   * outside it. Colour is set here and inherited by both buttons. */
  .hit {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-2);
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

  /* Whole-row focus overlay — fills the row (the row is `position: relative`) and
   * sits at the back of the content, so the favicon/title/close (later in DOM, or
   * in `.row-end`) paint above it and keep their own clicks. Every other pixel of
   * the row falls through to this, so a click anywhere focuses the tab. Chromeless;
   * no focus ring (it is `tabindex=-1` — keyboard uses the title/favicon buttons). */
  .row-focus {
    position: absolute;
    inset: 0;
    appearance: none;
    border: 0;
    margin: 0;
    padding: 0;
    background: transparent;
    cursor: pointer;
  }

  /* Both buttons reset to chromeless and inherit the row's colour. */
  .favicon-btn,
  .title-btn {
    appearance: none;
    border: 0;
    margin: 0;
    padding: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  /* Favicon button — the return-home target when drifted, else a second focus
   * target. Relative so the hover return glyph can overlay the favicon; presses
   * squish like the row's other controls. */
  .favicon-btn {
    position: relative;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-sm);
    transition: transform var(--motion-fast) var(--ease-standard);
  }
  /* The visible favicon is only --favicon-size (16px) — far too small a click/hover
   * target for the drifted return-home affordance. Extend the HIT AREA (clicks and
   * the hover that reveals the ↩ glyph/tooltip) to the row's full height, the row's
   * left padding, and half the favicon↔title gap — without moving a pixel of
   * layout. The title button stays a separate target (it paints later, so the
   * overlap boundary resolves to it), per the favicon/title split the bindings
   * spec mandates. */
  .favicon-btn::before {
    content: '';
    position: absolute;
    top: calc((var(--row-h) - var(--favicon-size)) / -2);
    bottom: calc((var(--row-h) - var(--favicon-size)) / -2);
    left: calc(-1 * var(--space-3));
    right: calc(var(--space-2) / -2);
  }
  .favicon-btn:active {
    transform: scale(var(--press-scale));
  }
  .favicon-btn:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
    border-radius: var(--r-sm);
  }

  /* Title button — stacks the title over the drifted-only subtitle and stays the
   * row's primary focus target (clicking it focuses the tab). */
  .title-btn {
    /* Positioned so it (and the favicon button) paint ABOVE the absolute
     * `.row-focus` overlay and keep their own clicks — return-home on the favicon,
     * focus on the title — while the overlay catches the surrounding dead space. */
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    text-align: left;
  }
  .title-btn:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
    border-radius: var(--r-sm);
  }

  /* Return affordance: a Space-hued ↩ glyph overlaying the favicon, revealed on
   * hover/focus of a drifted favicon button as the favicon cross-fades out. */
  .return-glyph {
    position: absolute;
    inset: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--space-c);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  .favicon-btn.returnable:hover .favicon,
  .favicon-btn.returnable:focus-visible .favicon {
    opacity: 0;
  }
  .favicon-btn.returnable:hover .return-glyph,
  .favicon-btn.returnable:focus-visible .return-glyph {
    opacity: 1;
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

  /* Drifted-only home-host subtitle. The grid-rows shell animates 0fr↔1fr so the
   * row grows/shrinks smoothly on drift/return; the inner line is clipped to 0
   * height while collapsed. The leading ↩ glyph + dim host read as "back to". */
  .subtitle-wrap {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--motion-base) var(--ease-standard);
  }
  .subtitle-wrap.open {
    grid-template-rows: 1fr;
  }
  .subtitle {
    overflow: hidden;
    min-height: 0;
    padding-top: 2px;
    display: flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--text-dim);
    font: var(--weight-medium) var(--text-xs) / 1.2 var(--font-sans);
  }
  .subtitle-host {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Reduced motion: the subtitle appears/disappears with no height tween and the
   * favicon→return swap is instant (no cross-fade). */
  @media (prefers-reduced-motion: reduce) {
    .subtitle-wrap,
    .return-glyph,
    .favicon {
      transition: none;
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
    /* Positioned so the trailing meta/close paint ABOVE the full-row `.row-focus`
     * overlay and keep their own clicks (the ✕ must close, not focus the tab). */
    position: relative;
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
  /* A trailing-only action (a row's close ✕, with no meta to swap against) sits with
   * an EQUAL gap on top, bottom, and right — so its hover box reads as evenly inset
   * rather than floating in or bleeding off the edge. Vertical centring already fixes
   * the top/bottom gap at `(--row-h - --icon-btn) / 2`; the box otherwise right-aligns
   * to the row's `--space-3` padding line, so pull it out until its right gap matches
   * that vertical gap. Holds at every row density (the gap tracks `--row-h`). Swap
   * rows (`.has-swap`) keep meta↔action in place, so they are excluded. */
  .row-end:not(.has-swap) > .trailing {
    margin-right: calc((var(--row-h) - var(--icon-btn)) / 2 - var(--space-3));
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
