## ADDED Requirements

### Requirement: importOpml command is a valid bus command
The `importOpml` `SidebarCommand` SHALL be registered in `bus.ts`
(`COMMAND_SCHEMAS`, `EventPolicy`) and handled by the background coordinator's
smart-folder handler map. Its schema SHALL enforce:
- `spaceId: string` (non-empty)
- `feeds: Array<{ name: string; feedUrl: string }>` (zero or more entries)

The command SHALL be subject to the same single-writer drain guarantees as
`createSmartFolder` — each per-feed folder creation marks dirty and triggers
persist+broadcast via the existing drain.

#### Scenario: importOpml is accepted by the bus
- **WHEN** the sidebar dispatches `{ kind: 'importOpml', payload: { spaceId: 's1', feeds: [{ name: 'HN', feedUrl: 'https://hn.rss' }] } }`
- **THEN** the coordinator handles it without an unknown-command error

#### Scenario: importOpml with malformed payload is rejected at the bus boundary
- **WHEN** a message with `kind: 'importOpml'` arrives with a missing `spaceId`
- **THEN** the bus rejects it with a schema validation error before reaching the handler
