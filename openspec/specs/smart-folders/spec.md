# smart-folders Specification

## Purpose

Live forge work items inside the pinned section. A smart folder is a third
`PinNode` kind persisting configuration only (`source` — GitLab, GitHub, or
Jira — instance `baseUrl`, a canned `query`, `refreshMinutes`, `name`/`icon`);
its displayed children are ephemeral connector results held in the broadcast-only
`smartFolders` slice, never persisted. An alarms-driven background engine polls
on a per-folder cadence (plus sidebar-open and post-boot refresh kicks),
dispatching fetches through per-source connector modules behind the
`SourceConnector` contract — GitLab merge requests over the v4 REST API
(per-host PAT, else the browser's session cookies), GitHub pull requests over
the search API (token-only), Jira issues over the GA JQL search API
(session-riding) — resolving failures calmly (`signed-out` /
`error` runtime states, never a red error card). Result rows are link-shaped —
favicon, title, at most one status dot — and activate via the existing
`openUrl` command. Folders are created and edited from the pinned-header menu
with a source picker; per-host tokens are managed in the options Connectors
section.
## Requirements
### Requirement: smart-folders capability is retired — all requirements moved to lenses

The `smart-folders` capability SHALL be considered retired as of the `establish-lens-model` change. All requirements MUST be referenced from the `lenses` capability instead; the `smart-folders` capability exists only as a tombstone.

#### Scenario: Retirement tombstone

Given the `establish-lens-model` change has been archived,
When any code or document references the `smart-folders` capability,
Then it SHALL reference the `lenses` capability instead.

