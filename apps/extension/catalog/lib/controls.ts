// Live-controls schema (component-catalog v2). A story declares, in its `meta`,
// a `controls` map describing the props the catalog renders editable inputs for
// — driving an `Args` object bound to a live preview — and doubling as the API
// table source (prop · type · default · description). Svelte 5 exposes no
// runtime prop metadata, so this schema is hand-authored per story.

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
