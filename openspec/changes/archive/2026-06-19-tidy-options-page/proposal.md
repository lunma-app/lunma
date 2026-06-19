## Why

Today the options page ships a visible inconsistency a user notices: the
**Recently archived** card heading still renders as a tiny grey uppercase
micro-label, while every other card heading on the page reads as the editorial
Instrument-Serif heading the code comments say *replaced* that micro-label.
Alongside it sit several accessibility gaps a keyboard or screen-reader user
feels — segmented settings groups (Density, Colour intensity, the toggles) have
no accessible group name; the Import / Clear-all / Token-replace / grant reveals
drop keyboard focus and swap silently; and the shortcut-guidance card plus the
Colour-intensity card cross-fade still animate under `prefers-reduced-motion`.
This change makes the options page **visually consistent and accessible at the
page's stated bar**, and does the structural tidy that removes the duplication
which let that heading inconsistency ship in the first place — collapsing the
1023-line `Options.svelte` orchestrator and the four copy-pasted card chromes
into composed primitives so the next drift can't happen.

This is backed by an adversarially-verified audit of the options surface (29
confirmed findings, 16 rejected as false-positives or deliberate per-card
chrome); the rejected set is recorded as **Out of scope** below so it is not
silently revisited.

## What Changes

**User-visible fixes (the value above)**

- Realign the **Recently archived** heading to the shared editorial serif
  treatment the other three cards use (regression against the documented intent).
- Give the `SegmentedControl` primitive an **accessible group name**
  (`ariaLabel` applied to the radio `fieldset`), passed at every call site —
  the options enum/toggle controls and the three sidebar editors.
- **Manage focus and announce outcomes** for the options page's inline reveals:
  the Backup import confirm, the Feed-subscriptions OPML import confirm, the
  Recently-archived Clear-all confirm, the Connectors token-replace reveal, and the
  Result-sources grant swap move focus to the revealed control on open, restore it
  to the trigger on cancel, and announce the result to assistive tech.
- Add the missing `prefers-reduced-motion` guards for the shortcut-card entrance
  animation and the `.surface` tint cross-fade.
- **Drop the live appearance preview entirely** (user-agreed, post-archive). The
  unlabelled preview card that dangled at the very bottom of the page was first
  folded into the Appearance card (D7), then removed on closer review — the options
  page already live-reflects both Density and Colour-intensity controls on its own
  content, so the TabRow preview adds no new information and clutters the card.
  *(Post-archive decision; see Impact and D7.)*

**Structural tidy (shrink `Options.svelte` to an orchestrator)**

- Extract three self-contained inline sections into sibling components, matching
  the already-extracted `BackupRestore` / `FeedSubscriptions` / `RecentlyArchived`
  pattern, each taking its tests into a new `*.test.ts`:
  `ConnectorsCard.svelte`, `ResultSourcesCard.svelte`, `ShortcutGuidanceCard.svelte`.
  Cross-surface deep-link anchors (`#connectors`, `#result-sources`) and the
  `Icon` primitive (the shortcut card stops hand-inlining the lucide `keyboard`
  SVG) are preserved/adopted.

**Shared primitives (build primitives, compose features)**

- **Built (token-only, proven by use here):** a `CardHeading.svelte` (serif
  `--text-xl` heading + its `data-tint` identity-hue override, today triplicated
  and drifted across cards); a `SettingsCard.svelte` scaffold (glass `Surface` +
  section padding + heading + optional description), composed by all six cards; a
  `SettingText.svelte` (the label/description column); an `InlineError.svelte`
  (the `role="alert"` danger box, byte-identical in two cards); and an `.sr-only`
  visually-hidden utility class in `@lunma/tokens` (the hidden file-input is
  triple-duplicated, incl. `newtab.css`).
- **In-place (no new surface):** merge the byte-identical `.connector-indicator` /
  `.result-source-indicator` status-pill selectors (no `StatusPill` primitive);
  export `STATE_STORAGE_KEY` from `shared/chrome/storage.ts` (drop three local
  `STATE_KEY` copies); fold the duplicated `TOGGLE_OPTIONS` const into a single
  `TOGGLE_SEGMENTS` export from `shared/settings.ts`; delete unused `data-testid`s
  (`backup-restore`, `feed-subscriptions`, and `connectors-section` if unreferenced
  after extraction).
- **Decided not to build:** a `ConfirmRow` primitive — the two-step confirm rows
  stay per-card (a verifier showed a shared primitive is net-negative;
  `FeedSubscriptions` embeds a `Select` inline), with `RecentlyArchived`'s confirm
  classes renamed to the sibling vocabulary for consistency.

**Test hardening**

- Add `data-testid="group-heading"` to the registry `<h2>` and assert ordering
  against it (decouple from the triplicated `.group-label` class) — landed before
  the extraction so the suite survives it; add testids so the shortcut /
  connectors / result-sources assertions survive extraction; cover the untested
  `onPermissionsChange` live-revoke path and the second auto-archive number field
  (`autoArchiveRetentionDays`); replace the magic 18-radio prose tally.

