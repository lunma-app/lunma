# Component catalog — design & UX review (global-first)

> Global-first static review — findings are symptoms; fixes target the design-system root cause (token / recipe / primitive / convention). "needs visual" items confirm in the catalog (`pnpm --filter @lunma/extension catalog`); a11y findings carry WCAG 2.2 SC.

## Executive summary

42 systemic fixes resolve 77 of the 99 findings spanning all 38 primitives, leaving only 22 genuinely local exceptions that are intrinsic to a single primitive's structure. The bulk of the corpus is a handful of shared-layer gaps: interactive-boundary tokens, accent-as-foreground legibility, form-field/control-height metrics, missing scales (icon-size, spacing/radius, motion-spin), and long-content overflow. Start with **DS-01** — retarget interactive-control idle boundaries from decorative `--border`/`--border-soft` to `--border-strong`/`--border-field`, a P1 convention fix that repairs Button, Chip, and SegmentedControl in one edit and clears WCAG 1.4.11. The next-highest leverage after the P1 contrast trio are the i18n copy convention (DS-22) and the overflow contract (DS-31), each touching five primitives.

## Prioritized TODO (global-first)

- [ ] **P1** [DS DS-01] Interactive boundaries → --border-strong/--border-field _(reach 3, effort S)_
- [ ] **P1** [DS DS-02] Theme-flipping accent-on/accent-label tokens _(reach 3, effort M)_
- [ ] **P1** [DS DS-03] Danger-text token + --danger-soft wash _(reach 2, effort S)_
- [ ] **P1** [DS DS-42] LensRow busy state sets aria-busy _(reach 1, effort S)_
- [ ] **P2** [DS DS-22] Primitives receive translated copy, not inline English _(reach 5, effort M)_
- [ ] **P2** [DS DS-31] Shared long-content overflow contract _(reach 5, effort S)_
- [ ] **P2** [DS DS-08] Auto-suppress transform transitions under reduced-motion _(reach 4, effort S)_
- [ ] **P2** [DS DS-14] Unify form-field metrics on --control-h-*/--r-*/fill _(reach 4, effort M)_
- [ ] **P2** [DS DS-04] AA-tuned informative/status foreground tokens _(reach 3, effort S)_
- [ ] **P2** [DS DS-37] Extract hue-tinted accent-pill fill recipe _(reach 3, effort M)_
- [ ] **P2** [DS DS-05] Apply space-scope light-L cap to hue foregrounds/rings _(reach 2, effort M)_
- [ ] **P2** [DS DS-21] Compose shared aurora recipe + fix intensity ramp _(reach 2, effort M)_
- [ ] **P2** [DS DS-23] Decorative-glyph accessible-name convention _(reach 2, effort S)_
- [ ] **P2** [DS DS-06] Surfaces include .lunma-space-scope for --space-c* _(reach 1, effort S)_
- [ ] **P2** [DS DS-17] Compose IconButton for overlay close controls _(reach 1, effort S)_
- [ ] **P2** [DS DS-18] Route scrims through --scrim/--scrim-blur _(reach 1, effort S)_
- [ ] **P2** [DS DS-20] Contrast assertion for glass-on-aurora muted text _(reach 1, effort M)_
- [ ] **P2** [DS DS-35] Migrate Select to bits-ui Popover positioning _(reach 1, effort M)_
- [ ] **P2** [DS DS-39] Announced zero-results state for searchable listboxes _(reach 1, effort M)_
- [ ] **P2** [DS DS-41] Header/action buttons meet 24px target floor _(reach 1, effort S)_
- [ ] **P3** [DS DS-10] Icon-size scale token; Icon/Favicon read it _(reach 6, effort M)_
- [ ] **P3** [DS DS-07] Tokenize input focus-halo recipe _(reach 5, effort M)_
- [ ] **P3** [DS DS-09] --motion-spin cadence token _(reach 4, effort S)_
- [ ] **P3** [DS DS-12] Consume --r-*/--space-* scales, no raw geometry _(reach 4, effort S)_
- [ ] **P3** [DS DS-19] Strong-glass modifier on .lunma-glass/Surface _(reach 4, effort M)_
- [ ] **P3** [DS DS-27] scrollFade scroll-padding for roving focus _(reach 4, effort M)_
- [ ] **P3** [DS DS-16] Shared ghost :active press recipe (hued) _(reach 3, effort S)_
- [ ] **P3** [DS DS-29] Shared listbox roving-keyboard util (Home/End) _(reach 3, effort S)_
- [ ] **P3** [DS DS-38] Stories exercise every axis/state _(reach 3, effort S)_
- [ ] **P3** [DS DS-11] Small-tile size token (26px) _(reach 2, effort S)_
- [ ] **P3** [DS DS-13] Line-height/leading token scale _(reach 2, effort M)_
- [ ] **P3** [DS DS-15] Shared disabled-state recipe for buttons _(reach 2, effort S)_
- [ ] **P3** [DS DS-28] Coarse-pointer fallback for hover-reveal affordances _(reach 2, effort M)_
- [ ] **P3** [DS DS-30] Shared micro-label primitive/recipe _(reach 2, effort M)_
- [ ] **P3** [DS DS-32] Dev-mode name-or-warn on nameable primitives _(reach 2, effort S)_
- [ ] **P3** [DS DS-24] InlineError drops intrinsic top margin _(reach 1, effort S)_
- [ ] **P3** [DS DS-25] Neutral/muted status token _(reach 1, effort S)_
- [ ] **P3** [DS DS-26] Icon null-resolution fallback glyph _(reach 1, effort S)_
- [ ] **P3** [DS DS-33] Fields declare ::placeholder{--text-faint} _(reach 1, effort S)_
- [ ] **P3** [DS DS-34] Shared field-label style for Select consumers _(reach 1, effort M)_
- [ ] **P3** [DS DS-36] Select disabled-option styling _(reach 1, effort S)_
- [ ] **P3** [DS DS-40] Listbox option ownership (no bare <li>) _(reach 1, effort S)_
- [ ] **P2** [LOCAL EXCEPTION LOC-01] AccountConnectField distinct Token field name _(effort S)_
- [ ] **P2** [LOCAL EXCEPTION LOC-02] EntityBadge test harness + test.ts _(effort S)_
- [ ] **P2** [LOCAL EXCEPTION LOC-03] ReviewerRail key on unique id _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-04] Avatar overflow containment _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-05] BottomSheet scrim not a focusable button _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-06] Button remove redundant sm transition _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-07] CardHeading delete stale hue comments _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-08] Chip fix disabled JSDoc/impl _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-09] FaviconTile remove stale dot comment _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-10] Kbd fix ariaLabel doc _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-11] LensRow remove inert stopPropagation _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-12] Menu implement or drop submenu semantics _(effort M)_
- [ ] **P3** [LOCAL EXCEPTION LOC-13] Menu fix false disabled-nav comment _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-14] ResultList aria-activedescendant in direct-focus _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-15] SegmentedControl fallback unique name _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-16] ServiceConnectPicker autocomplete on PAT field _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-17] SettingsCard forward clip in flush mode _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-18] TabRow aria-hide non-returnable favicon button _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-19] TextInput conditional Enter preventDefault _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-20] TextInput non-colour invalid cue _(effort M)_
- [ ] **P3** [LOCAL EXCEPTION LOC-21] Toast raise Undo action emphasis _(effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-22] Toast action Button size=sm _(effort S)_

## Design-system fixes — do these first

### DS-01 · Interactive-control idle boundary must use --border-strong/--border-field, not decorative border tokens  _(convention)_

Default Button outline, resting Chip toggle ring, and SegmentedControl track edge are imperceptible (<3:1) so controls don't read as interactive.

- **Root cause:** Decorative --border/--border-soft and ad-hoc faint mixes used as interactive-control boundaries, all below the 3:1 non-text floor.
- **Fix (global):** Retarget every interactive idle boundary to --border-strong (fields: --border-field) per the visual-system ban on --border for controls.
- **Severity:** P1 · 1.4.11 — **Effort:** S — **Reach:** 3 primitive(s)
- **Repairs:** Button, Chip, SegmentedControl
- **Findings:** Button/BUTT-01, Chip/CHIP-03, SegmentedControl/SEGM-01

### DS-02 · Theme-flipping accent-on/accent-label tokens for accent used as text or glyph  _(token)_

Selected IconPicker glyph, MultiSelect Select-all/Clear text and checkmark, and Select's selected check drop to ~1.1:1 on light theme, making state/actions illegible.

- **Root cause:** --accent (fill/ring hue) and frozen near-white --accent-text misused as foreground; no light-theme/theme-flipping expression, so light Space hues fail contrast.
- **Fix (global):** Add --accent-on (=--space-on, flips per Space) for on-accent ink and an --accent-label token for accent-colored text, and consume them in these primitives.
- **Severity:** P1 · 1.4.3 — **Effort:** M — **Reach:** 3 primitive(s)
- **Repairs:** IconPicker, MultiSelect, Select
- **Findings:** IconPicker/ICON-01, MultiSelect/MULT-02, MultiSelect/MULT-01, Select/SELE-07

### DS-22 · Primitives must receive translated copy via props/Paraglide, not bake English inline  _(convention)_

AccountChip status words, ColorSwatch aria colour names, and ServiceConnectPicker's ~10 strings leak untranslated English into all 9 non-English locales.

- **Root cause:** src/ui primitives hard-code user-facing English (status words, colour enums, connect microcopy) with no translation path.
- **Fix (global):** Route all user-facing strings through m.* messages/props (incl. a paraglide message set for the ten colour names); no inline English in primitives.
- **Severity:** P2 · 3.1.2 — **Effort:** M — **Reach:** 5 primitive(s)
- **Repairs:** AccountChip, ColorSwatch, ServiceConnectPicker, FolderRow, AccountConnectField
- **Findings:** AccountChip/ACCO-01, ColorSwatch/COLO-05, ServiceConnectPicker/SERV-02

### DS-31 · Shared long/translated-content overflow contract (min-width:0 + truncate-or-wrap)  _(convention)_

Long Space names/labels overflow, wrap, or clip in CardHeading, SegmentedControl, BottomSheet header, Tooltip, and Toast, dropping content or breaking layout.

- **Root cause:** Primitives with user/translated text define no consistent overflow behaviour — some lack the flex min-width:0 shrink guard, others force nowrap with no max-width.
- **Fix (global):** Adopt one convention: text-bearing flex items get min-width:0 and either a tokenized max-width+ellipsis or an explicit wrap rule; apply across these primitives.
- **Severity:** P2 · 1.4.10 — **Effort:** S — **Reach:** 5 primitive(s)
- **Repairs:** CardHeading, SegmentedControl, BottomSheet, Tooltip, Toast
- **Findings:** CardHeading/CARD-03, SegmentedControl/SEGM-02, BottomSheet/BOTT-04, Tooltip/TOOL-02, Toast/TOAS-03

### DS-03 · Legibility-tuned danger-text token + --danger-soft wash for destructive UI  _(token)_

InlineError body text on its danger tint and Menu's re-rolled danger hover wash both fall sub-AA (~3.4–4.4:1) for destructive labels.

- **Root cause:** --danger is a status/graphic hue verified 4.5:1 only bare on base surfaces; self-tinting its own background erodes it below AA.
- **Fix (global):** Add a legibility-tuned danger-text token and route destructive washes through --danger-soft over --bg-elev instead of per-primitive color-mix.
- **Severity:** P1 · 1.4.3 — **Effort:** S — **Reach:** 2 primitive(s)
- **Repairs:** InlineError, Menu
- **Findings:** InlineError/INLI-01, Menu/MENU-01

### DS-08 · Auto-suppress transform transitions under prefers-reduced-motion  _(convention)_

Button, ColorSwatch, IconPicker, and SegmentedControl keep animating their press-scale transform under prefers-reduced-motion.

- **Root cause:** --motion-fast is never collapsed under reduced-motion, so each component must hand-drop --press-scale transforms and four don't.
- **Fix (global):** Collapse transform transitions at the token/global block under reduced-motion so no primitive must opt out per-component.
- **Severity:** P2 · 2.3.3 — **Effort:** S — **Reach:** 4 primitive(s)
- **Repairs:** Button, ColorSwatch, IconPicker, SegmentedControl
- **Findings:** Button/BUTT-03

### DS-14 · Unify form-field/control metrics on --control-h-* / --r-* / field-fill tokens  _(convention)_

TextInput sits 4px taller and more rounded than adjacent Select/Button, Select/SegmentedControl reconstruct 36px from padding, and EditableLabel hard-codes 22px.

- **Root cause:** Control heights, radii, and fills are inlined as raw literals and diverge (TextInput --input/--r-lg/40px vs Select --bg/--r-md/36px) with stale parity comments.
- **Fix (global):** Derive every field/control height from --control-h-* and radius/fill from --r-*/field-fill tokens; converge the three field recipes and fix the stale comments.
- **Severity:** P2 — **Effort:** M — **Reach:** 4 primitive(s)
- **Repairs:** TextInput, Select, SegmentedControl, EditableLabel
- **Findings:** TextInput/TEXT-01, TextInput/TEXT-02, Select/SELE-04, Select/SELE-05, SegmentedControl/SEGM-03, EditableLabel/EDIT-01

### DS-04 · AA-tuned informative/status foreground tokens for elevated & washed surfaces  _(token)_

Diffstat numerals (surface-3), FolderRow count badge (surface-2), and TabRow dim meta over the hover wash all fall below AA 4.5:1 in the relevant theme.

- **Root cause:** --success/--danger and --text-dim/--text-faint were tuned only for bare base surfaces; they were never hardened for --surface-3 or the --space-c-soft wash.
- **Fix (global):** Harden the status/dim informative tokens (or add surface-aware variants) so informative text clears AA on --surface-3 and the space-c-soft wash; stop using decorative --text-faint for informative count text.
- **Severity:** P2 · 1.4.3 — **Effort:** S — **Reach:** 3 primitive(s)
- **Repairs:** Diffstat, FolderRow, TabRow
- **Findings:** Diffstat/DIFF-01, FolderRow/FOLD-01, TabRow/TABR-02

### DS-37 · Extract the hue-tinted accent-pill fill into a recipes.css recipe  _(recipe)_

EntityBadge, Chip, and a surface re-roll the pill fill independently (chroma 0.11 vs 0.10), so tuning fill drifts them apart.

- **Root cause:** The theme-aware accent-pill fill (oklch(0.55 0.13 h / --accent-fill-a)) is documented in tokens.css but absent from recipes.css, so 5 sites hand-roll it and have already drifted.
- **Fix (global):** Add a single .lunma-accent-pill recipe and compose it everywhere the tinted pill fill is used.
- **Severity:** P2 — **Effort:** M — **Reach:** 3 primitive(s)
- **Repairs:** EntityBadge, Chip
- **Findings:** EntityBadge/ENTI-01

### DS-42 · Busy rows must set aria-busy (LensRow missed the FolderRow migration)  _(convention)_

