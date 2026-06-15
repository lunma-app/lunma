## Why

OPML (Outline Processor Markup Language) is the universal exchange format for
feed subscription lists — every major feed reader (NetNewsWire, Feedly,
Inoreader, Reeder) can export one. Without OPML import, a user with 20+ feeds
who wants to adopt Lunma faces 20 manual "paste URL → name → save" cycles; with
it, a single file drop takes 30 seconds. OPML export closes the portability
loop: users who try Lunma can always take their feed list with them, which is
the no-lock-in promise. This change ships immediately after `rss-connector`
archives (prerequisite).

## What Changes

- **`parseOpml(xml: string)`** — a pure utility (no side effects) in
  `shared/opml.ts` that uses `saxes` (already a direct dependency) to walk
  `<outline type="rss">` elements at any nesting depth and return
  `{ name: string; feedUrl: string }[]`. Nested outlines (categories) are
  **flattened** in v1; category names are ignored.
- **`buildOpml(folders)`** — a companion utility in the same file that accepts
  an array of RSS `SmartFolderNode`s and emits a valid OPML 1.0 XML string,
  with one `<outline type="rss">` per feed (attributes: `text`, `xmlUrl`,
  `htmlUrl` = `baseUrl`). `CONNECTORS.rss.listingUrl` lives in `background/`
  and cannot be imported from `shared/`; `baseUrl` (the feed XML URL) is a
  valid OPML `htmlUrl` and the correct architectural choice.
- **`importOpml` bus command + handler** — receives
  `{ spaceId: string; feeds: { name: string; feedUrl: string }[] }`, loops and
  dispatches the existing `createSmartFolder` logic for each feed (defaults:
  `maxItems: 10`, `refreshMinutes: 30`). No schema bump — purely behavioural.
- **Options-page "Feed subscriptions" section** — a new `FeedSubscriptions.svelte`
  component in `options/`, styled to the `BackupRestore.svelte` card pattern:
  - **Import**: "Import from OPML" button → hidden `<input type="file"
    accept=".opml,.xml">` → parse → confirm sheet ("Found N feeds — add to
    [Space name]?") → dispatch `importOpml`. Target space = the state's
    `activeSpaceId`. Error states: no feeds found, parse failure, empty file.
  - **Export**: "Export as OPML" button → `buildOpml` → download
    `lunma-feeds-{date}.opml`. Conditionally rendered — present only when at
    least one `source: 'rss'` folder exists in any space.

## Capabilities

### New Capabilities
- `opml-import-export`: OPML parse + build utilities; `importOpml` bus command;
  the Options-page "Feed subscriptions" section (import + export gestures).

### Modified Capabilities
- `smart-folders`: `importOpml` is a new bus command that bulk-creates RSS smart
  folders; the spec gains this command in its bus-command table.

## Impact

**New files**
- `apps/extension/src/shared/opml.ts` — `parseOpml` + `buildOpml`.
- `apps/extension/src/shared/opml.test.ts` — parser + builder unit tests.
- `apps/extension/src/options/FeedSubscriptions.svelte` — the Options-page
  card (import + export UI).
- `apps/extension/src/options/FeedSubscriptions.test.ts`.

**Modified files**
- `apps/extension/src/shared/bus.ts` — add `importOpml` to the
  `PendingEvent`/`SidebarCommand` union + `COMMAND_SCHEMAS` + `EventPolicy`.
- `apps/extension/src/background/handlers/smart-folders.ts` — add
  `importOpml` handler (loops `createSmartFolder` logic).
- `apps/extension/src/options/Options.svelte` — mount the new
  `FeedSubscriptions` card in the Options layout.
- `openspec/specs/` — update the smart-folders spec (new `importOpml`
  command) and document the new `opml-import-export` capability.

**Untouched**
- `docs/tech-stack.md` (no new dependency — `saxes` already promoted in
  `rss-connector`), `docs/architecture.md` (import DAG unchanged —
  `shared/opml.ts` sits in the `shared/` layer).

**Primitives composed (no new primitives)**
- `Button` (primary + ghost variants), `Surface` (glass card), `Toast`,
  `Select` (Space picker in the confirm step) — the same set
  `BackupRestore.svelte` already uses plus `Select`. No new `src/ui/` primitive
  is added.

**No new dependency** — `saxes` is already a direct `@lunma/extension`
dependency. No schema version bump.
