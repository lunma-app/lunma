## Why

Smart folders are a queue-from-anywhere platform, and an **RSS/Atom feed** is the
cheapest way to broaden them past "things assigned to me" into "my live web":
a **Reading Space** of feed folders — Hacker News, a blog, a YouTube channel —
pinned exactly where you work, each showing the latest posts with an unread mark
that clears as you read. It is the purest expression of Lunma's no-server stance:
public feeds, fetched directly on-device, **nothing to authenticate and nothing
that leaves the machine**. This realises the `the distribution notes` connector
roadmap's "RSS / reading" bet, and the read-state + per-folder max-items +
open-all machinery it lands is reused by the **named downstream change
`readlater-connector`** (Readwise/Instapaper/Pocket — planned, not in this
change).

RSS is also the first connector that is a *feed*, not a *queue* (it never
empties), so it introduces a small amount of new behaviour — per-item read-state
— that the existing queue connectors did not need. That behaviour is what makes a
reading folder feel alive and resolvable instead of an eternal list of twenty.

## What Changes

- **A fourth connector source, `rss`**, added to the closed `CONNECTORS`
  registry. It fetches a feed URL, parses RSS 2.0 + Atom in one DOM-free
  streaming pass, and normalizes entries onto the existing agnostic
  `SmartFolderItem`/`SmartFolderRuntime` shapes. No auth (`signed-out` is
  impossible for a public feed); states used are `pending | ok | error`.
- **A draining unread queue (stateful, persisted read-state).** A feed folder is a
  queue of the newest **unread** entries that drains as you read. An entry is
  **consumed** (marked read) when you **move on** — its bound tab is deactivated
  (you navigate to another tab) or closed — NOT the instant you open it (so the
  entry stays put while you read it). The resting state is **drained** (read hidden);
  a footer **"Show recently read"** peek reveals them, a kebab **"Mark all read"**
  drains the folder, and the header **badge shows the unread count (`N+` at the
  budget) and disappears at zero** (the calm "caught up" state). Read-state is
  **persisted but ids-only and pruned to the fetched window** (the
  `smartItemBindings` precedent). RSS-only in v1 (queue items self-resolve).
- **Per-folder `maxItems` — an unread budget for feeds, a total cap for queues.**
  The smart node gains a `maxItems` field (replacing the hardcoded `RESULTS_CAP =
  20`), surfaced in the editor as a `Select` (10/20/30/50). For **queues** it caps
  the total results (the connector slices to it). For the **feed** it is the
  **unread budget**: the connector keeps the whole feed (bounded `FEED_BUFFER`), and
  the sidebar surfaces the newest `maxItems` unread, **backfilling** older unread as
  you read. The badge reads `N+` at the cap/budget so it is never silent.
- **"Open all in a tab."** A new per-connector **listing URL** opens the full
  source listing in a browser tab — for RSS the feed channel's website; the queue
  connectors are **backfilled** with their listing URLs (one each) so every smart
  folder gains the escape hatch. Reachable from a results-footer affordance **and**
  the folder kebab.
- **Source-adaptive editor.** The Source control becomes a `Select` (it scales
  past four sources — RSS is the fourth, `readlater` will be the fifth). For RSS
  the editor shows a **"Feed URL"** field, **no canned query** (query becomes
  source-optional), a **"Show up to N unread"** `Select`, **Refresh** (RSS default
  30 min; feeds move slowly, floor stays 5), **Name**, and a no-sign-in hint.
- **The "reading nook" visual treatment** in `SmartFolder.svelte` — unread vs read
  row grammar, the reading-controls footer, the open-on-click "it resolves" beat —
  composed entirely from existing primitives + feature-local CSS (see `design.md`).
- **Schema bump V5→V6** (append-only migration): widen the `source` enum, make
  `query` optional, add `maxItems` and `hideRead` to the smart node, add the
  persisted read-state slice.

## Capabilities

### New Capabilities
<!-- None — RSS extends the existing smart-folders capability rather than introducing a new one. -->

