## Context

"Smart folders" today are a `smart` `PinNode` carrying `sources: SmartSourceConfig[]`,
rendered in the sidebar and a full page (`launcher/folderpage`), with results in the
ephemeral `AppState.smartFolders` slice and persisted `smartItemBindings` /
`smartReadState`. The full reinvention (typed Lenses with per-kind entities, pages,
and cross-entity links) is captured in `docs/lenses-vision.md`. This change is **phase
1**: the rename + the `lensKind` seam, with one kind (`general`) reproducing today's
behaviour. It introduces no entities, adapters, or pages — only the vocabulary and the
field that later phases consume.

Prerequisite (done, committed `93b28bb`): the two completed-but-unarchived smart-folder
changes (`smart-folder-page`, `collapsible-smart-folder-sections`) were archived so the
living `smart-folders` spec is the complete, correct basis for the rename.

## Goals / Non-Goals

**Goals:**
- One vocabulary: "Lens" everywhere — code, types, bus, persisted keys, specs, surfaces,
  copy. No `smart` identifier or "smart folder" string survives.
- A folder-level `lensKind` field with a closed union (`'general'` only here), widened
  by later typed-kind changes.
- A single forward migration that turns every existing smart folder into a `general`
  lens with byte-for-byte identical behaviour.
- Stay green: the rename is mechanical and fully covered by `pnpm verify` + `pnpm test:e2e`.

**Non-Goals:**
- Any typed entity (`Change`, `Ticket`, …), adapter enrichment, or per-kind page.
- Cross-entity references/links (L0–L2).
- Restructuring `LensItem` (RSS rich fields stay flat; the `article` bag is `reading-lens`).
- Enforcing single-kind homogeneity beyond the union (only `general` exists yet).
- A kind picker in the editor (the editor just stamps `lensKind: 'general'`).

## Decisions

**D1 — Capability rename = ADD-all to `lenses` + REMOVE-all from `smart-folders`.**
OpenSpec has no first-class rename; the change's `specs/` delta creates a new `lenses`
capability whose `## ADDED Requirements` carry every current `smart-folders` requirement
(lens vocabulary) plus the new `lensKind` requirement, and a `smart-folders` delta whose
`## REMOVED Requirements` lists all current requirements so the capability retires on
archive. *Alternative:* keep the capability id `smart-folders` and MODIFY requirements
in place — rejected per the user's "everything becomes lens" (no legacy id). Cost is
similar either way (the whole spec is rewritten); this keeps the id consistent.

**D2 — `lensKind` is a closed union (`LensKind = 'general'`), schema-validated.**
Mirrors the existing `SmartSource`/`SmartQuery` closed-union precedent (widening is a
schema bump). *Alternative:* an open `string` — rejected; loses exhaustiveness checks
and lets typo kinds persist.

**D3 — Value unions keep their string values; only type *names* rename.**
`'gitlab' | 'github' | 'jira' | 'rss'` and `'authored' | 'assigned' | 'review-requested'`
stay as persisted values; the types rename to `LensProvider` / `LensQuery`. So the
migration touches the node discriminant, the new `lensKind` stamp, and persisted *key*
names — **not** the source/query string values. Keeps the migration small and the
connector wire formats untouched.