**Docs updated in this change:** `docs/architecture.md` (the `apps/extension/src/`
tree comments at the `ui/` primitive inventory and the `options/` listing, plus
the component-library section). **Left untouched:** `docs/tech-stack.md` (stack
unchanged), `docs/releasing.md`, `docs/adr/**`.

**Out of scope (audit-rejected — do NOT include):** tokenizing raw `6px` / `32px`
/ `560px` / `gap: 2px` feature-CSS values (feature CSS is reviewed, not
token-linted; against house style); extracting the deep-link hash logic to a
shared module (no second consumer; slug↔id contract already test-enforced); a
shared chrome-mock test factory (intentional per-component fixtures); loosening
the `PRIVACY_URL` exact-href assertion; and pulling the settings-registry render
loop out of `Options.svelte` (correctly coupled).

## Capabilities

### New Capabilities

None. This change introduces no new capability — it modifies existing
behaviour/contracts and refactors implementation within current capabilities.
The new `ui/` primitives (`CardHeading`, `InlineError`) are component-library
implementation proven by use in this change; their behavioural contract is
captured by the modified `visual-system` requirements below.

### Modified Capabilities

- `settings`: the **SegmentedControl primitive** gains an `ariaLabel` that names
  the radio group (applied to the `fieldset`), so each segmented settings control
  is no longer an anonymous group to assistive tech; the options page and the
  sidebar editors pass it.
- `visual-system`: the **options-page on-brand requirement** is tightened so
  *every* options card heading — the registry setting-groups and the standalone
  management cards (Backup, Feeds, Recently archived, Connectors, Result sources)
  — renders the shared editorial serif heading via a single `CardHeading`
  primitive; a new requirement makes the options page's **inline reveals manage
  keyboard focus and announce outcomes**; and the **reduced-motion guarantee**
  gains explicit options-page coverage (shortcut-card entrance + tint cross-fade
  suppressed).
- `auto-archive`: the **Recently-archived subpage** requirement's
  composed-primitives list is updated (it drops `Surface` for the shared
  `SettingsCard` and adds `CardHeading`; the heading now renders the shared serif
  treatment, not the old micro-label), and its Clear-all confirm gains focus
  management.
- `opml-import-export`: the **Feed subscriptions card** requirement, which names
  the card "as a `Surface variant="glass"` card", is updated to compose the shared
  `SettingsCard` (+ `CardHeading` / `InlineError`) primitives instead.

## Impact

- **Code (extension):** `apps/extension/src/options/` — `Options.svelte`
  (shrinks; loses Connectors / Result-sources / Shortcut sections and the shared
  card chrome; the appearance preview is removed entirely — no `TabRow` import,
  no preview block, no preview CSS), new `ConnectorsCard.svelte` /
  `ResultSourcesCard.svelte` / `ShortcutGuidanceCard.svelte` (+ their `*.test.ts`),
  and edits to
  `BackupRestore.svelte` / `FeedSubscriptions.svelte` / `RecentlyArchived.svelte`
  (heading, error box, STATE key, focus). New `apps/extension/src/ui/CardHeading.svelte`
  + `InlineError.svelte` (+ their `.test.harness.svelte` / `.test.ts`). Edits to
  `apps/extension/src/ui/SegmentedControl.svelte` and its three sidebar call sites
  (`SpaceEditor`, `TabBoundaryEditor`, `SmartFolderEditor`). `shared/chrome/storage.ts`
  exports `STATE_STORAGE_KEY`.
- **Code (tokens):** `packages/tokens/recipes.css` gains the `.sr-only` utility.
- **New public names introduced:** `CardHeading.svelte`, `SettingsCard.svelte`,
  `SettingText.svelte`, `InlineError.svelte`, `ConnectorsCard.svelte`,
  `ResultSourcesCard.svelte`, `ShortcutGuidanceCard.svelte`, the `ariaLabel` prop
  on `SegmentedControl`, `STATE_STORAGE_KEY` and `TOGGLE_SEGMENTS` (from
  `shared/settings.ts`), the `.sr-only` token class, and the `group-heading`,
  `shortcut-card`, and `shortcut-title` testids (plus a `testid` on the shortcut
  card's keyboard-shortcuts `Button`). *(No `ConfirmRow` or `StatusPill` primitive
  is introduced — see Shared primitives.)*
- **Preserved contracts:** the `#connectors` / `#result-sources` /
  `#recently-archived` / `#auto-archive` deep-link anchors; the `result-sources-section`
  testid (used by tests); all data-test selectors any primitive must thread through.
- **Gates:** Biome layer DAG + cycles, `svelte-check`, `lint:styles` (the new
  primitives are token-only), `vitest`, and the WCAG-AA contrast tests all run via
  `pnpm verify`; no new dependency, no stack change.
