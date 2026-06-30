## Context

`dedupePersistedState` (`apps/extension/src/shared/chrome/storage.ts`) is the
read-path self-heal: a pure function run by `readPersistedState` on every load
(and on `salvaged` recovery) that strips duplicate **ids** from the keyed
collections — `spaces` (by Space id), each `pinnedBySpace[spaceId]` tree (node
ids + folder children share one seen-set), and each instance's `tempTabIds` — so
a corrupted/legacy duplicate id never reaches the sidebar's keyed `{#each}` (which
throws `each_key_duplicate` and crashes the sidebar). It returns a new state only
when something changed, and the caller writes the healed envelope back.

The Space-name uniqueness invariant (`spaces-and-tabs` "Space names are unique")
is enforced at every *mutation* site — `createSpace`/`renameSpace` throw, while
the non-interactive mints (fresh-install conversion, restore-from-trash, boot
migration) and the Chrome-rename mirror auto-disambiguate via
`disambiguateSpaceName`. But nothing reasserts it on **read**. Investigation of
the PR #49 report confirmed the consequence: storage held no quarantine records
(so no corruption path fired), yet duplicate same-named `"Default"` Spaces
persisted and survived every restart, because the load path de-dupes ids but not
names. This change adds the missing read-path enforcement.

## Goals / Non-Goals

**Goals:**

- A persisted state holding two or more same-normalized-name Spaces self-heals to
  distinct names on the next load, and the healed envelope is written back.
- Zero data loss: every Space, and every `pinnedBySpace` / `spaceInstancesByWindow`
  entry that references it, is preserved — only the colliding record's display
  `name` changes.
- Reuse the established helpers (`normalizeSpaceName`, `disambiguateSpaceName`) and
  the existing `changed`/write-back plumbing — no new public surface.

**Non-Goals:**

- Finding or fixing the *first* write path that produced the duplicates. The
  reporter's original state was wiped by an extension reinstall, so the origin is
  unrecoverable; this change makes the symptom non-persistent regardless of origin.
- Merging duplicate Spaces (folding their tabs/instances into one). Disambiguating
  is strictly safer — merge semantics for genuinely-distinct Spaces that happen to
  share a name would risk losing a Space the user still wants.
- Any change to the mutation-time enforcement, the schema, or the UI.

## Decisions

**Disambiguate, don't drop or merge.** A later same-name Space is renamed
(`"Default"` → `"Default 2"`), not removed. Dropping it would delete the user's
pinned tabs under that Space; merging would require rewriting `pinnedBySpace`,
`spaceInstancesByWindow`, `activeSpaceByWindow`, and trash references and could
silently fuse two Spaces the user means to keep separate. Renaming preserves all
references untouched (they key by id, not name) and mirrors exactly what
`restoreSpaceFromTrash` already does for a non-interactive collision.

**Run inside `dedupePersistedState`, after the id-dedup.** The name pass operates
on the already-id-deduped `spaces` list so it never disambiguates against a
duplicate-id ghost that the same call is about to drop. It folds into the existing
`changed` flag and the existing single write-back — no new call site, no second
storage write. Alternative considered: a separate `dedupeSpaceNames` step in
`readPersistedState`; rejected because it would duplicate the change-tracking and
write-back logic and add a second pass over `spaces`.

**First-occurrence-wins, order-stable, against a running taken-set.** Iterate
`spaces` in array order; seed `taken` with each kept Space's normalized name; for a
collision, call `disambiguateSpaceName(space.name, taken)` and add the *result's*
normalized form to `taken` before continuing. This makes the pass deterministic and
idempotent (re-running on the healed output finds no collisions and renames
nothing — the spec's idempotence clause) and correctly skips suffixes already in
use elsewhere in the list (e.g. a pre-existing `"Default 2"` pushes the second
`"Default"` to `"Default 3"`).

**Build a new `spaces` array only when a name actually changed**, consistent with
the function's existing "return the same reference when nothing changed" contract,
so an already-unique state pays no allocation and triggers no write-back.

## Risks / Trade-offs

- [A healed rename changes a name the user recognises] → The rename only fires when
  two Spaces are *already* indistinguishable in the switcher (same displayed name);
  turning one into `"Default 2"` makes them distinguishable, which is the desired
  outcome, and the user can rename freely afterward. No silent data change beyond
  the visible de-duplication.
- [Interaction with the id-dedup ordering] → The name pass consumes the id-dedup's
  output, so the two never fight; covered by an idempotence test and a combined
  id+name fixture.
- [Performance] → O(n) over `spaces` with a `Set`; `spaces` is tiny (handful of
  Spaces). Negligible, and skipped entirely when no collision exists.

## Migration Plan

No data migration and no schema bump — this is a read-path heal, not a stored-shape
change. It deploys with the extension build; on the first load after update, any
on-disk duplicate-named state is healed and written back. Rollback is safe: an
older build simply stops healing (the duplicates would reappear), and a healed
state (`"Default"` + `"Default 2"`) is valid under every version.

## Open Questions

None.
