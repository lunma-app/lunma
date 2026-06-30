## Why

A user whose persisted state ends up holding two or more Spaces with the same
normalized name (e.g. repeating `Default … Default … Default` pills in the Space
switcher) sees those duplicates **survive every restart** and resist manual
deletion. The Space-name uniqueness invariant is enforced at every *mutation*
entry point (`createSpace`, `renameSpace`, `restoreSpaceFromTrash`, the
fresh-install group→Space conversion, the Chrome-side rename mirror) but is never
re-asserted on the **load path**: `dedupePersistedState` de-duplicates Spaces by
`id` only, so once any path (a multi-boot interleave, a since-changed older build,
hand-edited storage) writes two same-named Spaces to disk, they load unchanged
forever and render as duplicate switcher pills. This change closes that gap so a
duplicate-named state **self-heals on the next load** — directly removing the
duplicate pills the user sees.

This is the durable cure behind the PR #49 symptom (`fix/duplicate-default-spaces`):
that change stopped one *regeneration* trigger (gating fresh-install conversion on
a clean read), but the persistence is independent of corruption — investigation of
the reporter's storage found no quarantine records at all, so the duplicates were
genuinely persisted Space records, not a corrupt-recovery artifact.

## What Changes

- `dedupePersistedState` (the read-path self-heal in
  `apps/extension/src/shared/chrome/storage.ts`) gains a normalized-name pass over
  `state.spaces`, run alongside the existing id-dedup: first occurrence of each
  normalized name wins; a later Space whose `normalizeSpaceName` collides is
  **auto-disambiguated** (`"Default"` → `"Default 2"`) using the existing
  `disambiguateSpaceName`/`normalizeSpaceName` helpers. No Space and no pinned
  tabs/instances are dropped — only the colliding record's display name changes.
- A rename is a change, so the existing `changed` flag is set and the healed
  envelope is written back on load (same write-back the id-dedup already triggers),
  removing the duplicate from disk on first sight rather than only after the next
  mutation.
- The `spaces-and-tabs` "Space names are unique" requirement is extended to name
  the load-path self-heal as a fourth non-interactive auto-disambiguate origin,
  with a regression scenario.

No schema, type, message-bus, or UI surface changes. No new dependency.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `spaces-and-tabs`: the "Space names are unique" requirement's non-interactive
  auto-disambiguate enforcement (origin list + a load-path self-heal scenario) —
  `dedupePersistedState` is added as a path that reasserts the invariant on read.

## Impact

- **Code:** `apps/extension/src/shared/chrome/storage.ts` (`dedupePersistedState`
  only). Imports `disambiguateSpaceName` from
  `apps/extension/src/shared/space-names.ts` (already the home of
  `normalizeSpaceName`).
- **Tests:** `apps/extension/src/shared/chrome/storage.test.ts` — a regression that
  a persisted state with two `"Default"` Spaces loads as `"Default"` + `"Default 2"`
  with `changed === true`.
- **Docs:** no `docs/` file changes — the load-path self-heal is a storage-layer
  detail already implied by `docs/architecture.md`'s persistence section; the
  normative behaviour lives in the `spaces-and-tabs` spec. (`docs/` left untouched.)
- **No new public types, files, methods, or fields.** No `src/ui/` primitives
  added or composed (no user-visible surface markup changes).
- **No breaking changes.** Existing single-name states load identically; the heal
  only fires when a normalized-name collision is already present on disk.
