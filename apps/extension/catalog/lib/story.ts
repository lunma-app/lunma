import type { ControlDef, Controls } from './controls';

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
  /** The story content pane's backdrop: `'neutral'` (plain card, default) or
   * `'aurora'` (the immersive glass/aurora shell) — set `'aurora'` only when
   * the primitive's own visual identity depends on that backdrop. */
  background?: 'neutral' | 'aurora';
  /** The story content pane's own light/dark theme (default `'dark'`),
   * independent of the catalog chrome's theme toggle. */
  theme?: 'light' | 'dark';
  /** Author controls the deriver can't reach (a primitive whose props are
   * opaque type references derive nothing). Merged UNDER derived controls of the
   * same name — a real derived control wins — then patched by `controlOverrides`.
   * Lets an otherwise-underivable primitive still show a Playground + API table. */
  controls?: Controls;
  /** Props to omit from the derived controls panel/API table, one-line reason
   * each (e.g. a `Snippet`/callback prop, or a mechanically-derivable prop
   * that's unsafe as a naive control). */
  excludeControls?: Record<string, string>;
  /** Per-prop overrides merged over the derived base control (e.g. narrow a
   * `select`'s options, hand-write a better `description`) — each entry
   * replaces only the fields it names, not the whole `ControlDef`. */
  controlOverrides?: Record<string, Partial<ControlDef>>;
}

/**
 * Identity helper that brands a story's metadata with the {@link StoryMeta}
 * type. Exists so a story can write `export const meta = defineStory({ … })`
 * and get full type-checking on `title`/`group` without importing the type.
 */
export function defineStory(meta: StoryMeta): StoryMeta {
  return meta;
}
