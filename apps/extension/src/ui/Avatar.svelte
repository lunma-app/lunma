<script lang="ts">
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
>{initials}</span>

<style>
  .avatar {
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
</style>
