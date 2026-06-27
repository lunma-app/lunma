## Context

`OverviewPage.svelte` (the single-page lens overview, 2026-06-27) renders the
Changes row with inline markup: a `.reviewers` stack of `.avatar` spans tinted by
`reviewerHue(login)`, a trailing `.ci` glyph from `ciCircle(tone)`, a state
`Pill` from `changeState(item)`, and a `changeMeta(change)` subline that bakes
`repo · +N −N` into text. The `review-lens` change shipped `ReviewerRail`,
`Avatar`, and `Diffstat` for exactly this row, but the redesign never composed
them. The inline markup reaches past primitives straight to tokens
(`oklch(... var(--rv-h))`), violating the component-library policy.

## Goals / Non-Goals

**Goals:**

- Compose `ReviewerRail` + `Diffstat` into the Changes row; delete the inline
  avatar/CI/diffstat-text markup and its token-reaching CSS.
- Make the row's review-state signal singular: the `ReviewerRail` verdict glyph,
  not also a state pill.
- Keep `draft` visible after the pill is dropped, as a hollow CI-light glyph.
- Bring the `lenses` "Review Queue archetype" requirement back in sync with the
  row that ships.

**Non-Goals:**

- The Articles / Issues / Other sections — untouched.
- The repo-only filter vs. the spec's source+repo facets, and the dropped
  warming-age / `host/owner/repo · @author` columns. These are pre-existing
  redesign drift, flagged in the proposal for a separate change.
- Any `ChangeData`, schema, connector, or bus change.

## Decisions

- **`ReviewerRail` for reviewers.** Map `change.reviewers` ({login, state}) to the
  rail's `{ initials, state, title }` via a new pure `reviewersForRail(change)` +
  `initialsOf(login)` in `overview-vm.ts` (the page's "logic lives in the VM,
  components stay declarative" convention). `state` passes through unchanged
  (absent → the rail treats as `pending`); `title` is the login. The rail owns
  overlap, rings, and the `+N` overflow, so `reviewerHue` and the `.avatar`/
  `.reviewers` CSS are deleted.
- **`Diffstat` for the diff.** Pass `change.additions`/`deletions` straight in;
  the component renders nothing when both are absent (GitLab MRs without stats).
  `changeMeta` is simplified to return just the `repo` subline.
- **Drop the row `Pill`.** Remove `changeState` and the `<Pill testid="verdict">`
  from the row. The `Pill` import stays — the Issues section still uses it for
  priority. `changeState` becomes unused and is removed from the VM.
- **Draft → hollow CI light.** Add `ciLight(item)` returning the CI glyph for the
  status tone, or a distinct hollow glyph (label "Draft") when `change.draft`.
  Replaces `ciCircle` (which had no draft notion and is removed).
- **Row order.** Left: CI light + title + repo subline. Right (the triage
  cluster): `ReviewerRail`, then `Diffstat`. Three orthogonal signals —
  pipeline / review / size — none duplicated.

## Visual language

- **Hierarchy & layout.** The row keeps its existing frame (`--surface-2`,
  `--r-lg`, hover `--hover`). The right cluster groups `ReviewerRail` then
  `Diffstat` with `--space-2`/`--space-3` gaps so review-state reads before
  change-size. Dropping the pill removes a competing chip, letting the title and
  verdict breathe.
- **Colour.** All colour now comes through the primitives' token usage: the rail
  verdict glyph uses `--danger`/`--text-dim`/`--success` (changes/pending/
  approved) paired with a distinct icon, and the avatar rings reuse the same
  triad — never colour-only (WCAG-AA). `Diffstat` uses `--success`/`--danger`
  numerals over a neutral track. The CI light keeps the existing tone hues; the
  draft hollow glyph uses a muted token, distinguishable by shape, not colour
  alone.
- **Motion & reduced-motion.** No new motion; the row's existing
  `background var(--motion-fast)` hover transition is unchanged, and the
  primitives ship no animation, so `prefers-reduced-motion` is unaffected.
- **Accessibility.** Reviewer `Avatar`s carry the reviewer name as `title` (a
  labelled `img`); the verdict glyph carries an icon label; the `Diffstat`
  numerals render beside the bar so magnitude is never bar-only. Focus-visible
  on the activating row button is unchanged.

## Risks / Trade-offs

- **Losing the `draft` text label.** A hollow glyph is less explicit than the
  word "draft." Mitigated by matching the spec's chosen affordance and pairing
  shape with a tooltip label; revisitable in the deferred drift change.
- **Initials collisions.** `ReviewerRail` keys discs by `initials`; two reviewers
  with the same initials within the shown `max` would collide. Low impact (the
  rail caps at 4 and overflows the rest) and owned by the primitive, not this row.
- **Test churn.** `OverviewPage.test.ts` assertions on `testid="verdict"` and the
  inline avatar markup, and `overview-vm.test.ts` cases for the removed helpers,
  are updated to the primitives' testids (`reviewer-rail`, `diffstat`) and the
  new VM helpers.
