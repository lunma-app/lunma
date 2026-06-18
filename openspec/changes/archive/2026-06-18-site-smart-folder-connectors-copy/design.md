## Context

The marketing site's smart-folders beat (`apps/site/src/lib/Chapters.svelte`, chapter
6) reads as a single narrow recipe: "Point one at GitLab or GitHub and your review
queue lands in the Space: the merge requests and pull requests waiting on you, each
with its pipeline status…". The user's feedback is that this is too specific — the
beat should convey *what a smart folder is* and name a few supported services, with
"more on the way".

That feedback also exposes a spec-vs-code drift. The governing `marketing-site` spec
requirement "Smart folders are positioned as a live-queue platform and demonstrated"
mandates the copy name **only** GitLab and GitHub and **SHALL NOT name or imply** any
other connector, naming Jira explicitly as off-limits. But the extension now ships
four user-selectable connectors:

- `SmartSource = 'gitlab' | 'github' | 'jira' | 'rss'` (`apps/extension/src/shared/types.ts:143`).
- `SmartFolderEditor.svelte`'s `SOURCE_OPTIONS` exposes all four in the picker, each
  with its own auth hint and defaults (design history: GitHub D8, Jira D9, RSS D7).
- The `launcher` spec already flattens "every smart folder's items across all sources
  (GitLab, GitHub, Jira, RSS)".

So the `marketing-site` spec is stale — written when only two connectors shipped. It
cannot be hand-edited (living specs change only by archiving a change), so this change
carries a delta that refreshes the connector-naming requirement, and updates the copy
in the same change to keep docs/spec/code in lockstep.

## Goals / Non-Goals

**Goals:**

- Make the smart-folders beat copy lead with the *idea* of a smart folder: a folder
  that fills itself from a service you keep checking and stays current on its own.
- Name the connectors that actually ship (a code host — GitLab or GitHub; an issue
  tracker — Jira; a feed — RSS), with a calm, name-free, date-free "more on the way".
- Preserve the spec-required claims: self-hostable, on-device (no Lunma server),
  WCAG-AA, reduced-motion, one-status-mark-per-row visual.
- Refresh the `marketing-site` spec so it names the four shipped connectors and only
  excludes genuinely unshipped ones.

**Non-Goals:**

- No change to the staged visual (`SmartFolderMock.svelte`). The GitLab review queue
  stays the concrete demonstrated example; only the copy broadens.
- No change to the extension, the connector set, or any connector behaviour.
- No change to the privacy page, which already describes connectors generically
  ("a code host, an issue tracker, or a feed") and stays accurate.
- No new `src/ui` primitives or site components — this is a copy edit within the
  existing `Chapter` composition.

## Decisions

**D1 — Lead with the idea, name connectors by category + example.** The opening
sentence states what a smart folder is. The supported set is named the way the privacy
page already frames it — a code host (GitLab or GitHub), an issue tracker (Jira), a
feed (RSS) — so the copy reads as the general idea with concrete anchors, not a feature
matrix. *Alternative considered:* a bare list ("GitLab, GitHub, Jira, and RSS"). Rejected
— it reads as a spec sheet and buries the idea the user asked to foreground.

**D2 — Keep the GitLab review-queue visual as the concrete example.** The
`SmartFolderMock` (GitLab merge-request rows, one pipeline-status dot each) already
satisfies the spec's visual scenario and demonstrates the capability vividly. Changing
the visual is out of scope and unnecessary; the copy carries the breadth while the
visual demonstrates one source. *Alternative:* a generic/multi-source visual. Rejected
— more work, weaker concreteness, and the spec still wants one demonstrated example.

**D3 — Revise the title/kicker.** The current title "Pin a live queue, not just a
page." has two problems once the beat broadens: "queue" excludes a slow RSS feed, and
"not just X" is a banned AI tell in the `lunma-voice` checklist. The new title states
the idea plainly (a folder that fills and refreshes itself). The kicker "Smart folders"
stays. *Alternative:* keep the title. Rejected — it would contradict the broadened copy
and keep a voice tell. Final wording is fixed at apply time after the tell-hunter pass.

**D4 — Keep self-hosted + on-device, phrased lightly.** The spec requires both claims,
and they are real differentiators (self-hosted GitLab/Jira via the connector baseUrl;
no Lunma server). They stay, but trimmed so they support the idea rather than dominate
the paragraph as the original "It works with your self-hosted instance" mechanics did.

**D5 — Refresh the `marketing-site` spec via this change's delta.** The connector-naming
requirement and its scenario are MODIFIED to name GitLab, GitHub, Jira, and RSS feeds,
and to exclude only unshipped connectors (Notion, a calendar). Every other clause of
the requirement (live-queue framing, GitLab example, self-hosted/on-device, WCAG-AA,
reduced-motion, one-status-mark visual) is carried verbatim. Hand-editing the living
spec is not allowed; this is the sanctioned route.

**D6 — Voice gate.** The copy is authored to `lunma-voice` and must pass the tell-hunter
pass — multiple fresh critics flag any banned tell (em-dash dramatic pause, "not just
X", rule-of-three, hype words, hedge verbs) against the checklist; revise to zero flags.
Accuracy outranks punch: the named connector set must match the shipped `SmartSource`.

## Visual language

This beat ships through the existing editorial `Chapter` composition; the change is
copy-only, so the visual language is preserved, not re-rolled:

- **Motion.** No motion is added or changed. The `SmartFolderMock` is static (a running
  pipeline is a static `--info` dot), so the page's reduced-motion contract is untouched.
- **Colour.** The chapter keeps its pink Space accent (`color="pink"`). The folder name
  in the mock rides the surrounding Space colour with the `max(l, 0.72)` lightness floor
  so it stays WCAG-AA, unchanged.
- **Hierarchy.** Display heading (Instrument Serif) → body copy (Mona Sans) → staged
  visual, exactly as the other five chapters. The revised title remains a single display
  heading line; the body stays one short paragraph (one idea per sentence, mostly short).
- **Interaction feedback.** None new — the beat is non-interactive editorial content; the
  mock is `aria-hidden` decorative, with the copy carrying the meaning for assistive tech.
- **Contrast.** All beat text holds WCAG-AA, verified by the site's automated contrast
  test (`apps/site` `vitest run`) that already gates this surface.

## Risks / Trade-offs

- **[Copy and visual diverge in specificity]** The copy names feeds/Jira while the visual
  shows only a GitLab queue. → Mitigation: the spec explicitly models this (general
  capability + one concrete example); the privacy page does the same. The visual reads as
  "for example", not "the only source".
- **[Over-promising future connectors]** "More on the way" must not name an unshipped
  connector or imply a date. → Mitigation: the spec scenario keeps the future indication
  name-free and date-free; the tell-hunter pass checks the final phrasing.
- **[Spec delta loses a clause at archive time]** A MODIFIED requirement replaces the
  whole requirement. → Mitigation: the delta copies the entire existing requirement block
  and edits only the connector-naming paragraph + scenario, preserving all other clauses
  verbatim.
- **[Voice regression]** New copy reintroduces an AI tell. → Mitigation: D6's tell-hunter
  pass with fresh critics; the `lunma-voice` skill is binding for this surface.
