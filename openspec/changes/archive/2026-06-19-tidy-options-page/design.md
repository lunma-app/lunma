## Context

The options page is six cards over an `Aurora` substrate: a settings-registry
card (the `{#each SETTINGS}` loop), Connectors, Result sources, Backup & restore,
Feed subscriptions, and Recently archived — plus a shortcut-guidance card. Three
of those cards (`BackupRestore`, `FeedSubscriptions`, `RecentlyArchived`) are
already extracted sibling components; the other three sections live inline inside
a 1023-line `Options.svelte`. An adversarially-verified audit (29 confirmed
findings) showed the cost of that asymmetry: the card heading, the error box, the
status pill, the confirm row, the hidden file-input, and the `STATE_KEY` magic
string are each copy-pasted across cards, and one copy has already drifted — the
**Recently archived** heading still renders the retired uppercase micro-label
while its three siblings render the serif heading a code comment says replaced it.

Two mechanically-enforced contracts bound every decision here: the import-layer
DAG (`options/` and `ui/` may import `shared/`; `ui/` is imported by surfaces;
Biome fails the build on a violation) and the primitive→token CSS contract (`ui/`
primitives reference `@lunma/tokens` custom properties; `lint:styles` fails on a
raw `font-size`/`z-index` in a primitive). The WCAG-AA contrast tests and
`prefers-reduced-motion` guarantees must hold at every `data-tint` level.

## Goals / Non-Goals

**Goals:**
- Fix the shipped heading inconsistency and the audit's confirmed a11y gaps
  (segmented-group name, inline-reveal focus + announcement, reduced-motion).
- Shrink `Options.svelte` to an orchestrator by extracting the three inline
  sections into sibling cards, matching the established pattern.
- Remove the cross-card duplication at its root by promoting the shared card
  chrome into `ui/` primitives (`CardHeading`, `SettingsCard`, `SettingText`,
  `InlineError`) + an `.sr-only` token utility, so the drift cannot recur.
- Keep every behaviour, deep-link anchor, and test selector intact (pure tidy).

**Non-Goals:**
- No new user-facing feature, setting, or capability.
- No change to persistence, the message bus, the settings registry shape, or the
  search/connector/permission logic.
- The audit-rejected items (tokenizing raw px, extracting the hash logic, a
  shared chrome-mock factory, loosening the privacy assert, pulling the registry
  loop out) are explicitly excluded — see the proposal's Out-of-scope list.
- No `ConfirmRow` primitive (decided below); no barrel `ui/index.ts` (the repo
  imports primitives by file — pre-existing convention; the living `settings` /
  `visual-system` specs mention a `ui/index.ts` export that does not exist, which
  is pre-existing drift left untouched here — the new primitives follow the actual
  file-import convention).

## Decisions

### D1 — Extract three sibling cards, preserve the cross-surface contracts
`ConnectorsCard.svelte`, `ResultSourcesCard.svelte`, `ShortcutGuidanceCard.svelte`
each take their state, functions, the single-purpose `shared/` import they own
(`connectors`, `permissions`, `platform`), their template, and their CSS, and run
their own `onMount`. `Options.svelte` composes them like the existing siblings and
sheds the `shared/connectors`, `shared/permissions`, `shared/platform` imports and
their `onMount` calls. **Load-bearing invariants:** the `<section id="connectors">`
and `<section id="result-sources">` anchors move *intact* (sidebar `SmartFolder`
and the launcher overlay deep-link to them via the SW); the `scrollToHash`
`onMount` stays in `Options.svelte` (it resolves any `#id` at the document level,
so it keeps working across the moved sections). `ShortcutGuidanceCard` renders
nothing until `launcherShortcutBound === false` (preserving the no-flash gate) and
composes `<Icon name="keyboard" size={18}>` instead of the hand-inlined lucide SVG.
*Alternative considered:* one big `OptionsSections` wrapper — rejected; it would
not match the per-card sibling precedent and would not shrink the test surface.

### D2 — Four card primitives; ConfirmRow stays per-card
Build, in `apps/extension/src/ui/`, token-only and proven by use here:
- **`CardHeading.svelte`** — the `<h2>` serif `--text-xl` sentence-case heading +
  its `:root[data-tint=standard|vivid]` identity-hue override, with an optional
  `actions` snippet rendered beside the heading (this is how `RecentlyArchived`'s
  bordered `.head` row keeps its Clear-all button without re-rolling a heading).
- **`SettingsCard.svelte`** — composes `Surface variant="glass"` + the section
  inner padding (`--space-4 --space-5`) + a `CardHeading` (heading text +
  optional `actions`) + an optional `description` paragraph (the muted lead), with
  a `children` snippet for the body. Composed by all six cards.
