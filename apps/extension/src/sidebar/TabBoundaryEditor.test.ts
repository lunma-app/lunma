import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { TabBoundary } from '../shared/types';
import Harness from './TabBoundaryEditor.test.harness.svelte';

interface ChromeMock {
  sendMessage: ReturnType<typeof vi.fn>;
  openOptionsPage: ReturnType<typeof vi.fn>;
}

function installChrome(): ChromeMock {
  const mock: ChromeMock = {
    sendMessage: vi.fn(async () => undefined),
    openOptionsPage: vi.fn(),
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      sendMessage: mock.sendMessage,
      openOptionsPage: mock.openOptionsPage,
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  };
  return mock;
}

let chromeMock: ChromeMock;

beforeEach(() => {
  chromeMock = installChrome();
});

afterEach(() => {
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
  vi.restoreAllMocks();
});

/** The `setTabBoundary` payloads dispatched over the bus, newest last. */
function boundaryPayloads(): Array<{ savedTabId: string; boundary: TabBoundary | null }> {
  return chromeMock.sendMessage.mock.calls
    .map((call) => (call[0] as { cmd?: { kind: string; payload: unknown } }).cmd)
    .filter((cmd) => cmd?.kind === 'setTabBoundary')
    .map(
      (cmd) => (cmd as { payload: { savedTabId: string; boundary: TabBoundary | null } }).payload,
    );
}

function lastBoundary(): TabBoundary | null {
  const payloads = boundaryPayloads();
  return payloads[payloads.length - 1]?.boundary ?? null;
}

describe('TabBoundaryEditor', () => {
  test('inherit mode shows a caption reflecting an off global default', () => {
    const { getByTestId } = render(Harness, {
      props: { boundary: undefined, globalDefault: 'off' },
    });
    expect(getByTestId('boundary-inherit-caption').textContent).toContain('off');
  });

  test('inherit mode reflects a domain global default', () => {
    const { getByTestId } = render(Harness, {
      props: { boundary: undefined, globalDefault: 'domain' },
    });
    expect(getByTestId('boundary-inherit-caption').textContent).toContain('locked');
  });

  test('inherit mode reflects a page global default', () => {
    const { getByTestId } = render(Harness, {
      props: { boundary: undefined, globalDefault: 'page' },
    });
    expect(getByTestId('boundary-inherit-caption').textContent).toContain('page');
  });

  test('the Settings link opens the options page from Default mode', async () => {
    const { getByTestId } = render(Harness, { props: { boundary: undefined } });
    await fireEvent.click(getByTestId('boundary-options-link'));
    expect(chromeMock.openOptionsPage).toHaveBeenCalledTimes(1);
  });

  test('selecting Off dispatches an explicit off boundary', async () => {
    const { container } = render(Harness, { props: { boundary: undefined } });
    const off = container.querySelector('input[value="off"]') as HTMLInputElement;
    await fireEvent.click(off);
    expect(lastBoundary()).toEqual({ mode: 'off' });
  });

  test('selecting Locked from inherit seeds the current view (page glob)', async () => {
    const { container } = render(Harness, {
      props: { boundary: undefined, originalURL: 'https://gitlab.com/dashboard/merge_requests' },
    });
    const locked = container.querySelector('input[value="locked"]') as HTMLInputElement;
    await fireEvent.click(locked);
    expect(lastBoundary()).toEqual({
      mode: 'locked',
      allow: ['https://gitlab.com/dashboard/merge_requests*'],
    });
  });

  test('a non-http(s) home seeds an empty allow list when switching to Locked', async () => {
    const { container } = render(Harness, {
      props: { boundary: undefined, originalURL: 'chrome://newtab' },
    });
    const locked = container.querySelector('input[value="locked"]') as HTMLInputElement;
    await fireEvent.click(locked);
    expect(lastBoundary()).toEqual({ mode: 'locked', allow: [] });
  });

  test('selecting Inherit dispatches null (back to inherit)', async () => {
    const { container } = render(Harness, { props: { boundary: { mode: 'off' } } });
    const inherit = container.querySelector('input[value="inherit"]') as HTMLInputElement;
    await fireEvent.click(inherit);
    expect(lastBoundary()).toBeNull();
  });

  test('adding a bare host is still accepted (means the whole host)', async () => {
    const { container } = render(Harness, {
      props: { boundary: { mode: 'locked', allow: ['google.com'] } },
    });
    const input = container.querySelector(
      '[data-testid="boundary-pattern-input"]',
    ) as HTMLInputElement;
    await fireEvent.input(input, { target: { value: '*.example.com' } });
    const add = container.querySelector('button.btn') as HTMLButtonElement;
    expect(add.disabled).toBe(false);
    await fireEvent.click(add);
    expect(lastBoundary()).toEqual({ mode: 'locked', allow: ['google.com', '*.example.com'] });
  });

  test('adding a URL pattern dispatches the updated allow list (path case preserved)', async () => {
    const { container } = render(Harness, {
      props: { boundary: { mode: 'locked', allow: [] } },
    });
    const input = container.querySelector(
      '[data-testid="boundary-pattern-input"]',
    ) as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'https://example.com/Inbox*' } });
    const add = container.querySelector('button.btn') as HTMLButtonElement;
    expect(add.disabled).toBe(false);
    await fireEvent.click(add);
    // Host lower-cased, path case preserved (path matching is case-sensitive).
    expect(lastBoundary()).toEqual({ mode: 'locked', allow: ['https://example.com/Inbox*'] });
  });

  test('an invalid entry tints the field and is not added', async () => {
    const { container } = render(Harness, {
      props: { boundary: { mode: 'locked', allow: [] } },
    });
    const input = container.querySelector(
      '[data-testid="boundary-pattern-input"]',
    ) as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'has spaces' } });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const add = container.querySelector('button.btn') as HTMLButtonElement;
    expect(add.disabled).toBe(true);
    await fireEvent.click(add);
    expect(boundaryPayloads()).toHaveLength(0);
  });

  test('removing a chip dispatches the allow list without it', async () => {
    const { container } = render(Harness, {
      props: { boundary: { mode: 'locked', allow: ['google.com', '*.example.com'] } },
    });
    const removes = container.querySelectorAll('[data-testid="chip-remove"]');
    expect(removes).toHaveLength(2);
    await fireEvent.click(removes[1] as HTMLButtonElement); // remove *.example.com
    expect(lastBoundary()).toEqual({ mode: 'locked', allow: ['google.com'] });
  });

  test('the Add button is disabled for an empty or malformed pattern', async () => {
    const { container } = render(Harness, {
      props: { boundary: { mode: 'locked', allow: [] } },
    });
    const add = container.querySelector('button.btn') as HTMLButtonElement;
    expect(add.disabled).toBe(true); // empty
    const input = container.querySelector(
      '[data-testid="boundary-pattern-input"]',
    ) as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'has spaces' } });
    expect(add.disabled).toBe(true); // malformed
    await fireEvent.input(input, { target: { value: 'valid.com' } });
    expect(add.disabled).toBe(false);
  });
});
