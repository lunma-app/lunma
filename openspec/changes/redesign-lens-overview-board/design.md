## Context

The full-tab lens overview (`launcher/lenspage/LensPage.svelte` → `OverviewPage.svelte`) renders a lens as a vertical stack of collapsible cards (Changes → Issues → Articles), capped at `min(94vw, 1080px)`. The data layer is unchanged by this design: items already carry everything the redesign needs — a change's `relation` is derived from its source `query` (`overview-vm.relationOf`: `review-requested → waiting`, `assigned → assigned`, else `authored`), CI tone via `ciLight`, reviewers + diffstat on `ChangeData`; a ticket carries `assignee?` and `priority?` on `TicketData` and its `query === 'assigned'` means assigned-to-me. The direction below was prototyped in Chrome against real `@lunma/tokens` and reviewed with the maintainer (board, lane, two-row rows, enriched issues, per-card filters, quiet feed, List-not-2-up).

## Goals / Non-Goals

**Goals:**
- Fill wide viewports and cut vertical scroll: Changes + Issues side-by-side, Articles full width.
- Surface the single most actionable bucket first via a cross-entity "Waiting on you" lane.
- Make rows triage-complete: change titles untruncated; issues show owner + freshness.
- Distinguish PR vs ticket instantly in the mixed lane (shape + colour, colour-blind safe).
- Keep the feed quiet despite loud images; keep List and Grid as distinct views.
- No data-layer/connector change; reuse existing item fields.

**Non-Goals:**
- Keyboard triage (`j/k`/open/mark) — deferred to a later change.
- Changing connectors, fetch, auth, or the sidebar inline `Lens.svelte` rendering.
- New entity types or a third board column beyond Changes/Issues.
- "My issues" assignee-suppression heuristic (noted as a future refinement).

## Decisions

**D1 — Width-aware board, cap raised to `min(96vw, 1440px)`.** Changes and Issues render as two columns only when **both** entities are present; a lens with a single entity (e.g. feed-only News, or a review-only lens) renders that section full-width (no forced empty column). Each column keeps its ≤~640px reading measure, so two side-by-side honour the existing per-list measure rule rather than breaking it. Articles always span full width beneath. *Alternative rejected:* keep the 1080 stack (leaves voids, long scroll); a capped single column (same).

**D2 — Two-column switch via CSS container query, not viewport media query.** `.overview` becomes `container-type: inline-size`; `.board` is single-column by default and switches to two columns at `@container (min-width: ~1040px)`. Container-based so it stays correct regardless of window chrome / future embedding. *Alternative rejected:* `@media (min-width)` on the window — couples layout to the window rather than the content box.

**D3 — "Waiting on you" derived from the existing query axis + CI tone; no new data.** Lane membership = the union of: (a) changes with `relationOf(query) === 'waiting'` (review-requested of me) → reason "review requested"; (b) changes with `relationOf === 'authored'` and a failing CI tone (`item.status?.tone === 'fail'` — the raw `LensItem.status` tone; `ciLight()` returns a glyph/label only, no `tone` field) → reason "CI failing" (`--danger`); (c) tickets with `query === 'assigned'` and `ticket.statusCategory !== 'done'` → reason "assigned to you". Ordered (a) → (b) → (c), capped at **6** (overflow count shown). Implemented as the pure `waitingOnYou(tagged, cap=6)` in `overview-vm.ts` (with `isStale`/`LaneItem`/`LaneReason`); i18n keys `launcher_lensWaitingOnYou`, `launcher_lensReason{Review,Ci,Assigned}`, `launcher_lensUnassigned`. Items remain in their home section (the lane is a focus overlay, not a move). *Alternative rejected:* add an explicit `actionable` flag to the data layer — unnecessary, the query axis already encodes intent.

