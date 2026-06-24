## Context

Lunma's positioning leans on "Arc-style" across both identity surfaces (the
product's self-definition in `CLAUDE.md`/`README.md`, the GitHub repo description)
and discovery surfaces (the SEO `<title>`, the FAQ, the "coming from Arc" beat).
Arc's maker has pivoted away from the product, so a meaningful population of Arc
users is now searching for somewhere to migrate. The query they type is "Arc
alternative" / "Arc replacement" — not "Arc-style." This change separates the two
roles Arc plays: a *doormat* (entry via search/comparison — keep it) versus a
*mirror* (Lunma's own identity — remove it). The marketing-site spec currently
mandates the mirror framing, so the copy and the spec must move together.

## Goals / Non-Goals

**Goals:**
- Reframe the SEO `<title>` from "Arc-style" (not a query) to "Arc alternative"
  (a real, high-intent query), front-loaded to survive SERP truncation.
- Stop Lunma describing itself as "Arc-style \<thing\>" in its own docs and repo
  metadata; lead with Lunma's own claim, keeping one Arc reference for shorthand
  and GitHub-search discovery.
- Amend the `marketing-site` spec so its normative requirements no longer mandate
  the "Arc-style Spaces" identity framing, while preserving the FAQ obligations
  and the gracious Arcify credit.

**Non-Goals:**
- Removing Arc from the FAQ, `FromArc.svelte`, or the Arcify credits — these are
  the migration doormat and stay verbatim.
- Touching the ~14 internal Arc references in code/design comments, ADR 0002, or
  `CLAUDE.md` line 81's visual-bar reference — internal rationale, not brand copy.
- Any visual, motion, colour, layout, or component change. This is copy +
  `<head>` metadata + spec wording only.
- Editing archived changes (`openspec/changes/archive/**` is immutable).

## Decisions

**D1 — Keep Arc in the `<title>`, as "Arc alternative," front-loaded.**
The `<title>` is the strongest on-page ranking signal; dropping Arc forfeits the
migration traffic. "Arc-style" matches no query and couples identity to Arc;
"Arc alternative" is a real query and reads as a destination, not a clone. Final:
`Lunma — Arc alternative: vertical tabs & Spaces for Chrome` (~57 chars, under the
~60-char SERP truncation point, with "Arc alternative" early for term weighting).
_Alternatives considered:_ (a) keep "Arc-style" — max title SEO but identity-
coupled and weaker query match; (b) drop Arc entirely — cleanest brand but
forfeits the strongest discovery signal while Arc demand is live. Rejected both;
"Arc alternative" is simultaneously the SEO-optimal and brand-optimal form.

**D2 — In self-definition surfaces, lead with Lunma's own claim; keep at most one
Arc reference as shorthand.** `CLAUDE.md` line 3 and `README.md` line 11 reword to
"vertical-workspace … (the Spaces / vertical-tabs pattern Arc popularised)" so the
team keeps its mental-model shorthand without Lunma *being* "Arc-style." README
keeps one Arc mention because it is GitHub-searchable. _Alternative:_ strip Arc
fully from docs — rejected, it erodes the shared internal vocabulary the rest of
the codebase's comments rely on.

**D3 — GitHub repo description is a manual, out-of-repo step.** It lives in GitHub
settings, not a tracked file, so it cannot be edited by the apply step or verified
by `pnpm verify`. It is captured as an explicit `gh repo edit --description …`
checklist item in tasks.md so it is not silently dropped.

**D4 — Spec delta uses MODIFIED on two existing requirements, copied whole.** Per
the deltas convention, both "Immediately legible value proposition" and "Honest
positioning for alternative-seekers" are reproduced in full with the Arc wording
changed, so no scenario detail is lost at archive time. The FAQ scenarios and the
"credited, not ranked" scenario are preserved — only the identity framing softens.

**D5 — Doc updates in scope:** `CLAUDE.md` (line 3) and `README.md` (line 11) only.
`docs/architecture.md`, `docs/tech-stack.md`, and the ADRs are untouched — no
architectural or stack decision changes. This is recorded here so the apply step
does not expand the doc surface.

## Risks / Trade-offs

- **[Losing "Arc-style" long-tail SEO]** → "Arc-style" attracts negligible search
  volume versus "Arc alternative"; the FAQ ("different from Arc?") and FromArc beat
  still carry the bare "Arc" token, so the standalone Arc signal is retained.
- **[Spec/copy drift if only one is edited]** → Both the `seo.ts` `SITE_TITLE` and
  the `marketing-site` spec MODIFIED requirements ship in this single change; the
  apply step treats them as one unit and `tasks.md` lists both.
- **[Generated `build/*.html` going stale]** → They re-emit on the next `apps/site`
  prerender `build`, which is part of the site verify gate; no hand-editing of
  generated files.
- **[Repo-description step forgotten]** → It is an explicit checklist line in
  tasks.md with the exact `gh` command; it cannot be gated automatically.

## Visual language

No visual change. This change touches `<head>` metadata (the `<title>` string),
two prose docs, the GitHub repo description, and spec wording — it ships no surface
markup, no styles, no motion, no colour, and no `@lunma/tokens` usage. The hero,
FromArc beat, and FAQ render exactly as before (the FromArc copy and FAQ entries
are explicitly unchanged). WCAG-AA contrast and reduced-motion behaviour are
therefore unaffected; the site's existing contrast test and static prerender build
remain the gate.
