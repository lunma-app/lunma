<script lang="ts">
// The "lunma" wordmark with the tittle-ember — the dot over a lowercase i made
// literal, glowing in the active Space's accent. Recolours when the Space demo
// re-binds --space-h.
interface Props {
  href?: string;
  /** Display size in px. */
  size?: number;
}

let { href = '#top', size = 27 }: Props = $props();
</script>

<a class="wordmark" {href} style:--wordmark-size="{size}px">
  lunma<span class="ember" aria-hidden="true"></span>
</a>

<style>
  .wordmark {
    display: inline-flex;
    align-items: baseline;
    font-family: var(--font-display);
    font-weight: var(--weight-regular);
    font-size: var(--wordmark-size);
    letter-spacing: 0.005em;
    color: var(--text);
    text-decoration: none;
  }

  .ember {
    display: inline-block;
    width: 0.26em;
    height: 0.26em;
    margin-left: 0.07em;
    border-radius: var(--r-pill);
    background: var(--accent);
    box-shadow: var(--glow-space);
    transition: background var(--motion-slow) var(--ease-emphasised);
  }
</style>