LensRow busy state gives SR users no programmatic busy state, violating the ui-accessibility loading-row contract.

- **Root cause:** The loading-row busy convention (spec names LensRow) exists and FolderRow implements aria-busy, but LensRow wires busy only to a live-region blip.
- **Fix (global):** Set aria-busy on .lens-row in the busy state, matching FolderRow.
- **Severity:** P1 · 4.1.2 — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** LensRow
- **Findings:** LensRow/LENS-01

### DS-05 · Per-Space hue used as foreground/ring must apply the space-scope light-theme L cap  _(convention)_

LensRow's leading glyph (raw palette lightness) and ColorSwatch's selection ring (swatch-l+0.04, no cap) render near-invisible for light hues on light theme.

- **Root cause:** The .lunma-space-scope light-theme min(L) cap that prevents sub-3:1 light hues is not applied when a palette hue is re-rolled as a direct foreground glyph or selection ring.
- **Fix (global):** Normalize any per-Space hue used as foreground/ring through the space-scope lightness floor (FolderRow's L→0.62 pattern / recipe min(L,0.55) cap).
- **Severity:** P2 · 1.4.11 — **Effort:** M — **Reach:** 2 primitive(s)
- **Repairs:** LensRow, ColorSwatch
- **Findings:** ColorSwatch/COLO-01, LensRow/LENS-02

### DS-21 · Compose the shared .lunma-aurora recipe and fix its intensity ramp  _(recipe)_

Extension and site carry two hand-synced atmosphere copies (already drifted on the opacity fallback), and tint=standard is pixel-identical to vivid, making the calm step a no-op.

- **Root cause:** The extension's Aurora primitive bypasses the one shared .lunma-aurora atmosphere recipe and re-rolls geometry/keyframes/grain, and its INTENSITY_OPACITY collapses standard onto vivid's 0.5 cap.
- **Fix (global):** Have Aurora compose the shared .lunma-aurora recipe and move the intensity ramp there with a distinct standard opacity below vivid.
- **Severity:** P2 — **Effort:** M — **Reach:** 2 primitive(s)
- **Repairs:** Aurora, apps/site layout
- **Findings:** Aurora/AURO-01, Aurora/AURO-02

### DS-23 · Decorative-glyph accessible-name convention (role=img + aria-label / escape hatch)  _(convention)_

Kbd's aria-label is silently dropped by NVDA/VoiceOver (bare <kbd> is role=generic), and aria-hidden EntityBadge is sometimes the only entity-type signal for SR users.

- **Root cause:** The glyph-naming convention (role=img + aria-label, plus an optional accessible-name prop) is inconsistently applied; Kbd puts a name on a nameable-prohibited generic and EntityBadge exposes no name hatch.
- **Fix (global):** Standardize role=img+aria-label for named glyphs and give EntityBadge the optional accessible-name prop Kbd/Chip/BottomSheet already have.
- **Severity:** P2 · 4.1.2 — **Effort:** S — **Reach:** 2 primitive(s)
- **Repairs:** Kbd, EntityBadge
- **Findings:** Kbd/KBD-01, EntityBadge/ENTI-06

### DS-06 · Surfaces consuming --space-c*/--accent* must include .lunma-space-scope  _(recipe)_

On the lenspage a selected Chip toggle pill loses its --space-c-soft fill and --space-c ring, gutting the selected-state emphasis.

- **Root cause:** The lenspage surface sets the Space axes but omits the shared .lunma-space-scope recipe that derives the --space-c* family, so every consumer resolves empty.
- **Fix (global):** Include .lunma-space-scope on every surface that renders --space-c*/--accent* consumers.
- **Severity:** P2 — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** Chip
- **Findings:** Chip/CHIP-01

### DS-17 · Compose the IconButton primitive instead of hand-rolling icon buttons  _(primitive)_

BottomSheet's close ✕ uses a literal 28px box, inline SVG, no tokenized focus-visible, and no press squish.

- **Root cause:** Overlay close controls re-roll a square icon button, bypassing IconButton's --icon-btn sizing, --focus-* rebind, --press-scale, and Icon per the compose-primitives policy.
- **Fix (global):** Replace the hand-rolled close with the IconButton primitive.
- **Severity:** P2 — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** BottomSheet
- **Findings:** BottomSheet/BOTT-02

### DS-18 · Route overlay scrims through --scrim/--scrim-blur tokens  _(token)_

BottomSheet's scrim hardcodes oklch(0 0 0/0.5)+blur(2px), a pure-black untinted dim at 2px vs the token's 8px, diverging from every other overlay.

- **Root cause:** Scrim literals bypass the --scrim/--scrim-blur tokens.
- **Fix (global):** Use --scrim and --scrim-blur for the scrim fill and blur.
- **Severity:** P2 — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** BottomSheet
- **Findings:** BottomSheet/BOTT-03

### DS-20 · Add a contrast assertion for muted text on translucent glass over vivid aurora  _(convention)_

SearchField's immersive placeholder (--text-muted on glass over aurora) can fall below 4.5:1 on a bright Space hue.

- **Root cause:** The contrast suite never tests muted text composited on --glass-bg over a bright-hue aurora at vivid intensity, a gap shared by every glass-on-aurora text consumer.
- **Fix (global):** Add a glass-on-aurora contrast assertion and raise the muted-on-glass token/opacity to clear AA at vivid.
- **Severity:** P2 · 1.4.3 — **Effort:** M — **Reach:** 1 primitive(s)
- **Repairs:** SearchField
- **Findings:** SearchField/SEAR-02

### DS-35 · Migrate Select to the shared bits-ui Popover positioning pattern  _(convention)_

Select's manual position:absolute popover clips inside any overflow:hidden ancestor and can't flip up near the viewport bottom, obscuring the focused option.

- **Root cause:** Select never adopted the portal/flip Popover pattern its sibling MultiSelect migrated to for exactly this clipping bug.
- **Fix (global):** Reuse MultiSelect's bits-ui Popover (portal + flip) for the Select listbox.
- **Severity:** P2 — **Effort:** M — **Reach:** 1 primitive(s)
- **Repairs:** Select
- **Findings:** Select/SELE-02

### DS-39 · Searchable listboxes need a designed, announced zero-results state  _(convention)_

When MultiSelect's in-popover search filters out every option, the panel renders blank with no message and no live-region announcement.

- **Root cause:** The IconPicker zero-results empty-state pattern was not applied to MultiSelect's searchable popover.
- **Fix (global):** Reuse the IconPicker zero-results empty-state + live-region announcement for searchable listboxes.
- **Severity:** P2 · 4.1.3 — **Effort:** M — **Reach:** 1 primitive(s)
- **Repairs:** MultiSelect
- **Findings:** MultiSelect/MULT-05

### DS-41 · Header/action buttons must meet the 24px target floor (--control-h-xs)  _(convention)_

Select-all/Clear (~15px) and the chip-variant trigger (~22px) are real click targets below the 24×24 minimum.

- **Root cause:** MultiSelect re-rolls header actions and the chip trigger with tiny padding + height:auto, undershooting the 24×24 floor --control-h-xs already encodes.
- **Fix (global):** Size these controls to --control-h-xs so they clear the 24px target floor.
- **Severity:** P2 · 2.5.8 — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** MultiSelect
- **Findings:** MultiSelect/MULT-04, MultiSelect/MULT-07

### DS-10 · Add an icon-size scale token; Icon/Favicon read it instead of a raw px prop  _(token)_

Icon sizing drifts across surfaces (SearchField 15, return glyph 20 vs favicon 24, redundant 16px svg rules, FAVICON_PX hand-synced to --favicon-img).

- **Root cause:** No icon-size scale token exists and the size prop is a raw number that can't read the CSS token, so callers pass ~9 near-duplicate sizes and favicon primitives mirror --favicon-* pixels in JS.
- **Fix (global):** Add an icon-size scale in tokens.css and have Icon/Favicon default to token-driven sizes, removing raw px props and JS mirrors.
- **Severity:** P3 — **Effort:** M — **Reach:** 6 primitive(s)
- **Repairs:** Icon, SearchField, FaviconTile, LensRow, TabRow, ResultRow
- **Findings:** Icon/ICON-01, SearchField/SEAR-03, FaviconTile/FAVI-01, FaviconTile/FAVI-02, LensRow/LENS-03

### DS-07 · Tokenize the input focus-halo (border alpha + 3px accent-soft ring) as a recipe  _(token)_

The input focus halo is hand-rolled in five form fields, so any focus-treatment change must edit five sites and risks drift.

- **Root cause:** --focus-* tokens model only the 2px-offset trigger outline; no token exists for the inset accent-soft input halo, so its 3px/0.55 geometry is copied across 5 form primitives.
- **Fix (global):** Add --focus-halo geometry tokens (or a .lunma-input-focus recipe) and consume it in every form field.
- **Severity:** P3 — **Effort:** M — **Reach:** 5 primitive(s)
- **Repairs:** IconPicker, SearchField, TextInput, Select, MultiSelect
- **Findings:** IconPicker/ICON-02, SearchField/SEAR-01

### DS-09 · Add a --motion-spin cadence token for busy spinners  _(token)_

The busy-spinner tempo (0.8s) is duplicated in LensRow, FolderRow, TabRow, and FaviconTile and can drift.

- **Root cause:** No shared spin-cadence token exists, so each busy-spinner primitive hardcodes 0.8s linear.
- **Fix (global):** Add --motion-spin to @lunma/tokens and reference it in every busy spinner.
- **Severity:** P3 — **Effort:** S — **Reach:** 4 primitive(s)
- **Repairs:** LensRow, FolderRow, TabRow, FaviconTile
- **Findings:** LensRow/LENS-06

### DS-12 · Consume the --r-*/--space-* scales instead of raw geometry literals  _(convention)_

ColorSwatch (9px radius), Menu (14px/212px/paddings off-scale), ResultRow (4/7/1/3-5px spacing), and MultiSelect (--r-xs 5px fallback vs real 4px) bypass the scales and can't be retuned globally.

- **Root cause:** Radius/spacing scales are not applied — raw px radii, spacing, and a wrong --r-xs fallback are inlined across primitives.
- **Fix (global):** Replace raw radius/spacing literals with --r-*/--space-* tokens (and add an overlay-panel radius/width token for Menu's bespoke geometry).
- **Severity:** P3 — **Effort:** S — **Reach:** 4 primitive(s)
- **Repairs:** ColorSwatch, Menu, ResultRow, MultiSelect
- **Findings:** ColorSwatch/COLO-02, Menu/MENU-02, ResultRow/RESU-01, MultiSelect/MULT-08

### DS-19 · Add a strong/opaque modifier to .lunma-glass / Surface glass variant  _(recipe)_

Toast, DragClone, SearchField hover, and the launcher each hand-roll strong glass (Toast even drops the -webkit-backdrop-filter prefix), so the immersive panel treatment lives in four drifting places.

- **Root cause:** .lunma-glass and Surface expose only base opacity, so overlays needing a solid fill over aurora re-roll the whole strong-glass treatment.
- **Fix (global):** Add a strong/opaque glass modifier to the recipe/primitive and compose it in all four overlays.
- **Severity:** P3 — **Effort:** M — **Reach:** 4 primitive(s)
- **Repairs:** Toast, DragClone, SearchField, launcher
- **Findings:** Toast/TOAS-01

### DS-27 · scrollFade must set scroll-padding so roving focus never parks inside the fade  _(convention)_

IconPicker arrow-nav parks the focused tile flush at the active bottom fade band, fading its focus ring/glyph toward transparent.

- **Root cause:** scrollFade sets no coordinated scroll-padding, so roving-focus consumers can park a keyboard-focused item under the fade mask.
- **Fix (global):** Have scrollFade set scroll-padding matching the mask so focused items clear the fade (fixes IconPicker, ResultList, Menu, MultiSelect).
- **Severity:** P3 · 2.4.7 — **Effort:** M — **Reach:** 4 primitive(s)
- **Repairs:** IconPicker, ResultList, Menu, MultiSelect
- **Findings:** IconPicker/ICON-03

### DS-16 · Shared ghost :active press recipe (hued wash, not neutral)  _(convention)_

Press feedback differs across ghost controls and RowButton flashes grey mid-press, breaking colour-forward hover→press continuity.

- **Root cause:** The ghost :active press treatment diverges: IconButton applies only --press-scale with no bg wash, and RowButton paints neutral --press inside a Space-hued hover.
- **Fix (global):** Define one ghost :active recipe: --press-scale plus the in-scope hued wash (--space-c-dim where hued, --press otherwise), applied to Button/IconButton/RowButton.
- **Severity:** P3 — **Effort:** S — **Reach:** 3 primitive(s)
- **Repairs:** IconButton, RowButton, Button
- **Findings:** IconButton/ICON-03, RowButton/ROWB-04

### DS-29 · Shared listbox roving-keyboard util (Home/End parity)  _(convention)_

ResultList supports only Arrow/Enter/Escape — no Home/End — so keyboard users can't jump to first/last on a long list.

- **Root cause:** The listbox roving keyboard model is reimplemented per primitive with no shared util, so ResultList drifted from the Select/MultiSelect Home/End contract.
- **Fix (global):** Extract one listbox roving-keyboard util (incl. Home/End) and use it in ResultList, Select, and MultiSelect.
- **Severity:** P3 · 2.1.1 — **Effort:** S — **Reach:** 3 primitive(s)
- **Repairs:** ResultList, Select, MultiSelect
- **Findings:** ResultList/RESU-02

### DS-38 · Catalog stories must exercise every axis and state the primitive exposes  _(convention)_

Surface never renders the radius scale or clip, SegmentedControl never renders the disabled-option state, and ColorSwatch's palette story omits the mandated group wrapper.

- **Root cause:** Stories are authored without covering all exposed axes/states, so visual regressions on unrendered variants go uncaught.
- **Fix (global):** Extend each story to render every documented axis/state (and add the ColorSwatch group wrapper the a11y spec mandates).
- **Severity:** P3 — **Effort:** S — **Reach:** 3 primitive(s)
- **Repairs:** Surface, SegmentedControl, ColorSwatch
- **Findings:** Surface/SURF-02, SegmentedControl/SEGM-06, ColorSwatch/COLO-06

### DS-11 · Add a small-tile size token (26px) shared by EntityBadge and Avatar  _(token)_

The two small-tile sizes can drift independently with nothing gating raw width/height.

- **Root cause:** No small-tile size token exists, so 26px is a raw literal duplicated across EntityBadge and Avatar[data-size='md'].
- **Fix (global):** Add a small-tile size token and consume it in both primitives.
- **Severity:** P3 — **Effort:** S — **Reach:** 2 primitive(s)
- **Repairs:** EntityBadge, Avatar
- **Findings:** EntityBadge/ENTI-02

### DS-13 · Add a line-height/leading token scale to the typography tokens  _(token)_

CardHeading (and other primitives) hard-code unlike line-height values, violating the no-raw-design-values contract.

- **Root cause:** No shared line-height scale exists, so leading is a raw magic number scattered across ui primitives.
- **Fix (global):** Add a leading scale to tokens.css typography and consume it across primitives.
- **Severity:** P3 — **Effort:** M — **Reach:** 2 primitive(s)
- **Repairs:** CardHeading
- **Findings:** CardHeading/CARD-04

### DS-15 · Shared disabled-state recipe across button primitives  _(convention)_

The two button primitives express disabled through unrelated mechanisms.

- **Root cause:** No shared disabled recipe: IconButton dims via blanket opacity:0.4 while Button uses --disabled-bg/--text-faint.
- **Fix (global):** Define one disabled recipe (--disabled-bg/--text-faint) and apply it to IconButton and Button.
- **Severity:** P3 — **Effort:** S — **Reach:** 2 primitive(s)
- **Repairs:** IconButton, Button
- **Findings:** IconButton/ICON-02

### DS-28 · Hover-reveal row affordances need a coarse-pointer fallback  _(convention)_

LensRow's open-overview button and FolderRow's kebab are unreachable on touch pointers.

- **Root cause:** Trailing row affordances reveal only on :hover/:focus-within (pointer-events:none otherwise) with no coarse-pointer path.
- **Fix (global):** Add a coarse-pointer fallback (always-visible or long-press) for hover-revealed trailing affordances across sidebar rows.
- **Severity:** P3 — **Effort:** M — **Reach:** 2 primitive(s)
- **Repairs:** LensRow, FolderRow
- **Findings:** LensRow/LENS-07

### DS-30 · Shared micro-label primitive/recipe (uppercase --text-2xs --text-dim)  _(primitive)_

ResultRow and Menu re-roll the same micro-label, letting it drift across surfaces.

- **Root cause:** No shared micro-label primitive or text recipe exists, so the uppercase --text-2xs --text-dim pattern is re-rolled inline.
- **Fix (global):** Add a micro-label primitive/recipe and compose it in ResultRow and Menu.
- **Severity:** P3 — **Effort:** M — **Reach:** 2 primitive(s)
- **Repairs:** ResultRow, Menu
- **Findings:** ResultRow/RESU-04

### DS-32 · Nameable primitives need a dev-mode name-or-warn guardrail  _(convention)_

TextInput and EditableLabel can ship nameless (only placeholder, or nothing) with no guardrail.

- **Root cause:** Nameable inputs permit an omitted accessible name with no dev-mode warning, unlike IconButton's name-or-warn.
- **Fix (global):** Add IconButton-style dev-mode name-or-warn parity to TextInput and EditableLabel.
- **Severity:** P3 · 4.1.2 — **Effort:** S — **Reach:** 2 primitive(s)
- **Repairs:** TextInput, EditableLabel
- **Findings:** TextInput/TEXT-06, EditableLabel/EDIT-04

### DS-24 · InlineError must let its container own spacing, not hard-code a top margin  _(primitive)_

Composed in a flex/grid-gap host the error sits ~20px (margin+gap) below instead of the container's gap, breaking rhythm.

- **Root cause:** InlineError hard-codes a top margin that double-applies against any gap parent.
- **Fix (global):** Remove InlineError's intrinsic margin-top and let the gap parent own spacing.
- **Severity:** P3 — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** InlineError, AccountConnectField
- **Findings:** AccountConnectField/ACCO-04

### DS-25 · Add a neutral/muted status token alongside --success/--danger  _(token)_

A text-scale retune silently shifts Avatar's pending verdict ring and badge glyph.

- **Root cause:** The token set has --success/--danger but no neutral-status token, so Avatar borrows text-scale --text-dim for the pending indicator.
- **Fix (global):** Add a neutral/muted status token and consume it for pending indicators.
- **Severity:** P3 — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** Avatar
- **Findings:** Avatar/AVAT-04

### DS-26 · Icon needs a null-resolution fallback glyph  _(primitive)_

A stored Space icon later dropped from lucide renders a permanently empty box in the sidebar.

- **Root cause:** Icon has no fallback when resolveIcon returns null (unknown name or dropped lucide icon).
- **Fix (global):** Render a fallback glyph when resolveIcon returns null (distinct from the transient load-flash).
- **Severity:** P3 — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** Icon
- **Findings:** Icon/ICON-02

### DS-33 · Fields must declare ::placeholder{color:var(--text-faint)}  _(convention)_

The 'Name…' hint falls back to each browser's UA placeholder colour instead of tokenized --text-faint.

- **Root cause:** EditableLabel omits the shared ::placeholder rule every sibling field declares.
- **Fix (global):** Add the shared ::placeholder{color:var(--text-faint)} rule to EditableLabel (and any field missing it).
- **Severity:** P3 — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** EditableLabel
- **Findings:** EditableLabel/EDIT-02

### DS-34 · Shared field-label style so Select consumers don't re-invent TextInput's .label  _(convention)_

ServiceConnectPicker's Service label (weight-medium, lh 1, no letter-spacing) mismatches an adjacent TextInput label (semibold, lh 1.2, 0.01em).

- **Root cause:** There is no shared field-label style; Select forces consumers to hand-roll a label that drifts from TextInput's baked-in .label.
- **Fix (global):** Expose the field-label style as a shared recipe (or a Select label prop) matching TextInput's .label.
- **Severity:** P3 — **Effort:** M — **Reach:** 1 primitive(s)
- **Repairs:** ServiceConnectPicker, Select
- **Findings:** ServiceConnectPicker/SERV-01

### DS-36 · Select must style its disabled options like MultiSelect  _(convention)_

A disabled Select option looks identical to an enabled one, so a pointer user can't tell it's disabled.

- **Root cause:** Select omits the .option:disabled dim treatment its sibling MultiSelect defines.
- **Fix (global):** Add MultiSelect's .option:disabled dim styling to Select.
- **Severity:** P3 — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** Select
- **Findings:** Select/SELE-01

### DS-40 · Listbox option ownership — no bare <li> between role=listbox and its options  _(convention)_

MultiSelect's invalid listbox children can misreport set-size/position to assistive tech.

- **Root cause:** The listbox-ownership fix applied in Select was not applied to MultiSelect, which nests option buttons in bare <li> inside role=listbox.
- **Fix (global):** Apply Select's listbox-ownership structure to MultiSelect's options.
- **Severity:** P3 · 1.3.1 — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** MultiSelect
- **Findings:** MultiSelect/MULT-03

## Component-specific fixes — exceptions

### LOC-01 · AccountConnectField

Host-qualified name never reaches the DOM (label+ariaLabel are mutually exclusive), leaving two indistinguishable 'Token' password fields on the Options page.

- **Fix (local):** Drop the dead host-qualifier ariaLabel and fold the host into the visible label prop.
- **Why local (not systemic):** TextInput's label/ariaLabel contract works correctly; the dead qualifier is unique to this composite's misuse.
- **Severity:** P2 · 4.1.2 — **Effort:** S — **Finding:** AccountConnectField/ACCO-01

### LOC-02 · EntityBadge

EntityBadge is the only live src/ui primitive with no test harness/test.ts, so glyph/hue-map regressions ship unguarded.

- **Fix (local):** Add EntityBadge.test.harness.svelte + test.ts per the ui-primitives test contract.
- **Why local (not systemic):** The missing test artifact is specific to this one primitive, not a shared layer.
- **Severity:** P2 — **Effort:** S — **Finding:** EntityBadge/ENTI-03

### LOC-03 · ReviewerRail

Keyed each on non-unique initials throws each_key_duplicate and blanks the rail when two reviewers share initials.

- **Fix (local):** Key the each on a unique reviewer id instead of display initials.
- **Why local (not systemic):** The key choice is intrinsic to ReviewerRail's own list; no shared root cause.
- **Severity:** P2 — **Effort:** S — **Finding:** ReviewerRail/REVI-01

### LOC-04 · Avatar

Fixed-diameter disc has no overflow containment, so initials longer than 1–2 chars overflow and break the circle.

- **Fix (local):** Add overflow:hidden to .avatar.
- **Why local (not systemic):** The fixed-geometry initials disc is unique to Avatar; no other primitive shares this container.
- **Severity:** P3 — **Effort:** S — **Finding:** Avatar/AVAT-05

### LOC-05 · BottomSheet

Scrim modeled as a focusable Close button adds a redundant tab stop even though Escape and ✕ already dismiss.

- **Fix (local):** Make the scrim a non-focusable click-outside layer (div + pointer handler), removing the button role.
- **Why local (not systemic):** The scrim-as-button pattern is intrinsic to BottomSheet's overlay structure.
- **Severity:** P3 — **Effort:** S — **Finding:** BottomSheet/BOTT-05

### LOC-06 · Button

[data-size='sm'] restates a byte-identical transition already on .btn — inert now but will silently diverge if one copy is edited.

- **Fix (local):** Delete the redundant transition declaration in the sm selector.
- **Why local (not systemic):** A duplicated rule inside Button's own size selector, no shared layer.
- **Severity:** P3 — **Effort:** S — **Finding:** Button/BUTT-05

### LOC-07 · CardHeading

Stale comments/tests describe a removed per-tint hue + lightness floor, misleading maintainers editing heading contrast.

- **Fix (local):** Delete the stale comments to match the flat --accent-heading implementation.
- **Why local (not systemic):** Comment rot local to CardHeading's own refactor.
- **Severity:** P3 — **Effort:** S — **Finding:** CardHeading/CARD-01

### LOC-08 · Chip

disabled JSDoc claims aria-disabled but the code applies the native disabled attribute (inert, out of tab order), misleading consumers.

- **Fix (local):** Correct the JSDoc, or switch to aria-disabled to match the documented focusable/announced intent.
- **Why local (not systemic):** Doc/impl mismatch internal to Chip's own prop.
- **Severity:** P3 — **Effort:** S — **Finding:** Chip/CHIP-06

### LOC-09 · FaviconTile

Drift-dot comment cites 'TabRow's dot recipe' that TabRow no longer has.

- **Fix (local):** Remove the stale cross-reference comment.
- **Why local (not systemic):** Comment rot local to FaviconTile.
- **Severity:** P3 — **Effort:** S — **Finding:** FaviconTile/FAVI-03

### LOC-10 · Kbd

Props JSDoc claims ariaLabel can hide a decorative glyph, but aria-label names and never hides.

- **Fix (local):** Correct the doc — aria-hidden hides, aria-label names.
- **Why local (not systemic):** Doc inaccuracy internal to Kbd.
- **Severity:** P3 — **Effort:** S — **Finding:** Kbd/KBD-06

### LOC-11 · LensRow

onpointerdown stopPropagation on .open-page is inert — .lens-row has no pointer handler and pointerdown≠click, so nothing consumes it.

- **Fix (local):** Remove the vestigial stopPropagation guard.
- **Why local (not systemic):** Dead code carried from the FolderRow fork, specific to this row's structure.
- **Severity:** P3 — **Effort:** S — **Finding:** LensRow/LENS-05

### LOC-12 · Menu

Submenu items emit aria-haspopup + a chevron but no popup is implemented, so ArrowRight is inert and SRs announce a phantom popup.

- **Fix (local):** Either implement a real submenu (bits-ui Sub) or drop the haspopup/chevron for the in-place drill-in.
- **Why local (not systemic):** Menu's data-driven drill-in semantics are unique to Menu.
- **Severity:** P3 — **Effort:** M — **Finding:** Menu/MENU-03

### LOC-13 · Menu

menu-types comment claims disabled items stay in roving nav, but bits-ui excludes data-disabled items — the claim is false.

- **Fix (local):** Correct the comment to match bits-ui's skip behaviour (the skip itself is fine).
- **Why local (not systemic):** False doc claim local to Menu.
- **Severity:** P3 — **Effort:** S — **Finding:** Menu/MENU-07

### LOC-14 · ResultList

In direct-focus mode the list root never carries aria-activedescendant (only pushed to an external combobox), so a SR user hears the name but not the roving selection.

- **Fix (local):** Set aria-activedescendant on the list root in direct-focus mode.
- **Why local (not systemic):** Latent to ResultList's dual-mode focus API; no other primitive has this mode.
- **Severity:** P3 · 4.1.2 — **Effort:** S — **Finding:** ResultList/RESU-04

### LOC-15 · SegmentedControl

Required name must be page-globally unique; two instances sharing it silently merge their radio groups, breaking selection/keyboard nav.

- **Fix (local):** Generate a fallback unique name when the caller omits one.
- **Why local (not systemic):** Radio-group name uniqueness is intrinsic to SegmentedControl's fieldset.
- **Severity:** P3 — **Effort:** S — **Finding:** SegmentedControl/SEGM-05

### LOC-16 · ServiceConnectPicker

PAT field is type=password with no autocomplete, so Chrome's password manager offers to save a machine-local token.

- **Fix (local):** Pass an autocomplete passthrough (off/one-time-code) to the credential TextInput.
- **Why local (not systemic):** Credential-save behaviour specific to this connect composite's field.
- **Severity:** P3 — **Effort:** S — **Finding:** ServiceConnectPicker/SERV-04

### LOC-17 · SettingsCard

flush mode never forwards clip to Surface, so a full-bleed edge background would render square corners past the 2xl radius.

- **Fix (local):** Forward clip to the composed Surface in flush mode.
- **Why local (not systemic):** The flush-vs-Surface clip wiring is intrinsic to SettingsCard.
- **Severity:** P3 — **Effort:** S — **Finding:** SettingsCard/SETT-01

### LOC-18 · TabRow

Non-returnable favicon <button> is out of tab order but left in the AT tree with a duplicate title name, giving SR users a redundant second control per row.

- **Fix (local):** aria-hide the non-returnable favicon button like the row-focus overlay.
- **Why local (not systemic):** The returnable/non-returnable favicon-button duality is unique to TabRow.
- **Severity:** P3 · 4.1.2 — **Effort:** S — **Finding:** TabRow/TABR-01

### LOC-19 · TextInput

handleKeydown calls preventDefault on Enter unconditionally, swallowing native form submit when no onenter is wired.

- **Fix (local):** Only preventDefault when an onenter handler is provided.
- **Why local (not systemic):** Enter handling internal to TextInput's own keydown.
- **Severity:** P3 — **Effort:** S — **Finding:** TextInput/TEXT-04

### LOC-20 · TextInput

Standalone invalid signals error by 1px border hue alone, giving colorblind/low-vision users no perceivable cue (aria-invalid is SR-only).

- **Fix (local):** Add a non-colour affordance (icon/weight) to the standalone invalid variant.
- **Why local (not systemic):** The unpaired invalid variant is intrinsic to TextInput (paired InlineError already covers the common path).
- **Severity:** P3 · 1.4.1 — **Effort:** M — **Finding:** TextInput/TEXT-05

### LOC-21 · Toast

Undo (the sole time-limited action) uses the ghost/lowest-emphasis variant, inverting hierarchy below the status line.

- **Fix (local):** Raise the Undo action to a higher-emphasis Button variant.
- **Why local (not systemic):** Action-emphasis choice internal to Toast's own composition.
- **Severity:** P3 — **Effort:** S — **Finding:** Toast/TOAS-02

### LOC-22 · Toast

The composed action Button defaults to md (36px/13px), out-sizing the 12px message and contradicting Button's sm-for-inline guidance.

- **Fix (local):** Pass size='sm' to Toast's action Button.
- **Why local (not systemic):** Size omission internal to Toast's Button composition.
- **Severity:** P3 — **Effort:** S — **Finding:** Toast/TOAS-04

## Appendix — findings by primitive (traceability)

### Aurora.svelte (apps/extension/src/ui)

- **AURO-01 · P2 · visual** — INTENSITY_OPACITY sets standard=vivid=0.5, so on the new-tab home and lens page (both pass intensity={tint}) a tint=standard aurora is pixel-identical to vivid — the calm level shows the full backdrop, making the tint step a no-op and violating "aurora reduced at standard". _(Aurora.svelte:15-17 subtle:0.22, standard:0.5, vivid:0.5; consumers NewTab.svelte:501 + LensPage.svelte:196 intensity={tint}; test pins vivid/subtle only (Aurora.test.ts:53-56))_  → **UNMAPPED** _(system-likely)_
- **AURO-02 · P3 · consistency** — Aurora.svelte re-rolls the whole .lunma-aurora recipe (blob geometry, 3 keyframes, grain SVG, base styles) in scoped CSS instead of composing it, so extension and apps/site (+layout.svelte:46-50) carry two atmosphere copies that must be hand-synced — already drifted on the opacity fallback. _(Aurora.svelte:102-179 duplicates recipes.css:28-103; opacity fallback 0.5 (Aurora.svelte:108) vs 0.9 (recipes.css:34); recipe was authored as the single shared atmosphere source (recipes.css:1-14))_  → **UNMAPPED** _(system-likely)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - vivid opacity capped at 0.5 for WCAG-AA over the raw aurora is intentional (Aurora.svelte:7-13); AURO-01's fix only lowers standard and must preserve vivid=0.5 — do not raise vivid to widen the ramp — Aurora.svelte:7-13 module comment; ui-accessibility contrast contract
  </details>

### Avatar (apps/extension/src/ui/Avatar.svelte)

- **AVAT-04 · P3 · tokens** — `pending` verdict ring and badge glyph borrow `--text-dim` (a text-scale token) as a status color because the token set has `--success`/`--danger` but no neutral-status token, so a text-scale retune silently shifts the pending indicator. _(Avatar.svelte:90 box-shadow var(--text-dim), :122-124 color var(--text-dim); tokens.css:143 --text-dim (text scale), :210-212 --danger/--success (status))_  → **UNMAPPED** _(system-likely)_
- **AVAT-05 · P3 · robustness** — Fixed-diameter disc has no `overflow` containment, so initials longer than the documented 1–2 chars overflow and break the pill circle. _(Avatar.svelte:55-69 (fixed w/h 20/26px, centered text, no overflow guard))_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - AVAT-02: Avatar punting verdict exposure to consumer `title`/adjacent text is the intentional dual accessible-name model; the ui-accessibility spec's Avatar clause requires only a non-colour cue (glyph), not programmatic verdict — met by the corner glyph. — ui-accessibility/spec.md:63-64; Avatar.svelte:29,45-47; ReviewerRail.svelte:64 passes title={reviewer.title}
  </details>

### Select.svelte (src/ui form-field/listbox primitive)

- **SELE-02 · P2 · robustness · 2.4.11** — Manual `position:absolute` popover with no portal/flip clips inside any ancestor `overflow:hidden` and cannot flip up when the trigger sits near the viewport bottom (options/launcher), leaving the focused option obscured or off-screen. _(Select.svelte:295-302 `.popover{position:absolute;top:calc(100%+6px)}` + onDocPointerDown listener; MultiSelect.svelte:369-387 `Popover.Portal`/`Popover.Content side/align/sideOffset`.)_  → **UNMAPPED** _(system-likely)_
- **SELE-01 · P3 · states** — A disabled option renders identically to an enabled one (`color:var(--text-2)`, same as enabled resting), so a sighted pointer user cannot tell `Custom…` is disabled; only keyboard roving skips it. _(Select.svelte:317-337 `.option` has no `:disabled` rule; MultiSelect.svelte:623-626 `.option:disabled{color:var(--text-dim);cursor:default}`.)_  → **UNMAPPED** _(system-likely)_
- **SELE-04 · P3 · consistency** — Select's comments claim TextInput parity the values contradict: header says fill `--surface-2` but code uses `--bg`; TextInput uses `--input`/`--r-lg`/40px while Select uses `--bg`/`--r-md`/`--control-h-md`(36px), so the three 'field' primitives are two divergent recipes and the comments are stale. _(Select.svelte:140-141,244-245 comments vs :248-249 `background:var(--bg)`,`--r-md`,`--control-h-md`; TextInput.svelte:127-129 `--input`,`--r-lg`,`height:40px`.)_  → **UNMAPPED** _(system-likely)_
- **SELE-05 · P3 · visual** — Option `height:36px` (a control height) and `outline-offset:-2px` (focus-ring geometry) are hard-coded, violating the ui-primitives 'no hard-coded control heights / focus-ring geometry' prose contract (not Stylelint-gated, which only blocks raw font-size/z-index). _(Select.svelte:323 `height:36px`(=`--control-h-md`), :350 `outline-offset:-2px`; mirrored MultiSelect.svelte:596 `min-height:36px`.)_  → **UNMAPPED** _(system-likely)_
- **SELE-07 · P3 · color · 1.4.11** — The selected-row check is bare `var(--accent)` drawn on the same-hue `--accent-soft` wash (accent@0.18); on light theme + a light Space hue (yellow, accent L~0.685) the glyph can drop near-invisible, weakening the designated non-colour selection cue so selection reads via wash alone for sighted users. _(Select.svelte:352-359 `.check{color:var(--accent)}` on `.option.selected{background:var(--accent-soft)}`; MultiSelect.svelte:631-648 filled `--accent` box + `--accent-text` check.)_  → **UNMAPPED** _(system-likely)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Open popover is an opaque `elevated` Surface (not glass) so form content behind the dropdown can't bleed through. — Select.svelte:139-147,181
  - Roving keyboard model skips native-disabled options so wrap/Home/End never dead-end on a disabled row. — Select.svelte:64-90; ui-accessibility spec 'Arrow keys skip disabled options'
  - `<li role="presentation">` wrappers so option buttons are owned directly by role=listbox. — Select.svelte:187; ui-accessibility spec 'Correct roles, ownership'
  - Selection has a programmatic + non-colour equivalent (aria-selected + check glyph) alongside the accent wash. — Select.svelte:192-214
  - Reduced motion honored: popover entrance animation and chevron rotation removed. — Select.svelte:379-389
  - Enter/Space intentionally not intercepted on the closed trigger/options (native button click) to avoid open-then-toggle. — Select.svelte:92-104
  - Trigger focus uses an intentional gentle accent halo + border shift (documented design), matching TextInput/MultiSelect — a visible focus state (2.4.7 met); dropped SELE-03 lacked a computed contrast failure. — Select.svelte:261-267 'glides into a gentle accent halo'
  </details>

### Button (Atoms)

- **BUTT-01 · P1 · color-contrast · 1.4.11** — Secondary (the default variant) draws its only idle boundary with decorative `--border`, which sits below the 3:1 non-text floor in both themes, so the outline button's edge is imperceptible — visual-system spec explicitly bans `--border` on interactive-control boundaries. _(Button.svelte:111 `border: 1px solid var(--border)`; tokens.css:130,456 (`--border` decorative, sub-floor); visual-system spec:196-204,260-264)_  → **UNMAPPED** _(system-likely)_
- **BUTT-03 · P2 · motion · 2.3.3** — Button keeps its `--press-scale` transform transition under `prefers-reduced-motion` because `--motion-fast` is never collapsed and Button ships no per-component drop, violating the reduced-motion convention 9/13 sibling primitives follow. _(Button.svelte:69,81 `transform var(--motion-fast)`, no `@media`; tokens.css:409-416 collapses only base/slow/switch; IconButton.svelte:120-126 drops it)_  → **UNMAPPED** _(system-likely)_
- **BUTT-05 · P3 · code-quality** — The `[data-size='sm']` rule restates a byte-identical `transition` already set on base `.btn`, so it's inert now but will silently diverge if one copy is edited. _(Button.svelte:77-81 duplicates 65-69)_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Primary CTA uses fixed cool `--primary` (not Space `--accent`), fill darkened to 0.54 so `--primary-on` clears AA — documented. — tokens.css:159-168; Button.svelte:89-99
  - md=36px / sm=28px control heights are tokenized and both ≥24px, meeting 2.5.8 Target Size. — Button.svelte:56,74; tokens.css:315-316
  - focus-visible uses the tokenized ring that auto-rebinds to the active Space hue in `.sidebar` — not a re-rolled ring. — Button.svelte:84-87; tokens.css:304-307
  - Disabled uses explicit `--disabled-bg` + `--text-faint` + cursor:not-allowed (not blanket opacity); disabled controls are WCAG contrast-exempt. — Button.svelte:139-148
  - 120ms `--motion-fast` hover/press tweens sit within motion policy; the reduced-motion transform gap is the separate BUTT-03. — Button.svelte:63-69; tokens.css:241
  </details>

### Chip (Atoms)

- **CHIP-01 · P2 · states** — On the lenspage (the toggle pill's real consumer), `--space-c*` are undefined so a selected pill loses its `--space-c-soft` fill and `--space-c` ring — only the check glyph + brighter text still distinguish it, gutting the selected-state emphasis. _(Chip.svelte:201,203 background:var(--space-c-soft), ring color-mix(--space-c); LensPage.svelte:184-191 .lenspage sets --space-h/-chroma/-l but not .lunma-space-scope; --space-c* declared only at .lunma-space-scope (recipes.css:154), .sidebar, .home)_  → **UNMAPPED** _(system-likely)_
- **CHIP-03 · P2 · accessibility · 1.4.11** — The resting unselected toggle-pill ring is ~2:1 vs --bg, below the 1.4.11 3:1 non-text floor, so the pill (its only resting affordance) doesn't read as an interactive control until hover. _(Chip.svelte:177 box-shadow inset color-mix(in oklch, --text-faint 28%, transparent); --border-strong tokenized to clear 3:1 (tokens.css:125,452))_  → **UNMAPPED** _(system-likely)_
- **CHIP-06 · P3 · api** — The `disabled` prop JSDoc claims it sets `aria-disabled`, but the code applies the native `disabled` attribute (inert, out of tab order) — misleading a consumer who expects a focusable, announced aria-disabled control. _(Chip.svelte:39 JSDoc `aria-disabled`; Chip.svelte:75 native `{disabled}` attribute)_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Hue-chip color formula oklch(0.55 0.13 h /--accent-fill-a) + label oklch(--accent-text-l 0.1 h) is the documented theme-aware accent-pill recipe, contrast-verified dark+light. — tokens.css:174-177
  - `.chip.hue` repeats its background on :hover (no hover shift) — intentional for a static status/verdict token. — Chip.svelte:150-153
  - Dark-first, fully token-driven with no per-component light branch — matches the dark-first token architecture. — tokens.css:419-441
  - prefers-reduced-motion block zeroes transitions and :active transforms. — Chip.svelte:266-276
  - Selected toggle state conveyed by aria-pressed + a leading check glyph, not colour alone — meets programmatic-selection requirement. — ui-accessibility spec:53-56; Chip.svelte:73,80-82
  - `ariaLabel` prop for the toggle button satisfies the Chip accessible-name requirement. — ui-accessibility spec:22; Chip.svelte:74
  - Toggle pill and remove button carry the tokenized focus-visible ring; the non-interactive static span is correctly unfocusable. — Chip.svelte:192-195,261-264
  </details>

### ColorSwatch (Atoms)

- **COLO-01 · P2 · color-contrast · 1.4.11** — Selection ring is the swatch hue lightened (swatch-l+0.04) with no light-theme lightness cap, so light hues (yellow→0.91, teal/cyan/green 0.78-0.82, gray 0.70) sit <2:1 vs --bg-elev 0.978 on light theme — the intended selection ring is invisible, leaving selection to the subtle 0.92→1.0 scale alone. _(ColorSwatch.svelte:88 box-shadow 0 0 0 4px oklch(calc(var(--swatch-l)+0.04)…); recipes.css:167 caps min(--space-l,0.55) on [data-theme='light'])_  → **UNMAPPED** _(system-likely)_
- **COLO-02 · P3 · tokens** — border-radius:9px hard-coded in .swatch/.dot/:focus-visible instead of --r-md (9px), so a radius-scale change won't propagate. _(ColorSwatch.svelte:55,66,82 border-radius:9px; tokens.css:220 --r-md:9px)_  → **UNMAPPED** _(system-likely)_
- **COLO-05 · P3 · i18n** — aria-label={color} emits the raw English SpaceColor enum (e.g. 'purple'), unlocalized in a paraglide app, so non-English screen-reader users hear untranslated colour names and can't identify swatches. _(ColorSwatch.svelte:32 aria-label={color}; consumer localizes elsewhere (SpaceEditor.svelte:339 m.sidebar_spaceColorLabel()))_  → **UNMAPPED** _(system-likely)_
- **COLO-06 · P3 · story-fidelity · 1.3.1** — full-palette story renders single-select swatches with no role=group/accessible name, modeling the exact anti-pattern the ui-accessibility spec forbids for grouped ColorSwatch toggles. _(ColorSwatch.stories.svelte:37-41 bare Variant; ui-accessibility spec 'Swatch group uses a valid role'; SpaceEditor.svelte:338 wraps role=group)_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Selection conveyed by aria-pressed + ring + full-scale (0.92→1.0), not colour alone — satisfies WCAG 1.4.1 (COLO-01 addresses the separate 1.4.11 ring-contrast SC, not this). — ui-accessibility spec; ColorSwatch.svelte:31,85-90
  - Container role=group (not radiogroup) + aria-label + roving tabindex + arrow keydown is correctly implemented by the consumer per spec. — SpaceEditor.svelte:329-352; ui-accessibility spec 'Swatch group uses a valid role'
  - 30x30 CSS px hit area clears the 24x24 minimum target size. — WCAG 2.5.8; ColorSwatch.svelte:49-50
  - Focus ring uses tokenized --focus-width/--focus-color/--focus-offset, not a re-rolled ring. — tokens.css:305-307; ColorSwatch.svelte:79-83
  - Dot renders the colour's TRUE canonical OKLCH (gray chroma 0) as an honest identity preview by design. — ColorSwatch.svelte:18-21; space-hue.ts PALETTE
  - 120ms --motion-fast micro-transitions survive prefers-reduced-motion by design (the reduced-motion block keeps the fast tick as essential feedback). — tokens.css:409-417
  </details>

### Diffstat (Atoms)

- **DIFF-01 · P2 · color-contrast · 1.4.3** — Light-theme status numerals fail AA on --surface-3 (--success 4.16:1, --danger 4.04:1 vs 4.5:1 for 10px text); the numerals are Diffstat's entire content, so a Diffstat on an elevated light surface is illegible to low-vision users. _(Diffstat.svelte:60,65,68 (--text-2xs, .add=--success, .del=--danger); tokens.css:502 comment scopes light --success/--danger AA to --surface/--surface-2/--bg, omitting --surface-3 (measured 4.16/4.04:1).)_  → **UNMAPPED** _(system-likely)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Magnitude never colour-only: +/− numerals always render beside the aria-hidden decorative bar. — Diffstat.svelte:2-4,41
  - role=img + numsLabel on .nums preserves the additions/deletions distinction under SR punctuation suppression, singular-aware (DIFFSTAT-01). — Diffstat.svelte:21-40
  - Renders nothing when both sides undefined; a present-but-zero side still renders its 0. — Diffstat.svelte:13-16,35
  - tabular-nums for aligned digits across rows. — Diffstat.svelte:62
  - Dark-theme status text passes AA (--success 7.1-8.6:1, --danger 4.9-5.8:1 across --bg…--surface-3). — tokens.css:210-212
  - Non-interactive display atom: correctly ships no hover/focus/disabled states. — Diffstat.svelte:36-45
  </details>

### EntityBadge (Atoms)

- **ENTI-01 · P2 · consistency** — The theme-aware pill fill oklch(0.55 0.13 <hue> / var(--accent-fill-a)) is hand-rolled in 5 sites (2 primitives + a surface) with no shared recipe, so tuning fill drifts them apart — the divergence already happened (label chroma 0.11 here vs 0.1 in Chip/tokens.css doc). _(EntityBadge.svelte:49-50, Chip.svelte:147-148/152, OverviewPage.svelte:1035/1369; pattern documented tokens.css:172-177 but never codified)_  → **UNMAPPED** _(system-likely)_
- **ENTI-03 · P2 · test-coverage** — EntityBadge is the only live src/ui primitive with no *.test.harness.svelte or *.test.ts, violating the ui-primitives.md 'ships with test harness + test.ts' contract; glyph/hue-map regressions ship unguarded (stories-coverage guards stories, not tests). _(ls src/ui — every sibling has .test.harness.svelte+.test.ts; EntityBadge.svelte has neither; ui-primitives.md 'A new primitive ships with its test harness … and test.ts')_  → **UNMAPPED** _(local)_
- **ENTI-02 · P3 · tokens** — The 26px badge box is a raw magic number off the scale (nearest --control-h-xs 24 / --icon-btn 28), duplicated verbatim in Avatar[data-size='md']; the two small-tile sizes can drift independently with nothing gating raw width/height. _(EntityBadge.svelte:46-47 width/height:26px == Avatar.svelte:72-74 [data-size='md'] 26px; no 26px stop on the token scale)_  → **UNMAPPED** _(system-likely)_
- **ENTI-06 · P3 · accessibility · 1.1.1** — In the OverviewPage 'Waiting on you' lane the aria-hidden badge is the only change-vs-ticket-vs-article signal (row text gives title/provider/ref, never entity type), so screen-reader users lose a user-meaningful distinction; EntityBadge has no accessible-name escape hatch. _(EntityBadge.svelte:37 aria-hidden="true", Props:15-20 no label prop; OverviewPage.svelte:275 row omits entity-type text; a11y spec:79 decorative glyph SHALL be named where operation is user-meaningful)_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Theme-aware pill recipe (--accent-text-l/--accent-fill-a) keeps label+fill legible dark+light at every intensity; glyph clears non-text 3:1 by construction. — tokens.css:172-177; EntityBadge.svelte:49-50
  - Distinct glyph per entity (git-pull-request/circle-dot/newspaper) makes shape—not hue—carry meaning, surviving colour-blindness. — EntityBadge.svelte:24-28; visual-system spec
  - --r-md rounded-plate (not --r-pill) is an intentional lens-tile shape matching the FolderRow lens-header plate. — EntityBadge.svelte:48; FolderRow.svelte:396
  - ENTI-05: fixed per-entity hues 252/295/150 are a documented deliberate decision (stable entity identity, independent of Space); the same raw hues are used by the OverviewPage section dots (style:--dot-h="252"), so binding them to --space-*-h tokens would couple entity identity to palette retunes against that intent. — EntityBadge.svelte:8-14,29; OverviewPage.svelte:296
  </details>

### Favicon (Atoms)

_No issues found._


  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - alt honored only in loaded-img branch (:144); globe/box drop it — but the primitive is contractually decorative (default alt='', aria-hidden globe, title carries the name) and no production consumer passes meaningful alt, so no real a11y impact. — Favicon.svelte:40-41,144,151,156
  </details>

### FaviconTile (Atoms)

- **FAVI-01 · P3 · visual-consistency** — Return glyph renders size=20 while the favicon it cross-fades over is 24, so hovering a returnable tile visibly shrinks the affordance vs the icon it replaces (TabRow matches both at 16). _(FaviconTile.svelte:145 Icon corner-up-left size={20}; :132 Favicon size={FAVICON_PX}=24)_  → **UNMAPPED** _(local)_
- **FAVI-02 · P3 · token-contract** — FAVICON_PX=24 is a JS constant hand-synced to --favicon-img:24px; a token change silently drifts the image/spinner size from the CSS plate, and the same raw-number mirroring recurs in TabRow (16 vs --favicon-size) and ResultRow. _(FaviconTile.svelte:86-88 FAVICON_PX=24 comment 'kept in sync with --favicon-img'; tokens.css:331 --favicon-img:24px; TabRow.svelte:93 size={16}; ResultRow.svelte:76 size={16})_  → **UNMAPPED** _(system-likely)_
- **FAVI-03 · P3 · code-quality** — The drift-dot comment cites 'TabRow's dot recipe,' but TabRow conveys drift via subtitle + return glyph and has no dot, so the comment references a nonexistent recipe (comment rot per rules/comments.md). _(FaviconTile.svelte:221 comment 'TabRow's dot recipe'; TabRow.svelte:180 drift via .subtitle, no drift-dot class)_  → **UNMAPPED** _(local)_

### Icon (Atoms)

- **ICON-01 · P3 · consistency** — No icon-size scale token exists, so callers pass ~9 arbitrary near-duplicate px sizes (11/12/13/14/15/16/18/20/40) and icon sizing drifts across every surface. _(Icon.svelte:62 size=16 default; callers e.g. Lens.svelte:790 size=11, ArchivedChip.svelte:31 size=13, SpaceSwitcher.svelte:232 size=12; tokens.css:324,331 only --favicon-size/--favicon-img, no icon scale.)_  → **UNMAPPED** _(system-likely)_
- **ICON-02 · P3 · robustness** — When resolveIcon returns null (unknown name or load failure — e.g. a stored Space icon later dropped from lucide), Icon renders an empty box permanently with no fallback glyph, showing a blank Space icon in the sidebar. _(Icon.svelte:24,34 return null on miss/error; Icon.svelte:95,105 {#if Resolved} has no else branch.)_  → **UNMAPPED** _(system-likely)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - name typed as string (not IconName) is intentional — Icon is the generic renderer for the full lucide set; casting at call sites was the rejected alternative. — Icon.svelte:51-56
  - label undefined = aria-hidden decorative icon is the intended default, correctly hiding purely decorative glyphs from SR. — Icon.svelte:98-104
  - Transient empty-box flash on cache-miss / synchronous cache-hit swap is a documented before-paint tradeoff (separate from ICON-02's permanent-null case). — Icon.svelte:66-74
  </details>

### IconButton (Atoms)

- **ICON-02 · P3 · consistency** — Disabled dims via blanket `opacity:0.4` while sibling Button uses explicit `--disabled-bg`/`--text-faint`, so the two button primitives express disabled through unrelated mechanisms with no shared convention. _(IconButton.svelte:113-116 `opacity:0.4`; Button.svelte:139-145 `--disabled-bg`+`--text-faint`)_  → **UNMAPPED** _(system-likely)_
- **ICON-03 · P3 · consistency** — `:active` applies only `--press-scale` with no background wash, but Button's ghost `:active` also sets `background:var(--press)`, so press feedback differs between the two ghost controls. _(IconButton.svelte:104-106 (transform only); Button.svelte:132-135 `--press`+transform)_  → **UNMAPPED** _(system-likely)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Single `ghost` variant with `data-variant` hook kept for future fills — documented intentional. — IconButton.svelte:26-28
  - Accessible name resolves ariaLabel→title with dev-mode warning when both missing; icon stays decorative. — ui-accessibility/spec.md:11-16; IconButton.svelte:53-63,73
  - Reduced-motion drops transform easing but keeps un-eased `:active` press-scale + colour cross-fade — documented. — IconButton.svelte:118-126
  - Box `--icon-btn`=28px ≥24px satisfies WCAG 2.2 SC 2.5.8 Target Size (Minimum). — tokens.css:325
  - Focus ring/radius/press fully tokenized (`--focus-width/-color/-offset`,`--r-md`,`--press-scale`); 2px ring meets SC 2.4.13, auto-rebinds to Space hue via `--focus-color`. — IconButton.svelte:91,105,108-111; tokens.css:304-310
  - ICON-01: `size` documented as glyph px ('Icon size in px'), not box density — intentional contract distinct from Button's density enum; box stays 28px≥24px so no target-size regression. — IconButton.svelte:29-30,82-83; tokens.css:325
  </details>

### Kbd (Atoms)

- **KBD-01 · P2 · accessibility · 4.1.2, 1.1.1** — aria-label sits on a bare <kbd> (implicit role=generic, where author-supplied names are ARIA-prohibited), so NVDA/VoiceOver drop it and the prop's whole purpose — announcing ⌥L as "Option L" — silently fails, leaving SRs to read the raw pictograph. _(Kbd.svelte:15 `<kbd class="kbd" aria-label={ariaLabel}>`; convention at Icon.svelte:91, Diffstat.svelte:37, ReviewerRail.svelte:74 all `role="img"`+aria-label)_  → **UNMAPPED** _(local)_
- **KBD-06 · P3 · api** — Props JSDoc claims ariaLabel can "hide a purely decorative glyph," but aria-label names, it never hides — a consumer following it gets a named glyph, not a suppressed one; hiding needs aria-hidden. _(Kbd.svelte:6-9 JSDoc "...or to hide a purely decorative glyph"; same wording in openspec/specs/ui-accessibility/spec.md:15-17)_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Non-interactive <kbd> correctly has no focus ring and is exempt from 2.5.8 Target Size / focus-appearance. — .claude/rules/ui-primitives.md
  - ariaLabel being optional and applied to the <kbd> is spec-mandated, not an omission — covers KBD-02's 'should the primitive enforce' angle; KBD-01's role=img keeps the label on the <kbd> and stays compatible. — openspec/specs/ui-accessibility/spec.md:15-17
  - Opaque --surface-2 fill with --text-muted passes WCAG AA both themes and stays legible on glass/aurora since it carries its own opaque background. — packages/tokens/tokens.css:117,142,446,465
  - font (--text-xs/--weight-semibold/--font-mono), radius (--r-xs), surface/border/text colors all tokenized — no hardcoded color/radius/font-size. — Kbd.svelte:25-29
  - Dark-first with no per-component light branch is correct — tokens flip via data-theme. — packages/tokens/tokens.css:440-543
  </details>

### RowButton (Atoms)

- **ROWB-04 · P3 · visual-consistency** — :active paints neutral --press on a Space-hued-hover row, flashing grey mid-press inside a Space scope and breaking the colour-forward hover→press continuity. _(RowButton.svelte:65 hover var(--space-c-soft); :70 active var(--press) (neutral, tokens.css:120))_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - ariaCurrent is a spec-mandated passthrough (ui-accessibility spec:203-204: active catalog nav item SHALL expose aria-current='page' via a RowButton ariaCurrent passthrough), not stranded/speculative infra; the story deliberately omits a naive control because the neutral state is 'absent'. — openspec/specs/ui-accessibility/spec.md:203-204; RowButton.stories.svelte:14-16; RowButton.svelte:10-13
  </details>

### SettingText (Atoms)

_No issues found._


  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Raw gap values are not part of the token contract — ui-primitives.md gates only font-size/z-index (Stylelint), and raw sub-4px gaps are the established convention (Select.svelte:306, MultiSelect.svelte:576, ResultRow.svelte:196). — SettingText.svelte:28; .claude/rules/ui-primitives.md
  - Raw unitless line-heights are equally out of the token contract's gated scope and match the codebase convention (CardHeading.svelte:47, BottomSheet.svelte:177, Kbd.svelte). — SettingText.svelte:33,39
  - Consuming controls carry their accessible name directly via ariaLabel, so the label span is a visual duplicate and needs no id/aria-labelledby association hook. — Options.svelte:336,344
  </details>

### AccountChip (Composite)

- **ACCO-01 · P2 · i18n** — STATUS_WORD renders hard-coded English ('Connected','Add a token','Reconnect'…) with no translation path, leaking English status words into all 9 non-English locales on the localized sidebar/options surfaces. _(AccountChip.svelte:26-32,67 STATUS_WORD literals rendered; consumed at LensEditor.svelte:348 (localized); options_authmethod* m.* keys already exist)_  → **UNMAPPED** _(system-likely)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Pip is aria-hidden and always paired with the visible STATUS_WORD, so status is never colour-only (WCAG 1.4.1 satisfied). — AccountChip.svelte:66-67; design D8 comment L112-113
  - Chip is a non-interactive identity span with no focus ring — the consuming ledger/picker row owns the affordance. — AccountChip.svelte:54 bare JSDoc; L62 span root
  - github/gitlab/bitbucket share the folder-git-2 glyph because lucide ships no brand mark; matches connectors' mintedIcon. — AccountChip.svelte:14-23
  - Pip is a static colour step (not a pulse) and status colours (--success/--warning) are distinct from --accent. — AccountChip.svelte:112-132; tokens.css:209-212
  - 10px --text-2xs status word and --surface-2 dark-first fill are system tokens; --text-dim clears AA (~5.5:1 dark, ~5.2:1 light) on --surface-2. — tokens.css:139,143,267; AccountChip.svelte:82,137
  </details>

### AccountConnectField (Composite)

- **ACCO-01 · P2 · accessibility · 2.4.6** — TextInput suppresses ariaLabel when label is set, so the host-qualified name never reaches the DOM and every field is named just "Token" — two required git providers on one Options page expose two indistinguishable "Token" password fields. _(AccountConnectField.svelte:94-95 passes both label + ariaLabel=`Token for ${host}`; TextInput.svelte:90 aria-label={label===undefined?ariaLabel:undefined} drops it (per ui-accessibility spec:180-197 convention).)_  → **UNMAPPED** _(local)_
- **ACCO-04 · P3 · visual** — InlineError's intrinsic margin-top stacks on top of the parent flex gap, spacing the error ~20px (space-2 + space-3) below vs 8px for the help link — uneven rhythm in any flex/grid-gap host that composes InlineError. _(AccountConnectField.svelte:135 .connect-field gap var(--space-2); InlineError.svelte:27 margin: var(--space-3) 0 0.)_  → **UNMAPPED** _(system-likely)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Clearing token on confirm before the parent resolves (so a rejected token needs full re-entry) is the deliberate never-echo security choice; token fields are also the security exception to WCAG 3.3.7. — AccountConnectField.svelte:16-22,70-78 (onConnect/hasToken never-echo docs)
  </details>

### FolderRow (Composite)

- **FOLD-01 · P2 · color-contrast · 1.4.3** — Count-badge text (--text-faint on --surface-2, 10px) hits only 3.97:1 in light theme, below AA 4.5:1 for informative text, so a smart-folder count (badge="7") is sub-legible; dark theme actually passes at 4.53:1. _(FolderRow.svelte:475-476 .badge color:var(--text-faint) background:var(--surface-2) font:--text-2xs)_  → **UNMAPPED** _(local)_

### IconPicker (Composite)

- **ICON-01 · P1 · color-theming · 1.4.11** — Light theme: selected tile glyph is near-white (--accent-text 0.965) over a 0.16 accent tint on near-white --surface (~1.1:1) and the /0.5 accent border collapses, so the current-icon selection is imperceptible; same token in MultiSelect fails identically. _(tokens.css:156 --accent-text:oklch(0.965 …) not re-expressed in light block (only --accent-text-l:483); IconPicker.svelte:332,337 + MultiSelect.svelte:640 color:var(--accent-text); light --surface tokens.css:445 oklch(0.998 …))_  → **UNMAPPED** _(system-likely)_
- **ICON-02 · P3 · consistency** — The accent input focus-halo (border oklch(from --accent l c h /0.55) + box-shadow 0 0 0 3px --accent-soft) is hand-copied in 5 form primitives with no shared recipe, so any focus-treatment change must edit 5 sites and risks drift. _(identical halo in IconPicker.svelte:255-256, SearchField.svelte:242-245, MultiSelect.svelte:468, Select.svelte, TextInput.svelte)_  → **UNMAPPED** _(system-likely)_
- **ICON-03 · P3 · accessibility · 2.4.11** — Arrow-down roving nav parks the newly-focused tile flush at the still-active bottom scrollFade band, so its focus ring/glyph fade toward transparent over the 24px mask on a 40px tile (extremes self-heal since reaching an edge drops that fade). _(IconPicker.svelte:198 use:scrollFade + :323-326 focus-visible outline; focusTile() :115-120 uses browser auto-scroll with no scroll-margin; scroll-fade.ts:73-76 keeps --scroll-fade=24px (tokens.css:323) on an unreached edge)_  → **UNMAPPED** _(system-likely)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Soft accent-fill + tinted-glyph selection (no hard ring) is an intentional premium treatment; the light-theme glyph/border legibility is the separable ICON-01 fix. — IconPicker.svelte:328-334
  - Lazy IntersectionObserver glyph mounting (~200px rootMargin) is a deliberate perf choice for the ~400-tile catalogue. — IconPicker.svelte:65-104
  - Roving-tabindex radiogroup (grid tabindex=-1, arrow/Home/End nav) is the intended a11y pattern. — IconPicker.svelte:187-197,122-156
  - Persistent sr-only role=status region mirroring aria-hidden empty/more copy is the documented single-read announce pattern. — IconPicker.svelte:54-61,179-185
  - Accepting value:string (may highlight no tile when outside the catalogue) while emitting only IconName is intentional stored-value tolerance. — IconPicker.svelte:14-22
  - Focus-visible ring uses the tokenized --focus-width/--focus-color/--focus-offset convention correctly. — IconPicker.svelte:323-326
  - Recessed rect search field distinct from SearchField's glass pill is a deliberate comp §8 decision, so composing SearchField here is not the fix (ICON-02 addresses only the shared halo). — IconPicker.svelte:165-166,236-238
  </details>

### LensRow (Composite)

- **LENS-01 · P1 · accessibility · 4.1.2** — Busy state omits aria-busy on .lens-row, so SR users get no programmatic busy state (only a transient live-region blip), violating ui-accessibility 'Loading row announces busy' which explicitly names LensRow. _(LensRow.svelte:73-81 .lens-row has no aria-busy; FolderRow.svelte:204 sets aria-busy; spec ui-accessibility:85 lists LensRow)_  → **UNMAPPED** _(local)_
- **LENS-02 · P2 · color-contrast · 1.4.11 (glyph aria-hidden → visual-quality soft-fail)** — Leading glyph is painted in the raw per-colour palette lightness (--lens-c) with no contrast floor, so light hues (yellow L0.87, teal 0.78, cyan 0.77, green 0.74, orange 0.73, pink 0.70) render near-invisible on light-theme --surface. _(LensRow.svelte:190 .tile{color:var(--lens-c)}=oklch(l c h); PALETTE l space-hue.ts:60-69; FolderRow.svelte:205,411 normalizes L→0.62 via --folder-c + tinted plate)_  → **UNMAPPED** _(system-likely)_
- **LENS-03 · P3 · tokens** — Redundant .tile-mark/.tile-caret svg rule hardcodes width/height:16px that Icon already applies via --icon-size, duplicating the value --favicon-size owns and violating the no-hardcoded-values convention. _(LensRow.svelte:198-202 :global(svg){width:16px;height:16px}; Icon.svelte sizes svg via --icon-size (size=16 at LensRow:92-93); FolderRow.svelte:412-415 uses var(--favicon-size))_  → **UNMAPPED** _(local)_
- **LENS-05 · P3 · correctness** — onpointerdown stopPropagation on .open-page is inert for its stated 'stop row toggle' purpose: the toggle is a sibling button, .lens-row has no pointer handler, and pointerdown≠click — nothing consumes the bubbled event. _(LensRow.svelte:106-107 onpointerdown stopPropagation + comment; toggle onclick on sibling button :89)_  → **UNMAPPED** _(local)_
- **LENS-06 · P3 · motion-tokens** — 0.8s linear spin cadence is hardcoded in LensRow/FolderRow (+TabRow/FaviconTile) with no shared token, so the busy-spinner tempo can drift between primitives. _(LensRow.svelte:219 & FolderRow.svelte:422 animation ... 0.8s linear infinite; tokens.css:241-249 defines no spin-duration token)_  → **UNMAPPED** _(system-likely)_
- **LENS-07 · P3 · responsiveness** — The open-lens-overview button reveals only on :hover/:focus-within and is pointer-events:none otherwise, so on a coarse (touch) pointer it is unreachable — a hover-reveal pattern shared with FolderRow's kebab. _(LensRow.svelte:271-291 .open-page opacity/pointer-events gated on .lens-row:hover / .open-page:focus-within; no @media(hover:none) fallback)_  → **UNMAPPED** _(system-likely)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - active peek sets aria-current='true' on the row (not aria-pressed) — spec-mandated. — LensRow.svelte:77; spec ui-accessibility:59-60
  - Count folded into the toggle's accessible name and rendered aria-hidden avoids a context-free bare-number re-read. — LensRow.svelte:69-70,104
  - Active-peek 0.16 wash + 0.5 inset ring mirror the comp ACTIVE_STYLE; colour isn't sole signal since aria-current is present. — LensRow.svelte:63-64,150-153
  - Reduced motion disables caret tween + busy spin and holds the glyph static at --text-dim. — LensRow.svelte:226-236
  - Hard display swap type-icon→chevron (not opacity crossfade) is deliberate so the name never shifts. — LensRow.svelte:181-215
  - sr-only aria-live 'Refreshing…' is an extra announcement, not a substitute for the missing aria-busy (LENS-01). — LensRow.svelte:119-123
  - Focus ring hoisted to the row via :has(.toggle:focus-visible) with tokenized outline; coexists with the inset active ring. — LensRow.svelte:173-179
  - Plain (non-pill) count badge is intentional so its digits share the feed-section counts' right edge. — LensRow.svelte:264-270
  </details>

### ResultList (Composite)

- **RESU-04 · P3 · accessibility · 4.1.2 Name, Role, Value** — In the advertised 'focuses the list root directly' mode the root listbox (tabindex=-1, receives keydown) never carries aria-activedescendant itself — the active id is only pushed outward for an external combobox input — so a SR user focusing the list hears its name but not the roving selection; latent since no shipping surface uses direct-focus mode. _(ResultList.svelte:23-24 ariaLabel doc; :80-82 onactivedescendant callback only; :122-130 root role=listbox tabindex=-1 no aria-activedescendant)_  → **UNMAPPED** _(local)_
- **RESU-02 · P3 · consistency** — handleKeydown supports only ArrowUp/Down/Enter/Escape — no Home/End — so on a long list a keyboard user can't jump to first/last, diverging from the house listbox pattern (arrows still reach every row, so no WCAG failure). _(ResultList.svelte:102-119 no Home/End; Select.svelte:116-119 + MultiSelect.svelte:213-216 handle Home/End)_  → **UNMAPPED** _(system-likely)_

### ResultRow (Composite)

- **RESU-01 · P3 · tokens** — Off-scale raw pixels bypass the spacing scale the visual-system spec requires as tokens; Stylelint gates only font-size/z-index so they slip through — maintainability drift, no user impact. _(ResultRow.svelte:234 gap:4px; :196 gap:1px; :239-240 width/height:7px; :263 padding:3px 5px)_  → **UNMAPPED** _(system-likely)_
- **RESU-04 · P3 · consistency** — The uppercase --text-2xs/--text-dim micro-label is re-rolled inline in ResultRow and Menu instead of a shared primitive/recipe, letting the pattern drift across surfaces. _(ResultRow.svelte:254-264 .badge, :244-252 .space-name; Menu.svelte:254 .lunma-menu-kind — same uppercase --text-2xs --text-dim recipe)_  → **UNMAPPED** _(system-likely)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - text-dim-on-glass contrast is already covered: contrast tests intentionally treat --surface/--surface-2 as glass stand-ins and gate --text-dim >=4.5:1 on all surface tokens, and the launcher result list paints on --glass-bg-strong at 0.97 alpha specifically for legibility. — apps/extension/src/ui/contrast.test.ts:175-178; launcher/overlay.css:44-45,118-122; apps/site/src/lib/contrast.test.ts:107-108
  </details>

### ReviewerRail (Composite)

- **REVI-01 · P2 · robustness** — Keyed `{#each ... (reviewer.initials)}` throws Svelte's `each_key_duplicate` and blanks the rail whenever two real reviewers share initials (e.g. two "JD"). _(ReviewerRail.svelte:62 `(reviewer.initials)`; Reviewer has no id (lines 11-15))_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Non-interactive display primitive (verdict glyph + discs + badge, no controls) — no focus-visible ring required. — ReviewerRail.svelte:51-78
  - Empty reviewer list renders nothing — documented; absence is meaningful in a PR-row context. — ReviewerRail.svelte:8,51
  - Verdict never colour-only: lead glyph shape+colour and each Avatar corner badge shape back the ring hue. — ReviewerRail.svelte:33-37,59; Avatar.svelte:30-34
  - Blocking-wins lead verdict (changes>pending>approved), pending→--text-dim, is an intentional D5 rule. — ReviewerRail.svelte:29-45
  - Hard-coded English aria strings match sibling primitives; paraglide is not applied inside src/ui. — ReviewerRail.svelte:75; BottomSheet.svelte:83; IconPicker.svelte:174
  - Overflow +N is role=img/aria-label and non-interactive, so 2.5.8 Target Size does not apply. — ReviewerRail.svelte:71-75
  </details>

### ServiceConnectPicker (Composite)

- **SERV-02 · P2 · i18n** — ~10 user-facing strings are hardcoded English in this cross-surface composite (microcopy, toasts, errors) with no paraglide, so a localized build ships English fragments the host cannot override. _(ServiceConnectPicker.svelte:287-297 microcopy, :222-235 toasts, :143/:199 errors; no paraglide import in src/ui (surfaces use paraglide/messages))_  → **UNMAPPED** _(local)_
- **SERV-01 · P3 · consistency** — Hand-rolled Service field label (weight-medium, lh 1, no letter-spacing) diverges from TextInput's built-in .label (weight-semibold, lh 1.2, 0.01em), so a labelled Select beside a labelled TextInput shows mismatched label typography. _(ServiceConnectPicker.svelte:378-381 .field-label vs TextInput.svelte:108-112 .label; Select.svelte:21 externalizes label)_  → **UNMAPPED** _(system-likely)_
- **SERV-04 · P3 · security** — Token field is type=password with no autocomplete, so Chrome's password manager offers to save the PAT — an unexpected credential-save prompt for a machine-local token. _(ServiceConnectPicker.svelte:261-268 <TextInput type="password"> no autocomplete; TextInput.svelte:29,89 supports passthrough)_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Spec sanctions role="status" OR focus-move for ServiceConnectPicker's import result (distinct from IconPicker's persistent-region rule); code matches spec, so SERV-03's IconPicker-parity demand contradicts the invariant. — ui-accessibility/spec.md:125-127 vs :128-129; ServiceConnectPicker.svelte:332
  - Placeholder-as-label for Host/Token/Workspace is an explicit comp-matching design choice, and fields carry ariaLabel so the AT name persists — SERV-05 restates a documented tradeoff. — ServiceConnectPicker.svelte:84 comment, :253-281 ariaLabel
  </details>

### SettingsCard (Composite)

- **SETT-01 · P3 · robustness** — flush mode's documented 'dividers clipped by the Surface' contract is unimplemented, so a full-bleed edge row with a background/banner would render square corners past the radius-2xl curve (latent: no current flush consumer bleeds an edge background). _(SettingsCard.svelte:15-17 (comment) + :50 `<Surface variant="section" radius="2xl">` no clip; Surface.svelte:30 clip default false, :58 overflow:hidden gated on data-clip)_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Card lead uses --text-muted (neutral chroma 0, AA-clearing, hue-stable) by documented decision; changing it to match row --text-dim contradicts that choice, and lead-vs-row-desc is a role difference, not an inverted hierarchy. — tokens.css:142; SettingsCard.svelte:78; deliberate note on --text-muted description color
  </details>

### TabRow (Composite)

- **TABR-02 · P2 · color-contrast · 1.4.3** — Informative `--text-dim` `.meta`/`.subtitle` composited over the hover/active `--space-c-soft` wash can drop below AA 4.5:1 (dark theme, bright-hued Space e.g. yellow L0.87 lightens the dark row), and it is reachable — meta stays visible on hover, drift subtitle always shows. _(TabRow.svelte:508 .meta color:var(--text-dim); :438 .subtitle var(--text-dim); wash :227/:237 background:var(--space-c-soft); recipes.css:156/168 alpha 0.16; --text-dim AA-verified only on bare --surface (tokens.css:139,466))_  → **UNMAPPED** _(system-likely)_
- **TABR-01 · P3 · accessibility · 4.1.2** — When not `returnable`, the favicon `<button>` is dropped from tab order (tabindex=-1) but left in the AT tree with `aria-label={title}` and the same focus action, so SR browse/rotor users hit a redundant second control named identically to the title button per row. _(TabRow.svelte:147-155 favicon-btn tabindex=-1, aria-label={title}, no aria-hidden; sibling .row-focus:133-140 is aria-hidden='true')_  → **UNMAPPED** _(local)_

### EditableLabel (Form)

- **EDIT-01 · P3 · visual-consistency** — The input hard-codes height:22px, contradicting the primitive's own stated 'imposes no colour/size' intent (font:inherit) and matching no token, so the field's box is a magic number decoupled from the inherited line box. _(EditableLabel.svelte:128 height:22px; vs comment l107-108 'imposes no size'; no --control-h match (xs=24px))_  → **UNMAPPED** _(local)_
- **EDIT-02 · P3 · color-theming** — No ::placeholder rule, so the 'Name…' hint uses each browser's UA placeholder colour instead of the tokenized --text-faint every sibling field declares — untokenized and inconsistent (shows only on an empty draft, e.g. allowEmpty clear). _(EditableLabel.svelte:123-136 no ::placeholder; TextInput.svelte:138 / SearchField.svelte:227 / IconPicker.svelte:274 all color:var(--text-faint))_  → **UNMAPPED** _(local)_
- **EDIT-04 · P3 · accessibility · 4.1.2** — ariaLabel is optional with no fallback, so a consumer that omits it yields an input whose only accessible name is the placeholder (or none) — a latent unlabeled rename field the API permits. _(EditableLabel.svelte:29 ariaLabel?:string; l97 aria-label={ariaLabel})_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Chromeless input with outline:none on focus is intentional — the surrounding row owns the single .editing ring and the --accent caret is the in-field affordance; a primitive ring would stack a second outline. The story showing it bare reflects the primitive honestly. — EDIT-03; EditableLabel.svelte:142-144; TabRow.svelte:373-375; FolderRow.svelte:334-336
  - No invalid/error state is deliberate — validation is the parent's job and the composition contract keeps props minimal; adding an error surface with no consumer is speculative config. — EDIT-06; EditableLabel.svelte:15-32; ui-primitives.md:16-17
  </details>

### MultiSelect (Form)

- **MULT-02 · P1 · color-contrast · 1.4.3** — 'Select all'/'Clear' header actions colour text with raw --accent (theme-independent Space hue), failing AA 4.5:1 on the light elevated Surface across most Spaces (yellow ~1.1:1) so the bulk-select/clear affordance is illegible. _(MultiSelect.svelte:560 .head-action{color:var(--accent)} at var(--text-xs)/semibold; tokens.css:154 --accent (no light override))_  → **UNMAPPED** _(system-likely)_
- **MULT-01 · P2 · color-contrast · 1.4.11** — Checked box draws its check in fixed near-white --accent-text on the --accent fill, so on the 5 light-accent Spaces (yellow ~1.1:1, orange/green/cyan/pink ~1.5-2:1) the check is near-invisible in both themes — reads as a half-rendered toggle (state still conveyed by the accent-filled box, so mitigated). _(MultiSelect.svelte:640 .box{color:var(--accent-text)}; :646 .box.checked{background:var(--accent)}; tokens.css:156-157)_  → **UNMAPPED** _(local)_
- **MULT-05 · P2 · empty-state · 4.1.3** — When the in-popover search filters out every option the list renders blank with no message and no live-region announcement, so sighted users see an empty panel and SR users hear nothing. _(MultiSelect.svelte:270-313 {#each visibleOptions} has no empty branch/aria-live; cf. IconPicker.svelte:182 <p role="status"> + :185 .empty)_  → **UNMAPPED** _(local)_
- **MULT-04 · P2 · target-size · 2.5.8** — 'Select all'/'Clear' header buttons are ~15px tall (2px padding + 11px text), below the 24x24 minimum, hard to hit for touch/imprecise pointers. _(MultiSelect.svelte:557 .head-action{padding:2px var(--space-2)}; --text-xs=11px, --control-h-xs=24px)_  → **UNMAPPED** _(local)_
- **MULT-07 · P2 · target-size · 2.5.8** — Chip-variant trigger is ~22px tall (4px padding, height:auto) — a real filter-toolbar click target under the 24x24 minimum, while the default Chip already meets it. _(MultiSelect.svelte:441 .trigger.chip{height:auto;padding:4px 11px;font-size:var(--text-xs)}; Chip.svelte:119 height:var(--control-h-xs))_  → **UNMAPPED** _(local)_
- **MULT-03 · P3 · aria-semantics · 1.3.1** — Option button sits in a bare <li> (implicit listitem) directly inside role=listbox — an invalid listbox child that can misreport set-size/position to AT; Select applies the fix but MultiSelect diverged. _(MultiSelect.svelte:272 <li> vs Select.svelte:187 <li role="presentation">; ui-accessibility spec:147-148 (SEL-04))_  → **UNMAPPED** _(local)_
- **MULT-08 · P3 · tokenization** — Checkbox box uses var(--r-xs,5px) whose 5px fallback contradicts the real --r-xs (4px) — inert (token always defined) but misleading drift. _(MultiSelect.svelte:638 border-radius:var(--r-xs,5px); tokens.css:218 --r-xs:4px)_  → **UNMAPPED** _(local)_

### SearchField (Form)

- **SEAR-02 · P2 · color-contrast · 1.4.3** — Immersive input placeholder uses `--text-muted` over translucent `--glass-bg` composited on the vivid aurora, a composite the contrast suite never tests; on a bright Space hue the muted grey placeholder can fall below 4.5:1, making the resting search affordance hard to read. _(SearchField.svelte:228 `.control::placeholder{color:var(--text-muted)}` over :178 `--glass-bg` (tokens.css:349 `oklch(0.24 .03 h /0.5)`); contrast.test.ts:146 BGS covers only opaque `--bg/--surface*`, never glass-over-aurora)_  → **UNMAPPED** _(system-likely)_
- **SEAR-01 · P3 · tokens-consistency** — Input-mode focus indicator hardcodes halo geometry (`0 0 0 3px`) and border alpha (`/0.55`) instead of a `--focus-*` token, an untokenized pattern duplicated across five form primitives that Stylelint does not catch, so the shared input-focus halo can drift out of sync. _(SearchField.svelte:242-246 `border-color:oklch(from var(--accent) l c h /0.55)` + `box-shadow:...,0 0 0 3px var(--accent-soft)`; same `0 0 0 3px var(--accent-soft)` at TextInput.svelte:149, Select.svelte:265, IconPicker.svelte:256, MultiSelect.svelte:469)_  → **UNMAPPED** _(system-likely)_
- **SEAR-03 · P3 · consistency** — Leading icon is sized `15`, an outlier used only in SearchField that breaks the 12/14/16/18 icon-size rhythm every other primitive follows. _(SearchField.svelte:110,116 `size={15}` (only 2 uses of 15 in src/ui, both here) vs 12(6)/14(6)/16(8)/18(1)/20(1) across other primitives)_  → **UNMAPPED** _(local)_

### SegmentedControl (Form)

- **SEGM-01 · P2 · accessibility-contrast · 1.4.11 Non-text Contrast** — Track boundary uses semi-transparent --border-soft (<3:1 against --bg/--surface), leaving the control's outer edge barely perceptible to low-vision users — the same form-control boundary Select/TextInput fixed via --border-field. _(SegmentedControl.svelte:124 border:1px solid var(--border-soft); cf. Select.svelte:246 / TextInput.svelte:127 var(--border-field))_  → **UNMAPPED** _(system-likely)_
- **SEGM-02 · P3 · responsiveness-i18n** — block segments (flex:1 1 0) lack min-width:0 and labels lack a white-space rule, so a longer translated label wraps (breaking the ~30px segment height) or overflows the 16rem sidebar column. _(SegmentedControl.svelte:134-136 .block .option flex:1 1 0 (no min-width:0); :190 .option-label has no white-space/overflow)_  → **UNMAPPED** _(local)_
- **SEGM-03 · P3 · consistency** — 36px height is reconstructed from magic 9px/14px padding instead of --control-h-md, so re-tuning that token silently leaves SegmentedControl behind — the hard-coded control height ui-primitives bans. _(SegmentedControl.svelte:168 padding:9px 14px 'lands a 36px control'; tokens.css:316 --control-h-md:36px unused; .claude/rules/ui-primitives.md:9)_  → **UNMAPPED** _(system-likely)_
- **SEGM-05 · P3 · api-ergonomics** — name is a required caller string that must be page-globally unique; two instances sharing a name silently merge their radio groups, breaking selection and keyboard nav across both with no guard. _(SegmentedControl.svelte:10 name:string; :101 {name} bound to every radio)_  → **UNMAPPED** _(local)_
- **SEGM-06 · P3 · test-coverage** — The catalog story never exercises the supported disabled-option state (opacity 0.4 + inert input), so a visual regression there goes uncaught. _(SegmentedControl.stories.svelte:58-80 examples cover only intensity + block; disabled supported at SegmentedControl.svelte:5,96,104,173-176)_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Visually-hidden native radios (opacity:0, 1px, focusable) drive semantics + roving arrow-key nav; focus styling targets the input — canonical accessible radiogroup pattern. — SegmentedControl.svelte:99-108,178-188,204-207
  - Fill/pill/label use opaque neutral tokens (--bg / --surface-3 / --text / --text-muted), so contrast holds across every tint tier and over aurora/glass; the border token is separate (see SEGM-01). — SegmentedControl.svelte:126,143-152,193-198
  - Pill + label motion collapses via the global --motion-base reduced-motion token, not a per-component suppression. — SegmentedControl.svelte:153-156,194; tokens.css reduced-motion block
  - Focus ring composes tokenized --focus-width/--focus-color/--focus-offset, auto-rebinding to the active Space hue in .sidebar. — SegmentedControl.svelte:204-207; tokens.css:306-307
  - aria-label on the <fieldset> (role=group) with a documented consumer contract to pass it when the visible label sits outside — mirrors Select/TextInput. — SegmentedControl.svelte:16-20,81
  - Height derived from the option's own padding rather than a fieldset min-height is a documented workaround for fieldset box-rendering; SEGM-03 refines only the token-drift, not this choice. — SegmentedControl.svelte:113-118
  </details>

### TextInput (Form)

- **TEXT-01 · P2 · consistency** — Field height is a raw 40px literal (not even in the --control-h-* scale of 24/28/36/48/56) while every sibling form control uses --control-h-md (36px), so a TextInput sits 4px taller than an adjacent Select/Button in a form row. _(TextInput.svelte:125 height: 40px; Select.svelte:239 / MultiSelect.svelte:418 / SearchField.svelte:149 / Button.svelte:56 var(--control-h-md); visual-system spec:13-14,25-27 forbids raw control-height)_  → **UNMAPPED** _(local)_
- **TEXT-02 · P3 · consistency** — Corner radius is --r-lg (11px, the nav/card radius) while sibling form controls and Button use --r-md (9px), so a TextInput reads more rounded than an adjacent Select/Button. _(TextInput.svelte:128 border-radius: var(--r-lg); Select.svelte:247 / MultiSelect.svelte:424 / Button.svelte var(--r-md); tokens.css:215-216 "inputs/buttons sit at 9, nav/cards at 11")_  → **UNMAPPED** _(local)_
- **TEXT-04 · P3 · robustness** — handleKeydown calls event.preventDefault() on Enter unconditionally before the optional onenter?.(), so a TextInput in a native <form> with no onenter wired swallows Enter-to-submit for no benefit. _(TextInput.svelte:69-72 if (event.key === 'Enter') { event.preventDefault(); onenter?.(); })_  → **UNMAPPED** _(local)_
- **TEXT-05 · P3 · accessibility · 1.4.1** — Standalone invalid (the story's 'invalid' variant, no paired InlineError) signals error by border hue alone at the same 1px weight, so a low-vision/colorblind sighted user gets no perceivable cue (aria-invalid is SR-only). _(TextInput.svelte:157 .input.invalid border-color danger/0.65 only; story:61-63 invalid variant renders with no InlineError; siblings have no invalid state)_  → **UNMAPPED** _(local)_
- **TEXT-06 · P3 · accessibility · 4.1.2** — With both label and ariaLabel omitted (and no placeholder fallback, unlike SearchField) the field renders nameless with no dev-mode warning, so a nameless input is silently shippable. _(TextInput.svelte:90 aria-label={label === undefined ? ariaLabel : undefined}; no guard when both undefined; ui-accessibility spec:8-14 name-or-warn (mandated for IconButton, IconButton.svelte:58-60 implements))_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Box-shadow halo focus (not the --focus-* outline) is the shared recessed-form-control convention — Select/MultiSelect/SearchField use the identical border+halo. — Select.svelte:264-265 == TextInput.svelte:148-149
  - Recessed --input fill (a step below --surface) with crisp --border-field idle border is the intended inset form treatment per the comp. — TextInput.svelte:114-129; tokens.css:121-131
  - invalid tints the border from the shared --danger token via oklch relative color so it reads on every Space hue, and sets aria-invalid — the documented invalid contract. — TextInput.svelte:156-162; ui-accessibility spec error associations
  - 3.3.7/3.3.8 satisfied: no paste blocking, password masking without a memory gate; type=password + autocomplete='current-password' is the intended path. — TextInput.svelte:36-38,89; story password variant
  - autocomplete/required/describedById/aria-invalid passthroughs implement WCAG 1.3.5 input-purpose and programmatic error association per the spec. — TextInput.svelte:26-29,89-93; ui-accessibility spec
  - Implicit label association via the wrapping <label> is valid; ariaLabel is used only for the unlabelled case. — TextInput.svelte:76-99
  </details>

### CardHeading (Layout)

- **CARD-01 · P3 · docs-drift** — Stale doc/test comments describe a per-tint identity-hue heading with a max(l,0.72) lightness floor that no longer exists (style is flat color:var(--accent-heading)), self-contradicting and misleading any maintainer editing heading contrast. _(CardHeading.svelte:5-7 "identity-hue override under standard/vivid" vs :38-41 "fixed across Spaces", :48 color:var(--accent-heading); BackupRestore.test.ts:133 "max(l,0.72) under vivid/standard tint" — no such CSS (grep))_  → **UNMAPPED** _(local)_
- **CARD-03 · P3 · robustness · 1.4.10** — .card-heading is a non-shrinking flex item (default min-width:auto, no row wrap) so a long or unbreakable registry heading overflows a narrow 18rem card, breaking reflow. _(CardHeading.svelte:53-58 .card-heading-row display:flex, no flex-wrap, no min-width:0 on .card-heading (:42))_  → **UNMAPPED** _(local)_
- **CARD-04 · P3 · tokenization** — line-height is a raw magic number here and scattered unlike-valued across ui primitives with no shared scale, violating the primitives no-raw-design-values requirement. _(CardHeading.svelte:47 line-height:1.1; also Avatar:66(1), BottomSheet:177(1.1), Icon:117(0), SettingText:33/39(1.2/1.3); no --leading-* in tokens.css; visual-system/spec.md:13,58)_  → **UNMAPPED** _(system-likely)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Fixed cool-blue --accent-heading (not Space-derived) is intentional, AA-gated >=4.5:1 in both themes. — tokens.css:189,492; contrast.test.ts:286-305
  - h2 in Instrument Serif at --text-xl, weight-regular, sentence case is the deliberate serif=identity hierarchy. — CardHeading.svelte:38-49; CLAUDE.md Visual quality
  - Primitive is non-interactive; focus/hover/active belong to the Buttons passed via the actions snippet, so it needs no focus-ring. — CardHeading.svelte:28-35; stories:28-30
  - Color is fully token-driven (var(--accent-heading)); no hardcoded colours/radii/focus geometry. — CardHeading.svelte:42-63
  - Ships its test harness, unit test, and catalog story per the ui-primitives contract. — CardHeading.test.harness.svelte, CardHeading.test.ts, CardHeading.stories.svelte
  </details>

### InlineError (Layout)

- **INLI-01 · P1 · color-contrast · 1.4.3 Contrast (Minimum) (AA)** — 12px --danger body text over a same-hue --danger-10% tint clears AA 4.5:1 only on light --surface (4.56) and dark --surface/surface-2/bg, and falls sub-AA on every other canvas (light bg 4.17, surface-2 3.94, surface-3 3.51, hover 3.77, press 3.36; dark surface-3 4.34, hover 4.46, press 3.99) incl. the catalog neutral canvas and any options --bg placement, leaving error text below AA in most placements. _(InlineError.svelte:30,33 color-mix(in oklch,--danger 10%,transparent)+color:var(--danger); tokens.css:210,495 --danger; catalog.css:39 --cat-canvas #ececef; ratios reproduced via gamma-space compositing)_  → **UNMAPPED** _(system-likely)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - role="alert" assertive live region is hardcoded/always-on so form errors re-announce on inject/refocus — intended, documented in source header. — InlineError.svelte:2-8,23
  - Token-only danger via color-mix(in oklch,--danger …) is deliberate; --danger is a fixed hue-25 status color independent of --space-h, stable across Space hues (contrast erosion tracked separately in INLI-01). — InlineError.svelte:30-33; tokens.css:210
  - Error text at --text-sm 12px/1.45 --font-sans matches sibling helper/description text and passes Stylelint's raw-size gate. — InlineError.svelte:32; tokens.css:269
  - Non-interactive <p>, so no focus-visible/target-size (2.5.8/2.4.11) obligation; message is consumer-supplied so i18n lives at the call site. — InlineError.svelte:23
  - Primitive owning an outer leading margin (var(--space-3) 0 0) is the established repo convention (cf. SettingsCard-description margin:var(--space-2) 0 0); both shipped consumers want 12px — deliberate, not a defect. — InlineError.svelte:27; SettingsCard.svelte:76
  </details>

### Surface (Layout)

- **SURF-02 · P3 · consistency-catalog** — Catalog never renders the radius scale or clip: preview is hardcoded radius=lg and Examples cover only the 5 variants, so a reviewer can't confirm sm/md/xl/2xl corners or clip full-bleed behavior render correctly. _(Surface.stories.svelte:35 preview radius="lg"; examples 40-54 variant-only; no radius/clip Variant)_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Light-theme --glass-border staying near-white/0.1 is documented in THEME-01 ('border... unchanged; only fill flips'); glass panel stays identifiable via --shadow-md + --glass-highlight, so WCAG 1.4.11 isn't triggered on a container's decorative hairline. — tokens.css:526-527 THEME-01; Surface.svelte:66-67
  - Glass variant re-expresses .lunma-glass (adds --surface-glow slot); documented parallel mirror to keep in sync. — recipes.css:113-125
  - Dark-first immersive glass (glass-bg 0.5 alpha + 22px blur) is the intended aurora treatment, not a contrast bug. — Surface.svelte:2-5, tokens.css:349-353
  - glow=true renders weakly in light theme because --glow-space-soft has no light expression; explicitly deferred (redesign uses --atm-*). — tokens.css:435-438
  - Surface is a bare div with no role/focus — correct; semantics/focus belong to composing overlays. — Surface.svelte:34-43
  - variant/radius omitted from authored controls (module-script type aliases, not mechanically derivable); shown via Examples. — Surface.stories.svelte:12-16
  </details>

### BottomSheet (Overlay)

- **BOTT-02 · P2 · consistency** — Close ✕ re-rolls an icon button — literal 28px box (spec-banned control-height literal), inline 14px SVG not the Icon primitive, no tokenized :focus-visible (so it misses the required Space-hue focus-rebind and falls back to the UA outline), and no --press-scale squish. _(BottomSheet.svelte:99-117,181-196 width/height:28px + inline <svg width=14>, no :focus-visible/:active; IconButton.svelte:104-111 --press-scale + tokenized ring; visual-system spec.md:14 bans `28px` literal, :31 requires Space-hue focus-rebind)_  → **UNMAPPED** _(system-likely)_
- **BOTT-03 · P2 · theming** — Scrim hardcodes oklch(0 0 0 /0.5) + blur(2px) instead of --scrim/--scrim-blur, yielding a pure-black scrim with no Space-hue tint and a 2px vs the token's 8px blur — visibly diverges from every other overlay's dim. _(BottomSheet.svelte:145-146 background:oklch(0 0 0/.5), blur(2px); tokens.css:371-372 --scrim:oklch(.08 .02 base-hue/.5), --scrim-blur:8px)_  → **UNMAPPED** _(system-likely)_
- **BOTT-04 · P2 · robustness · 2.5.8 Target Size (Minimum)** — Long title has no truncation and the close no flex-shrink guard on the space-between header, so a long Space name wraps to multiple lines or squeezes the 28px close below the 24px minimum target. _(BottomSheet.svelte:165-170 space-between header; :174-179 .bottom-sheet-title no ellipsis; :181-196 close no flex-shrink)_  → **UNMAPPED** _(local)_
- **BOTT-05 · P3 · accessibility · 2.4.3 Focus Order** — Scrim is a <button aria-label="Close"> inside the focus trap, adding a redundant Close tab stop before the body — keyboard/SR users hit two identically-named Close controls with content between them, while Escape + ✕ already cover keyboard dismissal. _(BottomSheet.svelte:80-85 scrim <button aria-label=Close>; :99-104 ✕ <button aria-label=Close>)_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Upward box-shadow 0 -18px 50px hardcoded — comment justifies it as a local inverted offset because the token shadow family casts downward. — BottomSheet.svelte:157-159
  - Reduced-motion: animation:none plus the 0.4 opacity floor so a frozen/backgrounded animation never leaves the sheet invisible. — BottomSheet.svelte:198-216
  - position:absolute;inset:0 scoped to the positioned ancestor (in-panel sheet), with preventScroll={false} so body scroll isn't locked. — BottomSheet.svelte:59-72,130-139
  - Focus trap/loop, Escape + interact-outside dismissal, and return-focus-to-trigger delegated to bits-ui Dialog via the child snippet. — BottomSheet.svelte:66-72
  - aria-label suppressed when title is set (Dialog.Title supplies aria-labelledby) and required for the headerless case — avoids double-naming. — BottomSheet.svelte:86-95
  - Controlled open (not $bindable) with every dismissal funneled through onClose — single host-owned intent. — BottomSheet.svelte:49-55
  - portalTo resolved to a live element only while open with inline fallback, because bits-ui Portal throws on a non-matching `to` selector. — BottomSheet.svelte:39-47,65
  </details>

### Menu (Overlay)

- **MENU-01 · P2 · color-contrast · 1.4.3** — Danger item hover/highlight background re-rolls color-mix(--danger 16%, --surface-2) while text stays --danger, giving computed WCAG CR ~3.7:1 (light) / ~4.4:1 (dark) — both below AA 4.5:1 for the 13px medium destructive label in its own keyboard-highlighted/hover state. _(Menu.svelte:329 color-mix(in oklch,var(--danger) 16%,var(--surface-2)); text var(--danger); purpose-built --danger-soft (tokens.css:211,496) unused)_  → **UNMAPPED** _(system-likely)_
- **MENU-02 · P3 · visual-consistency** — Menu geometry hardcoded off the @lunma/tokens scales — panel radius 14px (off-scale between --r-lg/--r-xl) & width 212px raw, item radius 9px (raw, =--r-md), item padding 8px 9px, gap 11px, header 6px 10px 8px — so overlay radius/density can't be retuned globally and drifts from the scale (sibling Tooltip is fully tokenized). _(Menu.svelte:237 border-radius:14px, :232 width:212px, :286 border-radius:9px, :277 padding:8px 9px, :280 gap:11px, :250 padding:6px 10px 8px; cf Tooltip.svelte:69-70 --r-sm/--space-*)_  → **UNMAPPED** _(system-likely)_
- **MENU-03 · P3 · a11y · 4.1.2** — submenu items emit aria-haspopup="true" + a chevron but no popup is implemented (no bits-ui Sub, no aria-expanded, ArrowRight inert) — the exposed role promises a submenu the in-place drill-in never opens, so keyboard users pressing ArrowRight get nothing and SRs announce a popup that doesn't appear. _(Menu.svelte:143,182 aria-haspopup={item.submenu?'true':undefined}; no DropdownMenu.Sub/ContextMenu.Sub; menu-types.ts:20 submenu=data-driven drill-in)_  → **UNMAPPED** _(local)_
- **MENU-07 · P3 · doc-accuracy** — menu-types comment claims disabled items 'stay focusable (aria-disabled) so roving nav doesn't skip a gap', but bits-ui sets data-disabled and collects candidates via :not([data-disabled]) — disabled items ARE skipped in arrow-key nav, so the documented intent is factually false and misleads future readers (the skip behavior itself is standard/fine). _(menu-types.ts:15-18 'doesn't skip a gap'; Menu.svelte:133,172 disabled prop; bits-ui menu.svelte.js:772 querySelectorAll(...):not([data-disabled]), :1025 data-disabled set)_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Panel is opaque --bg-elev (not glass), keeping item/text contrast stable across Space hue and Intensity tiers. — Menu.svelte:235 background:var(--bg-elev)
  - Focus trap, restore-to-trigger, roving nav, Escape dismiss, and collision clamp are delegated to bits-ui — not missing. — Menu.svelte:6,20-24 + bits-ui Root/Content
  - 120ms fast-tick entrance (below the 150-250ms band) is the documented overlay pop matching Tooltip; reduced-motion disables it. — Menu.svelte:246,358-362
  - Header kind label on --text-dim (AA 4.5:1) not decorative --text-faint is deliberate a11y hardening. — Menu.svelte:259-261
  - Item focus ring uses -2px inset offset intentionally so the full-width row ring stays inside the padded panel. — Menu.svelte:222-224,296-299
  </details>

### Toast (Overlay)

- **TOAS-01 · P3 · consistency** — Four over-aurora overlays (Toast, DragClone, SearchField hover, launcher) each hand-roll the strong-glass treatment because Surface/`.lunma-glass` expose only the base opacity, so the immersive panel treatment lives in 4 places and drifts (Toast even omits the `-webkit-backdrop-filter` prefix both shared sources carry). _(Toast.svelte:143-147 (--glass-bg-strong, --shadow-lg, no -webkit prefix); cf Surface.svelte:62-68 + recipes.css:118-125; same hand-roll DragClone.svelte:94, SearchField.svelte:185, launcher/overlay.css:122)_  → **UNMAPPED** _(system-likely)_
- **TOAS-02 · P3 · ux** — The toast's sole time-limited affordance (Undo) is pinned to the ghost variant (--text-muted, lowest emphasis), inverting hierarchy so the one thing the user must act on reads quieter than the status line. _(Toast.svelte:125 <Button variant="ghost">; ghost color:var(--text-muted) Button.svelte:125; message color:var(--text) Toast.svelte:160)_  → **UNMAPPED** _(local)_
- **TOAS-03 · P3 · robustness** — `white-space:nowrap` + ellipsis silently truncates any message wider than the panel (routine for longer-language translations), dropping status content for sighted users though role=status still voices it. _(Toast.svelte:161-163 white-space:nowrap; overflow:hidden; text-overflow:ellipsis; i18n scope openspec/specs/i18n/spec.md:312)_  → **UNMAPPED** _(local)_
- **TOAS-04 · P3 · visual** — The action Button defaults to md (36px, --text-base 13px), out-sizing the --text-sm 12px message and contradicting Button's own guidance that sm is for inline/tertiary affordances, so the action label is typographically heavier than the status it supports. _(Toast.svelte:125 no size (md); message --text-sm Toast.svelte:159; Button.svelte:8-9 sm=inline/tertiary, --control-h-sm 28px)_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - TOAS-06: no status/severity variant or icon is documented deliberate minimalism (single neutral Undo consumer; a future notification system supersedes it) — finding itself says no change needed now. — Toast.svelte:4-13 docstring
  - TOAS-01 partial: --glass-bg-strong fill + --shadow-lg elevation are the deliberate over-aurora-overlay treatment (opaque enough to keep --text legible, floating elevation), not a divergence bug — shared by launcher/DragClone/SearchField. — tokens.css:349-350 immersive model; launcher/overlay.css:119-122
  </details>

### Tooltip (Overlay)

- **TOOL-02 · P2 · robustness** — white-space:nowrap with no max-width lets a long user-generated space name or translated label render as one line that Floating UI can shift but not shrink, so it clips at the narrow sidebar/viewport edge and becomes unreadable. _(Tooltip.svelte:72 white-space:nowrap, no max-width on .lunma-tooltip; consumer SpaceSwitcher.svelte:195 label=space.name)_  → **UNMAPPED** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Content carries role="tooltip" with explicit contentId wiring the trigger's aria-describedby. — ui-accessibility/spec.md:146,162
  - Transform-only entrance via --motion-fast/--ease-emphasised; reduced-motion removes it to end state. — visual-system/spec.md:637-648
  - enabled={false} renders the trigger plainly with no tooltip layer/ARIA. — visual-system/spec.md:659
  - Story spreads trigger props onto a native focusable <button>, not a wrapper span. — ui-accessibility/spec.md:207
  - Fully token-driven (surface/text/border/radius/space/text-xs/font-sans/z-dropdown/shadow); no raw values. — visual-system/spec.md:24
  - --text on --surface-3 clears WCAG AA in both themes for the 11px body text. — visual-system/spec.md:623
  - Opens on hover AND focus (bits-ui default), giving keyboard users the hint. — visual-system/spec.md:639
  </details>
