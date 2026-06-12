<script lang="ts">
import { reveal } from '$lib/reveal';

// A positioning beat for visitors arriving from Arc (and Arc-style extensions):
// it names the lineage and Lunma's own footing in the brand voice — no comparison
// matrix. The point-by-point answers (and the Arcify credit) live in the FAQ,
// which also feeds the FAQPage rich-results.
</script>

<section class="from-arc wrap-narrow" use:reveal>
  <p class="kicker">Coming from Arc</p>
  <h2>Arc's Spaces, in the browser you already use.</h2>
  <p class="body">
    You came here from Arc, and you want what it did with Spaces. You can have
    that without changing browsers. Lunma puts a vertical, colour-coded sidebar
    inside the Chrome or Edge you already run, with the launcher a keystroke away.
    You won't learn a new browser or make an account. It's open source, and
    everything runs on the device in front of you. One Space can be open in as
    many windows as you've got.
  </p>
</section>

<style>
  .from-arc {
    padding: 88px 24px 16px;
    text-align: center;
  }

  h2 {
    font-size: clamp(30px, 4.6vw, 46px);
    line-height: 1.1;
  }

  .body {
    max-width: 56ch;
    margin: 22px auto 0;
    font-size: var(--text-lg);
    color: var(--text-muted);
  }
</style>
