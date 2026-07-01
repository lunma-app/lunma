// Live-controls schema (component-catalog v2, derive-catalog-controls-from-props).
// `ControlDef`/`Controls` are the shape produced by `derive-controls.ts` parsing a
// primitive's own `Props` interface, then merged (in `registry.ts`'s
// `resolveControls`) with a story's `meta.controlOverrides`/`excludeControls` —
// not authored from scratch per story. The merged result drives an `Args` object
// bound to a live preview, and doubles as the API table source (prop · type ·
// default · description).

/** The input widget the catalog renders for a prop. */
export type ControlType = 'boolean' | 'text' | 'number' | 'select';

export interface ControlDef {
  type: ControlType;
  /** Initial value — also shown as the default in the API table. */
  default: boolean | string | number;
  /** Choices for a `select` control. */
  options?: readonly string[];
  /** Human description for the API table. */
  description?: string;
  /** TS type label for the API table (e.g. `'primary' | 'secondary' | 'ghost'`).
   * Defaults to the control `type` when omitted. */
  typeLabel?: string;
}

/** A story's editable-prop schema: prop name → control descriptor. */
export type Controls = Record<string, ControlDef>;

/** Live prop values, keyed by prop name. */
export type Args = Record<string, boolean | string | number>;

/** Seed an `Args` object from a controls schema's defaults. */
export function defaultArgs(controls: Controls | undefined): Args {
  const args: Args = {};
  for (const [prop, def] of Object.entries(controls ?? {})) {
    args[prop] = def.default;
  }
  return args;
}
