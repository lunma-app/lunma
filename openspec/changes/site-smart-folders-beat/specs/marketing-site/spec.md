## ADDED Requirements

### Requirement: Smart folders are positioned as a live-queue platform and demonstrated

The features section SHALL include a beat that presents Lunma's **smart folders** as a
**live-queue capability** — a pinned folder whose contents are live items pulled from a
service the visitor keeps checking, refreshed on their own — framed as the general
capability with **GitLab merge requests** shown as the concrete example that ships. The
beat SHALL render in the shared editorial-chapter form (a numbered chapter with a kicker,
a display heading, copy, and a staged product visual) and compose the shared design
language (`@lunma/tokens` + the site's own mock components), not re-roll primitives.

The claim SHALL be **factual** and stated in the brand voice. The page SHALL name
**GitLab** specifically as the available connector and SHALL NOT name or imply that any
other connector (for example GitHub, Jira, Notion, or a calendar) is available — only the
GitLab connector ships. A calm, name-free and date-free indication that further connectors
are planned is permitted; naming an unshipped connector or promising a date is not. The
copy SHALL state that smart folders work with self-hosted GitLab and that data stays on the
visitor's device (no Lunma server), consistent with the shipped connector. The beat SHALL
hold WCAG-AA contrast and SHALL introduce no motion that violates the page's reduced-motion
contract.

The staged visual SHALL show the capability rather than only assert it: a smart-folder
header with an item count over GitLab merge-request rows, each row carrying exactly one
pipeline-status indicator (no more than one status mark per row), in keeping with the
product's one-glyph restraint.

#### Scenario: The features section presents smart folders as a live queue

- **WHEN** a visitor reaches the features section
- **THEN** a chapter SHALL present smart folders as a live queue pinned in the Space, with GitLab merge requests shown as the example
- **AND** the chapter SHALL render in the shared editorial-chapter form composing the shared design language

#### Scenario: The beat names only the connector that ships

- **WHEN** the smart-folders beat renders its copy
- **THEN** it SHALL name GitLab as the available connector
- **AND** it SHALL NOT name or imply any other connector (GitHub, Jira, Notion, calendar, etc.) is available
- **AND** any indication of future connectors SHALL be name-free and date-free

#### Scenario: The beat frames smart folders as local and self-hostable

- **WHEN** the smart-folders beat renders its copy
- **THEN** it SHALL state that smart folders work with self-hosted GitLab
- **AND** it SHALL state that the data stays on the visitor's device with no Lunma server

#### Scenario: The staged visual shows the queue with one status mark per row

- **WHEN** the smart-folders beat renders its visual
- **THEN** it SHALL show a smart-folder header with an item count over GitLab merge-request rows
- **AND** each row SHALL carry exactly one pipeline-status indicator, never more than one
- **AND** all text in the visual SHALL hold WCAG-AA contrast
