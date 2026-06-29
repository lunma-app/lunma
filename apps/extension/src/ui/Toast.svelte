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

// Interruptible auto-dismiss (toast-auto-dismiss-is-interruptible): the countdown
// pauses while the pointer is over the toast OR focus is within it, and resumes
// with the time that REMAINED when paused; Escape from within dismisses now. The
// duration is therefore a NOMINAL window — engaging the toast holds it open.
let toastEl = $state<HTMLElement>();
let remaining = 0; // ms left to run (seeded from `duration` on mount)
let startedAt = 0; // Date.now() when the running segment began
let handle: ReturnType<typeof setTimeout> | undefined;
let hovered = false;
let focused = false;

function clearTimer(): void {
  if (handle !== undefined) {
    clearTimeout(handle);
    handle = undefined;
  }
}
function runTimer(): void {
  clearTimer();
  startedAt = Date.now();
  handle = setTimeout(() => onDismiss(), remaining);
}
function pauseTimer(): void {
  if (handle === undefined) return;
  clearTimer();
  remaining = Math.max(0, remaining - (Date.now() - startedAt));
}
/** Pause while engaged (hovered or focus-within), else run the remaining time. */
function sync(): void {
  if (hovered || focused) pauseTimer();
  else runTimer();
}

// Run the countdown for as long as we're mounted; clean up on unmount (parent
// removal) so a pending dismiss never fires against a gone parent. Seeding
// `remaining` here (not at declaration) keeps the reactive `duration` read inside
// the effect.
$effect(() => {
  remaining = duration;
  runTimer();
  return () => clearTimer();
});

function onPointerEnter(): void {
  hovered = true;
  sync();
}
function onPointerLeave(): void {
  hovered = false;
  sync();
}
function onFocusIn(): void {
  focused = true;
  sync();
}
function onFocusOut(e: FocusEvent): void {
  // Ignore focus moves that stay WITHIN the toast (e.g. between its controls).
  if (e.relatedTarget instanceof Node && toastEl?.contains(e.relatedTarget)) return;
  focused = false;
  sync();
}
function onKeydown(e: KeyboardEvent): void {
  // Escape while focus is within the toast dismisses it (the listener only fires
  // for keydowns bubbling from a focused descendant — i.e. focus-within).
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    onDismiss();
  }
}

function handleAction(): void {
  onAction?.();
  onDismiss();
}
</script>

<!-- A message-only toast (no action) renders no focusable child, so make the
     container itself a tab stop (+ a visible focus ring) so keyboard users can
     focus it to pause the timer and dismiss with Escape; an action toast already
     has its focusable Button, so it stays out of the tab order (TOAST-02). -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_no_noninteractive_tabindex (a focusable status toast is the intended TOAST-02 fix) -->
<div
  bind:this={toastEl}
  class="toast"
  role="status"
  aria-live="polite"
  tabindex={actionLabel ? undefined : 0}
  onpointerenter={onPointerEnter}
  onpointerleave={onPointerLeave}
  onfocusin={onFocusIn}
  onfocusout={onFocusOut}
  onkeydown={onKeydown}
>
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

  /* Visible focus ring for the keyboard-engageable message-only toast (TOAST-02). */
  .toast:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
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
