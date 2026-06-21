## Context

`AppStateV7Schema` declares `liveTabsById` and `smartFolders` as `.optional()`,
so `z.infer<typeof AppStateV7Schema>` produces those fields as `T | undefined`
while `AppState` declares them as non-optional `Record<…>`. The type equivalence
guard (`_schemaMatchesAppState`) is wrapped in a `Persisted<T>` helper that
strips both fields before comparing, bypassing the drift. Every caller that
receives a `SafeParseReturnType<AppStateV7>` must cast `stateResult.data as
unknown as AppState` to cross the gap — 5 sites today.

Separately, `Space.color` and `SpaceSchema.color` are typed as bare `string`
even though the only valid values are the 9 members of the `SpaceColor` union.
Every call site that passes `space.color` to `colourToOklch`/`colourToOn`
(which take `SpaceColor`) carries a redundant `as SpaceColor` cast — 5 sites
across sidebar, background, and options surfaces.

Finally, `requestStateSnapshot` in `shared/messages.ts` returns `msg.state`
directly (typed `AppState` on the `StateSnapshotMessage` discriminant) without
parse-validating the payload, accepting the SW's response on trust.

## Goals / Non-Goals

**Goals:**

- Close the `liveTabsById` / `smartFolders` optional-vs-non-optional gap by
  adding `.default({})`, making the schema's inferred type match `AppState`
  exactly and removing the `_schemaMatchesAppState` Persisted workaround.
- Remove all 5 `as unknown as AppState` casts.
- Export `SPACE_COLORS` as a `const` string-literal array and derive
  `SpaceSchema.color` from it via `z.enum(SPACE_COLORS)`.
- Narrow `Space.color: string` → `Space.color: SpaceColor` in `types.ts`,
  removing all `space.color as SpaceColor` casts.
- Add `AppStateV7Schema.safeParse(msg.state)` in `requestStateSnapshot` so a
  malformed SW response throws a descriptive error rather than returning an
  unvalidated value.

**Non-Goals:**

- No schema version bump — the persisted format is unchanged (`.default({})` is
  a parse-side default; `.optional()` already accepts absent fields at the write
  side, so the on-disk shape is identical).
- No new runtime behavior for Space colours — this is type narrowing only.
- No new UI surfaces.

## Decisions

### D1: Use `.default({})` not `.optional()` for ephemeral fields

**Chosen:** Change `liveTabsById` and `smartFolders` from `.optional()` to
`.default({})` in `AppStateV7Schema`.

**Alternatives considered:**
- Keep `.optional()` and widen `AppState` to use `?: ...` — rejected because it
  would propagate the optional type throughout the codebase (every consumer would
  need nullchecks for fields that are always populated at runtime).
- Keep `.optional()` and update the `Persisted<T>` guard to exclude all optional
  fields — masks the gap rather than fixing it.

**Why `.default({})` is correct:** Both fields are ALWAYS present at runtime
(rebuilt at boot via `rebuildLiveTabs`/connector events); `.default({})` makes
the parse output match that reality. Persistence already strips them before
writing, so the on-disk representation is unchanged.

### D2: Export `SPACE_COLORS` as a `const` array, derive schema from it

**Chosen:** Define `export const SPACE_COLORS = ['red', 'orange', ...] as const`
in `schemas.ts`, then `z.enum(SPACE_COLORS)`.

**Why:** `SpaceColor` in `types.ts` is an exhaustive union. A `z.enum` derived
from the same source array ensures the two cannot drift without a compile error.
`SPACE_COLORS` can also serve callers (e.g. the colour picker) that need the
values at runtime.

### D3: Narrow `Space.color` in `types.ts` to `SpaceColor`

**Chosen:** Change `Space.color: string` → `Space.color: SpaceColor` in
`types.ts`.

**Why:** The `SpaceColor` union is already exported from `types.ts`. Keeping
`color: string` was a hold-over from before the union existed. Narrowing removes
5 cast sites and makes the compiler verify that only valid colours can reach
`colourToOklch`/`colourToOn`.

**Risk:** Any code that assigns `space.color` from a non-narrowed string will
fail `tsc` until it validates through `SpaceSchema`. This is the point — a
compile error is better than a silent bad colour at runtime. The `schemas.ts`
`z.enum` validation becomes the boundary.

### D4: Add `safeParse` in `requestStateSnapshot` rather than a cast

**Chosen:** `AppStateV7Schema.safeParse(msg.state)`, throw on failure.

**Why:** `msg.state` comes from the SW over `chrome.runtime.sendMessage`. Even
though we control both ends, an `as AppState` cast skips any Zod validation that
could catch a version skew or a SW bug. The safeParse matches the pattern already
used in `onStateBroadcast` and adds negligible overhead (called at most once per
sidebar mount).

## Risks / Trade-offs

`Space.color: SpaceColor` (D3) is a **narrowing** — it will surface latent type
errors in any code that assigns `space.color` from a `string` without first going
through the schema. One known site: `colourToOklch(space.color)` calls that
currently use `as SpaceColor` casts. Those casts become unnecessary and are
removed. Unknown sites (if any) will fail `tsc` and must be fixed as part of this
change.

The `safeParse` in `requestStateSnapshot` (D4) adds a parsing step on the
sidebar's cold-load path. The overhead is sub-millisecond for a typical
`AppState`; it is not on a hot path.
