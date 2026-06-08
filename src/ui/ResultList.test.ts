import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import ResultListHarness from './ResultList.test.harness.svelte';

function list(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-testid="result-list"]') as HTMLElement;
}
function rows(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll('[data-testid="result-row"]'));
}
function selectedIndex(container: HTMLElement): number {
  return rows(container).findIndex((r) => r.getAttribute('data-selected') === 'true');
}

describe('ResultList', () => {
  test('renders a row per result, first selected by default', () => {
    const { container } = render(ResultListHarness);
    expect(rows(container)).toHaveLength(3);
    expect(selectedIndex(container)).toBe(0);
  });

  test('ArrowDown / ArrowUp move the roving selection and wrap', async () => {
    const { container } = render(ResultListHarness);
    await fireEvent.keyDown(list(container), { key: 'ArrowDown' });
    expect(selectedIndex(container)).toBe(1);
    await fireEvent.keyDown(list(container), { key: 'ArrowUp' });
    await fireEvent.keyDown(list(container), { key: 'ArrowUp' });
    expect(selectedIndex(container)).toBe(2); // wrapped past the top to the end
  });

  test('Enter acts on the selected result', async () => {
    const onact = vi.fn();
    const { container } = render(ResultListHarness, { props: { onact } });
    await fireEvent.keyDown(list(container), { key: 'ArrowDown' });
    await fireEvent.keyDown(list(container), { key: 'Enter' });
    expect(onact).toHaveBeenCalledTimes(1);
    expect(onact.mock.calls[0]?.[0]).toMatchObject({ id: 'saved:2' });
    expect(onact.mock.calls[0]?.[1]).toBe(1);
  });

  test('clicking a row acts on it', async () => {
    const onact = vi.fn();
    const { container } = render(ResultListHarness, { props: { onact } });
    await fireEvent.click(rows(container)[2] as HTMLButtonElement);
    expect(onact.mock.calls[0]?.[0]).toMatchObject({ id: 'history:3' });
  });

  test('hovering a row moves the selection', async () => {
    const { container } = render(ResultListHarness);
    await fireEvent.mouseEnter(rows(container)[2] as HTMLButtonElement);
    expect(selectedIndex(container)).toBe(2);
  });

  test('Escape calls onescape', async () => {
    const onescape = vi.fn();
    const { container } = render(ResultListHarness, { props: { onescape } });
    await fireEvent.keyDown(list(container), { key: 'Escape' });
    expect(onescape).toHaveBeenCalledTimes(1);
  });
});
