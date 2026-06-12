<script lang="ts">
import { GITHUB_URL } from '$lib/links';
import { reveal } from '$lib/reveal';
</script>

<section class="trust wrap" id="trust" use:reveal>
  <div class="head">
    <p class="kicker">Privacy</p>
    <h2>Your data stays put, and the code is public.</h2>
  </div>
  <div class="cells">
    <div class="cell lunma-glass">
      <span class="cell-mark" aria-hidden="true">⌂</span>
      <h3>Your data stays on your device</h3>
      <p>
        Your Spaces, favourites, pinned tabs, and settings sit in your browser's
        local extension storage, on this device only. There's no Lunma account
        and no Lunma server behind them.
      </p>
    </div>
    <div class="cell lunma-glass">
      <span class="cell-mark" aria-hidden="true">{'<>'}</span>
      <h3>Open source</h3>
      <p>
        The full source is
        <a href={GITHUB_URL} target="_blank" rel="noopener">public</a> and
        Apache-2.0 licensed, and we build it in the open. Read exactly what it
        does, and the permissions it asks for, before you install.
      </p>
    </div>
    <div class="cell lunma-glass">
      <span class="cell-mark" aria-hidden="true">⊘</span>
      <h3>Nothing is sent anywhere</h3>
      <p>
        Fonts and code ship inside the extension. Lunma makes no network calls of
        its own and no analytics calls. Unplug the network and it works exactly
        the same.
      </p>
    </div>
  </div>
</section>

<style>
  .trust {
    padding: 96px 24px;
  }

  .head {
    text-align: center;
    margin-bottom: 48px;
  }

  h2 {
    max-width: 21ch;
    margin: 0 auto;
    font-size: var(--text-2xl);
    line-height: 1.12;
  }

  .cells {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }

  .cell {
    display: flex;
    flex-direction: column;
    padding: 28px 24px;
  }

  .cell-mark {
    display: inline-grid;
    place-items: center;
    width: 38px;
    height: 38px;
    margin-bottom: 18px;
    border-radius: var(--r-md);
    background: var(--accent-soft);
    color: var(--accent-text);
    font-family: var(--font-mono);
    font-size: var(--text-md);
  }

  .cell h3 {
    margin-bottom: 8px;
    font-family: var(--font-sans);
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    line-height: 1.3;
  }

  .cell p {
    font-size: var(--text-md);
    color: var(--text-muted);
  }

  .cell a {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  @media (max-width: 800px) {
    .cells {
      grid-template-columns: 1fr;
    }
  }
</style>
