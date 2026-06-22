## 1. State plumbing (per-window ephemeral collapse)

- [x] 1.1 Add `collapsedSmartSectionsByWindow?: { [windowId: WindowId]: { [folderId: FolderId]: { [sourceKey: string]: boolean } } }` to `SidebarLocalState` in `apps/extension/src/shared/types.ts`, with a doc comment mirroring the `expandedFoldersByWindow` note (sidebar-local, per-window, never persisted/broadcast, absent = expanded).
- [x] 1.2 Add `setSmartSectionCollapsed(windowId, folderId, sourceKey, collapsed): void` to the store (`apps/extension/src/shared/store.svelte.ts`), modeled on `setFolderExpanded` (lazy-create the nested maps, write the leaf boolean).
- [x] 1.3 Project the new field/reader through `SidebarState` in `apps/extension/src/sidebar/store-context.svelte.ts` so `SmartFolder.svelte` can read `collapsedSmartSectionsByWindow`.

## 2. Disclosure header (`SmartSectionHeader.svelte`)

- [x] 2.1 Add `collapsed: boolean` and `onToggle: () => void` props; add a `controlsId?: string` (or equivalent) prop for `aria-controls` wiring.
- [x] 2.2 Convert the root from `<div aria-hidden="true">` to a `<button type="button">` that calls `onToggle`, with `aria-expanded={!collapsed}`, `aria-controls`, and an accessible label `"{host} section, {count} items, {collapse|expand}"`.
- [x] 2.3 Add a leading `Icon name="chevron-right" size={12}` in `--text-dim` that rotates `0deg`→`90deg` on expand (`var(--motion-fast)` / `var(--ease-standard)`); keep the existing source icon, host, and count. Count stays visible while collapsed.
- [x] 2.4 Add header interaction styles matching the result-row language: hover `--surface-2` + host → `--text`, active `scale(var(--press-scale))`, focus-visible `--focus-width`/`--focus-color`/`--focus-offset`. Add a `prefers-reduced-motion: reduce` block disabling the chevron rotation.

## 3. Section body gating (`SmartFolder.svelte`)

- [x] 3.1 Read per-section collapsed state: `const collapsed = store.state.collapsedSmartSectionsByWindow?.[windowId]?.[node.id]?.[sourceKey(cfg)] ?? false` inside the `node.sources` loop.
- [x] 3.2 Pass `collapsed` and an `onToggle` (dispatching `setSmartSectionCollapsed(windowId, node.id, sourceKey(cfg), !collapsed)`) to `SmartSectionHeader`; wire a stable `controlsId` to the section body wrapper.
- [x] 3.3 Wrap the section body (ghost rows, sign-in/needs-access rows, result rows, empty/error notes, feed reading-controls) in `{#if !collapsed}` with an `id` matching `aria-controls`. Keep the header always rendered. Confirm header + rows keep current padding (no added indent — flat layout).
- [x] 3.4 Ensure the folder `badge` computation is untouched (still sums all sections regardless of collapse).
- [x] 3.5 Extend the existing `prefers-reduced-motion` block so the section-body entrance animation is disabled under reduced motion.

## 4. Tests & verification

- [x] 4.1 Update `SmartSectionHeader.test.harness.svelte` + tests: renders as a button, `aria-expanded` reflects `collapsed`, chevron rotation class, `onToggle` fires on click/Enter/Space, count stays visible when collapsed.
- [x] 4.2 Update `SmartFolder.test.harness.svelte` + tests: collapsing a section hides its body and keeps its header; other sections unaffected; per-window independence (collapsed in window A, expanded in window B); single-source folder renders no header/control; badge unchanged when a busy section is collapsed.
- [x] 4.3 Run `pnpm --filter @lunma/extension verify` (tsc, biome incl. layer DAG, svelte-check, lint:styles, vitest) and fix any failures.
- [x] 4.4 Run `pnpm verify` at the workspace root to confirm the full gate is green.
