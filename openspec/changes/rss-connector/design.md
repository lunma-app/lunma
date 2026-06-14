## Context

Smart folders dispatch through a closed `CONNECTORS` registry keyed by a
`SmartSource` discriminant (`background/smart-folders.ts`). Each source is a
`SourceConnector` (`background/connectors/connector.ts`) with one real method,
`fetchRuntime(node, caches?) → SmartFolderRuntime`, bounded and never-throwing.
The three shipped connectors (GitLab, GitHub, Jira) are all **queues** — "things
assigned to / waiting on me" — auth'd (PAT or session cookie), JSON, and
self-emptying as you act. The engine (scheduling on one alarm, the in-flight
guard, the result-event drain, single-writer persistence) is **source-agnostic**
and is reused wholesale here.

RSS is the first **feed** source: a public address, no identity, no canned query,
parsed from XML, that **never empties**. Two constraints shaped this design and
were de-risked with spikes during the explore session:

1. **No DOM in the service worker.** MV3 background is a service worker with no
   `DOMParser` (`typeof DOMParser === 'undefined'`), so feed XML must be parsed in
   pure JS. A spike with `saxes` (already in the tree transitively, ~168 KB)
   parsed RSS 2.0 + Atom + CDATA + missing-guid fallback in one streaming pass.
2. **Read-state without bloating storage.** A feed never empties, so without
   per-item read tracking the folder is an eternal list of twenty. The persisted
   `smartItemBindings` slice is an existing precedent for an **ids-only, pruned**
   per-(folder, item) persisted record; read-state follows the same shape and is
   pruned to the live feed window, so it can never grow unbounded.

## Goals / Non-Goals

**Goals:**
- Land `rss` as a fourth connector with zero changes to the engine's scheduling /
  drain / single-writer invariants.
- A reading folder that feels **alive and resolvable**: unread marks that clear on
  open, hide-read, mark-all-read, an unread-count badge.
- Per-folder `maxItems` (replacing the hardcoded cap) and a generalised
  "open all in a tab" (a per-connector listing URL), both usable by every source.
- Hit the visual bar from first sight — the calm "reading nook" treatment.
- Reuse the read-state / max-items / listing-URL machinery for the named
  downstream `readlater-connector`.

**Non-Goals:**
- Read-later (Readwise/Instapaper/Pocket) — separate change.
- **Feed autodiscovery** from a site URL (sniffing `<link rel="alternate">`) —
  paste the feed URL in v1; autodiscovery is a follow-up.
- **Aggregating multiple feeds into one folder** — one feed = one folder (a
  multi-feed folder would need `baseUrl[]`, a larger model change).
- Per-item reader-mode / article preview; OPML import.
- Read-state for the **queue** connectors (their items self-resolve).

## Decisions

