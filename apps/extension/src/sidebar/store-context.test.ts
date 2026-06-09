import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import NoSetHarness from './store-context.noset-test.harness.svelte';
import { createSidebarStore } from './store-context.svelte';
import StoreHarness from './store-context.test.harness.svelte';

describe('store-context', () => {
  test('setStore + useStore round-trip exposes the same store', () => {
    const store = new LunmaStore();
    store.createSpace({ name: 'Work', color: 'blue', icon: 'star' });
    const { container } = render(StoreHarness, { props: { store } });
    const root = container.querySelector('[data-spaces-count]') as HTMLElement;
    expect(root.getAttribute('data-spaces-count')).toBe('1');
    expect(root.getAttribute('data-error')).toBe('');
  });

  test('useStore() without setStore throws a helpful error', () => {
    const { container } = render(NoSetHarness, { props: {} });
    const root = container.querySelector('[data-error]') as HTMLElement;
    expect(root.getAttribute('data-spaces-count')).toBe('-1');
    expect(root.getAttribute('data-error')).toContain('useStore()');
  });

  test('createSidebarStore seeds from an AppState snapshot', () => {
    const seed = new LunmaStore();
    seed.createSpace({ name: 'Reading', color: 'orange', icon: 'book' });
    const snapshot = seed.snapshot();
    const created = createSidebarStore(snapshot);
    expect(created.state.spaces).toHaveLength(1);
    expect(created.state.spaces[0]?.name).toBe('Reading');
  });
});
