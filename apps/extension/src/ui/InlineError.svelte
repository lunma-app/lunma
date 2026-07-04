<script lang="ts">
/**
 * An inline `role="alert"` error box carrying the shared danger styling — a
 * faint `--danger-soft` fill + hairline border + legible `--danger-text` ink.
 * Byte-identical across the Backup & restore and Feed subscriptions cards before
 * this primitive homed it. Token-only (the destructive roles are the shared
 * `--danger-soft`/`--danger-text` tokens, so the label stays AA on its own tint
 * across every Space hue).
 */
interface Props {
  /** The error message. */
  message: string;
  /** Stable `id` for the `<p>` so a consuming field can point its
   * `aria-describedby` at the error (`role="alert"` already covers the on-inject
   * announcement; this adds the persistent on-refocus association). */
  id?: string | undefined;
  /** `data-testid` passthrough. */
  testid?: string | undefined;
}

const { message, id, testid }: Props = $props();
</script>

<p class="inline-error" {id} role="alert" data-testid={testid}>{message}</p>

<style>
  .inline-error {
    margin: var(--space-3) 0 0;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--r-md);
    /* Danger label on its own danger tint: the shared `--danger-soft` wash + the
       legible `--danger-text` ink (AA over the wash), not a per-primitive
       `color-mix(--danger …)` self-tint below the text floor. */
    background: var(--danger-soft);
    border: 1px solid color-mix(in oklch, var(--danger) 25%, transparent);
    font: var(--weight-regular) var(--text-sm) / 1.45 var(--font-sans);
    color: var(--danger-text);
  }
</style>
