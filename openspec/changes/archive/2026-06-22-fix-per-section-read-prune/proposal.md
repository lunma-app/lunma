## Why

In a feed folder built from an OPML import (one folder, many `rss` sections),
items the user has read silently come back as unread. Each section fetches
independently, and every section's successful fetch currently prunes the
**whole folder's** read-state against only **that section's** items — so the
moment any other section refreshes, the read ids it doesn't recognise (every
read id belonging to a different section) are dropped. The user value is direct:
read marks stop vanishing — once you've read a feed item it stays read, no
matter which section refreshes next.

This is a regression introduced by `multi-filter-smart-connectors` (525044e):
before multi-section folders existed, a folder had exactly one section, so
"the whole folder's read ids" and "this section's read ids" were the same set
and the folder-wide prune was correct.

## What Changes

- `pruneSmartReadState` becomes **section-scoped**: it is told which resolved
  section just fetched and only ever drops read ids that belong to that section
  (ids whose namespaced key carries that section's prefix). Read ids for every
  other section are left untouched — each section prunes its own ids on its own
  fetch.
- The `smartFolders.result` handler passes the section key it already has to
  the prune call.
- No behaviour change for single-section folders (the section's ids ARE the
  folder's ids), so no regression for queue/single-feed folders.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `storage-and-migrations`: the "Smart-folder read-state is persisted and
  pruned" requirement is reworded from a folder-wide prune ("pruned to the
  fetched window") to a **per-resolved-section** prune ("each section's fetch
  prunes only that section's read ids against that section's fetched window").

## Impact

- `apps/extension/src/shared/store.svelte.ts` — `pruneSmartReadState` gains a
  `sectionKey: string` parameter; prune logic filters by section prefix.
- `apps/extension/src/background/handlers/smart-folders.ts` (`smartFolders.result`
  handler, ~line 429) — passes `sk` to the prune call.
- `apps/extension/src/shared/store.smart-folders.test.ts` — existing
  `pruneSmartReadState` tests (~lines 249, 261) adopt the new signature; a new
  test asserts a section-B fetch does NOT wipe section-A read ids.
- Docs: no `docs/` file documents this internal pruning detail, so none change.
  The `storage-and-migrations` spec is updated (see Modified Capabilities).
- No new public types, files, surfaces, or `src/ui` primitives; no dependency
  changes.
