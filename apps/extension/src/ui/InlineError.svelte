<script lang="ts">
/**
 * An inline `role="alert"` error box carrying the shared danger styling — a
 * faint danger-tinted fill + hairline border + danger ink. Byte-identical across
 * the Backup & restore and Feed subscriptions cards before this primitive homed
 * it. Token-only (the danger hue is the shared `--danger` token, mixed via
 * `color-mix` so it reads on every Space hue).
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
    background: color-mix(in oklch, var(--danger) 10%, transparent);
    border: 1px solid color-mix(in oklch, var(--danger) 25%, transparent);
    font: var(--weight-regular) var(--text-sm) / 1.45 var(--font-sans);
    color: var(--danger);
  }
</style>
