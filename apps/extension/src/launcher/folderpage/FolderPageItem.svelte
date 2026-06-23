<script lang="ts" module>
/**
 * The B-SEAM (smart-folder-page design D4). Phase A renders ONLY the fields the
 * `smartFolders` runtime carries today — title, favicon, at most one status dot.
 * This optional `rich` bag is the reserved slot set: a future
 * `smart-folder-page-rich-content` change adds optional fields to
 * `SmartFolderItem`, maps them onto `rich`, and the card below lights them up
 * additively — no rewrite of this surface. In Phase A `rich` is never passed, so
 * every slot is absent and the card reads as a clean, finished link card (empty
 * slots collapse to zero height; they are NOT blank reserved boxes).
 */
export interface RichSlots {
  /** A short summary / first line (e.g. an RSS excerpt, an MR description). */
  excerpt?: string;
  /** A hero/preview image URL. */
  imageUrl?: string;
  /** A compact meta line (e.g. `+112 −40 · 4 checks`). */
  meta?: string;
}
</script>

<script lang="ts">
import type { SmartFolderItem } from '../../shared/types';
import Favicon from '../../ui/Favicon.svelte';

interface Props {
  title: string;
  /** Favicon src for the leading disc (recessed at rest, full on hover/active). */
  faviconSrc: string;
  /** At most one status dot (queue check/CI tone). Absent → no glyph. */
  status?: SmartFolderItem['status'];
  /** Feed unread mark — a single hue dot; `read` clears it. */
  feed?: boolean | undefined;
  read?: boolean | undefined;
  /** Bound to an open tab in this window (drives the active treatment). */
  active?: boolean | undefined;
  /** Accessible label (composed by the parent with read/status context). */
  ariaLabel: string;
  onactivate: () => void;
  /** Richer-content slots — populated for feed entries (smart-folder-page);
   * absent for queue items, where the card collapses to its plain head row. */
  rich?: RichSlots | undefined;
  /** Pre-formatted publication date (the page formats epoch ms → a label). */
  dateLabel?: string | undefined;
}

const {
  title,
  faviconSrc,
  status,
  feed = false,
  read = false,
  active = false,
  ariaLabel,
  onactivate,
  rich,
  dateLabel,
}: Props = $props();

// Feed cards always lead with a hero of one fixed ratio so titles align across
// the magazine grid: a real image when the entry has one, else a generated cover
// (the title's initial set in the serif over a hue wash). Queue cards have no
// hero — they stay compact head-first rows.
const hasImage = $derived(rich?.imageUrl !== undefined && rich.imageUrl !== '');
const hasHero = $derived(feed);
// The cover initial — the first letter/character of the title, else a quiet dot.
const initial = $derived.by(() => {
  const ch = title.trim().match(/[\p{L}\p{N}]/u)?.[0];
  return ch ? ch.toUpperCase() : '·';
});
</script>

<button
  type="button"
  class="card"
  class:active
  class:feed
  class:read
  class:has-hero={hasHero}
  data-testid="folderpage-item"
  data-active={active}
  aria-label={ariaLabel}
  onclick={onactivate}
