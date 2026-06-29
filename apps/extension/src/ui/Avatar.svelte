<script lang="ts">
import Icon from './Icon.svelte';

// Avatar (review-lens, D8): an initials disc with an optional verdict/status
// ring. A cross-surface primitive — the Review Queue row's author disc and the
// ReviewerRail's reviewer discs both compose it, so the disc never drifts. Reads
// tokens only (visual-system token-consumption requirement).
interface Props {
  /** 1–2 character initials shown in the disc. */
  initials: string;
  /** Disc geometry. `sm` for the reviewer rail, `md` for the row author. */
  size?: 'sm' | 'md' | undefined;
  /** Optional verdict/status ring tint: `approved` → `--success`, `changes` →
   * `--danger`, `pending` → `--text-dim`, `none` (default) → no ring. */
  ring?: 'approved' | 'changes' | 'pending' | 'none' | undefined;
  /** Tooltip / accessible label (the person's name). When set the disc is a
   * labelled `img`; otherwise it is decorative (the name shows in text nearby). */
  title?: string | undefined;
  /** `data-testid` for the disc. Default `'avatar'`. */
  testid?: string | undefined;
}

const { initials, size = 'md', ring = 'none', title, testid = 'avatar' }: Props = $props();

// Non-colour verdict cue (AVATAR-01): a small corner glyph per ring state so the
// verdict is shape + colour, not hue alone (the approved/changes pair is the
// classic red/green confusion case). Reuses the same lucide glyphs ReviewerRail
// maps to these states — no new icon, no `gen:icons` regen. The badge is
// decorative (the verdict reaches AT via `title`/adjacent text), so `aria-hidden`.
const RING_ICON: Record<'approved' | 'changes' | 'pending', string> = {
  approved: 'check',
  changes: 'circle-alert',
  pending: 'clock',
};
const ringIcon = $derived(ring !== 'none' ? RING_ICON[ring] : undefined);
const badgeIconSize = $derived(size === 'sm' ? 8 : 10);
</script>

<span
  class="avatar"
  data-size={size}
  data-ring={ring}
  data-testid={testid}
  title={title}
  role={title !== undefined ? 'img' : undefined}
  aria-label={title}
  aria-hidden={title === undefined ? 'true' : undefined}
><!-- initials kept whitespace-tight so textContent is exactly the initials; the
     badge is decorative (aria-hidden) and absolutely positioned -->{initials}{#if ringIcon !== undefined}<span
    class="verdict-badge"
    data-verdict={ring}
    aria-hidden="true"><Icon name={ringIcon} size={badgeIconSize} /></span>{/if}</span>

<style>
  .avatar {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border-radius: var(--r-pill);
    background: var(--surface-3);
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-weight: var(--weight-semibold);
    line-height: 1;
    text-transform: uppercase;
    user-select: none;
  }

  .avatar[data-size='sm'] {
    width: 20px;
    height: 20px;
    font-size: var(--text-2xs);
  }
  .avatar[data-size='md'] {
    width: 26px;
    height: 26px;
    font-size: var(--text-xs);
  }

  /* Verdict/status ring — an outer halo so the initials never clip. */
  .avatar[data-ring='approved'] {
    box-shadow: 0 0 0 2px var(--success);
  }
  .avatar[data-ring='changes'] {
    box-shadow: 0 0 0 2px var(--danger);
  }
  .avatar[data-ring='pending'] {
    box-shadow: 0 0 0 2px var(--text-dim);
  }

  /* Non-colour verdict cue (AVATAR-01): a corner badge whose glyph SHAPE
   * (✓ / ! / ◷) plus the ring colour together convey the verdict, so it never
   * rests on hue alone. The badge sits on the disc's own surface with a thin ring
   * so it reads as a distinct token; the glyph inherits the per-state colour. */
  .verdict-badge {
    position: absolute;
    right: -2px;
    bottom: -2px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-pill);
    background: var(--surface);
    box-shadow: 0 0 0 1px var(--surface-3);
  }
  .avatar[data-size='sm'] .verdict-badge {
    width: 11px;
    height: 11px;
  }
  .avatar[data-size='md'] .verdict-badge {
    width: 14px;
    height: 14px;
  }
  .verdict-badge[data-verdict='approved'] {
    color: var(--success);
  }
  .verdict-badge[data-verdict='changes'] {
    color: var(--danger);
  }
  .verdict-badge[data-verdict='pending'] {
    color: var(--text-dim);
  }
</style>
