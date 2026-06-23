## Context

A multi-source smart folder (a smart `PinNode` with ≥2 `sources`) renders, when
expanded, every section's rows in one flat `.children` column. Each source gets a
`SmartSectionHeader` (`apps/extension/src/sidebar/SmartSectionHeader.svelte`) —
today a static, `aria-hidden="true"` divider showing the source icon, host, and
an optional attention count. The only collapse affordance is folder-level:
`FolderRow`'s chevron toggling the whole `.children` block via the per-window
ephemeral `expandedFoldersByWindow` map (`SidebarLocalState`, mutated by
`store.setFolderExpanded`, projected through `SidebarState`).

There is no way to quiet one section while keeping the rest open. This change
makes the existing section header an interactive disclosure that collapses just
its own section, reusing the exact persistence shape and idioms already proven by
folder-level collapse.

Constraints:
- Layer DAG: the sidebar cannot import from `background/`; `sourceKey` is already
  re-derived locally in `SmartFolder.svelte` (`${source}:${host}`) and stays so.
- Component-library policy: section header is a feature component; it composes the
  `Icon` primitive only. No new primitive, no re-rolled chrome.
- Visual-quality policy: the disclosure must feel alive (chevron tween, body
  collapse) and hold reduced-motion + WCAG-AA.
- The flat-layout requirement from the proposal: no new indentation rail.

## Goals / Non-Goals

**Goals:**
- Per-section collapse/expand on multi-source folders, driven from the section
  header, independent per section.
- Collapsed section keeps its header and attention count visible; body hidden.
- Per-window, ephemeral state — same lifecycle as folder expand/collapse.
- Flat layout preserved — no added indent.
- Accessible disclosure (button, `aria-expanded`, `aria-controls`, label) and
  reduced-motion support.

**Non-Goals:**
- Single-source folders gaining a header or collapse control (unchanged).
- Persisting collapse across reloads/SW restarts (explicitly ephemeral).
- Collapsing/hiding individual rows within a section (feed read-row hiding via
  `hideRead` is a separate, untouched mechanism).
- Any change to the folder-level badge, polling, runtime, or connector logic.

## Decisions

### D1 — Reuse the per-window ephemeral collapse pattern, keyed by folderId + sourceKey

Add `collapsedSmartSectionsByWindow?: { [windowId: WindowId]: { [folderId: FolderId]: { [sourceKey: string]: boolean } } }`
to `SidebarLocalState` (`shared/types.ts`), with a sidebar-only mutator
`setSmartSectionCollapsed(windowId, folderId, sourceKey, collapsed): void` on the
store (mirroring `setFolderExpanded`), and a `SidebarState` projection so
`SmartFolder.svelte` can read it.

- **Default expanded.** Absence of an entry means expanded (`collapsed === false`),
  so a freshly rendered folder shows all sections — matching today and avoiding a
  migration/seed concern. `true` means collapsed.
- **Why folderId + sourceKey, not a flat key.** Mirrors `expandedFoldersByWindow`'s
  nesting (`[windowId][folderId]`) and keeps cleanup obvious; `sourceKey` is the
  stable per-section identity already used by runtime, bindings, and read-state.
- **Alternative considered — persist in `AppState` (schema-migrated).** Rejected:
  collapse is a transient view preference, the user chose ephemeral per-window, and
  persisting would force a schema bump + broadcast for zero durable value. Folder
  expand/collapse set the precedent (ephemeral).
- **Alternative considered — single-window (not per-window).** Rejected: the same
  Space/folder can be open in multiple windows (a Lunma trait Arc lacks); folder
  collapse is already per-window, so sections match.

### D2 — Section header becomes a disclosure `<button>`, composing `Icon`

`SmartSectionHeader.svelte` gains `collapsed: boolean` and `onToggle: () => void`
props, renders as a `<button type="button">` (was a static `<div aria-hidden>`),
and adds a leading chevron `Icon` that rotates 0°→90° on expand — the same
`chevron-right` glyph + rotation idiom as `FolderRow`, for visual consistency.
`aria-expanded={!collapsed}`, `aria-controls` referencing the section body's id,
and an accessible label (`"{host} section, {count} items, {collapse|expand}"`).
The existing source icon, host label, and count are retained; the count stays
visible while collapsed.

- **Why not a new `Disclosure` primitive.** FolderRow already owns the
  folder-level disclosure with bespoke chrome; a section header is a distinct,
  lighter feature row. Extracting a shared primitive now would be speculative —
  composing `Icon` (as today) is the policy-correct minimum. If a third disclosure
  surface appears, that's the moment to extract a primitive.
- **Order/identity.** The header keys and section order are unchanged
  (`{#each node.sources as cfg (sourceKey(cfg))}`).

