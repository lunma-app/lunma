import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import type { LauncherResult } from '../shared/launcher-contract';
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

  test('is a listbox with id-bearing option rows (combobox a11y)', () => {
    const { container } = render(ResultListHarness);
    expect(list(container).getAttribute('role')).toBe('listbox');
    expect(list(container).id).toBe('launcher-results');
    const ids = rows(container).map((r) => r.id);
    expect(ids).toEqual([
      'launcher-results-opt-0',
      'launcher-results-opt-1',
      'launcher-results-opt-2',
    ]);
    for (const r of rows(container)) expect(r.getAttribute('role')).toBe('option');
  });

  test('reports the active option id as the roving selection moves', async () => {
    const onactivedescendant = vi.fn();
    const { container } = render(ResultListHarness, { props: { onactivedescendant } });
    // Fired on mount with the default (first) selection.
    expect(onactivedescendant).toHaveBeenLastCalledWith('launcher-results-opt-0');
    await fireEvent.keyDown(list(container), { key: 'ArrowDown' });
    expect(onactivedescendant).toHaveBeenLastCalledWith('launcher-results-opt-1');
  });

  test('reports null active descendant when there are no results', () => {
    const onactivedescendant = vi.fn();
    render(ResultListHarness, { props: { results: [], onactivedescendant } });
    expect(onactivedescendant).toHaveBeenLastCalledWith(null);
  });

  test('Enter forwards the Shift modifier so a surface can force a new tab', async () => {
    const onact = vi.fn();
    const { container } = render(ResultListHarness, { props: { onact } });
    await fireEvent.keyDown(list(container), { key: 'Enter', shiftKey: true });
    expect(onact.mock.calls[0]?.[2]).toEqual({ shiftKey: true });
    await fireEvent.keyDown(list(container), { key: 'Enter' });
    expect(onact.mock.calls[1]?.[2]).toEqual({ shiftKey: false });
  });

  test('passes the alreadyOpen predicate through to the matching rows', () => {
    const { container } = render(ResultListHarness, {
      props: { alreadyOpen: (r: LauncherResult) => r.id === 'history:3' },
    });
    const flagged = container.querySelectorAll('[data-testid="result-already-open"]');
    expect(flagged).toHaveLength(1);
    expect(rows(container)[2]?.classList.contains('already-open')).toBe(true);
  });

  test('reports the focused result as the roving selection moves', async () => {
    const onfocuschange = vi.fn();
    const { container } = render(ResultListHarness, { props: { onfocuschange } });
    expect(onfocuschange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'tab:1' }));
    await fireEvent.keyDown(list(container), { key: 'ArrowDown' });
    expect(onfocuschange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'saved:2' }));
  });

  test('reports null focused result when there are no results', () => {
    const onfocuschange = vi.fn();
    render(ResultListHarness, { props: { results: [], onfocuschange } });
    expect(onfocuschange).toHaveBeenLastCalledWith(null);
  });
});
