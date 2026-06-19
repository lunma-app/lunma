import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { parse, wcagContrast } from 'culori';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import BackupRestore from './BackupRestore.svelte';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn(() => Promise.resolve()) }));
vi.mock('../shared/bus', () => ({ bus: { send: sendMock } }));

function validBackupJson(): string {
  return JSON.stringify({
    formatVersion: 1,
    schemaVersion: 5,
    exportedAt: 1000,
    state: {
      schemaVersion: 5,
      spaces: [],
      savedTabs: {},
      pinnedBySpace: {},
      faviconRow: [],
      archivedTabs: [],
      trash: {},
      lastActivatedSpaceId: null,
    },
  });
}

function installChrome(): void {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      local: { get: vi.fn(async () => ({})) },
      sync: { get: vi.fn(async () => ({})) },
    },
    runtime: { getURL: (p: string) => `chrome-extension://x/${p}` },
  };
}

async function feedFile(fileInput: HTMLInputElement, content: string): Promise<void> {
  Object.defineProperty(fileInput, 'files', {
    value: [new File([content], 'backup.json', { type: 'application/json' })],
    configurable: true,
  });
  await fireEvent.change(fileInput);
}

beforeEach(() => {
  sendMock.mockClear();
  installChrome();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('BackupRestore (options card)', () => {
  test('renders the Export backup and Import backup buttons', () => {
    const { getByText } = render(BackupRestore);
    expect(getByText('Export backup')).not.toBeNull();
    expect(getByText('Import backup')).not.toBeNull();
  });

  test('selecting a valid file arms a confirm row without dispatching importState', async () => {
    const { container } = render(BackupRestore);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await feedFile(fileInput, validBackupJson());

    await waitFor(() =>
      expect(container.querySelector('[data-testid="import-confirm"]')).not.toBeNull(),
    );
    expect(sendMock).not.toHaveBeenCalled();
  });

  test('confirming with Restore dispatches importState (two-step complete)', async () => {
    const { container, getByText } = render(BackupRestore);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await feedFile(fileInput, validBackupJson());

    await waitFor(() =>
      expect(container.querySelector('[data-testid="import-confirm"]')).not.toBeNull(),
    );
    await fireEvent.click(getByText('Restore'));
    await waitFor(() =>
      expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ kind: 'importState' })),
    );
  });

  test('Cancel in the confirm row dismisses without dispatching', async () => {
    const { container, getByText } = render(BackupRestore);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await feedFile(fileInput, validBackupJson());

    await waitFor(() =>
      expect(container.querySelector('[data-testid="import-confirm"]')).not.toBeNull(),
    );
    await fireEvent.click(getByText('Cancel'));

    expect(container.querySelector('[data-testid="import-confirm"]')).toBeNull();
    expect(sendMock).not.toHaveBeenCalled();
  });

  test('opening the import confirm moves focus to its primary action (Restore)', async () => {
    const { container } = render(BackupRestore);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await feedFile(fileInput, validBackupJson());

    await waitFor(() => {
      const restore = container.querySelector(
        '[data-testid="import-confirm"] [data-variant="primary"]',
      ) as HTMLButtonElement;
      expect(restore).not.toBeNull();
      expect(document.activeElement).toBe(restore);
    });
  });

  test('cancelling the import confirm restores focus to the Import trigger', async () => {
    const { container, getByText } = render(BackupRestore);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await feedFile(fileInput, validBackupJson());
    await waitFor(() =>
      expect(container.querySelector('[data-testid="import-confirm"]')).not.toBeNull(),
    );

    await fireEvent.click(getByText('Cancel'));

    await waitFor(() => {
      const trigger = container.querySelector(
        '[data-testid="import-trigger"]',
      ) as HTMLButtonElement;
      expect(trigger).not.toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });

  test('card heading meets WCAG-AA (4.5:1) at the identity-hue lightness floor', () => {
    // The shared `CardHeading` CSS enforces `max(l, 0.72)` under vivid/standard tint.
    // Neutral grey at L=0.72 is the worst-case (lowest-chroma) heading colour;
    // the effective glass card background is ~oklch(0.2 0 0) (glass-bg at 50%
    // opacity composited over the dark page --bg oklch(0.155 0 0)).
    const headingFloor = parse('oklch(0.72 0 0)');
    const effectiveBg = parse('oklch(0.2 0 0)');
    if (!headingFloor || !effectiveBg) throw new Error('culori failed to parse');
    const ratio = wcagContrast(headingFloor, effectiveBg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
