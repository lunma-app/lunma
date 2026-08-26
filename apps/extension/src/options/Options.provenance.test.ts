import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { requestMock, hasMock, writeMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  hasMock: vi.fn(),
  writeMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('../shared/permissions', () => ({
  requestApiPermission: requestMock,
  hasApiPermission: hasMock,
  onPermissionsChange: () => () => undefined,
  originPatternForBaseUrl: () => '',
  hasHostPermissions: () => Promise.resolve(true),
  requestHostPermissions: () => Promise.resolve(true),
}));

import Options from './Options.svelte';

/** Svelte reflects a radio's `value` as a PROPERTY, not an attribute, so an
 * attribute selector misses it. */
function onRadio(container: HTMLElement): HTMLInputElement | null {
  const radios = [
    ...container.querySelectorAll<HTMLInputElement>('input[name="trackTabProvenance"]'),
  ];
  return radios.find((r) => r.value === 'on') ?? null;
}

describe('provenance toggle — permission gating', () => {
  beforeEach(() => {
    (globalThis as unknown as { chrome: unknown }).chrome = {
      storage: {
        sync: { get: vi.fn(async () => ({})), set: vi.fn(async () => undefined) },
        local: { get: vi.fn(async () => ({})), set: vi.fn(async () => undefined) },
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
      runtime: {
        getManifest: () => ({ version: '0.0.0' }),
        getURL: (path: string) => `chrome-extension://x/${path}`,
      },
      commands: { getAll: vi.fn(async () => [{ name: 'toggle-launcher', shortcut: 'Alt+L' }]) },
      permissions: {
        contains: vi.fn(async () => false),
        request: vi.fn(async () => true),
        onAdded: { addListener: vi.fn(), removeListener: vi.fn() },
        onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    };
    requestMock.mockReset();
    hasMock.mockReset().mockResolvedValue(false);
    writeMock.mockReset();
  });

  test('enabling requests webNavigation from the click', async () => {
    requestMock.mockResolvedValue(true);
    const { container } = render(Options);
    await waitFor(() => expect(onRadio(container)).not.toBeNull());
    await fireEvent.change(onRadio(container) as Element);
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith('webNavigation'));
  });

  test('a declined grant does not leave the toggle on', async () => {
    requestMock.mockResolvedValue(false);
    hasMock.mockResolvedValue(false);
    const { container } = render(Options);
    await waitFor(() => expect(onRadio(container)).not.toBeNull());
    await fireEvent.change(onRadio(container) as Element);
    await waitFor(() => expect(onRadio(container)?.checked).toBe(false));
  });
});
