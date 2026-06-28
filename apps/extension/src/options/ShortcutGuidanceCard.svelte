<script lang="ts">
import { onMount } from 'svelte';
import { m } from '../shared/paraglide/messages';
import { getExtensionsShortcutsUrl, modifierLabel } from '../shared/platform';
import Button from '../ui/Button.svelte';
import Icon from '../ui/Icon.svelte';

// Whether Chrome has bound the `toggle-launcher` (Alt+L) command shortcut.
// `null` while the async `chrome.commands.getAll()` check is in flight — the
// guidance card stays hidden until we actually know, so it never flashes.
let launcherShortcutBound = $state<boolean | null>(null);

/**
 * Detect whether Chrome has bound the launcher's `Alt+L` shortcut. Chrome
 * routinely leaves `suggested_key` unset, and an extension cannot bind it
 * programmatically — so when it's empty we surface guidance to bind it by hand.
 * An empty/absent `shortcut` on the `toggle-launcher` command means unbound.
 */
async function checkLauncherShortcut(): Promise<void> {
  try {
    const commands = (await chrome.commands?.getAll?.()) ?? [];
    const toggle = commands.find((c) => c.name === 'toggle-launcher');
    launcherShortcutBound = (toggle?.shortcut ?? '') !== '';
  } catch {
    // API unavailable — we can't tell, so assume bound rather than nag falsely.
    launcherShortcutBound = true;
  }
}

/** Open the host browser's keyboard-shortcuts page so the user can bind `Alt+L`
 * — the only way to set a `chrome.commands` shortcut (extensions can't do it).
 * The URL resolves to the running browser's own scheme (Edge vs Chrome). */
function openShortcutsPage(): void {
  void chrome.tabs.create({ url: getExtensionsShortcutsUrl() });
}

onMount(() => {
  void checkLauncherShortcut();
});
</script>

{#if launcherShortcutBound === false}
  <aside class="shortcut-card" data-testid="shortcut-card">
    <span class="shortcut-glyph" aria-hidden="true">
      <Icon name="keyboard" size={18} />
    </span>
    <div class="shortcut-text">
      <span class="shortcut-title" data-testid="shortcut-title">{m.options_shortcutTitle()}</span>
      <span class="shortcut-desc">
        {m.options_shortcutDescription({ modifier: modifierLabel })}
      </span>
      <div class="shortcut-action">
        <Button variant="primary" testid="shortcut-open" onclick={openShortcutsPage}>
          {m.options_openShortcuts()}
        </Button>
      </div>
    </div>
  </aside>
{/if}

<style>
  /* Unbound-shortcut guidance — calm, not alarming (guidance, not an error):
   * accent-tinted glyph, no danger/warning hues. Only rendered when the
   * shortcut is unbound, so the healthy page is unchanged. */
  .shortcut-card {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    background: var(--surface-2);
    animation: shortcut-card-in var(--motion-base) var(--ease-emphasised);
  }
  @keyframes shortcut-card-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .shortcut-glyph {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 32px;
    height: 32px;
    border-radius: var(--r-md);
    background: var(--accent-soft);
    color: var(--accent);
  }
  .shortcut-text {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .shortcut-title {
    font: var(--weight-medium) var(--text-md) / 1.2 var(--font-sans);
    color: var(--text);
  }
  .shortcut-desc {
    font: var(--weight-regular) var(--text-sm) / 1.45 var(--font-sans);
    color: var(--text-muted);
  }
  .shortcut-action {
    margin-top: var(--space-1);
  }

  /* Reduced motion: the card appears without the entrance slide (end state
   * identical), so reduced motion holds on the options page. */
  @media (prefers-reduced-motion: reduce) {
    .shortcut-card {
      animation: none;
    }
  }
</style>
