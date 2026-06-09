import { createInitialState, LunmaStore } from './store.svelte';
import type { AppState, Space } from './types';

export function makeStore(
  overrides: { initial?: Partial<AppState>; idFactory?: () => string } = {},
) {
  let counter = 0;
  const idFactory = overrides.idFactory ?? (() => `id-${++counter}`);
  const initial: AppState = { ...createInitialState(), ...overrides.initial };
  return new LunmaStore({ idFactory, initial });
}

export function seedSpace(store: LunmaStore, partial: Partial<Space> = {}): Space {
  const space: Space = {
    id: partial.id ?? 'work',
    name: partial.name ?? 'Work',
    color: partial.color ?? 'blue',
    icon: partial.icon ?? 'star',
  };
  store.state.spaces.push(space);
  if (store.state.lastActivatedSpaceId === null) {
    store.state.lastActivatedSpaceId = space.id;
  }
  return space;
}