**D4 — New primitive `src/ui/EntityBadge.svelte`.** A 26px rounded-square badge taking `entity: 'change' | 'ticket' | 'article'`, rendering the entity glyph (pull-request/branch · issue-dot · article) over the section-dot hue (`change 252` / `ticket 295` / `article 150`) via the theme-aware `--accent-text-l` / `--accent-fill-a` pill pattern. Cross-surface (the sidebar's mixed lens listing can adopt it later), so it is a primitive with a catalog story, not inline markup. Glyphs come from the existing `Icon` set (`git-pull-request`, `circle-dot`/`dot`, `newspaper`); if a name is absent it is added to the generated icon set — that addition is a listed deviation and updates this design + the icon source in the same change. *Alternative rejected:* inline SVG in OverviewPage (violates the component-library policy; not reusable).

**D5 — Two-row change & issue rows; full title preserved.** Change row: line 1 = full title (wraps to as many lines as needed on its own full-width line — **no truncation**, honouring the existing "title is never truncated" requirement) + ticket-ref chip; line 2 = repo · CI light · `ReviewerRail` · `Diffstat` (right-aligned cluster). Issue row: line 1 = issue-key (aligned to the title line) + full title; line 2 = assignee (`Avatar` + name, hollow ring for Unassigned) · updated-age · priority pill (right). The whole row stays one `<button>` — activation/focus semantics unchanged. The **compact lane** (D3) is the one place a title MAY clamp (to 2 lines) since it is an at-a-glance summary, not the full section row. *Alternative rejected:* single line with tooltip-on-truncate (hides the metadata that triage needs, and breaks no-truncation).

**D6 — Filters per-card; remove the overview's entity-type control only (no data change).** Scope facets move inside their owning card (repos→Changes, projects→Issues, feeds→Articles; chips ≤5 then "All …" `MultiSelect`, accessible names + union + `setLensFilter` persistence all preserved). The entity-type toggle bar is **removed from the overview** — redundant when entities are always-visible columns, and per-card collapse already hides a section. `LensFilterBar.svelte` (the entity-type bar) is retired along with its UI message keys. **The data model is untouched:** `LensFilter.entities` and the type axis in `applyLensFilter` (`shared/lens-filter.ts`) stay as-is — so there is **no storage migration**, and the "sidebar honours the active filter" requirement is unaffected; the type axis simply has no overview author anymore. The Changes header "incl. CI" trailing label is removed. *Alternative rejected:* drop `entities` from `LensFilter` — forces a migration and breaks the sidebar honour-filter contract for no gain. *Alternative rejected:* keep the entity bar for narrow layout — collapse covers it. **The overview filter-UI behaviour change was directed by the maintainer.**

**D7 — Quiet feed; List full-width single column, Grid unchanged.** Article thumbnails sit at `opacity: 0.62; filter: saturate(0.7)` at rest and animate to full on `:hover`/`:focus-visible`. **List** is a **full-width** single column — its rows span the content measure like the section header and Grid/List controls above them (a narrower cap left the rows visibly short of their own controls, reading as broken). It is still *not* multi-column — **Grid** is the responsive multi-column browse view (kept as-is, gaining only the quiet-thumbnail treatment on its hero images), so the two don't duplicate. *Alternative rejected:* a ~900px capped List — it misaligned with its full-width section header/controls and read as a layout bug (maintainer call). *Alternative rejected:* 2-up List columns — duplicates Grid.

**D8 — Provider subtitle fix (applied).** `LensPage.svelte`'s local `PROVIDER_NAME` is typed `Record<LensProvider, string>` and includes `bitbucket`, so an omitted provider is a compile error instead of `"… & undefined"`.

**Docs:** `docs/lenses-vision.md` — update the overview-model section to describe the board, the "Waiting on you" lane, and the two-row change/issue anatomy. `docs/architecture.md` / `docs/tech-stack.md` untouched (no layer/stack change).

## Visual language

- **Hierarchy (one accessory):** the "Waiting on you" lane is the single boldest element — it carries the Space hue glow (`--glow-space-soft`) and a faint top hue wash (`oklch(0.62 var(--space-chroma) var(--space-h) / 0.10)` over `--surface`) with a `--lens-border` edge. Everything below stays quiet: section cards on `--surface`, recessed `--bg` bodies, rows on `--surface-2`, meta in `--text-muted`/`--text-faint`. Boldness is spent once.
- **Colour / tokens:** entity badges use the section-dot hues (`252`/`295`/`150`) through the contrast-gated `--accent-text-l` + `--accent-fill-a` pill pattern. Stale issue age (> 1 wk) → `--warning`; CI-failing reason → `--danger`; CI lights keep the existing `--success`/`--danger`/`--warning` status tokens; ticket-ref + priority pills unchanged. Quiet thumb = `opacity .62 / saturate .7` at rest.
- **Motion:** thumbnail wake `opacity`+`filter` 200ms `--ease-standard`; row hover background `--motion-fast` (120ms); lane reason arrow nudge `translateX(2px)` 120ms; chevron rotate 150ms (existing). All collapse to instant under `prefers-reduced-motion` (the global token block already maps `--motion-*`; the thumbnail/arrow transitions add an explicit reduced-motion guard).
- **Interaction feedback:** rows/lane-rows hover → `--hover`, `:focus-visible` → `--focus-color` ring at the standard geometry, `:active` → `--press-scale`. Scope pickers use `--border-field` (idle control boundary clears the 3:1 floor). The article read/unread toggle keeps its mail / mail-open icon swap.
- **Arc reference & divergence:** Arc surfaces the active/important inline and keeps chrome calm; Lunma's deliberate improvement is the **cross-source** actionable lane — one place that unifies "a review is waiting", "your PR's CI is red", and "this ticket is yours" across GitLab/GitHub/Bitbucket/Jira, which Arc has no equivalent for.
- **Levels:** holds at `subtle`/`standard`/`vivid` — the glow/aurora track the tint via existing tokens; WCAG-AA contrast is gated by `contrast.test.ts` on the tokens used here.

## Risks / Trade-offs

- **Lane duplicates items shown in their section** → accepted: the lane is a pinned focus view, not a move; an item appearing twice (once in the lane, once under its relation/status group) mirrors "shortcut + source". Revisit only if it reads as noise.
- **Uneven column heights** when Changes and Issues differ a lot in count → accepted: columns are independent (`align-items: start`); a short column simply ends, no stretching.
- **Two columns could feel sparse** for a small lens → mitigated by D1: two columns only when both entities are present; otherwise full-width single section.
- **New icon glyphs may be missing** from the generated set → mitigation: D4 adds them to the icon source as a listed deviation in the same change; no inline SVG.
- **Quiet thumbnails could hide a relevant image** → mitigated: hover/focus restores full colour instantly enough for scanning; read items already dim further.

## Open Questions

- Lane cap is proposed at **6** with an overflow count — confirm during apply if a different N reads better against real data.
- Should a lane item be visually de-emphasised in its home section (to signal "already surfaced above")? Default decision: no (keep both at full weight); flag if it reads noisy.
- An ADR for "board over stack" is optional — record one via the documentation-and-adrs skill only if the decision proves contentious.
