import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import ExtCloseHarness from './RowMenu.extclose.test.harness.svelte';
import RowMenuHarness from './RowMenu.test.harness.svelte';

/** Flush the drawer's grow gate (two rAFs in `handleOpened`) so `revealed` lands. */
function flushReveal(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

const TRIGGER = '[data-testid="row-menu-trigger"]';
const ITEM = '[data-testid="row-menu-item"]';

function trigger(container: HTMLElement): HTMLButtonElement {
  return container.querySelector(TRIGGER) as HTMLButtonElement;
}

describe('RowMenu', () => {
  test('renders the header + a kebab trigger, closed by default', () => {
    const { container } = render(RowMenuHarness);
    expect(container.querySelector('[data-testid="row-header"]')).not.toBeNull();
    const t = trigger(container);
    expect(t.getAttribute('aria-haspopup')).toBe('menu');
    expect(t.getAttribute('aria-expanded')).toBe('false');
    expect(t.querySelector('[data-icon-name="ellipsis-vertical"]')).not.toBeNull();
    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(document.querySelectorAll(ITEM).length).toBe(0);
  });

  test('clicking the trigger opens the drawer and flips the glyph to ✕', async () => {
    const { container } = render(RowMenuHarness);
    await fireEvent.click(trigger(container));
    expect(trigger(container).getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
    expect(trigger(container).querySelector('[data-icon-name="x"]')).not.toBeNull();
    expect(document.querySelectorAll(ITEM).length).toBe(3);
    expect(document.querySelector('[data-menu-id="del"]')?.classList.contains('danger')).toBe(true);
  });

  test('a non-keepOpen action fires onSelect and closes', async () => {
    const onA = vi.fn();
    const { container } = render(RowMenuHarness, { props: { onA } });
    await fireEvent.click(trigger(container));
    await fireEvent.click(document.querySelector('[data-menu-id="a"]') as HTMLButtonElement);
    expect(onA).toHaveBeenCalledTimes(1);
    expect(trigger(container).getAttribute('aria-expanded')).toBe('false');
  });

  test('a keepOpen action stays open and can reveal the in-drawer panel', async () => {
    const { container } = render(RowMenuHarness);
    await fireEvent.click(trigger(container));
    expect(document.querySelector('[data-testid="row-menu-panel"]')).toBeNull();
    await fireEvent.click(document.querySelector('[data-menu-id="panel"]') as HTMLButtonElement);
    expect(trigger(container).getAttribute('aria-expanded')).toBe('true'); // still open
    expect(document.querySelector('[data-testid="row-menu-panel"]')).not.toBeNull();
  });

  test('Escape closes the drawer', async () => {
    const { container } = render(RowMenuHarness);
    await fireEvent.click(trigger(container));
    await fireEvent.keyDown(document.querySelector('[role="menu"]') as HTMLElement, {
      key: 'Escape',
    });
    expect(trigger(container).getAttribute('aria-expanded')).toBe('false');
  });

  // Regression (smart-folder editor onDone): a host that dismisses the morph by
  // flipping the bindable `open` to false directly — not via trigger/Esc/outside —
  // must still tear the drawer down. Otherwise the absolutely-positioned drawer
  // lingers `revealed` (empty but full editor height), an invisible overlay that
  // swallows clicks on the rows below until the next remount ("can't click tabs
  // after adding a smart folder").
  test('a host-driven close (open→false) collapses the drawer instead of leaving it revealed', async () => {
    const { container } = render(ExtCloseHarness);
    const t = trigger(container);

    await fireEvent.click(t); // open the morph
    await flushReveal();
    const drawer = container.querySelector('.drawer') as HTMLElement;
    expect(drawer.classList.contains('revealed')).toBe(true);

    await fireEvent.click(document.querySelector('[data-menu-id="edit"]') as HTMLButtonElement);
    expect(document.querySelector('[data-testid="editor-panel"]')).not.toBeNull();

    // Confirm dismisses the whole morph by setting `open = false` (the onDone path).
    await fireEvent.click(
      document.querySelector('[data-testid="editor-confirm"]') as HTMLButtonElement,
    );

    expect(t.getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('[data-testid="editor-panel"]')).toBeNull();
    // The drawer must have collapsed — not stayed expanded as an invisible overlay.
    expect(drawer.classList.contains('revealed')).toBe(false);
  });

  test('a disabled item renders muted + aria-disabled, stays inert, and keeps the drawer open', async () => {
    const onMove = vi.fn();
    const { container } = render(RowMenuHarness, {
      props: {
        items: [
          { id: 'move-up', label: 'Move up', disabled: true, onSelect: onMove },
          { id: 'a', label: 'Action A', onSelect: () => undefined },
        ],
      },
    });
    await fireEvent.click(trigger(container));
    const moveUp = document.querySelector('[data-menu-id="move-up"]') as HTMLButtonElement;
    expect(moveUp.classList.contains('disabled')).toBe(true);
    expect(moveUp.getAttribute('aria-disabled')).toBe('true');
    await fireEvent.click(moveUp);
    expect(onMove).not.toHaveBeenCalled();
    expect(trigger(container).getAttribute('aria-expanded')).toBe('true'); // still open
  });
});