### Modified Capabilities
- `smart-folders`: a fourth source (`rss`); a feed-shaped (non-queue) connector
  with no auth; per-item read-state (unread/read, hide-read, mark-all-read,
  unread-count badge); per-folder `maxItems`; a per-connector listing URL +
  "open all in a tab"; the source-adaptive editor (Source as `Select`, RSS feed
  URL + no query + max-items).
- `storage-and-migrations`: the V5→V6 schema + migration — widened source enum,
  optional `query`, new `maxItems`/`hideRead` node fields, and a new **persisted**
  read-state slice (kept on disk like `smartItemBindings`, not stripped like the
  ephemeral `smartFolders` runtime), with its pruning contract.

## Impact

**New files**
- `apps/extension/src/background/connectors/rss.ts` — the `rssConnector`
  (`fetchRuntime` + `listingUrl`) and the `parseFeed` RSS/Atom parser.
- `apps/extension/src/background/connectors/rss.test.ts`.

**New dependency (tech-stack addition — surfaced per the deviation policy)**
- **`saxes`** (a pure-JS, DOM-free streaming XML/SAX parser, ~168 KB, already
  present transitively; promoted to a direct dependency). The MV3 service worker
  has **no `DOMParser`**, so feed XML cannot be parsed with the platform; a spike
  confirmed `saxes` parses RSS 2.0 + Atom + CDATA + missing-guid fallback in one
  pass. `docs/02-tech-stack.md` gains a dependency row for it.

**New public types / fields / methods**
- `SmartSource` widens to `'gitlab' | 'github' | 'jira' | 'rss'`.
- The `smart` `PinNode` (and its Zod schema): `query` becomes **optional**; adds
  `maxItems: number` and `hideRead: boolean`.
- `SourceConnector` gains a **`listingUrl(node)`** member (and honours `maxItems`).
- `AppState` + schema gain a persisted **`smartReadState: { [folderId]: string[] }`**
  slice (seen/read item ids); `AppStateV6Schema`, `SmartReadStateSchema`, and the
  V5→V6 migration entry.
- New bus commands: **`markSmartItemRead`**, **`markAllSmartItemsRead`**,
  **`setSmartFolderHideRead`**, **`openSmartFolderListing`** (the `openSmartItem`
  open path is reused — opening also marks read).
- New store mutators: `markSmartItemRead`, `markAllSmartItemsRead`,
  `setSmartFolderHideRead`, `pruneSmartReadState`.
- Icon allowlist (`pnpm gen:icons`): `rss`, `arrow-up-right` (and any
  hide-read glyph the design lands).

**Primitives — composed (no new primitives)**
- Composes existing `src/ui/` primitives: `FolderRow`, `Select`, `TextInput`,
  `Button` (ghost variant, the `Divider`'s "↓ Clear" pattern), `RowMenu` /
  `ContextMenu`, `Favicon`, `Tooltip`, `IconButton`. The Source picker **drops**
  `SegmentedControl` in favour of `Select`. The unread/read row grammar and the
  reading-controls footer are **feature-local CSS** in `SmartFolder.svelte` (the
  existing `.dot` / `.note-row` / `.signin-row` precedent). **No new shared
  primitive is added.**

**Docs updated (lockstep, in this change)**
- `docs/04-capabilities.md` (#12 smart-folders scope; #3 storage-and-migrations).
- `docs/02-tech-stack.md` (the `saxes` dependency row).
- `the distribution notes` (connector decision log — RSS ships).
- **Untouched:** `docs/01-vision.md`, `docs/03-architecture.md` (the import DAG is
  unchanged — `background/connectors/rss.ts` sits in the same layer as its peers),
  `docs/05-*`, `docs/06-migration.md`.

**Engine / coordinator**
- The source-agnostic engine (`smart-folders.ts` scheduling, in-flight guard,
  result-event drain) is **unchanged** apart from threading `maxItems` and the
  new registry entry. Read-state mutations ride the existing single-writer drain.
