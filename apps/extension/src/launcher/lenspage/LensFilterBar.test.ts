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

  test('Clear button absent when no filter active', () => {
    const { container } = renderBar({}, { ...emptyFacets(), entities: ['change', 'ticket'] });
    expect(container.querySelector('[data-testid="filter-clear"]')).toBeNull();
  });

  test('Clear button appears when entity filter is active', () => {
    const { container } = renderBar(
      { entities: ['change'] },
      { ...emptyFacets(), entities: ['change', 'ticket'] },
    );
    expect(container.querySelector('[data-testid="filter-clear"]')).not.toBeNull();
  });

  test('Clear button appears when a scope filter is active (repo, project, or feed set from a card)', () => {
    const { container } = renderBar(
      { repos: ['github.com/acme/api'] },
      { ...emptyFacets(), entities: ['change', 'ticket'] },
    );
    expect(container.querySelector('[data-testid="filter-clear"]')).not.toBeNull();
  });

  test('Clear button appears when a feed filter is active', () => {
    const { container } = renderBar(
      { feeds: ['Hacker News'] },
      { ...emptyFacets(), entities: ['change', 'article'] },
    );
    expect(container.querySelector('[data-testid="filter-clear"]')).not.toBeNull();
  });

  test('a single-entity lens with an active scope filter renders no bar (no orphaned ×)', () => {
    // Feeds-only lens: one entity type → no type-facet bar. Selecting a feed must NOT
    // pop a lone clear-× in (it caused a reflow + read as a stray control); the scope
    // control owns clearing.
    const { container } = renderBar(
      { feeds: ['Hacker News'] },
      { ...emptyFacets(), entities: ['article'] },
    );
    expect(container.querySelector('[data-testid="lens-filter-bar"]')).toBeNull();
    expect(container.querySelector('[data-testid="filter-clear"]')).toBeNull();
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
    const { container } = renderBar(
      { entities: ['ticket'] },
      { ...emptyFacets(), entities: ['change'] },
    );
    expect(container.querySelector('[data-testid="entity-chip-ticket"]')).not.toBeNull();
  });

  test('does not render repo or project chips (scope is in entity cards)', () => {
    const { container } = renderBar(
      {},
      { ...emptyFacets(), entities: ['change', 'ticket'], repos: ['host/repo'], projects: ['P'] },
    );
    expect(container.querySelector('[data-testid="repo-chip"]')).toBeNull();
    expect(container.querySelector('[data-testid="project-chip"]')).toBeNull();
  });
});
