# Design

## Context

`loadState()` returns `{ state, outcome }` with `outcome ∈ 'clean' | 'recovered'
| 'salvaged' | 'unavailable'` (storage-and-migrations capability). The boot chain
in `apps/extension/src/background/index.ts` derives `freshInstall` from it and
passes it to `reconcileTabGroupsOnBoot(store, freshInstall)`, which on a fresh
install mints one Space per existing Chrome tab group.

The defect: `freshInstall = state.spaces.length === 0 && !bootUnavailable`. Three
distinct outcomes leave `state.spaces` empty:

- `clean` from an absent/empty key — a **genuine** first install (intended).
- `recovered` — a corrupt payload was quarantined and the layer fell back to
  `createInitialState()` (empty spaces).
- `salvaged` with no Spaces recovered — partial corruption recovery.

The current predicate only excludes `unavailable`, so `recovered`/`salvaged`
masquerade as first installs and trigger group→Space conversion over real data.

## Decision

Gate conversion on the **positive** signal of a genuine first install:

```ts
freshInstall = store.state.spaces.length === 0 && outcome === 'clean';
```

`outcome === 'clean'` is returned only for an `ok` read (which has Spaces, so the
`length === 0` conjunct fails) or a genuinely-empty/absent key (the real first
boot). `recovered`, `salvaged`, and `unavailable` are all excluded — none can
fabricate Spaces from the user's tab groups. This reuses the existing outcome; no
new `loadState` field or `LoadOutcome` member is added.

`ensureAtLeastOneSpace` is unchanged: a `recovered` boot still mints the single
`'Default'` (the at-least-one-Space invariant) and persists, but no longer
mass-converts tab groups — so a false corruption verdict yields one Default
rather than a wall of regenerated Spaces.

## Alternatives considered

- **Thread a `firstInstall` boolean / new outcome from `loadState`.** Rejected:
  the existing `outcome` already distinguishes the cases; adding plumbing changes
  a second spec requirement (the loadState surface) for no gain.
- **Make `recovered` preserve the on-disk payload (treat like `unavailable`:
  no mint, no persist-over).** Deferred. This would fully protect data on a
  *false* corruption verdict, but it reverses a deliberate design choice
  ("corrupt junk → fresh start") and leaves genuine unsalvageable corruption
  stuck on an empty UI — a product/UX call that should follow pinning the real
  trigger, not precede it.
- **Name-normalized dedup of Spaces on read.** Deferred. With conversion gated,
  no new duplicates are created; pre-existing duplicates can be deleted once and
  now stay deleted. A read-path name-collapse would also need content-merge
  semantics for non-empty duplicates — out of scope here.

## Residual / follow-up

The underlying trigger — a user's valid state failing the strict
`AppStateV17Schema` whole-state parse (`z.strictObject` top-to-bottom, so one
unexpected key fails everything) and being declared `corrupt` — is unaddressed.
This change stops the destructive regeneration symptom regardless, but the cure
(stop the false `corrupt`, or make `corrupt` non-destructive) needs the
quarantine `zodIssues` to identify the failing field.
