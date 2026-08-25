## Context

See [proposal.md](proposal.md) — Why.

Three facts shape the approach:

1. **Icons are persisted untyped.** `Space.icon` and the `kind: 'folder'`
   `PinNode.icon` are `z.string()` in
   [apps/extension/src/shared/schemas.ts](../../../apps/extension/src/shared/schemas.ts).
   The narrow `IconName` union is applied only at the bus boundary
   (`IconNameSchema = z.enum(ICON_NAMES)` in `bus.ts`). So a legacy name on disk
   still *validates* — nothing throws, the icon just disappears.
2. **The loader allowlist is generated, and guarded.**
   `apps/extension/src/ui/icon-loaders.generated.ts` is emitted by
   `scripts/gen-icon-loaders.mjs` from `ICON_NAMES` ∪ icon-name literals found in
   source, intersected with the names lucide actually ships.
   `src/ui/icon-loaders.generated.test.ts` re-derives both sides independently and
   fails `pnpm verify` when they disagree — that guard is what surfaced the five
   removals.
3. **Lucide publishes the rename map.** `@lucide/svelte@1.31.0` ships
   `dist/aliases/aliases.js`, where each removed name is re-exported with
   `@deprecated … use {@link <NewName>} instead`. The five successors are read
   from there, not guessed.

## Goals / Non-Goals

**Goals:**

- No user loses a chosen Space or folder icon across the `@lucide/svelte`
  1.23.0 → 1.31.0 bump.
- The picker keeps offering the same number of icons.
- The migration is safe to run over already-migrated and over hostile data.

**Non-Goals:**

- Automating future lucide renames. This change hard-codes one map for one bump;
  a generic "read lucide's alias table at build time" mechanism is speculative
  until a second rename actually lands.
- Preserving the five *legacy* names as accepted input at the bus boundary. Once
  `ICON_NAMES` drops them, `bus.ts` rejects a `changeSpaceIcon` payload carrying
  one — correct, since no UI can produce one after the picker is regenerated.
- Repainting or re-drawing anything. Lucide redesigned the face glyphs; Lunma
  takes them as shipped.

## Decisions

**D1 — Remap at the storage boundary, not at render time.**
The alternative was an alias table inside `Icon.svelte` that resolves a legacy
name on the fly, leaving disk data untouched. Rejected: it makes the legacy name
immortal (every read pays the indirection forever), it leaves the stored value
disagreeing with `ICON_NAMES` so the bus would reject a round-trip of the user's
own Space, and it duplicates a concern the migration chain already owns. A v18
migration rewrites once, at boot, and the problem is gone.

**D2 — `CURRENT_SCHEMA_VERSION` 17 → 18 with a real transform.**
The alternative was to piggyback the remap onto v17 or run it outside the chain
(e.g. a one-shot boot step). Rejected: the chain is append-only and is the single
documented place persisted data is rewritten; an out-of-band step would run on
every boot with no version gate to stop it. The bump also makes a downgrade
detectable via the existing version gate, matching the v9/v11/v13/v15 transform
precedent.

**D3 — `AppStateV18Schema` is a structural alias of `AppStateV17Schema`.**
No shape changes — only the *values* an already-`z.string()` field may hold. This
follows the V15/V16 alias precedent in `schemas.ts` rather than cloning the object.

**D4 — Unknown names pass through untouched; no default substitution.**
The alternative was to coerce anything unresolvable to `DEFAULT_ICON` (`'star'`).
Rejected: that would silently destroy a user's choice on the *next* lucide rename
before anyone noticed, and it would overwrite data this change has no mandate to
touch. `Icon.svelte` already degrades an unknown name to a blank render plus one
console warning; that behaviour stays the safety net.

**D5 — The map lives in `migrations.ts`, module-private.**
`RENAMED_ICONS: Record<string, string>` is not exported. Nothing outside the
migration needs it, and exporting it would invite a render-time consumer —
exactly the D1 shape that was rejected. This is the only new symbol the change
introduces.

**D6 — The delta also repairs the spec's account of v17.**
`openspec/specs/storage-and-migrations/spec.md` still says the current version is
16, and the archived `persist-lens-article-layout` requirement describes itself as
version 15 (it landed at 17 after v15/v16 were taken). Restating the envelope and
chain requirements for v18 without correcting v17 would archive that error
permanently, so the delta states the real chain. Agreed with the user before
writing.

**D7 — Biome 2.5.8's reformats ride along.**
The grouped bump raises Biome 2.5.3 → 2.5.8, whose formatter rewraps a `test.each`
call in `coordinator.home-tab.test.ts` and now requires `<T,>` rather than `<T>`
for a generic arrow function inside a `.svelte` file (`PinnedTabs.svelte`). Both
are pure formatting, neither is autofixable in the `.svelte` case, and splitting
them into a separate commit would leave `biome check` red in between. They land
here.

**Docs.** No `docs/` file names any of the five icons or pins `@lucide/svelte`
below its major line, so no doc update is implied.
[docs/architecture.md](../../../docs/architecture.md) and
[docs/tech-stack.md](../../../docs/tech-stack.md) are deliberately untouched.

## Risks / Trade-offs

- **The five successors are lucide's redesigned glyphs, not pixel-identical
  replacements** (only `history → rotate-ccw-clock` matches the old path data
  exactly; the four faces were redrawn) → A user's icon changes appearance
  slightly. Accepted: it is the upstream icon under its new name, and the
  alternative — vendoring the old SVGs — forks the icon set for cosmetics.
- **`mic-signal` is the least self-evident of the five** → Taken from lucide's own
  `@deprecated … use {@link MicSignal} instead` alias for `Podcast`, so it is
  upstream's mapping rather than a judgement call.
- **A user on a build older than v18 reading v18 data** → The existing version
  gate quarantines it, which is the designed behaviour for every downgrade and the
  reason the version is bumped at all.
- **A future lucide bump removes more names** → The generated-loader test fails
  `pnpm verify` and surfaces it before release, exactly as it did here. That guard,
  not a generic alias mechanism, is the durable protection.

## Migration Plan

1. Bump `@lucide/svelte` to `1.31.0`; `pnpm install`.
2. Rename the five entries in `ICON_NAMES`, keeping each name in its existing alphabetical neighbourhood (the list is near-sorted, not strictly sorted).
3. Update the one non-generated source literal
   (`apps/extension/src/sidebar/PinnedTabs.svelte`, the "Reset name" menu item).
4. `pnpm gen:icons` to regenerate the loader allowlist.
5. Add `RENAMED_ICONS` + the `{ toVersion: 18 }` entry; raise
   `CURRENT_SCHEMA_VERSION`; alias `AppStateV18Schema`.
6. `pnpm verify` — the generated-loader guard and `assertMigrationsTerminal` both
   have to go green.

**Rollback:** revert the commit. Data already rewritten to v18 stays on the new
names, which the reverted build cannot resolve — so a rollback is only clean
*before* release, and after release the forward fix is preferred. This is true of
every transform entry in the chain and is not new risk.