### D3 — Gate the section body, keep the header; flat layout preserved

In `SmartFolder.svelte`, each section's body (ghost rows, sign-in / needs-access
rows, result rows, empty/error notes, and the feed reading-controls) is wrapped so
that when the section is collapsed the body is hidden. The header always renders.
The section header and rows keep their current padding (`SmartSectionHeader`
`padding-left: var(--space-3)`, rows `padding-left: var(--space-3)`, both inside
`.children`'s `padding-left: var(--space-4)`) — no extra indent is introduced, so
the tree stays flat per the proposal.

- **Hide strategy — conditional render (`{#if !collapsed}`) for the body.**
  Chosen over a CSS `max-height: 0` collapse for the whole body because section
  bodies vary in height and content (ghost vs items vs notes), and the existing
  feed per-row `max-height` animation already coexists; a height-animated wrapper
  over a variable, already-animating body risks jank. The chevron rotation
  supplies the motion cue; the body cross-fades via the existing
  `smart-open`-style entrance on re-expand. Reduced-motion disables the chevron
  tween and any entrance animation.
- **Folder badge unchanged.** `badge` keeps summing every section's attention
  count regardless of collapse, so a collapsed-but-busy section still contributes
  to the folder badge (and its own header count stays visible).

### D4 — Multi-source only

The collapse control renders only inside the existing `node.sources.length >= 2`
branch. Single-source folders never render a `SmartSectionHeader` and so gain no
control — preserving the spec's "single-source renders identically" guarantee.

## Visual language

- **Disclosure chevron.** `Icon name="chevron-right" size={12}` leading the
  header, in `--text-dim` (matching the muted header weight). Rotates `0deg`
  (collapsed) → `90deg` (expanded) over `var(--motion-fast)` with
  `var(--ease-standard)` — lighter/faster than the folder chevron (whose row is
  taller and heavier), keeping the section header subordinate to the folder row in
  the hierarchy.
- **Header as control.** Resting: transparent background, host in `--text-muted`,
  count in `--text-dim` (unchanged from today). Hover: `--surface-2` background +
  host lifts to `--text` — the same hover language as `.result-row`/`.signin-row`,
  so the now-interactive header reads as clickable. Active (press):
  `scale(var(--press-scale))`. Focus-visible: `--focus-width` solid
  `--focus-color` at `--focus-offset` — identical focus geometry to the result
  rows.
- **Body collapse/expand.** On expand, the section body uses the existing
  `smart-open` entrance (`var(--motion-base)` `var(--ease-emphasised)`,
  translateY + fade) already defined for `.children`; on collapse it is removed
  from the flow. The header's count is the persistent at-a-glance signal while
  collapsed.
- **Hierarchy.** Three tiers stay legible: folder row (tallest, `FolderRow`
  chevron) > section header (12px, muted, light chevron) > result rows. No new
  indentation rail — collapse is signalled by chevron state, not by indent depth
  (the deliberate "flat" divergence from a classic indented tree).
- **WCAG-AA.** Header text tokens (`--text-muted`, `--text-dim`) are unchanged and
  already AA on the sidebar substrate; the added hover state lifts contrast, never
  lowers it.
- **Reduced-motion.** Under `prefers-reduced-motion: reduce`, the chevron rotation
  and the body entrance animation are disabled (extend the existing
  reduced-motion block in `SmartFolder.svelte`; add one in `SmartSectionHeader`).

## Risks / Trade-offs

- **[Collapsed section hides a sign-in / needs-access / error affordance]** → The
  header count and the folder badge still surface attention; the user explicitly
  collapsed that section, and expanding reveals the affordance immediately. No
  state is lost. Acceptable and consistent with folder-level collapse hiding the
  same affordances today.
- **[Ephemeral state resets on SW restart / sidebar reopen]** → By design (user
  chose ephemeral). Sections default to expanded after a restart — the same
  behaviour folder collapse has; no surprise relative to existing patterns.
- **[Header now focusable adds a tab stop per section]** → Intended: the
  disclosure must be keyboard-reachable. Sections are few (≥2, capped by source
  count), so the added tab stops are minimal and semantically meaningful.
- **[Conditional-render body loses per-row exit animation on collapse]** → The
  body is removed without a body-level exit tween; the chevron rotation carries
  the motion. Chosen over height-animating a variable, already-animating body to
  avoid jank (D3). Re-expand keeps the entrance animation.

## Migration Plan

No data migration: the new state is sidebar-local and ephemeral; `AppState` and
the persisted schema are untouched. Rollout is a pure UI change. Rollback is
removal of the field/mutator/props with no stored-data consequence.

## Open Questions

None — scope (multi-source only), persistence (per-window ephemeral), and
indentation (flat) were confirmed with the user before drafting.
