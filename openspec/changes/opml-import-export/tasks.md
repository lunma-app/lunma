## 1. OPML utilities

- [x] 1.1 `shared/opml.ts`: implement `parseOpml(xml: string): { name: string; feedUrl: string }[]` using `saxes` — recurse into all `<outline>` depths; collect entries with `type="rss"` and a non-empty `xmlUrl`; `name` = `text ?? title ?? xmlUrl`; catch `saxes` errors and return whatever was collected before the error.
- [x] 1.2 `shared/opml.ts`: implement `buildOpml(folders: SmartFolderNode[]): string` — filter to `source === 'rss'`; emit OPML 1.0 XML with `<?xml?>` declaration, `<opml version="1.0">`, `<head><title>Lunma feed subscriptions</title></head>`, and one `<outline type="rss" text={name} xmlUrl={baseUrl} htmlUrl={baseUrl}/>` per node. `htmlUrl` = `baseUrl` (design D6 — `CONNECTORS` is in `background/` and cannot be imported from `shared/`).
- [x] 1.3 `shared/opml.test.ts`: cover `parseOpml` (flat OPML, nested/categorised OPML flattened, outlines without `xmlUrl` skipped, name fallback chain, malformed XML doesn't throw, no RSS outlines → `[]`) and `buildOpml` (single feed, non-RSS nodes excluded, `htmlUrl` equals `baseUrl`).

## 2. Bus command and handler

- [x] 2.1 `shared/bus.ts`: add `importOpml` to the `SidebarCommand` union and `COMMAND_SCHEMAS` with schema `{ spaceId: z.string(), feeds: z.array(z.object({ name: z.string(), feedUrl: z.string() })) }`; add to `EventPolicy` (ack-required, like `createSmartFolder`).
- [x] 2.2 `background/handlers/smart-folders.ts`: add `importOpml` handler — iterate `feeds`, apply the `createSmartFolder` logic per entry (mint UUID, `normalizeBaseUrl`, `addSmartFolder`, `markDirty`, `syncSmartFoldersAlarm`, immediate first-fetch side-effect); catch per-entry validation errors, increment `skipped`; return `{ imported, skipped }` as the ack payload.
- [x] 2.3 Update the coordinator's handler map registration to include `importOpml`; add a coordinator/bus test covering: all-valid batch creates N folders, an invalid `feedUrl` increments `skipped`, unknown `spaceId` throws, empty `feeds` is a no-op.

## 3. Options-page UI

- [x] 3.1 `options/FeedSubscriptions.svelte`: implement the "Feed subscriptions" `Surface variant="glass"` card following the `BackupRestore.svelte` pattern — Instrument Serif `h2`, `.description`, `.actions` row. Import flow: primary `Button` → hidden `<input type="file" accept=".opml,.xml">` → inside `onFileChange`, read `AppState` from `chrome.storage.local` (D8 — lazy, at file-select time) to populate the Space picker, then call `parseOpml` on the file text → empty result shows error alert ("No RSS feeds found in this file") → non-empty shows confirm step. Confirm step: feed count text, `Select` of Space names (from the freshly-read `state.pinnedTree` Space nodes, default first), Cancel ghost `Button`, Import primary `Button`. Confirming dispatches `importOpml`; success shows `Toast` (`"N feeds imported"`); error shows error alert.
- [x] 3.2 Export flow in `FeedSubscriptions.svelte`: read `AppState` from `chrome.storage.local` once at component mount to determine button visibility and populate `rssNodes`; conditionally render "Export as OPML" ghost `Button` only when `rssNodes.length > 0`. Clicking calls `buildOpml(rssNodes)` (the mount-time snapshot is sufficient — export is a point-in-time snapshot, not a live view), generates a `lunma-feeds-{date}.opml` download (Blob + object URL + `a.click()`), shows `Toast` ("Feeds exported").
- [x] 3.3 Mount `FeedSubscriptions` in `options/Options.svelte` — add a "Feed subscriptions" section in the Options layout, after "Backup & restore" (both are data-management gestures; group them).
- [x] 3.4 `options/FeedSubscriptions.test.ts`: cover import happy path (file → confirm step shows count + Space picker → dispatch → toast), import error (no feeds), export button absent when no RSS folders, export button present when RSS folders exist, export triggers download.

## 4. Docs (lockstep)

- [x] 4.1 `docs/04-capabilities.md`: add the new `opml-import-export` capability entry; update #12 smart-folders to note the `importOpml` bus command.

## 5. Quality gates

- [x] 5.1 `pnpm --filter @lunma/extension verify` green (tsc, biome incl. layer DAG, svelte-check, lint:styles, vitest).
- [x] 5.2 `pnpm verify` green at the workspace root; `pnpm test:e2e` smoke unaffected.
- [ ] 5.3 Manual smoke: open Options → Feed subscriptions; import a real OPML file (e.g. a Feedly export), confirm the folders appear in the target Space with the correct names and feed URLs; verify a bad OPML file shows the error message; verify the Export button appears after import and produces a valid OPML file.

### Deviation (agreed during smoke test)
`parseOpml` now pre-processes bare `&` not part of a valid XML entity reference by replacing with `&amp;` before parsing. The spec said "catch saxes errors and return whatever was collected" — but a bare `&` in `<head>` throws before any outlines are processed, returning `[]` and showing a misleading "No RSS feeds found" error. Lenient pre-processing is the standard approach used by all major feed readers.
