## Why

A smart folder's sections are auto-labelled `host` (rss) or `host · filter`
(queue) with no way to give a source a friendly name. With several feeds (an
OPML import) the sidebar shows a wall of bare hostnames; the user can't call one
"Tech news" or "Work GitLab". User value: name a source and that name labels its
section(s) in the sidebar and the editor.

## What Changes

- `SmartSourceConfig` gains an **optional `name`**. When set, it labels the
  source's section(s): the section header shows `name` (rss) or `name · filter`
  (queue) instead of the host; when unset, the host label is unchanged.
- The editor's source card gains an optional **Name** field (placeholder = the
  host), and the card's header identity shows the name when set.
- **Schema bump v9 → v10** with an additive (identity) migration — `name` is a
  new optional field, so existing v9 nodes load unchanged.
- The `createSmartFolder` / `updateSmartFolder` bus command source schema gains
  the optional `name`, carried through the handlers into the persisted node.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `smart-folders`: a source MAY carry an optional `name` that labels its
  resolved section(s) (header + editor), overriding the host label; the editor
  exposes a per-source Name field.
- `storage-and-migrations`: `CURRENT_SCHEMA_VERSION` becomes `10`; the
  `SmartSourceConfig` schema gains optional `name`; an additive v10 migration is
  appended (existing v9 state is structurally unchanged).

## Impact

- `apps/extension/src/shared/types.ts` — `SmartSourceConfig.name?: string`;
  `ResolvedSourceConfig.name?` so the resolved section carries it.
- `apps/extension/src/shared/schemas.ts` — `SmartSourceConfigSchema` gains
  `name: z.string().optional()`; `CURRENT_SCHEMA_VERSION = 10`; `AppStateV10Schema`.
- `apps/extension/src/shared/migrations.ts` — append `{ toVersion: 10 }` (identity).
- `apps/extension/src/shared/bus.ts` — command `SmartSourceConfigSchema` gains
  optional `name`.
- `apps/extension/src/sidebar/SmartFolderEditor.svelte` — per-card Name field;
  header identity prefers `name`; `confirm` carries `name` (trimmed, omitted when
  empty).
- `apps/extension/src/sidebar/SmartFolder.svelte` — the `sections` derivation
  carries `name` into each `ResolvedSourceConfig`.
- `apps/extension/src/sidebar/SmartSectionHeader.svelte` — label uses
  `name ?? host`.
- No new `ui/` primitives.
