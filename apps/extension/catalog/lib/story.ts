import type { Controls } from './controls';

/**
 * The metadata a `*.stories.svelte` file exports from its `<script module>`
 * block (`export const meta = defineStory({ … })`). The catalog's `registry.ts`
 * globs these eagerly to build the navigation without executing the story
 * component itself.
 */
export interface StoryMeta {
  /** Display title in the nav — by convention the primitive's name (e.g. `Button`). */
  title: string;
  /** Nav group the story sorts under (e.g. `Atoms`, `Form`, `Composite`). */
  group: string;
  /** Optional sort weight within the group (lower first); ties fall back to `title`. */
  order?: number;
  /** Optional editable-prop schema. When present, the catalog renders a live
   * controls panel + preview for these props and an API table from them. */
  controls?: Controls;
}

/**
 * Identity helper that brands a story's metadata with the {@link StoryMeta}
 * type. Exists so a story can write `export const meta = defineStory({ … })`
 * and get full type-checking on `title`/`group` without importing the type.
 */
export function defineStory(meta: StoryMeta): StoryMeta {
  return meta;
}
