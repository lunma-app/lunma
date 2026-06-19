import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import ResultSourcesCard from './ResultSourcesCard.svelte';

interface ChromeMock {
  permissionsRequest: ReturnType<typeof vi.fn>;
  /** Captured `chrome.permissions.onRemoved` listeners (the live-revoke path). */
  onRemovedListeners: Array<(p: chrome.permissions.Permissions) => void>;
  /** Mutable grant state the `contains` mock reads. */
  granted: { history: boolean; bookmarks: boolean };
}

// Result sources (least-privilege-permissions D5): the card reads grant state via
// `hasApiPermission` and grants via `requestApiPermission`, and stays live via
// `onPermissionsChange` (wrapping `chrome.permissions.onAdded`/`onRemoved`).
function installChromeMock(granted: { history?: boolean; bookmarks?: boolean } = {}): ChromeMock {
  const mock: ChromeMock = {
    permissionsRequest: vi.fn(async () => true),
    onRemovedListeners: [],
    granted: { history: granted.history ?? false, bookmarks: granted.bookmarks ?? false },
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    permissions: {
      contains: vi.fn(async (q: { permissions?: string[] }) => {
        const name = q.permissions?.[0];
        if (name === 'history') return mock.granted.history;
        if (name === 'bookmarks') return mock.granted.bookmarks;
        return false;
      }),
      request: mock.permissionsRequest,
      onAdded: { addListener: vi.fn(), removeListener: vi.fn() },
      onRemoved: {
        addListener: (l: (p: chrome.permissions.Permissions) => void) =>
          mock.onRemovedListeners.push(l),
        removeListener: vi.fn(),
      },
    },
  };
  return mock;
}

let chromeMock: ChromeMock;

beforeEach(() => {
  chromeMock = installChromeMock();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ResultSourcesCard (least-privilege-permissions D5)', () => {
  test('renders an Enable control per ungranted optional source', async () => {
    const { container, getByText } = render(ResultSourcesCard, { props: {} });
    await waitFor(() =>
      expect(container.querySelector('[data-testid="result-sources-section"]')).not.toBeNull(),
    );
    expect(getByText('Result sources')).not.toBeNull();
    // Both ungranted by default → both show their Enable button, no "Enabled" pill.
    await waitFor(() => {
      const labels = [
        ...container.querySelectorAll('[data-testid="result-sources-section"] button'),
      ].map((b) => (b.textContent ?? '').trim());
      expect(labels).toEqual(['Enable history results', 'Enable bookmark results']);
    });
    expect(container.querySelector('[data-testid="result-source-history-granted"]')).toBeNull();
  });

  test('clicking Enable requests the matching permission', async () => {
    const { container } = render(ResultSourcesCard, { props: {} });
    await waitFor(() =>
      expect(container.querySelector('[data-testid="result-sources-section"]')).not.toBeNull(),
    );
    const btn = await waitFor(() => {
      const b = [
        ...container.querySelectorAll('[data-testid="result-sources-section"] button'),
      ].find((el) => (el.textContent ?? '').includes('Enable bookmark results'));
      if (!b) throw new Error('no enable button yet');
      return b as HTMLButtonElement;
    });
    await fireEvent.click(btn);
    expect(chromeMock.permissionsRequest).toHaveBeenCalledWith({ permissions: ['bookmarks'] });
  });

  test('a granted source shows an Enabled indicator, not a button', async () => {
    chromeMock = installChromeMock({ history: true });
    const { container } = render(ResultSourcesCard, { props: {} });
    await waitFor(() =>
      expect(
        container.querySelector('[data-testid="result-source-history-granted"]'),
      ).not.toBeNull(),
    );
    // History granted → no history Enable button; bookmarks still offered.
    const labels = [
      ...container.querySelectorAll('[data-testid="result-sources-section"] button'),
    ].map((b) => (b.textContent ?? '').trim());
    expect(labels).toEqual(['Enable bookmark results']);
  });

  test('a live revoke (onPermissionsChange) swaps the row back to the Enable button', async () => {
    // Start with history granted → its "Enabled" pill is shown.
    chromeMock = installChromeMock({ history: true });
    const { container } = render(ResultSourcesCard, { props: {} });
    await waitFor(() =>
      expect(
        container.querySelector('[data-testid="result-source-history-granted"]'),
      ).not.toBeNull(),
    );

    // Revoke history in Chrome's own UI: flip `contains` + fire the captured
    // `onRemoved` listener (the path `onPermissionsChange` observes).
    chromeMock.granted.history = false;
    expect(chromeMock.onRemovedListeners.length).toBeGreaterThan(0);
    for (const listener of chromeMock.onRemovedListeners) {
      listener({ permissions: ['history'] });
    }

    // The row swaps back to the Enable button without a reload.
    await waitFor(() => {
      expect(container.querySelector('[data-testid="result-source-history-granted"]')).toBeNull();
      const labels = [
        ...container.querySelectorAll('[data-testid="result-sources-section"] button'),
      ].map((b) => (b.textContent ?? '').trim());
      expect(labels).toContain('Enable history results');
    });
  });
});
