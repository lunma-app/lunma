## Context

The `rss-connector` change (prerequisite) ships `source: 'rss'` smart folders,
promotes `saxes` as a direct dependency, and introduces `createSmartFolder`
with the full feed-node field set (`baseUrl`, `name`, `maxItems`,
`refreshMinutes`, optional `query`). This change builds on that foundation:
the only new coordination surface is the Options page.

The existing `BackupRestore.svelte` card establishes the full Options-page
pattern for file-based import/export: a `Surface` glass card, a hidden
`<input type="file">`, a button that activates it, a confirm step before any
mutation, and a `Toast` on success. This change follows that pattern exactly
for OPML.

Key constraint: the Options page is a standalone surface with no intrinsic
"active space" — the sidebar's currently-open Space is a per-window runtime
value that the Options page cannot know. A Space picker in the confirm step
is therefore required.

## Goals / Non-Goals

**Goals:**
- A `parseOpml` utility that extracts feed entries from OPML XML using `saxes`
  at any nesting depth, returning `{ name: string; feedUrl: string }[]`.
- A `buildOpml` utility that serialises RSS smart-folder nodes to OPML 1.0 XML.
- An `importOpml` bus command + handler that batch-creates RSS smart folders in
  a target space by dispatching the existing `createSmartFolder` logic per feed.
- An Options-page "Feed subscriptions" card (`FeedSubscriptions.svelte`) with
  import (file → parse → confirm → dispatch) and export (build → download)
  gestures, styled to the `BackupRestore` card pattern.

**Non-Goals:**
- Category-to-Space mapping (nested OPML categories → multiple Spaces) — v1
  flattens all `type="rss"` outlines regardless of nesting; category names are
  ignored.
- Feed autodiscovery from a site URL (`<link rel="alternate">` sniffing) —
  remains a non-goal from `rss-connector`.
- Sidebar-adjacent entry point (e.g. an empty-state hint) — Options-only in v1.
- Duplicate detection — if a feed URL already exists as a folder in the target
  space, a second folder is created; deduplication is a future concern.
- Partial-failure rollback — feeds that fail to create (e.g. invalid URL) are
  skipped and reported in a summary; already-created folders are not rolled back.

## Decisions

### D1 — `shared/opml.ts`, not `background/`
`parseOpml` and `buildOpml` are pure functions (no side effects, no I/O). Both
need to be reachable from the Options surface, which lives outside
`background/`. The `shared/` layer is the only layer that can be imported by
both `background/` and `options/` without violating the DAG. **Alternative:**
put parse in `background/`, export via a bus round-trip — rejected: a bus
round-trip for a pure string→array transform is wasteful and would require a
new `parseOpmlRequest` command just to proxy a CPU-bound operation.

### D2 — `saxes` for OPML parsing (same as RSS)
OPML is XML; `saxes` is already the established XML parser. **Alternative:**
a hand-rolled regex/split — rejected for the same reasons as in
`rss-connector` (CDATA, entities, encoding declarations in the wild).
`saxes` is already a direct dependency; this adds no new cost.

### D3 — Flatten nested outlines; ignore category names
OPML supports `<outline>` elements that contain other `<outline>` elements
(used by Feedly and Inoreader for category grouping). In v1, `parseOpml`
recurses into every outline depth and collects all `type="rss"` leaves.
Category (container) outlines have no `xmlUrl` and are silently skipped.
**Alternative:** map categories to Spaces — rejected as a scope-expanding
feature that touches Space creation; named as a future change.

### D4 — `importOpml` dispatches N × `createSmartFolder` calls in the handler
The handler receives `{ spaceId, feeds: { name, feedUrl }[] }` and calls the
existing `createSmartFolder` logic once per feed (minting a UUID, triggering an
immediate first fetch). Each call is independent; a validation error on one feed
(e.g. an invalid URL) throws for that entry and is caught, logged, and counted
in a per-entry error tally — the remaining feeds continue. **Alternative:** a
single-call bulk endpoint that accepts an array of nodes — rejected: no existing
precedent; `createSmartFolder` already has the correct logic including
normalisation, alarm sync, and the immediate-fetch side-effect, and looping it
is safe and obvious. Import defaults: `maxItems: 10`, `refreshMinutes: 30`
(the RSS editor defaults from `rss-connector`).

### D5 — Space picker in the confirm step, not auto-derived active space
The Options page is a standalone surface; there is no canonical "currently open
Space" available to it. Rather than reading the first Space from state or
guessing, the confirm sheet includes a `Select` populated from
`state.pinnedTree` Space nodes, defaulting to the first Space. This lets the
user consciously route their feeds. **Alternative:** default to
`state.pinnedTree[0]` with no picker — rejected: a user with multiple Spaces
would land all feeds in the wrong Space with no recourse short of deleting and
reimporting; the picker is one extra control with high corrective value.

