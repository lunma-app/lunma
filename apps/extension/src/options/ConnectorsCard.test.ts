import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import ConnectorsCard from './ConnectorsCard.svelte';

interface ChromeMock {
  /** chrome.storage.local backing record (the `lunma.connectors` token map). */
  localData: Record<string, unknown>;
}

function installChromeMock(): ChromeMock {
  const mock: ChromeMock = { localData: {} };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      local: {
        get: vi.fn(async (key: string) => {
          const value = mock.localData[key];
          return value === undefined ? {} : { [key]: value };
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(mock.localData, items);
        }),
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

describe('ConnectorsCard (smart-folders, design D10)', () => {
  const hostInput = (c: HTMLElement): HTMLInputElement =>
    c.querySelector('[data-testid="connector-host-input"]') as HTMLInputElement;
  const tokenInput = (c: HTMLElement): HTMLInputElement =>
    c.querySelector('[data-testid="connector-token-input"]') as HTMLInputElement;
  const buttonByText = (c: HTMLElement, text: string): HTMLButtonElement =>
    [...c.querySelectorAll('button')].find((b) =>
      (b.textContent ?? '').includes(text),
    ) as HTMLButtonElement;

  test('the intro copy covers both sources (github-connector: card reused, copy widened)', () => {
    const { container } = render(ConnectorsCard, { props: {} });
    const intro = (
      container.querySelector('[data-testid="connectors-section"] p')?.textContent ?? ''
    ).replace(/\s+/g, ' ');
    expect(intro).toContain('GitLab folders ride your browser');
    expect(intro).toContain('GitHub folders always need a token');
  });

  test('adds a host + token via setConnectorToken (password-type input, cleared after add)', async () => {
    const { container } = render(ConnectorsCard, { props: {} });
    expect(tokenInput(container).type).toBe('password');

    await fireEvent.input(hostInput(container), { target: { value: 'gitlab.example.com' } });
    await fireEvent.input(tokenInput(container), { target: { value: 'glpat-secret-1' } });
    await fireEvent.click(buttonByText(container, 'Add token'));

    await waitFor(() => {
      expect(chromeMock.localData['lunma.connectors']).toEqual({
        'gitlab.example.com': 'glpat-secret-1',
      });
      // The row appears with the token-set indicator; the form is cleared.
      expect(container.querySelector('[data-testid="connector-row"]')?.textContent).toContain(
        'gitlab.example.com',
      );
      expect(container.querySelector('[data-testid="connector-token-set"]')).not.toBeNull();
      expect(tokenInput(container).value).toBe('');
    });
  });

  test('a pasted instance URL collapses to its host (the PAT lookup key)', async () => {
    const { container } = render(ConnectorsCard, { props: {} });
    await fireEvent.input(hostInput(container), {
      target: { value: 'https://gitlab.example.com:8443/group' },
    });
    await fireEvent.input(tokenInput(container), { target: { value: 'glpat-port' } });
    await fireEvent.click(buttonByText(container, 'Add token'));
    await waitFor(() => {
      expect(chromeMock.localData['lunma.connectors']).toEqual({
        'gitlab.example.com:8443': 'glpat-port',
      });
    });
  });

  test('a stored token is NEVER echoed into the DOM — only the replace affordance', async () => {
    chromeMock.localData['lunma.connectors'] = { 'gitlab.example.com': 'glpat-super-secret' };
    const { container } = render(ConnectorsCard, { props: {} });

    await waitFor(() => {
      expect(container.querySelector('[data-testid="connector-row"]')).not.toBeNull();
    });
    expect(container.innerHTML).not.toContain('glpat-super-secret');
    expect(buttonByText(container, 'Token set — replace?')).toBeTruthy();
    for (const input of container.querySelectorAll('input')) {
      expect((input as HTMLInputElement).value).not.toBe('glpat-super-secret');
    }
  });

  test('replace opens a password field and writes the new token for that host', async () => {
    chromeMock.localData['lunma.connectors'] = { 'gitlab.example.com': 'glpat-old' };
    const { container } = render(ConnectorsCard, { props: {} });
    await waitFor(() => {
      expect(buttonByText(container, 'Token set — replace?')).toBeTruthy();
    });

    await fireEvent.click(buttonByText(container, 'Token set — replace?'));
    const replaceInput = container.querySelector(
      '[data-testid="connector-replace-input"]',
    ) as HTMLInputElement;
    expect(replaceInput.type).toBe('password');
    expect(replaceInput.value).toBe(''); // never seeded with the stored value

    await fireEvent.input(replaceInput, { target: { value: 'glpat-new' } });
    await fireEvent.click(buttonByText(container, 'Save'));
    await waitFor(() => {
      expect(chromeMock.localData['lunma.connectors']).toEqual({
        'gitlab.example.com': 'glpat-new',
      });
      // The inline replace field is gone again.
      expect(container.querySelector('[data-testid="connector-replace-input"]')).toBeNull();
    });
  });

  test('opening replace moves focus to the password field; cancel restores the trigger', async () => {
    chromeMock.localData['lunma.connectors'] = { 'gitlab.example.com': 'glpat-old' };
    const { container } = render(ConnectorsCard, { props: {} });
    await waitFor(() => {
      expect(buttonByText(container, 'Token set — replace?')).toBeTruthy();
    });

    await fireEvent.click(buttonByText(container, 'Token set — replace?'));
    // Open → focus lands on the inline password field.
    await waitFor(() => {
      const input = container.querySelector(
        '[data-testid="connector-replace-input"]',
      ) as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(document.activeElement).toBe(input);
    });

    // Cancel → focus returns to that row's "Token set — replace?" trigger.
    await fireEvent.click(buttonByText(container, 'Cancel'));
    await waitFor(() => {
      const trigger = container.querySelector(
        '[data-testid="connector-replace-trigger"]',
      ) as HTMLButtonElement;
      expect(trigger).not.toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });

  test('remove clears the host token and drops its row', async () => {
    chromeMock.localData['lunma.connectors'] = {
      'gitlab.example.com': 'glpat-a',
      'gitlab.com': 'glpat-b',
    };
    const { container } = render(ConnectorsCard, { props: {} });
    await waitFor(() => {
      expect(container.querySelectorAll('[data-testid="connector-row"]')).toHaveLength(2);
    });

    // Rows sort by host: gitlab.com first, gitlab.example.com second.
    const firstRow = container.querySelector('[data-testid="connector-row"]') as HTMLElement;
    expect(firstRow.textContent).toContain('gitlab.com');
    await fireEvent.click(
      [...firstRow.querySelectorAll('button')].find((b) =>
        (b.textContent ?? '').includes('Remove'),
      ) as HTMLButtonElement,
    );

    await waitFor(() => {
      expect(chromeMock.localData['lunma.connectors']).toEqual({
        'gitlab.example.com': 'glpat-a',
      });
      expect(container.querySelectorAll('[data-testid="connector-row"]')).toHaveLength(1);
    });
  });
});
