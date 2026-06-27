<script lang="ts">
import { Dialog } from 'bits-ui';
import type { Snippet } from 'svelte';

interface Props {
  /** Open state. The host owns it (controlled): flip it to drive the sheet. */
  open: boolean;
  /** Instrument Serif header text. When set, also renders the close ✕ row.
   * The explicit `| undefined` mirrors the repo's primitives under
   * `exactOptionalPropertyTypes`: a host may forward a structurally-undefined
   * `title` (e.g. a `$state` that hasn't been set), which falls through to
   * "no header". */
  title?: string | undefined;
  /** Called for every dismissal path — scrim click, the ✕, Escape, and a
   * focus-leave outside the sheet. The host sets `open = false` in response;
   * we do NOT mutate `open` ourselves (it is not `$bindable`), so dismissal is
   * a single intent the host fully controls. */
  onClose: () => void;
  /** Sheet body. */
  children: Snippet;
  /** `data-testid` passthrough on the sheet panel. */
  testid?: string | undefined;
  /** When set (a CSS selector), the sheet portals INTO that element instead of
   * rendering inline. The sidebar passes its root panel so a sheet opened from
   * anywhere in the tree — a deep lens row, the bottom space bar — anchors to the
   * FULL panel and slides from the very bottom, giving identical coverage no
   * matter the trigger depth. Omit to keep the portal inline (the overlay then
   * anchors to the nearest positioned ancestor). */
  portalTo?: string | undefined;
}

const { open, title, onClose, children, testid, portalTo }: Props = $props();

// Resolve `portalTo` to a live element only while open. bits-ui's Portal THROWS
// if a `to` selector matches nothing, so we query it ourselves and fall back to
// an inline portal (`disabled`) when the target is absent — which is the case in
// isolated component tests (no `.sidebar` ancestor) and before the panel mounts.
// Keyed on `open` so the lookup runs when the sheet opens, by which point the
// sidebar root is always in the DOM.
const portalTarget = $derived(
  open && portalTo ? document.querySelector<HTMLElement>(portalTo) : null,
);

// bits-ui `Dialog.Root` is controlled here: we pass `open` straight through and
// translate every close into the host's `onClose`. We never feed our own state
// back into `open`, so opening is purely host-driven and there is no second
// source of truth to desync.
function onOpenChange(next: boolean): void {
  if (!next) onClose();
}
</script>

<Dialog.Root {open} {onOpenChange}>
  <!-- The overlay/sheet are `position:absolute;inset:0`, so they anchor to a
       positioned ancestor, NOT the viewport (a body portal would scope the modal
       to the whole window, which the comp does not want). When `portalTo` is set
       the sheet portals INTO that element (the sidebar root panel) so coverage is
       identical regardless of trigger depth; otherwise the portal stays inline
       (`disabled`) and anchors to the nearest positioned ancestor. -->
  <Dialog.Portal {...(portalTarget ? { to: portalTarget } : {})} disabled={portalTarget === null}>
    <!-- bits owns the focus scope (trap + loop), Escape + interact-outside
         dismissal, return-focus to the trigger on close (onCloseAutoFocus), and
         the role="dialog"/aria-modal/aria-labelledby wiring — spread onto our
         own panel via the `child` snippet so we keep full control of layout.
         `preventScroll={false}`: this is an in-PANEL sheet, locking body scroll
         would be wrong. `data-state` (open/closed) drives the entrance below. -->
    <Dialog.Content preventScroll={false}>
      {#snippet child({ props, open: contentOpen })}
        {#if contentOpen}
          <div class="bottom-sheet-overlay">
            <!-- Scrim: a real button so it's keyboard-reachable and announced.
                 Lives inside the focus scope, so its click is an "inside"
                 interaction → wire dismissal directly rather than relying on
                 interact-outside. -->
            <button
              type="button"
              class="bottom-sheet-scrim"
              aria-label="Close"
              onclick={onClose}
            ></button>
            <div {...props} class="bottom-sheet" data-testid={testid}>
              {#if title}
                <div class="bottom-sheet-header">
                  <Dialog.Title class="bottom-sheet-title">{title}</Dialog.Title>
                  <button
                    type="button"
                    class="bottom-sheet-close"
                    aria-label="Close"
                    onclick={onClose}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.2"
                      stroke-linecap="round"
                      aria-hidden="true"
                    >
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
              {/if}
              {@render children()}
            </div>
          </div>
        {/if}
      {/snippet}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  /* Scoped to the sidebar panel (nearest positioned ancestor), not the viewport:
     the host mounts this inside a `position:relative` sidebar shell. */
  .bottom-sheet-overlay {
    position: absolute;
    inset: 0;
    z-index: var(--z-overlay);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .bottom-sheet-scrim {
    position: absolute;
    inset: 0;
    border: none;
    background: oklch(0 0 0 / 0.5);
    -webkit-backdrop-filter: blur(2px);
    backdrop-filter: blur(2px);
    cursor: pointer;
  }

  .bottom-sheet {
    position: relative;
    border-top-left-radius: var(--r-2xl);
    border-top-right-radius: var(--r-2xl);
    background: var(--bg-elev);
    border-top: 1px solid var(--border);
    /* Upward-cast pop shadow, matching the comp's `0 -18px 50px` — the token
       shadow family casts downward, so this one inverted offset is local. */
    box-shadow: 0 -18px 50px oklch(0 0 0 / 0.55);
    padding: var(--space-4) var(--space-4) var(--space-5);
    /* `--z-overlay` lives on the overlay; the sheet sits above its own scrim. */
    animation: bottom-sheet-pop var(--motion-base) var(--ease-standard);
  }

  .bottom-sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }

  /* `:global` — `Dialog.Title` renders its own element, so the class is applied
     by bits, not our scoped template; the selector must be global to reach it. */
  .bottom-sheet :global(.bottom-sheet-title) {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    line-height: 1.1;
    color: var(--text);
  }

  .bottom-sheet-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: var(--r-sm);
    background: var(--surface-2);
    color: var(--text-muted);
    cursor: pointer;
  }
  .bottom-sheet-close:hover {
    background: var(--surface-3);
    color: var(--text);
  }

  /* Slide-up + slight fade entrance. The fade floor is 0.4 (not 0) so a frozen
     animation — reduced-motion, or a tab backgrounded mid-animation — never
     leaves the sheet invisible. The guard below removes it entirely anyway. */
  @keyframes bottom-sheet-pop {
    from {
      transform: translateY(14px);
      opacity: 0.4;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bottom-sheet {
      animation: none;
    }
  }
</style>