### D6 — `buildOpml` uses `baseUrl` for `htmlUrl`; export is feed-only
`buildOpml` iterates pinned-tree nodes where `source === 'rss'` (across all
Spaces) and emits OPML 1.0 XML. The `htmlUrl` attribute is set to `baseUrl`
(the feed XML URL). Using `CONNECTORS.rss.listingUrl(node)` — which holds the
channel website link captured during the first fetch — was considered but
rejected: `CONNECTORS` lives in `background/connectors/` and importing it from
`shared/opml.ts` would violate the one-way import DAG (`shared/` may not import
`background/`). `baseUrl` is a valid, unambiguous `htmlUrl` value; feed readers
that open the URL will land on the feed XML, which is acceptable for portability.
Export covers all Spaces (not just a selected one) — a user migrating out of
Lunma wants all their feeds. **Alternative:** export only the selected Space's
feeds — rejected; OPML is a portability format, completeness is the expectation.

### D7 — Export button conditionally rendered
The "Export as OPML" button is only rendered when at least one `source: 'rss'`
folder exists anywhere in the pinned tree. An empty state (no feeds yet) shows
only the import affordance. **Alternative:** always show both buttons — rejected;
an export of zero feeds creates a misleading empty file.

### D8 — Options page reads state at action time, directly from `chrome.storage.local`
Following the `BackupRestore.svelte` precedent, `FeedSubscriptions.svelte`
reads the current `AppState` directly from `chrome.storage.local` **at the
moment the user selects a file** (inside `onFileChange`) for the Space picker,
and **at the moment the user clicks Export** (inside `handleExport`) for the
feed-folder list — not at component mount and not via a bus `state-request`.
Lazy reads at action time guarantee the snapshot is fresh when the user acts
and avoid a bus round-trip for a read-only pre-action check. The import action
itself goes through the bus (`importOpml`), so the write path is correctly
single-writer.

## Visual language

The "Feed subscriptions" card follows the `BackupRestore.svelte` card exactly
as a template:
- `Surface variant="glass"` wrapper; `h2` in Instrument Serif (`--font-display`,
  `--text-xl`, `--weight-regular`), identity-hue tinted at standard/vivid tints
  (the `max(l, 0.72)` floor).
- Import and export actions in the `.actions` row: `Button variant="primary"`
  for import (the initiating action), `Button variant="ghost"` for export.
- **Confirm sheet** (replaces the import button row, same as the
  `BackupRestore` confirm pattern):
  - Text: `"Found N feeds — add to:"` + inline `Select` of Space names
    (the Space picker, D5) + `Button variant="ghost"` Cancel + `Button
    variant="primary"` Import.
  - Motion: the confirm row replaces the import button in-place with no
    animation (the `BackupRestore` pattern — instant swap, no transition, the
    content change itself is the signal).
- **Error state**: `<p role="alert">` with `--danger` background tint, same as
  `BackupRestore`'s `.import-error` treatment.
- **Toast on success**: `"N feeds imported"` / `"Feeds exported"` — same `Toast`
  primitive as `BackupRestore`.
- Reduced-motion: no animations in this card (the confirm swap and toast are
  already instant or handled by the `Toast` primitive).
- WCAG-AA: the Space picker and buttons inherit their contrast guarantees from
  the `Select` and `Button` primitives; the error text at `--danger` over the
  glass fill is verified by the existing `BackupRestore` contrast case.

## Risks / Trade-offs

- **Malformed / huge OPML** → `saxes` errors are caught; whatever parsed cleanly
  before the error is kept. No response-size cap is needed here (OPML is a
  local file, not a network fetch) but we reject clearly-broken parses (zero
  entries after a parse attempt with no saxes error indicates a non-OPML file).
- **Duplicate feeds** → accepted in v1; the confirm sheet shows the count so
  the user can abort if it looks wrong. A future deduplication change can filter
  `xmlUrl`s already present in the target Space.
- **Invalid `xmlUrl` values** (relative paths, non-http(s) schemes) → the
  `createSmartFolder` handler's `normalizeBaseUrl` validation rejects them;
  they are counted as skipped and reported in a `"N imported, M skipped"` toast.
- **No feeds found** → `parseOpml` returns `[]`; the import flow shows an error
  ("No RSS feeds found in this file") instead of the confirm sheet, and does not
  dispatch the bus command.
- **Space picker with one Space** → the picker is still rendered (the pattern
  is consistent and avoids a conditional layout); it has one option and is
  effectively a label.

## Open Questions

- **`"N imported, M skipped"` wording** — decide at apply whether to show the
  skip count at all when M = 0 (simpler: `"N feeds imported"`), or always show
  both numbers.
- **Cross-Space export grouping** — the OPML `<body>` could group feeds by Space
  name using category outlines (non-`type="rss"` container outlines). Decide at
  apply: flat list (simpler, no information loss on re-import) or grouped by
  Space (richer, but category names are ignored on import in v1 anyway).
