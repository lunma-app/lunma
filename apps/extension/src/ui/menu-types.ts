/**
 * One action in a {@link Menu}. `onSelect` fires on click / keyboard activation;
 * `danger` paints the row destructive; `keepOpen` suppresses the close-on-select
 * (e.g. a two-step confirm). Lives in a `.ts` (not the `.svelte` module block) so
 * it's importable as a plain type — the ambient `*.svelte` module declaration
 * does not surface named type exports to `import type`.
 */
export interface MenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  icon?: string | undefined;
  danger?: boolean | undefined;
  keepOpen?: boolean | undefined;
  /** Renders a trailing chevron + `aria-haspopup` to signal the item drills into a
   * titled `panel` (a sub-view) rather than firing a one-shot action. */
  submenu?: boolean | undefined;
}