### D1 — `saxes` (streaming SAX), not `DOMParser`, `fast-xml-parser`, or a hand-roll
`DOMParser` is unavailable in the SW. Among DOM-free options: a **streaming SAX
parser** (`saxes`) over a **tree builder** (`fast-xml-parser`) — feeds are small
and we only need a flat entry list, so the event model is a natural fit, the
memory profile is bounded, and `saxes` is already resolved in the workspace
(promoting a transitive dep, not adding a novel one). A hand-rolled regex/tokenizer
was rejected: feed XML in the wild (CDATA, entities, namespaces, mixed RSS/Atom)
is exactly where regex parsers rot. **Alternatives:** `fast-xml-parser` (heavier,
builds a whole tree we'd then walk); `htmlparser2` (also in-tree, but HTML-lenient
semantics we don't want for XML); hand-rolled (brittle). `saxes` is a tech-stack
addition → `docs/02-tech-stack.md` dependency row (an ADR is optional; the row +
this decision log suffice).

### D2 — RSS is feed-shaped: `query` becomes source-optional, `baseUrl` holds the feed URL
The smart node's `query` (`authored | assigned | review-requested`) is an
identity-scoped *queue* concept with no RSS meaning. Rather than invent a dummy
`'feed'` member, `query` becomes **optional** on the node + schema; RSS nodes omit
it. `baseUrl` (already an absolute http(s) URL, trailing-slash-stripped by
`normalizeBaseUrl`) holds the **feed URL** directly. The editor relabels it
"Feed URL" for RSS. **Alternative:** add a `'feed'` query value — rejected as a
meaningless enum member that every queue code path would have to special-case.

### D3 — Read-state: persisted, ids-only, pruned to the fetched buffer; RSS-only
A new persisted slice `smartReadState: { [folderId]: string[] }` holds the **read
item ids** per folder. It is **persisted** (kept by `toPersistable`, like
`smartItemBindings`; *not* stripped like the ephemeral `smartFolders` runtime) so
read marks survive SW sleeps and restarts. **Unbounded growth is prevented by
pruning to the fetched window**: after each successful fetch, any read id no
longer present in the fetched item set is dropped (`pruneSmartReadState`) — and
the fetched set is the connector's bounded **`FEED_BUFFER`** (the whole feed file,
capped at 200; see D5), so the read set can never exceed that. **Alternative
considered — a publish-date watermark** (store one "last read through" timestamp
per folder; unread = newer): O(1) storage, but feed `pubDate`s are
unreliable/absent and out-of-order, which would mismark items; the pruned id-set
is robust and matches an existing, tested pattern. Read-state is **RSS-only** in
v1 — queue items have no "read" concept. An item with **no guid** falls back to
its `link` as id (matching `gitlab.ts`'s id fallback); if a feed reuses neither
stably across fetches an item may re-surface as unread once — an accepted edge.

**The read TRIGGER is "consumed", not "opened" (revised on user feedback).**
Opening an entry does NOT mark it read — that would drain it from the list the
instant you open it (the draining-queue model, D5). An item is marked read only
when you **move on** from it: its bound tab is **deactivated** (you navigate to
another tab — the store sweeps this in `setActiveTab`, which the open path and
every tab-switch invoke; per-window, so switching *windows* doesn't count) or
**closed** (`onTabRemoved`). So the just-opened entry stays put — bound, active,
unread/highlighted — until you leave it. **Alternative — mark on open** (the
original D3): rejected as the cause of the instant-drain bug.

### D4 — Badge = unread count, `N+` at the budget, hidden at zero
The header badge shows the **unread** count and **disappears at zero** (the calm
"caught up" state — absence is the strongest signal, and in a multi-feed Reading
Space the eye jumps straight to folders that *have* a number). It reads
**`<maxItems>+`** when the feed holds more unread than the budget (D5), so the
budget is never silent. The coherence rule across all sources: **the badge always
counts what needs your attention** — for a feed that's unread items, for a queue
that's open items (unchanged behaviour for GitLab/GitHub/Jira). **Alternatives:**
total count (≈constant for a feed — pure noise) and `unread/total` — both
rejected. Matches every feed reader's convention (NetNewsWire/Reeder/Feedly).

### D5 — `maxItems`: an UNREAD budget for feeds, a total cap for queues (the draining queue)
The hardcoded `RESULTS_CAP = 20` becomes a per-node `maxItems: number`, surfaced
in the editor as a `Select` (10/20/30/50). For the **queue** sources it caps the
total results, and the connector slices to it (unchanged behaviour, default 20).
For the **feed** source it is the **UNREAD budget** (revised on user feedback —
the draining-queue model): the connector keeps the **whole feed file** (bounded by
a `FEED_BUFFER` of 200, NOT sliced to `maxItems` — a feed file is one snapshot with
no pagination), and the sidebar surfaces the **newest `maxItems` unread** items,
**backfilling older unread** from the buffer as you read so the queue stays full
until the feed is exhausted. The editor labels it "Show up to N **unread**" for a
feed, "Show at most N **items**" for a queue. **Alternative — `maxItems` as a
total latest-N cap for feeds too** (the original D5): rejected because a small cap
+ read-hiding left the folder stranding older unread you could never reach; the
unread budget keeps the pinned surface a glanceable, self-refilling queue (matching
the queue-from-anywhere thesis). Migration defaults existing nodes to **20** (no
behaviour change for queues).

### D6 — A per-connector `listingUrl` + "open all in a tab"
`SourceConnector` gains `listingUrl(node): string` — the URL that shows the full
listing on the source. RSS → the feed **channel's `<link>`** (its website),
captured during parse; the **queue connectors are backfilled** (GitLab
`/dashboard/merge_requests`, GitHub the PR search, Jira the JQL view) so *every*
smart folder gains the escape hatch they lack today (`openInstance` currently only
fires on the signed-out row). Surfaced **twice**: a results-footer affordance
("Open all ↗") and a folder-kebab entry ("Open all in a tab"), so it is
pointer-, keyboard-, and touch-reachable. Opens via the existing `openUrl` command.

### D7 — Source picker: `SegmentedControl` → `Select`
Four segments is tight at the 216px panel; `readlater` makes five. The Source
control becomes the `Select` primitive (the editor already uses `Select` for
Refresh + the new max-items, so it reads as one form). **Alternatives:** keep
segments and let them crowd (rejected — breaks at five); a two-tier `Dev ▸ /
Feeds ▸` grouping (rejected — a new interaction pattern for a flat list of five).

### D8 — Unread dot = Space-hued
The 8px `.dot` slot carried semantic pipeline tones for queue sources; RSS has no
pipeline status, so the slot is free. The unread mark is a **filled dot in the
Space hue** (the accent `--space-c` the active wash derives from) — immersive,
tying the unread signal to the Space's identity rather than a notification red.
Read rows leave the slot empty. Colour is **never the only carrier** (per the
spaces-and-tabs rule): unread/read is also weight + favicon opacity + the row's
accessible name.

### D9 — `hideRead` persisted per folder — DRAINED by default
A feed's resting state is the **drained unread queue** (the draining-queue model,
D5): read items are hidden, and the footer's **"Show recently read"** reveals them
in place. This is the persisted `hideRead: boolean` on the node, **defaulting
`true`** (revised on user feedback — the draining resting state hides read; the
original default `false` showed read). One boolean, no slice; persists so the
peek-state survives restart (a pref that reset would annoy). Inert on queue
sources (they carry no read-state). **Alternative:** session-only component state —
rejected (persisting matches the codebase's "persist prefs" convention). The field
keeps the name `hideRead` (`true` = the drained default); a future rename to
`showRead` was weighed but the flipped default + this note suffice.

### D10 — RSS Refresh default 30 min; D11 — no auth, states `pending | ok | error`
Feeds update slowly; the RSS editor default Refresh is **30 min** (floor stays 5,
SW-clamped). RSS is **public** — no PAT, no cookie ride; `signed-out` is
unreachable and never returned. A network error / non-2xx / parse-empty resolves
to the quiet `error` state (last-known items hold), exactly like the queue
connectors.

### D12 — No new shared primitives
Everything composes existing `src/ui/` primitives (`FolderRow`, `Select`,
`TextInput`, the ghost `Button`, `RowMenu`/`ContextMenu`, `Favicon`, `Tooltip`,
`IconButton`); the unread/read grammar and the footer strip are **feature-local
CSS** in `SmartFolder.svelte`, following the existing `.dot`/`.note-row`/
`.signin-row` precedent. The Source picker drops `SegmentedControl`. This keeps
the component-library policy satisfied with no primitive-library expansion.

## Visual language

The mood is **"the reading nook" — calm, ink-on-paper**, deliberately the
quietest surface in the sidebar (queues signal pressure; a feed should not).

**Unread vs read row.** Three signals carry the state, never colour alone:

| | ink | dot (8px slot) | favicon |
|---|---|---|---|
| **unread** | `--text`, `--weight-medium` | filled, Space hue (`--space-c`) | full opacity |
| **read** | `--text-muted`, `--weight-regular` | empty | opacity `0.45` (dormant-favicon precedent) |

`--text-muted` (not `--text-faint`) for read titles, because they remain
meaningful content and **must clear WCAG-AA over the Space wash** — the sidebar
already guarantees `--text-muted` clears AA at every tint; `--text-faint` does not
and stays reserved for the error note.

**The "it drains" beat (the draining queue, D5).** The entry you open **stays**
in the list — bound, active, highlighted — while you read it. When you **move on**
(navigate to another tab, or close the tab; D3) it is marked read and **drains**:
the dot fades out over `--motion-base` (opacity-only), the title settles
`--text → --text-muted`, the favicon dims to 0.45, the row collapses, and the
**next-oldest unread backfills** into the budget. Reduced-motion: instant, same
end state (the `animation: none` path already in this file).

**Reading-controls footer** (RSS, expanded, low-ink `--text-muted`, composed from
the ghost `Button` the `Divider`'s "↓ Clear" already uses; hover lifts ink to
`--text` with a `--surface-2` wash):
- left — **`Show N recently read`** (the drained default hides read; this reveals
  them in place) ⇄ `Hide N read`; **absent** when no read items in the window.
- right — `Open all ↗` (`arrow-up-right` glyph), opens the listing URL.

Read rows are **collapsed by default** (the drained queue) and revealed by the
footer (height + opacity over `--motion-base` / `--ease-emphasised` — reuses the
`smart-open` keyframe); reduced-motion swaps instantly. **Mark all read** lives in
the kebab (drains the whole folder). No shimmer/strobe (first-fetch keeps the
existing static ghost rows).

**Badge** uses the existing folder-header badge slot; the unread count, `N+` at
the budget, hidden at zero (D4). **Editor**: the Source `Select`, "Feed URL"
`TextInput`, "Show up to N **unread**" `Select`, "Refresh" `Select`, "Name"
`TextInput`, and a one-line hint
("Public feed — no sign-in needed. Paste the feed URL.") read as one form via the
existing `.field` / `.field-label` styles.

Arc reference: Arc's feed-ish surfaces lean notification-center loud; Lunma
**deliberately diverges to calm** — the unread mark is a single hue dot that
*clears*, not a count chip that accrues. AA: a new automated contrast case asserts
the read-row title over the Space wash at every tint (the `newtab-hearth`
precedent).

## Risks / Trade-offs

- **Malformed / huge feed XML** → bounded fetch (`FETCH_TIMEOUT_MS`), a response
  byte cap (reject oversized bodies to the `error` state), element-wise tolerance
  (one bad entry never costs the rest, per `gitlab.ts`), and `maxItems` slicing.
  `saxes` errors are swallowed; whatever parsed cleanly is kept.
- **Arbitrary-origin fetch** (feeds live anywhere) → the extension's existing host
  permissions let the SW fetch cross-origin and read the body (no page-CORS, no
  proxy — the no-server win). Feeds behind Cloudflare/anti-bot or requiring a
  User-Agent may fail → degrade to the quiet `error` state, never a broken folder.
- **Unstable item ids** (no guid + changing link) → an item may re-appear unread
  once; accepted, logged. Mitigation: prefer `guid`/Atom `id`, fall back to `link`.
- **Read-state growth** → pruned to the live window every successful fetch; capped
  at `maxItems` per folder by construction.
- **`maxItems` raised after items were read** → newly-revealed older entries read
  as unread (correct — they were never opened).

## Migration Plan

- **V5 → V6, append-only** (the v2→v3→v4→v5 precedent). `AppStateV6Schema`:
  widen `source` enum to include `'rss'`; make `query` `.optional()`; add
  `maxItems` (migration default **20**) and `hideRead` (default **false**) to the
  smart node; add `smartReadState` (`SmartReadStateSchema`, `.default({})`).
- Existing smart nodes migrate with **no behaviour change** (cap 20, query
  preserved, nothing read yet). The migration is pure-additive over persisted data.
- **Rollback:** migrations are forward-only (storage capability); a V6 envelope on
  an older build would fail validation and route through the existing
  salvage / `__corrupt_backup_*` safety net rather than corrupting data. No
  destructive step to roll back.

## Open Questions

- **Listing-URL backfill scope** — decided in-change (D6), but if a queue
  connector's canonical listing URL is contentious (e.g. Jira's JQL view URL
  shape), confirm the exact URLs during apply.
- **Response byte cap value** (e.g. 2–5 MB) — pick a concrete bound in
  implementation.
- **`saxes` ADR** — a dependency row in `docs/02-tech-stack.md` is planned; decide
  at apply whether it also warrants a short ADR (the lucide/drag precedent).
