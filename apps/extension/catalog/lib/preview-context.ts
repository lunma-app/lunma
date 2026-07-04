// The catalog's global preview knobs (Space hue drives the inherited `--space-*`
// on the scroll wrapper; intensity + canvas are read here), shared with each
// render surface (`Story.svelte`'s Playground stage, `Variant.svelte`'s tiles)
// so an `aurora`-canvas story can render its own `<Aurora>` backdrop inside the
// tile — which works even inside the opaque neutral chrome panels.

import { getContext, setContext } from 'svelte';
import type { Tint } from '@/shared/settings';

export interface PreviewContext {
  /** Colour-intensity tier → the previewed `<Aurora>`'s `intensity`. Reactive. */
  readonly tint: Tint;
  /** The selected story's canvas (`meta.background`). Reactive. */
  readonly canvas: 'neutral' | 'aurora';
  /** Live Canvas toggle: a clean neutral grey surface, or the theme habitat
   * (atmospheric bg + hue bloom, plus the aurora for an `aurora` story). Reactive. */
  readonly surface: 'neutral' | 'theme';
}

const KEY = Symbol('catalog-preview');

export function setPreviewContext(ctx: PreviewContext): void {
  setContext(KEY, ctx);
}

export function getPreviewContext(): PreviewContext | undefined {
  return getContext<PreviewContext>(KEY);
}
