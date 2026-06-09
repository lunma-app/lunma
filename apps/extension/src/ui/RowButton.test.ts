import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import RowButtonHarness from './RowButton.test.harness.svelte';

function rowButton(container: HTMLElement): HTMLButtonElement {
  return container.querySelector('[data-testid="row-button"]') as HTMLButtonElement;
}

describe('RowButton', () => {
  test('renders the label', () => {
    const { container } = render(RowButtonHarness, { props: { label: 'New Tab' } });
    expect(rowButton(container).textContent).toContain('New Tab');
  });

  test('fires onclick when activated', async () => {
    const onclick = vi.fn();
    const { container } = render(RowButtonHarness, { props: { onclick } });
    await fireEvent.click(rowButton(container));
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  test('does not fire onclick when disabled', async () => {
    const onclick = vi.fn();
    const { container } = render(RowButtonHarness, { props: { onclick, disabled: true } });
    const el = rowButton(container);
    expect(el.disabled).toBe(true);
    await fireEvent.click(el);
    expect(onclick).not.toHaveBeenCalled();
  });
});
