# Site smart-folders beat — the live-queue platform, GitLab as the shipping example

## Why

The marketing site sells five ways to *organise what you already have* (Spaces, the launcher, auto-archive, favourites, pinned tabs) but says nothing about the launch's most differentiating capability: **smart folders bring the work that finds you *into* the Space**. The shipped v1 connector pulls your live GitLab merge requests — your review queue, your assigned MRs — into a pinned folder, each row one click from the MR with its pipeline status at a glance, refreshed automatically. That converts the visitor who babysits a work queue all day (re-opening and refreshing the same tab), which no generic tab manager touches.

Direct user-visible value (shape a): a launch-available capability gets the on-site demonstration it needs to earn installs from the "I live in a queue" audience. The named consumer is the launch itself — the extension ships smart folders, and the site must present it (accurately) or under-sell the product.

## What Changes

- **A sixth feature beat**, added to `apps/site/src/lib/Chapters.svelte` after the five core beats (Spaces → Launcher → Auto-archive → Favourites → Pinned tabs → **Smart folders**), composed via the existing `Chapter.svelte` with a `color` prop continuing the colour journey (the five beats use purple/cyan/blue/orange/green; the sixth's palette colour — from the nine-colour `@lunma/tokens` set — is finalised in `design.md`).
- **Platform framing, GitLab as the concrete example.** The copy leads with the general promise — *a live queue from the apps you live in, pinned in your Space* — and shows **GitLab specifically** as what ships. It MUST NOT name or imply other connectors (GitHub, Jira, Notion, Calendar, …) as available — only GitLab ships in v1, and naming the unshipped would reintroduce the exact over-claim `site-faq-accuracy` removed. A calm, non-dating hint that smart folders is the first of more connectors is permitted; concrete unshipped names/dates are not.
- **A new token-faithful `SmartFolderMock`** (`apps/site/src/lib/mocks/SmartFolderMock.svelte`), composed from `@lunma/tokens` and the existing mock primitives (the `TabRowMock`/`FaviconGrid` family) — never reaching past primitives to raw tokens. It renders a smart-folder header (name + source icon + a quiet item-count badge) over ~3 GitLab MR result rows, each row carrying **exactly one** pipeline-status dot painted from the semantic tone tokens (`--success` / `--info` / `--warning`) — the same one-glyph restraint guard the extension's presentation contract enforces. Reduced-motion safe (no animated status); any text clears the automated WCAG-AA contrast test.
- **Honest, voice-passed copy** (the `lunma-voice` standard: British spelling, warm/concrete, zero AI tells — no em-dash splices, no tricolons, no banned filler). Frames smart folders as: live GitLab merge requests (your review queue / assigned / authored) pinned inside the Space, refreshed automatically, pipeline status at a glance; works with self-hosted GitLab; stays local (no Lunma server).

## Capabilities

### New Capabilities

<!-- none — this is marketing-site content for an existing extension capability -->

### Modified Capabilities

- `marketing-site`: ADD a requirement — *Smart folders are positioned as a live-queue platform and demonstrated* — with scenarios that (1) present smart folders as the general "live queue in your Space" capability with GitLab as the shown example, (2) pin accuracy: the page names GitLab specifically and SHALL NOT claim any other connector (GitHub/Jira/Notion/etc.) is available, and (3) frame it local-only / no Lunma server. Mirrors the existing "Pinned tabs are positioned as app-like and demonstrated" requirement and the accuracy-pinning scenario style of `site-faq-accuracy`.

## Impact

- **Affected code (apps/site only; NO extension changes):**
  - `apps/site/src/lib/Chapters.svelte` — one new `<Chapter>` (kicker, title, copy snippet, `color`, the new visual), plus the import of the new mock.
  - `apps/site/src/lib/mocks/SmartFolderMock.svelte` — NEW; the smart-folder visual (header + count badge + 3 MR rows + one semantic-tone status dot per row).
  - Possibly a tiny feature-local status-dot style inside the mock (token-referencing CSS, the `drift-dot` precedent) — no new `src/ui` primitive, no new shared mock unless `design.md` justifies one.
- **New files (exhaustive; anything beyond is a deviation to raise first):** `apps/site/src/lib/mocks/SmartFolderMock.svelte`.
- **Copy surfaces:** the new beat's kicker/title/body in `Chapters.svelte`. A FAQ/`seo.ts` entry about connectors is **out of scope** (decided in `design.md`) to avoid a code-level coexistence with the in-flight `site-faq-accuracy` change and to keep the structured-data/JSON-LD stable; the beat alone carries the message.
- **Dependencies:** none. **Manifest/permissions:** n/a (site). 
- **Docs:** none — the marketing-site capability spec is the source of truth for site content; no `docs/` file enumerates the individual beats.
- **Coexistence:** `site-faq-accuracy` (unarchived) MODIFIES the "Local-only, no-account, open-source trust signals" requirement; this change ADDS a *different*, new requirement and edits a *different* part of `Chapters.svelte` (a new beat, not existing beat copy), so the two deltas do not overlap and can archive in either order.
