<script lang="ts" module>
import type { Component } from 'svelte';
import { type IconName, isIconName } from '../shared/icon-names';
// Allowlisted lazy loaders (generated from ICON_NAMES + source literals by
// scripts/gen-icon-loaders.mjs) — replaces a wildcard glob that emitted a chunk
// for all ~1,711 lucide icons at build time.
import { iconLoaders } from './icon-loaders.generated';

const componentCache: Map<string, Component> = new Map();
const inflight: Map<string, Promise<Component | null>> = new Map();
const missingLogged: Set<string> = new Set();

async function resolveIcon(name: string): Promise<Component | null> {
  const cached = componentCache.get(name);
  if (cached) return cached;
  const pending = inflight.get(name);
  if (pending) return pending;
  const loader = iconLoaders[name];
  if (!loader) {
    if (!missingLogged.has(name)) {
      missingLogged.add(name);
      console.warn(`[lunma] Icon: unknown icon name '${name}'`);
    }
    return null;
  }
  const p = (async () => {
    try {
      const mod = await loader();
      componentCache.set(name, mod.default);
      return mod.default;
    } catch (err) {
      if (!missingLogged.has(name)) {
        missingLogged.add(name);
        console.warn(`[lunma] Icon: failed to load '${name}'`, err);
      }
      return null;
    } finally {
      inflight.delete(name);
    }
  })();
  inflight.set(name, p);
  return p;
}

export type { IconName };
export { isIconName };
</script>

<script lang="ts">
interface Props {
  /** Any lucide icon name. `Icon` is the generic renderer — it loads the icon
   * dynamically and warns on an unknown name — so it accepts the full lucide set,
   * NOT just the curated `IconName` Space-icon catalogue (the IconPicker's domain).
   * Typing it to `IconName` was wrong: every UI icon (`x`, `chevron-right`, `plus`,
   * …) lives outside that catalogue and had to be cast at each call site. */
  name: string;
  size?: number | undefined;
  color?: string | undefined;
  label?: string | undefined;
}

const { name, size = 16, color, label }: Props = $props();

let Resolved: Component | null = $state(null);

$effect(() => {
  // Cache hit: swap synchronously, no null-then-set double render (which flashed
  // an empty box) for the common case of a repeated/already-loaded icon. Effects
  // flush before paint, so the cached component is in place for the first frame.
  const cached = componentCache.get(name);
  if (cached) {
    Resolved = cached;
    return;
  }
  let cancelled = false;
  Resolved = null;
  resolveIcon(name).then((c) => {
    if (!cancelled) Resolved = c;
  });
  return () => {
    cancelled = true;
  };
});
</script>

{#if label !== undefined}
  <span
    class="icon"
    style:--icon-size={`${size}px`}
    style:color={color ?? 'currentColor'}
    role="img"
    aria-label={label}
    data-icon-name={name}
  >
    {#if Resolved}<Resolved size={size} color={color ?? 'currentColor'} />{/if}
  </span>
{:else}
  <span
    class="icon"
    style:--icon-size={`${size}px`}
    style:color={color ?? 'currentColor'}
    aria-hidden="true"
    data-icon-name={name}
  >
    {#if Resolved}<Resolved size={size} color={color ?? 'currentColor'} />{/if}
  </span>
{/if}

<style>
  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    width: var(--icon-size);
    height: var(--icon-size);
    line-height: 0;
  }

  .icon :global(svg) {
    width: var(--icon-size);
    height: var(--icon-size);
    display: block;
  }
</style>
