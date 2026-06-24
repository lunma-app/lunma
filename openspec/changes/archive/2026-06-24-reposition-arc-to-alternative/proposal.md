## Why

Prospective users who would benefit most from Lunma are the ones searching "Arc
alternative" / "Arc replacement" right now — Arc's maker pivoted away from the
product, stranding a base of users actively looking for somewhere to land. Today
Lunma's own copy and metadata frame it as "Arc-style" — a *style descriptor* that
nobody searches for and that caps Lunma's identity at "discount Arc." This change
keeps Arc exactly where it earns high-intent migration traffic (the `<title>`, the
FAQ, the "coming from Arc" beat) but repositions it from "Arc-style" to "Arc
alternative" — a real query — and removes Arc from the surfaces that define what
Lunma *is*. The user-visible result: the marketing site's search title leads with
"Arc alternative" (better SEO and better positioning), and Lunma stops describing
itself to the world as a follower.

## What Changes

- **SEO `<title>` (`apps/site/src/lib/seo.ts` `SITE_TITLE`)**: `Lunma — Arc-style
  Spaces & vertical tabs for Chrome` → `Lunma — Arc alternative: vertical tabs &
  Spaces for Chrome`. Front-loads "Arc alternative" (a real query, ~57 chars to
  avoid SERP truncation); keeps the strongest on-page Arc signal while
  de-coupling identity from "style."
- **Self-definition in docs**: `CLAUDE.md` line 3 and `README.md` line 11 reworded
  to lead with Lunma's own claim, keeping a single Arc reference for shorthand /
  GitHub-search discovery rather than "Arc-style \<thing\>."
- **GitHub repo description** (external, not a repo file — set via
  `gh repo edit --description`): `Arc-style vertical-workspace Chrome extension` →
  `Vertical tabs & colour-coded Spaces for Chrome — open source, fully local. An
  Arc alternative.` Tracked as a manual checklist item in tasks.md.
- **Kept as-is (the migration "doormat")**: the two FAQ entries ("How is Lunma
  different from Arc?", "Is this like Arcify?"), `FromArc.svelte` (already framed
  as migration, not identity), and the Arcify credits in the footer and README.
- **Out of scope (internal design rationale, not brand-facing)**: the ~14 Arc
  references in code/design comments, the ADR 0002 isolation reference,
  `CLAUDE.md` line 81's "Arc's vertical" visual bar, and dev-load's "Arc-quality
  bar." Archived changes under `openspec/changes/archive/**` are immutable and
  untouched.

No new types, files, methods, fields, or dependencies. No new or changed `src/ui`
primitives (the marketing site composes `@lunma/tokens` directly and ships no
extension code). No visual/motion/colour change — copy + `<head>` metadata + spec
wording only.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `marketing-site`: Two requirements are reworded to drop "Arc-style" as the named
  core value and to reframe the positioning from "Arc-style tools" toward "Arc
  alternative" migration framing — while preserving the existing FAQ obligations
  ("how is Lunma different from Arc?") and the gracious credit to the Arc-style
  extension it was inspired by (Arcify). Specifically: "Immediately legible value
  proposition" (the hero-value scenario that currently names "Arc-style Spaces")
  and "Honest positioning for alternative-seekers."

## Impact

- **Docs**: updates `CLAUDE.md` (line 3) and `README.md` (line 11). Leaves
  `CLAUDE.md` line 81, the ADR, and `docs/` architecture/tech-stack files
  untouched (no architectural change).
- **Code**: edits `apps/site/src/lib/seo.ts` (`SITE_TITLE` constant only). The
  generated `apps/site/build/*.html` files re-emit on the next site build.
- **Spec**: delta against `openspec/specs/marketing-site/spec.md` (two MODIFIED
  requirements).
- **External**: one manual GitHub repo-description update (outside the repo).
- **Gates**: `apps/site` `svelte-check` + WCAG-AA contrast test + static
  prerender `build` must pass (no contrast/layout change expected — copy only).
