## Context

The marketing site presents five feature beats in an editorial colour journey (Spaces purple → Launcher cyan → Auto-archive blue → Favourites orange → Pinned tabs green), each a numbered `Chapter` with a kicker, display heading, copy, and a token-faithful mock. The extension now ships **smart folders** (a `smart` `PinNode` whose children are live GitLab merge-request results, refreshed by a background connector). The user has decided this ships at launch and is featured as one focused beat, framed as a **platform** ("a live queue from the apps you live in") with GitLab as the concrete shipping example — not a dev-only badge, and without naming connectors that do not yet ship.

## Goals / Non-Goals

**Goals:**
- One sixth beat that presents smart folders as a live-queue capability, GitLab shown as the example, in the existing editorial-chapter form and colour journey.
- A new token-faithful `SmartFolderMock` that *shows* the behaviour: a folder header with a count badge over GitLab MR rows, each with exactly one pipeline-status dot.
- Accurate, voice-passed copy that names GitLab specifically and stays local-only.
- All gates hold: WCAG-AA contrast, reduced-motion, biome/svelte-check, static prerender.

**Non-Goals:**
- No extension changes. No new `src/ui` primitive.
- **No naming of unshipped connectors** (GitHub, Jira, Notion, Calendar, …) as available — a calm "more are coming" is the ceiling, with no names or dates.
- No FAQ/`seo.ts` entry in this change (keeps JSON-LD stable and avoids a code-level overlap with the in-flight `site-faq-accuracy` change). The beat carries the message.
- No multi-connector mock — the visual shows GitLab only, matching what ships.

## Decisions

- **Placement & form.** Append the beat as `index={6}` in `Chapters.svelte`, after Pinned tabs, composing `Chapter.svelte` unchanged. Layout alternates to `right` (beat 5 is `left`), keeping the left/right rhythm.
- **Colour: `pink`.** The journey's remaining palette colours are gray/red/pink/yellow. The mock's status dots use the **semantic tone tokens** (`--success` green, `--info` blue, `--warning` amber), so the beat's accent must not read as a status — that rules out red/green/blue/amber adjacents. `pink` is unmistakably decorative (no status meaning), continues the warm finish after green, and clears WCAG-AA via `Chapter`'s existing 0.72 kicker-lightness floor. Decision: **`color="pink"`**.
- **`SmartFolderMock` composition.** A new `apps/site/src/lib/mocks/SmartFolderMock.svelte`, decorative (`aria-hidden`, like the other mocks — its labels are not page content; the copy carries meaning). It renders: a header (a `folder-git-2`-style glyph + folder name + a quiet count badge), then 3 MR rows in the established row vocabulary (source icon + title), each closing with **one** status dot. The status dot is feature-local, token-referencing CSS painting `--success` / `--info` / `--warning` (the `drift-dot` precedent) — one per row, never more (the extension's one-glyph restraint guard). No animation (a running pipeline is a static `--info` dot), so the page's reduced-motion contract is untouched.
- **Copy (final, voice-passed).**
  - Kicker: `Smart folders`
  - Title: `Pin a live queue, not just a page.` (sets it against the pinned-tabs beat above — that pins a page; this pins a queue.)
  - Body: `A smart folder fills itself from a service you keep checking. The first one talks to GitLab and shows your open merge requests with the reviews waiting on you, each with its pipeline status, and refreshes on its own. It works with self-hosted GitLab, and like everything in Lunma it stays on your device. More connectors are on the way.`
  - Voice check: British spelling; no em-dash splice; not a tricolon (two coordinated clauses, not three parallel items); no banned filler; names GitLab only; "More connectors are on the way" is the permitted name-free, date-free hint.
- **Accuracy guard.** GitLab is the only service named. "self-hosted GitLab" and "stays on your device" are both true of the shipped connector (cookie/PAT, no Lunma server). The beat asserts no reliability guarantee about the connector's cookie-riding contract.

## Visual language

- **Form:** the shared editorial-chapter (numbered serif numeral + kicker + display heading + copy + glass-framed visual), identical to the five existing beats — composes `@lunma/tokens` recipes and the site's mock components, never re-rolling primitives.
- **Colour:** `pink` Space accent drives the glowing numeral, the kicker (0.72 lightness floor for AA), and the soft halo behind the visual — extending the colour journey to a sixth hue.
- **The mock:** frosted-glass folder panel; rows in the existing tab-row vocabulary; the only new mark is a single small status dot per row in the semantic success/info/warning tones. Count badge is quiet (`--text-dim`).
- **Motion:** none beyond the shared `reveal` entrance (reduced-motion safe). No animated status, matching the extension's "a running pipeline is a static dot at every motion level".
- **Contrast:** all text holds WCAG-AA (gated by the contrast vitest); the status dots are decorative illustration, not the sole carrier of meaning (the copy states what they mean).

## Risks / Trade-offs

- **Over-claim risk.** The platform framing could drift into implying broad integrations. Mitigated by the spec's accuracy scenario (GitLab named; no other connector claimed) and the firm copy ceiling ("more are coming", no names).
- **Colour-journey saturation.** A sixth hue could tip the journey from "rhythm" to "rainbow". Mitigated by `pink` reading as a natural warm continuation after green, and by the beats remaining editorially identical in form.
- **Coexistence with `site-faq-accuracy`.** That change MODIFIES the "Local-only…" requirement and edits an *existing* beat's copy; this change ADDS a *new* requirement and a *new* beat. Different requirement, different code region — they archive in either order. (The FAQ change's code is already committed; this beat is purely additive.)
- **Dating risk.** If a second connector ships soon, "more are coming" still reads true; no copy names a specific unshipped service, so the page never goes stale or wrong.
