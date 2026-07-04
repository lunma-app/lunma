import type { Component } from 'svelte';
import type { Controls } from './controls';
import { derivedControls } from './derived-controls.generated';
import type { StoryMeta } from './story';

/** A single discovered story: its nav metadata plus lazy component + source loaders. */
export interface StoryEntry extends StoryMeta {
  /** Stable id derived from the file path (used as the nav selection key). */
  id: string;
  /** Lazily import the story component (the file's default export). */
  load: () => Promise<Component>;
  /** Lazily load the story file's raw source text (for the source-view panel). */
  loadSource: () => Promise<string>;
}

/** A nav group: a heading and its stories, both already sorted. */
export interface StoryGroup {
  name: string;
  stories: StoryEntry[];
}

// Auto-discovery (component-catalog: stories are auto-discovered, not centrally
// registered). Two globs over the same set: `meta` eagerly (cheap — just the
// nav metadata, no component code runs) and the component lazily (loaded only
// when its story is selected). Adding a `*.stories.svelte` needs no edit here.
const metas = import.meta.glob<StoryMeta>('../stories/**/*.stories.svelte', {
  eager: true,
  import: 'meta',
});
const loaders = import.meta.glob<{ default: Component }>('../stories/**/*.stories.svelte');
// Raw source for the source-view panel — a third lazy glob over the same files
// (`?raw` yields the file text as the default export).
const sources = import.meta.glob<string>('../stories/**/*.stories.svelte', {
  query: '?raw',
  import: 'default',
});

/**
 * A story's final controls, merged per prop in precedence order: a
 * story-authored `meta.controls` floor (for a primitive the deriver can't
 * reach), the primitive's derived-from-`Props` base (keyed by `meta.title`,
 * which by convention names the primitive — a real derived control of the same
 * name wins wholesale), each prop dropped by `meta.excludeControls`, then
 * shallow-patched by `meta.controlOverrides`.
 */
export function resolveControls(meta: StoryMeta): Controls {
  const base: Controls = {
    ...meta.controls,
    ...(derivedControls[meta.title]?.controls ?? {}),
  };
  const controls: Controls = {};
  for (const [prop, def] of Object.entries(base)) {
    if (meta.excludeControls?.[prop]) continue;
    controls[prop] = { ...def, ...meta.controlOverrides?.[prop] };
  }
  return controls;
}

/** `…/stories/ui/Button.stories.svelte` → `ui/Button`. A stable nav key. */
function idFromPath(path: string): string {
  return path.replace(/^.*\/stories\//, '').replace(/\.stories\.svelte$/, '');
}

function buildEntries(): StoryEntry[] {
  const entries: StoryEntry[] = [];
  for (const [path, meta] of Object.entries(metas)) {
    const loader = loaders[path];
    const sourceLoader = sources[path];
    if (!meta || !loader || !sourceLoader) continue;
    entries.push({
      ...meta,
      id: idFromPath(path),
      load: () => loader().then((mod) => mod.default),
      loadSource: () => sourceLoader(),
    });
  }
  return entries;
}

function compare(a: StoryEntry, b: StoryEntry): number {
  return (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title);
}

/**
 * The discovered stories, grouped by `meta.group` and sorted — groups
 * alphabetically, stories within a group by `order` then `title`.
 */
export function buildGroups(): StoryGroup[] {
  const byGroup = new Map<string, StoryEntry[]>();
  for (const entry of buildEntries()) {
    const bucket = byGroup.get(entry.group);
    if (bucket) bucket.push(entry);
    else byGroup.set(entry.group, [entry]);
  }
  return [...byGroup.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, stories]) => ({ name, stories: stories.sort(compare) }));
}