**D4 — One forward migration (`storage-and-migrations`), forward-only.**
Bump `SCHEMA_VERSION` by one; the migration step: (a) for every `PinNode` with
`kind === 'smart'`, set `kind = 'lens'` and `lensKind = 'general'`; (b) rename top-level
persisted keys `smartItemBindings → lensItemBindings`, `smartReadState → lensReadState`.
The ephemeral `smartFolders → lenses` slice is stripped before persist, so it needs only
the code rename. *Alternative:* dual-read old keys as aliases — rejected (perpetuates the
old vocabulary; migrations are the project's one-way door).

**D5 — Backup envelope (`data-backup`) only renames references.** It already excludes the
machine/ephemeral slices (`smartItemBindings`, `smartFolders`); the rename changes their
names in the exclusion list and the "smart-folder" prose, not the envelope shape. Backups
written pre-rename import through `runMigrations`, so they upgrade into `general` lenses.

**D6 — RSS rich fields stay flat on `LensItem`.** `excerpt`/`imageUrl`/`publishedAt`
remain top-level (pure rename). They fold into an `article` data bag in `reading-lens`,
where the `general → reading` page split happens. Avoids restructuring in a rename change.

**D7 — Engine/file moves follow the identifier rename.** `background/smart-folders.ts` →
`background/lenses.ts`; `sidebar/SmartFolder*.svelte` → `Lens*.svelte`;
`launcher/folderpage/*` → `launcher/lenspage/*`. The manifest + `vite.config.ts` rollup
input for the page point at the new path. *Alternative:* keep filenames, rename only
symbols — rejected; leaves "folder"/"smart" in paths, violating D-goal "no smart survives".

## Risks / Trade-offs

- **Archive may not auto-delete an all-REMOVED capability spec** → verify at apply time
  whether `openspec archive` removes `openspec/specs/smart-folders/` once every
  requirement is REMOVED; if it leaves an empty stub, the tasks include an explicit
  cleanup step (and `docs/architecture.md` records `lenses` as the sole capability).
- **Large mechanical diff → regression risk** → the rename is identifier-by-identifier
  with the full gate (`tsc`, `biome` incl. the layer DAG, `svelte-check`, `stylelint`,
  `vitest` 2297 tests, Playwright e2e) as the safety net; no logic changes, so any red
  test is a rename miss, not a behaviour change.
- **Migration correctness** → add fixtures: a prior-version envelope with `smart` nodes +
  `smartItemBindings` + `smartReadState` migrates to `lens` nodes (`lensKind: 'general'`)
  + renamed keys; assert idempotence and that source/query values are untouched.
- **Other active changes may name smart terms** → `extension-store-publish`,
  `github-repo-and-ci`, `open-source-public-launch` are active; if any carry deltas
  touching `smart-folders`/`storage-and-migrations`/bus commands they must rebase onto the
  Lens names after this lands. Verified during specs authoring (see Open Questions).
- **Cross-app rename** → `apps/site` marketing copy ("smart folder" → "lens") must keep
  the WCAG-AA contrast test + static prerender green (`apps/site` verify).

## Migration Plan

1. Land specs/docs deltas in this change; implement behind the existing schema-version
   machinery. Forward-only — no runtime rollback (consistent with every prior Lunma
   migration). Dev rollback = revert the change before release.
2. Order at apply time: (a) types + schemas + migration + migration tests; (b) store +
   bus + messages + background engine identifier rename; (c) surface file moves
   (sidebar, page) + manifest/vite; (d) test/harness/e2e renames; (e) `apps/site` copy;
   (f) docs; (g) verify gate green; (h) archive applies the capability rename.
3. The migration runs once on next load; existing users see no behaviour change, only the
   word "Lens" in the menu/editor/page copy.

## Open Questions

- Does `openspec archive` cleanly retire an all-REMOVED capability (delete the spec dir),
  or leave an empty file needing manual removal? Resolve before archive (tasks cover both).
- Do the three other active changes carry smart-folder deltas that need rebasing? Confirm
  while authoring the specs deltas; if yes, note the rebase as a follow-up on each.

## Visual language

This change ships **no visual change** — it is a rename. Every design token, motion
timing/easing, glass/aurora/glow recipe, layout, hierarchy, and interaction state
(hover, active, focus-visible, disabled, loading/ghost, empty, error, signed-out,
needs-access) on the editor, the sidebar lens rows/section headers, and the full page is
**preserved exactly** as the smart-folder surfaces have them today (the disclosure
crossfade, the 150–250ms section/card tweens, the `--text-*` ramp for headers, the
`prefers-reduced-motion` collapses, WCAG-AA at every Colour intensity). The only
user-visible delta is **copy**: "smart folder" → "lens" in the pinned-header menu
("New lens…", "Open as page"), the editor title/labels, the page header, and the calm
empty/error strings (e.g. section/feed copy). No new primitive is added and none is
re-rolled: `LensEditor`/`Lens`/`LensSectionHeader`/`LensPage` compose precisely the
`ui/` primitives their smart-folder predecessors compose. The deliberate, forward-looking
note (not built here): the Lens *name* is the first user-visible step toward the typed,
content-fitted pages in `docs/lenses-vision.md` — the rebrand earns its keep when those
land.
