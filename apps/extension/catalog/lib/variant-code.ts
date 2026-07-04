// Lets each `<Variant>` tile in an Examples matrix trigger a single shared,
// full-width code drawer in its `Story.svelte` host — the tile carries the
// `</>` button (it knows its own label), the host owns the drawer (so the code
// shows full width, never clipped in a narrow matrix column). Wired through
// context because the examples are an opaque author snippet the host renders but
// can't reach into.
import { getContext, setContext } from 'svelte';

export interface VariantCodeContext {
  /** Extracted source for a variant, or undefined if none was found. */
  codeFor(label: string): string | undefined;
  /** Open this variant's code (or close it if already open). */
  toggle(label: string): void;
  /** The currently-open variant label, or null. Reactive. */
  readonly openLabel: string | null;
}

const KEY = Symbol('catalog-variant-code');

export function setVariantCodeContext(ctx: VariantCodeContext): void {
  setContext(KEY, ctx);
}

export function getVariantCodeContext(): VariantCodeContext | undefined {
  return getContext<VariantCodeContext>(KEY);
}