>
  <!-- Hero leads the magazine card (feed entries). A real image loads lazily and
       referrer-free; a cover-less entry gets a generated cover (serif initial on a
       hue wash) at the SAME ratio, so titles stay aligned across the grid row. -->
  {#if hasHero}
    {#if hasImage}
      <span class="hero" data-testid="folderpage-hero" aria-hidden="true">
        <img src={rich?.imageUrl} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
      </span>
    {:else}
      <span class="hero placeholder" data-testid="folderpage-hero-placeholder" aria-hidden="true">
        <span class="initial">{initial}</span>
      </span>
    {/if}
  {/if}

  <span class="head">
    <span class="favicon" aria-hidden="true">
      <Favicon src={faviconSrc} size={20} />
    </span>
    <span class="title">{title}</span>
    {#if status}
      <span class="dot {status.tone}" data-testid="folderpage-status-dot"></span>
    {:else if feed}
      <span class="dot unread" class:cleared={read} data-testid="folderpage-unread-dot"></span>
    {/if}
  </span>

  {#if rich?.excerpt}
    <span class="excerpt" data-testid="folderpage-excerpt">{rich.excerpt}</span>
  {/if}
  {#if dateLabel || rich?.meta}
    <span class="footer">
      {#if dateLabel}<time class="date" data-testid="folderpage-date">{dateLabel}</time>{/if}
      {#if rich?.meta}<span class="meta">{rich.meta}</span>{/if}
    </span>
  {/if}
</button>

<style>
  .card {
    appearance: none;
    border: 0;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    background: transparent;
    color: var(--text-2);
    border-radius: var(--r-md);
    cursor: pointer;
    text-align: left;
    transition:
      background var(--motion-fast) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard),
      box-shadow var(--motion-fast) var(--ease-standard);
  }
  .card:hover {
    background: var(--surface-2);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
  .card:active {
    transform: scale(var(--press-scale));
  }
  .card:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
  .card.active {
    background: var(--space-c-soft);
    color: var(--text);
  }

  .head {
    display: flex;
    /* Top-align so the favicon + status dot sit with the title's FIRST line when
     * the title wraps to multiple lines (titles are never truncated). */
    align-items: flex-start;
    gap: var(--space-2);
    min-width: 0;
  }

  .favicon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    /* Recessed at rest so the title leads; full strength on hover / when active. */
    opacity: 0.8;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  .card:hover .favicon,
  .card.active .favicon {
    opacity: 1;
  }

  .title {
    flex: 1;
    min-width: 0;
    /* Show the WHOLE title — wrap freely, never truncate; break only to avoid
     * overflow from an unbroken URL-ish token. */
    overflow-wrap: anywhere;
    font: var(--weight-medium) var(--text-base) / 1.3 var(--font-sans);
  }
  .card.active .title {
    font-weight: var(--weight-semibold);
  }
  /* Feed unread/read weighting mirrors the sidebar's reading treatment. */
  .card.feed:not(.read) .title {
    color: var(--text);
  }
  .card.feed.read .title {
    color: var(--text-muted);
    font-weight: var(--weight-regular);
  }
  .card.feed.read .favicon {
    opacity: 0.45;
  }

  .dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    /* Centre on the title's first line (the head is top-aligned for wrapping). */
    margin-top: calc((1.3em - 8px) / 2);
    border-radius: var(--r-pill);
    transition: opacity var(--motion-base) var(--ease-standard);
  }
  .dot.ok {
    background: var(--success);
  }
  .dot.fail {
    background: var(--danger);
  }
  .dot.warn {
    background: var(--warning);
  }
  .dot.pending {
    background: var(--info);
  }
  .dot.unread {
    background: var(--space-c);
  }
  .dot.unread.cleared {
    opacity: 0;
  }

  /* --- Richer feed content (smart-folder-page): hero, excerpt, date footer --- */
  /* A card carrying a hero reads as a magazine card: image on top, then title. */
  .card.has-hero {
    padding-top: 0;
    gap: var(--space-2);
  }
  .hero {
    display: block;
    margin: 0 calc(-1 * var(--space-3)); /* bleed to the card edges */
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: var(--r-md) var(--r-md) 0 0;
    background: var(--surface-2);
  }
  .hero img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transition: transform var(--motion-base) var(--ease-standard);
  }
  .card:hover .hero img {
    transform: scale(1.03);
  }

  /* Generated cover for a picture-less entry — the title's initial in the serif
   * over a soft Space-hue wash. Same 16/9 box as a real hero, so the grid aligns.
   * A subtle top sheen + a faint hairline keep it from reading as a flat block. */
  .hero.placeholder {
    display: grid;
    place-items: center;
    background:
      radial-gradient(120% 80% at 30% 0%, var(--space-c-soft), transparent 70%),
      linear-gradient(150deg, color-mix(in oklch, var(--space-c) 14%, var(--surface-2)), var(--surface-2));
    box-shadow: inset 0 -1px 0 color-mix(in oklch, var(--text-faint) 18%, transparent);
  }
  .hero.placeholder .initial {
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 7vw, 3.75rem);
    line-height: 1;
    color: color-mix(in oklch, var(--space-c) 55%, var(--text-faint));
    transition: transform var(--motion-base) var(--ease-standard);
  }
  .card:hover .hero.placeholder .initial {
    transform: scale(1.06);
  }

  .excerpt {
    color: var(--text-muted);
    font: var(--weight-regular) var(--text-sm) / 1.45 var(--font-sans);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card.read .excerpt {
    color: var(--text-faint);
  }

  .footer {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-faint);
    font: var(--weight-medium) var(--text-xs) / 1.2 var(--font-sans);
  }
  .date {
    white-space: nowrap;
  }
  .meta {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (prefers-reduced-motion: reduce) {
    .card,
    .favicon,
    .dot,
    .hero img,
    .hero.placeholder .initial {
      transition: none;
    }
    .card:hover,
    .card:hover .hero img,
    .card:hover .hero.placeholder .initial {
      transform: none;
    }
  }
</style>
