import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import TabRowMenuHarness from './TabRowMenu.test.harness.svelte';

const TRIGGER = '[data-testid="tab-row-menu-trigger"]';
const ITEM = '[data-testid="tab-row-menu-item"]';

function trigger(container: HTMLElement): HTMLButtonElement {
  return container.querySelector(TRIGGER) as HTMLButtonElement;
}

describe('TabRowMenu', () => {
  test('renders a kebab trigger that advertises a menu, closed by default', () => {
    const { container } = render(TabRowMenuHarness, { props: { label: 'Tab actions' } });
    const t = trigger(container);
    expect(t).not.toBeNull();
    expect(t.getAttribute('aria-label')).toBe('Tab actions');
    expect(t.getAttribute('aria-haspopup')).toBe('menu');
    expect(t.getAttribute('aria-expanded')).toBe('false');
    expect(t.querySelector('[data-icon-name="ellipsis-vertical"]')).not.toBeNull();
    // No actions rendered while closed.
    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(document.querySelectorAll(ITEM).length).toBe(0);
  });

  test('clicking the kebab opens the action drawer and flips the trigger to ✕', async () => {
    const { container } = render(TabRowMenuHarness, {});
    await fireEvent.click(trigger(container));
    expect(trigger(container).getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
    // Trigger glyph swaps from the kebab to the close (✕) icon.
    expect(trigger(container).querySelector('[data-icon-name="x"]')).not.toBeNull();
  });

  test('every action renders as a role=menuitem inside a role=menu', () => {
    render(TabRowMenuHarness, { props: { open: true } });
    const menu = document.querySelector('[role="menu"]');
    expect(menu).not.toBeNull();
    const items = document.querySelectorAll(ITEM);
    expect(items.length).toBe(3);
    expect(Array.from(items).every((el) => el.getAttribute('role') === 'menuitem')).toBe(true);
    const labels = Array.from(items).map((el) => el.querySelector('.label')?.textContent);
    expect(labels).toEqual(['Go home', 'Unpin', 'Delete']);
    expect(document.querySelector('[data-menu-id="delete"]')?.classList.contains('danger')).toBe(
      true,
    );
  });

  test('selecting a non-keepOpen action fires onSelect and closes', async () => {
    const onGoHome = vi.fn();
    const { container } = render(TabRowMenuHarness, { props: { open: true, onGoHome } });
    await fireEvent.click(document.querySelector('[data-menu-id="go-home"]') as HTMLButtonElement);
    expect(onGoHome).toHaveBeenCalledTimes(1);
    expect(trigger(container).getAttribute('aria-expanded')).toBe('false');
  });

  test('Escape closes the menu', async () => {
    const { container } = render(TabRowMenuHarness, { props: { open: true } });
    await fireEvent.keyDown(document.querySelector('[role="menu"]') as HTMLElement, {
      key: 'Escape',
    });
    expect(trigger(container).getAttribute('aria-expanded')).toBe('false');
  });

  test('clicking the ✕ trigger again closes the menu', async () => {
    const { container } = render(TabRowMenuHarness, { props: { open: true } });
    expect(trigger(container).getAttribute('aria-expanded')).toBe('true');
    await fireEvent.click(trigger(container));
    expect(trigger(container).getAttribute('aria-expanded')).toBe('false');
  });

  test('two-step delete keeps the menu open, then dispatches on confirm', async () => {
    const onDelete = vi.fn();
    const { container } = render(TabRowMenuHarness, { props: { open: true, onDelete } });

    // First activation: keepOpen — menu stays, row becomes a confirm affordance.
    await fireEvent.click(document.querySelector('[data-menu-id="delete"]') as HTMLButtonElement);
    expect(onDelete).not.toHaveBeenCalled();
    expect(trigger(container).getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('[data-menu-id="delete"] .label')?.textContent).toBe(
      'Delete — confirm',
    );

    // Second activation: dispatches and closes.
    await fireEvent.click(document.querySelector('[data-menu-id="delete"]') as HTMLButtonElement);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(trigger(container).getAttribute('aria-expanded')).toBe('false');
  });
});