- **`SettingText.svelte`** — the label + optional description column (the
  `.setting-text` trio). Composed by the registry card and Backup & restore.
- **`InlineError.svelte`** — the `role="alert"` danger box (Backup & Feeds).

Plus an **`.sr-only`** visually-hidden utility class in
`packages/tokens/recipes.css` (the hidden file-input pattern is triple-duplicated,
incl. `apps/extension`'s `newtab.css`).

**ConfirmRow is *not* built** (user-decided): the two-step confirm rows stay in
each card. `RecentlyArchived`'s `.clear-confirm` / `.clear-confirm-text` /
`archived-clear-confirm` are renamed to the sibling `.import-confirm` /
`.confirm-text` vocabulary for consistency, but no primitive is introduced — a
verifier showed a shared `ConfirmRow` is net-negative (FeedSubscriptions embeds a
`Select` inline; realigning ~7 testid sites for ~5 saved lines is a leaky
abstraction). **StatusPill is *not* built** — the two byte-identical
`.connector-indicator` / `.result-source-indicator` selectors are merged in place
(same file, no third consumer), not promoted to a primitive.

### D3 — Threading test selectors and the registry heading hook
Every primitive forwards the `data-testid` its callers' tests assert on
(`connector-token-set`, `result-source-*-granted`, `import-error`, etc.); the CSS
moves verbatim so computed styles and the WCAG-AA assertions are unchanged. The
brittle `.group-label` ordering selector (`Options.test.ts`) is replaced *first*
by a `data-testid="group-heading"` on the registry card's `CardHeading`, so the
suite survives both the primitive swap and the section extraction. `CardHeading`
keeps a queryable `.group-label`-equivalent hook for the existing class-based
assertions, or those assertions are updated in the same change.

### D4 — Accessibility behaviours
- **Segmented group name:** `SegmentedControl` gains an optional `ariaLabel`
  applied to its `<fieldset>` (mirrors `Select`/`TextInput`, which already take
  one); the options enum/toggle branches pass `decl.label`, BackupRestore passes
  `"Include settings"`, and the three sidebar editors (`SpaceEditor`,
  `TabBoundaryEditor`, `SmartFolderEditor`) pass their control's label.
- **Inline-reveal focus:** `Button`/`TextInput` expose no ref, so each card uses
  the repo's established pattern (`SpaceEditor`): `bind:this` a container around
  the revealed row, `querySelector` the primary control, `.focus()` after
  `await tick()`; on cancel, restore focus to the trigger. Applied to the Backup
  import confirm, the **Feed-subscriptions OPML import confirm** (same pattern —
  added apply-time after review flagged it as a behaviourally-identical sibling of
  the Backup confirm that the change had edited but left dropping focus to
  `<body>`), the Recently-archived Clear-all confirm, and the Connectors
  token-replace reveal.
- **Grant announcement:** the Result-sources grant composes the existing `Toast`
  primitive on success (as Backup/Feeds already do), so the button→pill swap is
  announced and not silent.
- **Reduced motion:** add `@media (prefers-reduced-motion: reduce)` guards for the
  `.shortcut-card` entrance keyframe (move with the card into `ShortcutGuidanceCard`)
  and the `.column :global(.surface)` tint cross-fade in `Options.svelte`.

### D5 — Spec deltas (only where required behaviour or a normative name moves)
Pure extraction and CSS dedup are implementation — no delta. Deltas land only
where behaviour or a *named closed name* changes: `settings` (the SegmentedControl
`ariaLabel` contract), `visual-system` (the new card-primitive contracts; the
options inline-reveal focus/announce + reduced-motion guarantees; the all-cards
serif-heading consistency), `auto-archive` (the Recently-archived requirement
enumerates a closed composed-primitive list — it gains `SettingsCard` +
`CardHeading`), and `opml-import-export` (its Feed-subscriptions-card requirement
names the card "as a `Surface variant="glass"` card" — recomposing onto
`SettingsCard` changes that normative name, so it gains a MODIFIED delta).
`data-backup`, `smart-folders`, `runtime-permissions`, and `launcher` describe
their cards in prose without a closed primitive enumeration and keep their
anchors, so they need no delta; the focus/announce behaviour for their cards is
homed once in the `visual-system` inline-reveals requirement.

### D6 — Sequencing (so the gate stays green at each step)
1. Test hooks first (`group-heading` + shortcut/connector/result testids) so
   selectors survive later moves. 2. Ship the four primitives + `.sr-only` with
   their harnesses/tests. 3. Recompose the three existing siblings + the registry
   card onto the primitives (heading realign falls out here). 4. Extract the three
   new sibling cards. 5. A11y behaviours. 6. Test-coverage additions + the
   registry-derived radio count. 7. Docs (`docs/architecture.md` tree + component
   library). Each step ends `pnpm verify`-clean.

### D7 — Drop the appearance preview (two-step decision)
The live appearance preview was a separate, **unlabelled** glass card dangling at
the very bottom of the page. Apply-time decision (step 9): fold it INTO the
Appearance `SettingsCard`, beneath its controls. Post-archive decision (step 11):
**drop it entirely** — the options page already live-reflects both Density and
Colour-intensity on its own content (every glass `Surface` re-treats with the tint;
the registry rows reflow under `--row-gap`/`--list-pad`); the `TabRow` preview adds
no new information and clutters the Appearance card. Dropping it is cleaner than
keeping a redundant demo in an otherwise functional card. `Options.svelte` loses the
`import TabRow`, the `{#if group === 'Appearance'}` block, and the `.preview` /
`.preview-label` / `.preview-panel` CSS rules.

## Visual language

This change is a consistency-and-accessibility pass, not a restyle — the bar is
that **nothing the user already likes shifts a pixel** (the two deliberate,
user-agreed exceptions: the drifted Recently-archived heading snaps into line, and
the orphaned appearance preview is dropped entirely — see D7).

- **Hierarchy / identity:** every card heading now reads in the same Instrument
  Serif `--text-xl` sentence case with the identity-hue treatment over glass —
  serif carries identity, the sans body and controls carry information (the
  established pairing). The Recently-archived eyebrow that broke this rule becomes
  a serif heading like its siblings; `CardHeading`'s `actions` slot keeps its
  Clear-all button on the heading row. Group rhythm (`--space-6` between cards,
  `--space-4` heading→controls) is preserved by `SettingsCard`.
- **Colour:** unchanged at every `data-tint` level — `CardHeading` carries the
  same `oklch(from var(--space-c) max(l, 0.72) c h)` AA-floored hue override the
  cards hand-rolled, so `subtle`/`standard`/`vivid` render identically to today
  and the contrast tests still pass. The tint cross-fade still plays (now
  reduced-motion-safe).
- **Motion:** 150–250ms token-driven transitions are untouched; the only motion
  change is *removing* animation under `prefers-reduced-motion` where it wrongly
  persisted (shortcut-card entrance, tint cross-fade) — end state identical.
- **Interaction feedback:** inline reveals (import / clear-all / token-replace /
  grant) now land focus on the primary action and announce success, matching the
  focus convention the sidebar already sets, so keyboard and screen-reader users
  get the same confidence as pointer users.

## Risks / Trade-offs

- **SettingsCard touches all six cards (high blast radius)** → sequence it as a
  pure recompose (D6 step 3) with the CSS moved verbatim; rely on the existing
  per-card tests + the WCAG-AA contrast suite to prove each card is unchanged;
  land the `group-heading` testid first (D3) so ordering assertions survive.
- **A primitive drops a `data-testid` a caller's test asserts** → D3 makes
  testid-forwarding a contract of each primitive; the dynamic
  `result-source-${name}-granted` id is explicitly threaded.
- **Extraction breaks a cross-surface deep-link** (`#connectors`,
  `#result-sources`) → D1 moves the `id`-bearing `<section>` intact and keeps
  `scrollToHash` in `Options.svelte`; an e2e/integration check on the sidebar→
  options deep-link guards it.
- **CardHeading's `data-tint` override regresses AA at a hue** → the override
  formula moves verbatim (not re-derived); the per-level contrast tests are the
  backstop.
- **RecentlyArchived's bordered `.head` layout doesn't fit a generic scaffold** →
  `CardHeading` exposes the `actions` slot specifically so this card composes the
  primitive instead of re-rolling its heading; the Clear-all action rides the
  heading row via that slot. **Resolved during apply (user-agreed):** the old
  `.head` hairline divider under the heading is *dropped* rather than retained —
  the normative `auto-archive` + `visual-system` scenarios require the heading to
  render "matching the other options cards", and no sibling card carries a divider
  under its heading, so keeping one here would make Recently-archived the lone
  inconsistency the change exists to remove. The card now reads heading → list on
  the shared `SettingsCard` rhythm like every other card.
- **Change size** → mitigated by the strict no-behaviour-change rule and the
  phased sequencing; if any step forces a real behaviour change it is a deviation
  to raise before committing (CLAUDE.md policy), not a silent default.

## Open Questions

None blocking. The contested-primitive decisions (ConfirmRow per-card;
SettingsCard + SettingText built; StatusPill in-place) are resolved above per the
user's direction.
