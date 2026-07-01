# Gate fresh-install group→Space conversion on a genuine first boot

## Why

Users are losing their workspace to silently-regenerated, duplicate `'Default'`
Spaces. The boot tab-group pass converts the user's live Chrome tab groups into
Spaces on a "fresh install", but `freshInstall` is currently defined as merely
"`state.spaces` empty after load AND outcome ≠ `'unavailable'`". A
corruption-quarantine fallback (`outcome: 'recovered'`) and a partial salvage
that recovered no Spaces (`outcome: 'salvaged'`) BOTH leave `state.spaces` empty
— so they satisfy that definition and are mistaken for a first install. The boot
then re-derives Spaces from the user's Chrome tab groups (minting fresh ids) and
persists the result. If a read keeps being flagged corrupt, this repeats every
boot, fabricating duplicate `'Default'`/`'Group N'` Spaces over the real
(quarantined) data and surviving manual deletion. The reported symptom is a space
switcher showing repeating `Default … Default … Default` pills.

The fix restores the requirement's actual intent — convert Chrome groups into
Spaces only for a **genuine** first install (a clean read of an absent/empty
`lunma.state`), never for a corruption recovery — protecting the user's existing
workspace from being overwritten by a transient or false corruption verdict.

## What Changes

- Redefine `freshInstall` as "`state.spaces` empty after load AND the boot read
  `outcome` is `'clean'`" (a genuine first install), excluding `'recovered'`,
  `'salvaged'`, and `'unavailable'` — using the existing `loadState` outcome, no
  new plumbing.
- `apps/extension/src/background/index.ts`: the one-line `freshInstall`
  derivation in the boot chain.
- Regression tests in `index.test.ts`: a `corrupt` (recovered) read SHALL NOT run
  fresh-install group conversion; a `clean` empty read still does.
- Spec delta to the `spaces-and-tabs` "Fresh-install conversion of Chrome groups
  into Spaces" requirement (the normative `freshInstall` definition) + a new
  "Conversion does not run after a corruption recovery" scenario.

Out of scope (tracked separately): the *root* trigger — why a user's valid state
fails the strict whole-state v17 parse and is declared `corrupt` in the first
place — and whether a `corrupt` read should preserve the on-disk payload rather
than mint+persist over it. This change stops the destructive group→Space
regeneration regardless of that trigger; pinning the trigger needs the user's
quarantine `zodIssues`.

## Impact

- Affected specs: `spaces-and-tabs` (Fresh-install conversion requirement).
- Affected code: `apps/extension/src/background/index.ts`,
  `apps/extension/src/background/index.test.ts`.
- No schema/migration change; no storage-layer change. Behaviour change is
  strictly narrowing (fewer boots convert), so existing first-install conversion
  and the `unavailable` carve-out are unaffected.
