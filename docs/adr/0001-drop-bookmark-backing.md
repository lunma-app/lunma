# 0005 — Drop the Chrome-bookmark backing; Lunma owns its state (local-first)

- **Status:** Accepted
- **Date:** 2026-05-29
- **Implementing change:** `lunma-owned-store` (Phase 2, see [docs/05-roadmap.md](../05-roadmap.md))

## Context

Until now Lunma's Spaces and saved tabs (pinned tabs + favicon row) were
**backed by the Chrome bookmark tree**: a Space *was* a bookmark folder
under `Lunma/`, a saved tab *was* a Chrome bookmark, and a binding/drift
layer (`originalURL`/`currentURL`, `bookmarkBindings`, restart recovery)
mapped saved tabs to live Chrome tabs. Two boot-time bootstraps
(`bookmark-bootstrap`, `pinned-bookmarks-bootstrap`) and a sync-discovery
path (auto-adopt new folders under `Lunma/`) kept Lunma state in step with
the bookmark tree.

The one real benefit of that backing was **free cross-device sync** — the
bookmark tree is synced by Chrome. It also carried a structural cost: a
Chrome bookmark stores its title on the bookmark *node*, not in Lunma
state, so the sidebar could not render a saved tab's title without an
extra lookup. The next sidebar slices (`sidebar-pinned-tabs` first) need
stored titles, explicit ordering, and Lunma-owned Space identity.

## Decision

**Lunma owns its own state. Spaces and saved tabs are plain records in
`chrome.storage.local`; the Chrome bookmark tree backs neither.** (D1)

- A **Space** is a Lunma record `{ id, name, color, icon }` keyed by a
  `crypto.randomUUID()` id; its order is its position in `state.spaces[]`
  (no `bookmarkFolderId`, no `order` field). (D9, D11)
- A **saved tab** is a `SavedTab` record
  `{ id, spaceId, title, originalURL, currentURL }` held in a flat map
  `state.savedTabs`, with a per-Space ordering array `state.pinnedBySpace`
  and a separate session-ephemeral binding map `state.tabBindings`. (D3, D4)
- **Favicons derive at render** from the Chrome `_favicon` endpoint; no
  favicon is stored on the record. This adds the `favicon` manifest
  permission and removes the now-unused `bookmarks` permission. (D5, D10)
- The binding/drift model, restart-recovery-by-URL, temp tabs, and
  soft-delete are **kept** (reworked off folders onto Lunma records). The
  bookmark bootstraps, sync-discovery, folder adoption, and the
  self-tag/self-folder echo-suppression registries are **deleted**.

### Local-first; cross-device sync deferred, not precluded (D2)

v1 stores state only in `chrome.storage.local` (already the persist
target). Re-introducing cross-device sync later can take any of three
paths **without redoing this work**:

1. **Chunked `chrome.storage.sync`** — shard the record map under the
   per-item size cap.
2. **An external backend** — sync the same records over the network.
3. **Optional one-way bookmark mirroring** — for users who want it, mirror
   saved tabs back into Chrome bookmarks (the reverse of the old backing).

"Local-first" is therefore a known, reversible posture, not an accident.

### Migration is a V2 → V3 clean reset (D6)

`v2Tov3` is a pure, synchronous migration that drops the bookmark-coupled
fields and sets `spaces: []` / `trash: {}` / `savedTabs: {}` /
`tabBindings: {}` / `pinnedBySpace: {}`. It does **not** mint a Space
(a migration must not call `crypto.randomUUID`/`Date.now`); the SW boot's
`ensureAtLeastOneSpace` seeds one Default Space `{ name: 'Default',
color: 'gray', icon: 'star' }` with a real uuid immediately after
`loadState` (skipped only when the boot read outcome is `unavailable` —
a transient `chrome.storage.local.get` failure that must not fabricate a
Default over real, unread on-disk data; see `04-capabilities.md`).
Pre-release, this reset loses no shipped data. Orphan
`Lunma/` bookmark folders are left untouched in Chrome (harmless; manually
removable; re-ingestible by the Phase 6 Arcify import, which owns the
bookmark→Lunma read path).

## Consequences

- **Cross-device sync is silently lost for v1.** Not a regression of a
  shipped promise (v1 had not shipped); the three re-introduction paths
  above keep the door open.
- **The capability `lunma-bookmark-bindings` keeps a bookmark-flavoured
  name** while describing a bookmark-free `SavedTab` model (modified in
  place to avoid a tombstone spec). A future cosmetic rename could realign
  it.
- Affected docs updated in the same change: `docs/03-architecture.md`
  (AppState shape, boot sequence), `docs/04-capabilities.md` (Spaces,
  saved tabs, binding, removed sync-discovery), `docs/06-migration.md`
  (V2→V3 reset; Arcify import reframed as bookmark→Lunma ingestion).

What this ADR forecloses: treating the Chrome bookmark tree as the source
of truth for Spaces or saved tabs; reintroducing folder adoption or
sync-discovery; storing a favicon on the record.
