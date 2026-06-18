## Why

A visitor reading the marketing site's smart-folders beat should understand what a
smart folder *is* — a folder that fills itself from a service you keep checking and
stays current on its own — and see the real breadth of what it connects to. Today the
beat reads as one narrow recipe (a GitLab/GitHub review queue with pipeline status),
and the governing `marketing-site` spec actively forbids naming any other connector,
calling out Jira by name as something not to mention. That spec is now stale: the
extension ships **four** user-selectable connectors — GitLab, GitHub, Jira, and RSS
feeds (`SmartSource = 'gitlab' | 'github' | 'jira' | 'rss'`, exposed in
`SmartFolderEditor.svelte`'s source picker; the `launcher` spec already names all
four). This change makes the beat lead with the idea and name what the product
actually ships, and brings the marketing spec back into lockstep with the code.

## What Changes

- Rewrite the smart-folders beat copy in `apps/site/src/lib/Chapters.svelte`
  (chapter 6) so it leads with the *idea* of a smart folder, names the connectors
  that actually ship (a code host — GitLab or GitHub; an issue tracker — Jira; a feed
  — RSS), keeps the self-hosted and on-device claims, and ends with a name-free,
  date-free "more on the way". Drops the over-specific review-queue mechanics
  (merge-vs-pull request wording, pipeline-status prose).
- Adjust the chapter's `title`/`kicker` if "Pin a live queue, not just a page" no
  longer fits the broadened framing (the GitLab review-queue visual stays the
  concrete example; the staged `SmartFolderMock` is unchanged).
- **MODIFY** the `marketing-site` spec requirement "Smart folders are positioned as a
  live-queue platform and demonstrated": the beat SHALL name the shipped connectors
  (GitLab, GitHub, Jira, RSS feeds) and SHALL NOT name or imply *unshipped* connectors
  (e.g. Notion, a calendar). Everything else the requirement pins (live-queue framing,
  GitLab review queue as the demonstrated example, self-hosted + on-device claims,
  WCAG-AA, reduced-motion, one-status-mark-per-row visual) is preserved.

No code is added or removed in the extension; the connector set already ships. This is
a copy + spec correction, not a feature.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `marketing-site`: the smart-folders beat's connector-naming requirement changes —
  it must name the four shipped connectors and only exclude genuinely unshipped ones,
  replacing the stale "GitLab and GitHub only; do not name Jira" rule.

## Impact

- **Code**: `apps/site/src/lib/Chapters.svelte` (chapter 6 copy + possibly its
  title/kicker). No change to `SmartFolderMock.svelte` (the GitLab review-queue visual
  remains the concrete example) or to the extension.
- **Spec**: `openspec/specs/marketing-site/spec.md` — the "Smart folders are
  positioned as a live-queue platform and demonstrated" requirement and its
  "names the connectors that ship" scenario, applied when this change is archived.
- **Docs**: none. `docs/architecture.md` and `docs/tech-stack.md` are unaffected (no
  architecture or stack change); the privacy page already describes connectors
  generically ("a code host, an issue tracker, or a feed") and stays as-is.
- **Voice**: copy is authored to the `lunma-voice` skill and must pass the tell-hunter
  pass (zero banned AI tells) before it ships.
