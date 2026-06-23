## Why

A multi-source smart folder stacks every section's rows under one another the
moment the folder is expanded — a GitLab queue, a GitHub queue, and an RSS feed
all spill at once, and the only way to quiet a section you don't care about
right now is to collapse the whole folder (losing the sections you *do* want).
This change lets a user **collapse an individual section** (a "filter" queue or
a "feed") in place from its section header, keeping the other sections open —
so a busy folder can be tuned to exactly the work in view. The section header
keeps its attention count while collapsed, so a collapsed section still reads at
a glance. Critically, the disclosure is **flat**: collapsing a section does not
push its rows into a deeper indent — header and rows stay on the same rail, so
the tree never grows a second nesting level.

## What Changes

- The per-source `SmartSectionHeader` (rendered only on folders with ≥2 sources)
  becomes an **interactive disclosure control**: a button with a leading
  chevron that toggles its section open/closed, with `aria-expanded` /
  `aria-controls` and a descriptive accessible label. It is no longer
  `aria-hidden`.
- A collapsed section hides its body (result rows, ghost/empty/error/sign-in/
  needs-access rows, and the feed reading-controls) while keeping the header —
  including its count — visible. The folder-level badge is unchanged (it keeps
  summing every section regardless of collapse).
- Collapse state is **sidebar-local, per-window, ephemeral** — keyed by
  `folderId` + `sourceKey`, never persisted, never broadcast — mirroring the
  existing per-window folder expand/collapse. Sections default to **expanded**.
- The layout stays **flat**: the section header and its rows remain at today's
  indentation; the disclosure affordance adds no nesting indent.
- Single-source folders are unchanged (no section header, no collapse control).

This applies only to **multi-source** folders, which already render section
headers; single-source folders render identically to today.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `smart-folders`: the section-header rendering requirement gains interactive
  per-section collapse (a new requirement plus a modification of the existing
  "Smart-folder rendering and the one-glyph restraint" requirement to describe
  the disclosure-control header and collapsed-body behaviour).

## Impact

- **Types** (`apps/extension/src/shared/types.ts`): new optional field on
  `SidebarLocalState` —
  `collapsedSmartSectionsByWindow?: { [windowId: WindowId]: { [folderId: FolderId]: { [sourceKey: string]: boolean } } }`.
  No `AppState`/schema change (ephemeral, sidebar-only), so no storage migration.
- **Store** (`apps/extension/src/shared/store.svelte.ts`): new sidebar-only
  mutator `setSmartSectionCollapsed(windowId, folderId, sourceKey, collapsed): void`,
  alongside `setFolderExpanded`.
- **Store projection** (`apps/extension/src/sidebar/store-context.svelte.ts`):
  `SidebarState` exposes the new field/reader.
- **Components**:
  - `apps/extension/src/sidebar/SmartSectionHeader.svelte` — gains `collapsed`
    and `onToggle` props, a chevron, `aria-expanded`/`aria-controls`/label;
    becomes a `<button>`. Composes the existing `Icon` primitive only (chevron +
    source icon); **no new primitives**.
  - `apps/extension/src/sidebar/SmartFolder.svelte` — reads per-section collapse
    state and gates each section's body on it; wires the header toggle.
- **Docs**: no `docs/` file changes — this is sidebar UI behaviour within the
  existing architecture and stack. `docs/architecture.md` and
  `docs/tech-stack.md` are left untouched. The OpenSpec `smart-folders` spec is
  updated (delta in this change).
- **Tests**: `SmartFolder` / `SmartSectionHeader` harness + Vitest coverage for
  toggle, body-hidden-when-collapsed, count-stays-visible, per-window
  independence, single-source unaffected, and reduced-motion.
