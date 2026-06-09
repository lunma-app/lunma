<script lang="ts">
import Button from './Button.svelte';

/**
 * Transient status toast (a UI primitive). Minimal by design — one toast at a
 * time, no queue/stack — it shows a short message and an optional action, then
 * auto-dismisses. The PARENT controls mount/unmount (e.g. `{#if toast}`); while
 * mounted the toast owns only its dismiss timer. Composes the `Button` primitive
 * for the action; all values come from `@lunma/tokens`.
 *
 * First consumer: the sidebar "Cleared N tabs — Undo" affordance
 * (safety-destructive-actions). A future notification system can supersede it.
 */
interface Props {
  /** The status line (e.g. "Cleared 3 tabs"). */
  message: string;
  /** Optional action label (e.g. "Undo"). When absent, no action button shows. */
  actionLabel?: string | undefined;
  /** Invoked when the action is activated (before `onDismiss`). */
  onAction?: (() => void) | undefined;
  /** Invoked when the toast auto-dismisses OR the action runs. The parent unmounts. */
  onDismiss: () => void;
  /** Auto-dismiss delay in ms. Default 5000. */
  duration?: number | undefined;
}

const { message, actionLabel, onAction, onDismiss, duration = 5000 }: Props = $props();

// Own the auto-dismiss timer for as long as we're mounted; clean it up on unmount
// (parent removal) so a pending dismiss never fires against a gone parent.
$effect(() => {
  const handle = setTimeout(() => onDismiss(), duration);
  return () => clearTimeout(handle);
});

function handleAction(): void {
  onAction?.();
  onDismiss();
}
</script>

<div class="toast" role="status" aria-live="polite">
  <span class="toast-message">{message}</span>
  {#if actionLabel}
    <Button variant="ghost" onclick={handleAction}>{actionLabel}</Button>
  {/if}
</div>

<style>
  .toast {
    position: fixed;
    bottom: var(--space-4);
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--z-overlay);

    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    max-width: calc(100% - 2 * var(--space-4));
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3);

    border: 1px solid var(--glass-border);
    border-radius: var(--r-lg);
    background: var(--glass-bg-strong);
    backdrop-filter: blur(var(--glass-blur));
    box-shadow: var(--shadow-lg), var(--glass-highlight);

    animation: toast-in var(--motion-base) var(--ease-emphasised);
  }

  .toast-message {
    font: var(--weight-medium) var(--text-sm) / 1.3 var(--font-sans);
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translate(-50%, var(--space-3));
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .toast {
      animation: none;
    }
  }
</style>
