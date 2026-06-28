<script lang="ts">
import { m } from '../shared/paraglide/messages';
import Button from '../ui/Button.svelte';
import Icon from '../ui/Icon.svelte';

/**
 * One-time, dismissible first-run notice that discloses auto-archive BEFORE it can
 * act (auto-archive). Informational, not a warning — restyled to a calm, COMPACT
 * notice (sidebar-firstrun-options-polish D4): a leading icon + a short body that
 * still carries all three spec-mandated facts (idle archival, the live threshold,
 * the 7-day retention window) + inline "Got it" / "Manage in settings" text actions,
 * on a quiet `--surface` fill with no border/shadow emphasis. "Got it" is the
 * dismiss action the spec mandates; the redundant corner ✕ is dropped. Semantics,
 * gating, facts, and dismissal persistence are unchanged — only the visual weight.
 * The host (`App.svelte`) owns the gating (`autoArchiveEnabled && !dismissed`) and
 * persists the dismissal; this component is pure disclosure + two callbacks.
 */
interface Props {
  /** Live global idle threshold, for the truthful threshold copy. */
  autoArchiveIdleMinutes: number;
  /** Dismiss the notice (the host persists `autoArchiveNoticeDismissed`). */
  onDismiss: () => void;
  /** Open the options page to the Auto-archive settings group. */
  onManage: () => void;
}

const { autoArchiveIdleMinutes, onDismiss, onManage }: Props = $props();

/** Format the idle threshold as a plain-language phrase (e.g. 720 → "12 hours",
 * 30 → "30 minutes", 1440 → "1 day"). Derived at render time from the live
 * `autoArchiveIdleMinutes` so the copy stays truthful if the default changes
 * (design risk note). */
function formatIdleThreshold(minutes: number): string {
  const m = Math.max(1, Math.floor(minutes));
  const unit = (n: number, label: string): string => `${n} ${label}${n === 1 ? '' : 's'}`;
  if (m % 1440 === 0) return unit(m / 1440, 'day');
  if (m % 60 === 0) return unit(m / 60, 'hour');
  if (m < 60) return unit(m, 'minute');
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${unit(h, 'hour')} ${unit(rem, 'minute')}`;
}

const threshold = $derived(formatIdleThreshold(autoArchiveIdleMinutes));
</script>

<div class="first-run-notice" data-testid="first-run-notice">
  <div class="notice">
    <span class="notice-icon" aria-hidden="true">
      <Icon name="archive" size={15} />
    </span>
    <div class="notice-main">
      <p class="notice-text">
        <span class="notice-lead">{m.sidebar_autoArchiveIsOn()}</span>
        {m.sidebar_autoArchiveExplain({ threshold })}
      </p>
      <div class="notice-actions">
        <Button variant="secondary" onclick={onDismiss}>{m.sidebar_autoArchiveDismiss()}</Button>
        <Button variant="ghost" onclick={onManage}>{m.sidebar_autoArchiveManage()}</Button>
      </div>
    </div>
  </div>
</div>

<style>
  /* The notice fades + rises in on first appearance (150–250ms via --motion-base,
   * --ease-emphasised). Reduced motion drops the animation entirely (it just
   * appears). All values are tokens — no hard-coded colour, radius, or timing. */
  .first-run-notice {
    margin: var(--space-2) var(--list-pad) 0;
    animation: notice-in var(--motion-base) var(--ease-emphasised);
  }

  /* Compact notice (D4): a quiet `--surface` row with a leading icon — no glass
   * card, no border, no shadow. Reads as a footnote, not a panel. */
  .notice {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3);
    border-radius: var(--r-md);
    background: var(--surface);
  }

  /* Leading icon plate — a soft Space-tinted square, the visual anchor that keeps
   * the notice recognisable at a glance. */
  .notice-icon {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--favicon-tile) / 2);
    height: calc(var(--favicon-tile) / 2);
    border-radius: var(--r-md);
    background: var(--space-c-soft);
    color: var(--space-c);
  }

  .notice-main {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: var(--space-2);
  }

  .notice-text {
    margin: 0;
    color: var(--text-muted);
    font: var(--weight-regular) var(--text-sm) / 1.45 var(--font-sans);
  }
  /* The lead clause carries the on/off disclosure at full strength; the rest (the
   * facts) stays muted. Neutral colour — informational, never destructive. */
  .notice-lead {
    color: var(--text);
    font-weight: var(--weight-medium);
  }

  /* Inline text actions — "Got it" (the dismiss) leads, "Manage in settings" trails. */
  .notice-actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--space-2);
  }

  @keyframes notice-in {
    from {
      opacity: 0;
      transform: translateY(var(--space-2));
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .first-run-notice {
      animation: none;
    }
  }
</style>
