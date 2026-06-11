<script lang="ts">
import type { IconName } from '../shared/types';
import Button from '../ui/Button.svelte';
import Icon from '../ui/Icon.svelte';
import IconButton from '../ui/IconButton.svelte';
import Stack from '../ui/Stack.svelte';
import Surface from '../ui/Surface.svelte';

/**
 * One-time, dismissible first-run notice that discloses auto-archive BEFORE it can
 * act (auto-archive). Informational, not a warning — a calm branded heads-up on a
 * frosted `Surface`, composed entirely from `ui/` primitives (no new primitive).
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
  <Surface variant="glass" radius="lg" glow>
    <div class="notice-body">
      <IconButton
        icon={'x' as IconName}
        ariaLabel="Dismiss"
        title="Dismiss"
        size={14}
        onclick={onDismiss}
        testid="first-run-dismiss"
      />
      <Stack gap="2">
        <span class="notice-title">
          <Icon name="archive" size={15} />
          Auto-archive is on
        </span>
        <p class="notice-text">
          Temporary tabs left idle for {threshold} are archived automatically so your
          workspace stays tidy. Archived tabs remain restorable for 7 days.
        </p>
        <Stack direction="row" gap="2" align="center">
          <Button variant="secondary" onclick={onDismiss}>Got it</Button>
          <Button variant="ghost" onclick={onManage}>Manage in settings</Button>
        </Stack>
      </Stack>
    </div>
  </Surface>
</div>

<style>
  /* The notice fades + rises in on first appearance (150–250ms via --motion-base,
   * --ease-emphasised). Reduced motion drops the animation entirely (it just
   * appears). All values are tokens — no hard-coded colour, radius, or timing. */
  .first-run-notice {
    margin: var(--space-2) var(--list-pad) 0;
    animation: notice-in var(--motion-base) var(--ease-emphasised);
  }

  .notice-body {
    position: relative;
    padding: var(--space-3);
  }

  .notice-title {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    /* Neutral text on glass — informational, never destructive colour. */
    color: var(--text);
    font: var(--weight-semibold) var(--text-md) / 1.2 var(--font-sans);
  }

  .notice-text {
    margin: 0;
    /* Leave room for the corner dismiss button so the copy never runs under it. */
    padding-right: var(--space-4);
    color: var(--text-muted);
    font: var(--weight-regular) var(--text-sm) / 1.45 var(--font-sans);
  }

  /* The dismiss IconButton sits in the top-right corner (the quick keyboard/mouse
   * dismiss path); the Stack holds the title/body/actions below it. */
  .notice-body :global(.icon-btn) {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
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
