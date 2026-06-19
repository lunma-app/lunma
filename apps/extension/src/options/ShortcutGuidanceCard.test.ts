import { render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getExtensionsShortcutsUrl } from '../shared/platform';
import ShortcutGuidanceCard from './ShortcutGuidanceCard.svelte';

interface ChromeMock {
  getAll: ReturnType<typeof vi.fn>;
  tabsCreate: ReturnType<typeof vi.fn>;
}

// `launcherShortcut` controls what `chrome.commands.getAll()` reports for the
// `toggle-launcher` command — '' means unbound (the guidance card shows).
function installChromeMock(launcherShortcut = 'Alt+L'): ChromeMock {
  const getAll = vi.fn(async () => [
    { name: 'pin-active-tab', shortcut: 'Alt+D' },
    { name: 'toggle-launcher', shortcut: launcherShortcut },
  ]);
  const tabsCreate = vi.fn(async () => ({}));
  (globalThis as unknown as { chrome: unknown }).chrome = {
    commands: { getAll },
    tabs: { create: tabsCreate },
  };
  return { getAll, tabsCreate };
}

beforeEach(() => {
  installChromeMock();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ShortcutGuidanceCard (launcher shortcut guidance)', () => {
  test('shows the guidance card when the toggle-launcher shortcut is empty', async () => {
    installChromeMock('');
    const { container } = render(ShortcutGuidanceCard, { props: {} });
    await waitFor(() => {
      expect(container.querySelector('[data-testid="shortcut-card"]')).not.toBeNull();
    });
    expect(container.querySelector('[data-testid="shortcut-title"]')?.textContent).toContain(
      'Set the launcher shortcut',
    );
  });

  test('hides the guidance card when the shortcut is bound', async () => {
    const mock = installChromeMock('Alt+L');
    const { container } = render(ShortcutGuidanceCard, { props: {} });
    await waitFor(() => expect(mock.getAll).toHaveBeenCalled());
    await mock.getAll.mock.results[0]?.value; // let the resolved check assign
    await tick(); // flush the reactive `{#if}`
    expect(container.querySelector('[data-testid="shortcut-card"]')).toBeNull();
  });

  test('the guidance button opens the host browser shortcuts page (default Chrome)', async () => {
    const mock = installChromeMock('');
    const { container } = render(ShortcutGuidanceCard, { props: {} });
    await waitFor(() => {
      expect(container.querySelector('[data-testid="shortcut-open"]')).not.toBeNull();
    });
    (container.querySelector('[data-testid="shortcut-open"]') as HTMLButtonElement).click();
    // Default (non-Edge) host resolves to the chrome:// scheme.
    expect(getExtensionsShortcutsUrl()).toBe('chrome://extensions/shortcuts');
    expect(mock.tabsCreate).toHaveBeenCalledWith({ url: getExtensionsShortcutsUrl() });
  });

  test('on Edge the guidance button opens the edge shortcuts page', async () => {
    const original = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: `${original} Edg/120.0.0.0`,
      configurable: true,
    });
    try {
      const mock = installChromeMock('');
      const { container } = render(ShortcutGuidanceCard, { props: {} });
      await waitFor(() => {
        expect(container.querySelector('[data-testid="shortcut-open"]')).not.toBeNull();
      });
      (container.querySelector('[data-testid="shortcut-open"]') as HTMLButtonElement).click();
      expect(mock.tabsCreate).toHaveBeenCalledWith({ url: 'edge://extensions/shortcuts' });
    } finally {
      Object.defineProperty(navigator, 'userAgent', { value: original, configurable: true });
    }
  });
});
