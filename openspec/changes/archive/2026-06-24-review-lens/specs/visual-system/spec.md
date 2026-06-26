## ADDED Requirements

### Requirement: Review-lens primitives are token-driven ui/ components

Lunma SHALL provide three cross-surface primitives in `apps/extension/src/ui/` — `Avatar`, `Diffstat`, and `ReviewerRail` — so the Review Queue (and later typed lenses) compose them rather than re-rolling discs, diff bars, or reviewer clusters inline. Each SHALL consume `@lunma/tokens` design tokens and SHALL NOT hard-code raw design values (colours, sizes, radii), in line with the token-consumption requirement. Their contracts SHALL be:

- `Avatar.svelte` — `{ initials: string; size?: 'sm' | 'md'; ring?: 'approved' | 'changes' | 'pending' | 'none'; title?: string }`. An initials disc; the `ring` tint reads `--success` (approved), `--danger` (changes), or `--text-dim` (pending), and the disc geometry reads radius/size tokens.
- `Diffstat.svelte` — `{ additions?: number; deletions?: number }`. Renders mono `+N −N` numerals (`--success` / `--danger`) over a proportional two-tone bar on a `--surface-3` track. Whenever a side is present its numeral SHALL render (so the magnitude is never colour-only); when **both** sides are absent the component SHALL render nothing (it collapses rather than showing `+0 −0`).
- `ReviewerRail.svelte` — `{ reviewers: { initials: string; state?: 'approved' | 'changes' | 'pending'; title?: string }[]; max?: number }`. A leading verdict `Icon` (blocking-wins) followed by overlapped `Avatar`s tinted by `state`, with a `+N` overflow past `max`.

Feature components SHALL compose these primitives rather than re-rolling an initials disc, a diff bar, or a reviewer cluster inline.

#### Scenario: The primitives read tokens, not literals

- **WHEN** `Avatar`, `Diffstat`, or `ReviewerRail` sets a colour, size, radius, or font
- **THEN** it SHALL reference a token (`--success`/`--danger`/`--text-*`, `--surface-*`, `--r-*`, `--text-*`, `--space-*`) and not a raw literal

#### Scenario: Diffstat is never colour-only

- **WHEN** `Diffstat` renders a change's additions and deletions
- **THEN** it SHALL show the `+N −N` numerals beside the bar, so the magnitude reads without relying on the green/red colour alone (WCAG-AA)

#### Scenario: Diffstat collapses when no size is known

- **WHEN** `Diffstat` receives neither `additions` nor `deletions`
- **THEN** it SHALL render nothing (no `+0 −0`, no empty bar)
- **AND WHEN** exactly one side is present, that side's numeral SHALL render

#### Scenario: A feature component composes the primitives

- **WHEN** the Review Queue row renders an author disc, a diff stat, and the reviewer cluster
- **THEN** it SHALL compose `Avatar`, `Diffstat`, and `ReviewerRail` rather than declaring disc/bar/cluster markup inline
