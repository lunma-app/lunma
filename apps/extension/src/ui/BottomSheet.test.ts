import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Harness from './BottomSheet.test.harness.svelte';

const SHEET = '[data-testid="sheet"]';
const SCRIM = '.bottom-sheet-scrim';

describe('BottomSheet', () => {
  test('renders nothing while closed, the sheet + title + close button when open', async () => {
    const { container, rerender } = render(Harness, {
      props: { open: false, title: 'Edit Space' },
    });
    expect(container.querySelector(SHEET)).toBeNull();

    await rerender({ open: true, title: 'Edit Space' });
    const sheet = container.querySelector(SHEET) as HTMLElement;
    expect(sheet).not.toBeNull();
    expect(sheet.getAttribute('role')).toBe('dialog');
    expect(sheet.getAttribute('aria-modal')).toBe('true');
    // Title text + an aria-labelledby tie to it.
    expect(container.querySelector('.bottom-sheet-title')?.textContent).toBe('Edit Space');
    expect(sheet.getAttribute('aria-labelledby')).toBe(
      container.querySelector('.bottom-sheet-title')?.id,
    );
    // The header close ✕ (distinct from the scrim) is present and labelled.
    const closes = container.querySelectorAll('button[aria-label="Close"]');
    expect(closes.length).toBe(2); // scrim + ✕
    expect(container.querySelector('.bottom-sheet-close')).not.toBeNull();
  });

  test('a scrim click fires onClose', async () => {
    const onClose = vi.fn();
    const { container } = render(Harness, { props: { open: true, onClose } });
    await fireEvent.click(container.querySelector(SCRIM) as HTMLButtonElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('the header ✕ fires onClose', async () => {
    const onClose = vi.fn();
    const { container } = render(Harness, {
      props: { open: true, title: 'Edit Space', onClose },
    });
    await fireEvent.click(container.querySelector('.bottom-sheet-close') as HTMLButtonElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('Escape fires onClose', async () => {
    const onClose = vi.fn();
    render(Harness, { props: { open: true, onClose } });
    await fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  test('focus moves into the sheet on open', async () => {
    const { container } = render(Harness, { props: { open: false } });
    // Open via the trigger so the focus scope's auto-focus runs from a real
    // initiating element (mirrors a click in the sidebar).
    await fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLButtonElement);
    const sheet = container.querySelector(SHEET) as HTMLElement;
    await waitFor(() => {
      const active = document.activeElement;
      expect(active && sheet.contains(active)).toBe(true);
    });
  });

  test('omitting title renders no header (no ✕), just the body', async () => {
    const { container } = render(Harness, { props: { open: true, title: undefined } });
    expect(container.querySelector('.bottom-sheet-header')).toBeNull();
    expect(container.querySelector('.bottom-sheet-close')).toBeNull();
    expect(container.querySelector('[data-testid="body-input"]')).not.toBeNull();
    // The scrim still exists as a dismiss affordance.
    expect(container.querySelector(SCRIM)).not.toBeNull();
  });
});
