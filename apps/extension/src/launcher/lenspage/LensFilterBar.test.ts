import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { LensEntity, LensFilter } from '../../shared/types';
import LensFilterBar from './LensFilterBar.svelte';

afterEach(() => cleanup());

function emptyFacets() {
  return { entities: [] as LensEntity[], repos: [] as string[], projects: [] as string[] };
}

function renderBar(filter: LensFilter = {}, facets = emptyFacets(), onfilter = vi.fn()) {
  return { onfilter, ...render(LensFilterBar, { props: { filter, facets, onfilter } }) };
}

describe('LensFilterBar', () => {
  test('renders nothing when there are no facets and no active filter', () => {
    const { container } = renderBar();
    expect(container.querySelector('[data-testid="lens-filter-bar"]')).toBeNull();
  });

  test('renders entity chips when multiple entity types are present in facets', () => {
    const { container } = renderBar({}, { ...emptyFacets(), entities: ['change', 'ticket'] });
    expect(container.querySelector('[data-testid="entity-chip-change"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="entity-chip-ticket"]')).not.toBeNull();
  });

  test('toggling an entity chip calls onfilter with that entity added', async () => {
    const { container, onfilter } = renderBar(
      {},
      { ...emptyFacets(), entities: ['change', 'ticket'] },
    );
    await fireEvent.click(
      container.querySelector('[data-testid="entity-chip-change"]') as HTMLElement,
    );
    expect(onfilter).toHaveBeenCalledWith({ entities: ['change'] });
  });

  test('toggling a selected entity chip calls onfilter with it removed', async () => {
    const { container, onfilter } = renderBar(
      { entities: ['change'] },
      { ...emptyFacets(), entities: ['change', 'ticket'] },
    );
    await fireEvent.click(
      container.querySelector('[data-testid="entity-chip-change"]') as HTMLElement,
    );
    expect(onfilter).toHaveBeenCalledWith({ entities: [] });
  });

  test('repo chips render when repos are present in facets', () => {
    const { container } = renderBar(
      {},
      { ...emptyFacets(), entities: ['change'], repos: ['host.com/org/repo-a'] },
    );
    expect(container.querySelector('[data-testid="repo-chip"]')).not.toBeNull();
  });

  test('repo Select renders when repos exceed 5 (overflow threshold)', () => {
    const repos = ['h/a', 'h/b', 'h/c', 'h/d', 'h/e', 'h/f'];
    const { container } = renderBar({}, { ...emptyFacets(), entities: ['change'], repos });
    expect(container.querySelector('[data-testid="repo-select"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="repo-chip"]')).toBeNull();
  });

  test('project chips render when projects are present in facets', () => {
    const { container } = renderBar(
      {},
      { ...emptyFacets(), entities: ['ticket'], projects: ['PROJ'] },
    );
    expect(container.querySelector('[data-testid="project-chip"]')).not.toBeNull();
  });

  test('Clear button appears only when filter is active', () => {
    const { container, rerender } = renderBar(
      {},
      { ...emptyFacets(), entities: ['change', 'ticket'] },
    );
    expect(container.querySelector('[data-testid="filter-clear"]')).toBeNull();

    void rerender({
      filter: { entities: ['change'] },
      facets: { ...emptyFacets(), entities: ['change', 'ticket'] },
      onfilter: vi.fn(),
    });
    expect(container.querySelector('[data-testid="filter-clear"]')).not.toBeNull();
  });

  test('clicking Clear calls onfilter with empty filter', async () => {
    const { container, onfilter } = renderBar(
      { entities: ['change'] },
      { ...emptyFacets(), entities: ['change', 'ticket'] },
    );
    await fireEvent.click(container.querySelector('[data-testid="filter-clear"]') as HTMLElement);
    expect(onfilter).toHaveBeenCalledWith({});
  });

  test('absent-but-selected entity stays as a clearable chip (D6 union)', () => {
    // 'ticket' is not in facets.entities but is in filter.entities → still renders.
    const { container } = renderBar(
      { entities: ['ticket'] },
      { ...emptyFacets(), entities: ['change'] },
    );
    expect(container.querySelector('[data-testid="entity-chip-ticket"]')).not.toBeNull();
  });

  test('absent-but-selected repo stays as a clearable chip (D6 union)', () => {
    const { container } = renderBar({ repos: ['ghost/repo'] }, { ...emptyFacets(), repos: [] });
    expect(container.querySelector('[data-testid="repo-chip"]')).not.toBeNull();
  });
});
