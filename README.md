# Lunma

A Chrome extension for vertical tab spaces. Spec-driven, TypeScript-strict, Svelte 5.

- **Author:** The Lunma Authors
- **Status:** Planning (pre-implementation)
- **Inspired by:** Arcify v4 by Nisarg Kolhe — Lunma is a clean-room reimplementation that builds on Arcify's ideas with its own architecture and codebase. See `docs/01-vision.md` for the full picture.

## What Lunma delivers

A Chrome Manifest V3 extension with an Arc-style vertical workspace for tabs:

- **Spaces** — Chrome tab groups augmented with metadata; one active Space per window
- **Pinned tabs** — durable, bookmark-backed, sync across devices
- **Temporary tabs** — ephemeral; archived automatically when idle
- **Favicon row** — compact bar of bookmark-backed shortcuts with live-tab binding
- **Spotlight** — keyboard search across tabs, bookmarks, history (overlay + new-tab page)
- **Options** — schema-driven settings UI
- **Onboarding** — install + update flows from a single source of content

## What Lunma emphasizes

- **TypeScript strict** end to end — types are part of the design, not an afterthought.
- **A single, serialized store.** Reducer pattern with a dispatch pipeline that drains all Chrome events and user actions in order. No interleaved mutations.
- **Versioned storage.** Every persisted read flows through a Zod schema with an append-only migrations table.
- **Honest layer boundaries.** Chrome APIs, business logic, persistence, and DOM each live in their own modules with one-way dependencies.
- **Svelte 5 + scoped styles.** Tiny runtime, CSS isolated per component, byte budget honored for the `<all_urls>` overlay.
- **Tests carry weight.** Vitest for reducers, migrations, and search; Playwright for sidebar smoke.
- **Spec-driven development.** Each capability has an OpenSpec spec authored before code.
- **MV3-native build.** `@crxjs/vite-plugin` does the heavy lifting; no custom build glue.

## Reading order

1. `docs/01-vision.md` — what Lunma is, the user experience, the principles
2. `docs/02-tech-stack.md` — chosen stack with rationale
3. `docs/03-architecture.md` — project layout, store pattern, event coordinator
4. `docs/04-capabilities.md` — capability specs to flesh out (becomes `openspec/specs/`)
5. `docs/05-roadmap.md` — 8-week implementation plan
6. `docs/06-migration.md` — Arcify v4 user-data import path
7. `the distribution notes` — distribution notes (non-normative)
8. `docs/08-brand-identity.md` — Lunma brand & visual identity brief (non-normative)

## How to pick this up

1. `mkdir lunma && cd lunma && git init`
2. Scaffold with Vite + `@crxjs/vite-plugin` + Svelte 5 + TypeScript strict (see `docs/02-tech-stack.md` for versions)
3. Initialize OpenSpec: `mkdir -p openspec/{specs,changes}` and copy each section in `docs/04-capabilities.md` into `openspec/specs/<capability-name>/spec.md`
4. Author the first change at `openspec/changes/v1-bootstrap/` with `proposal.md`, `design.md`, `tasks.md`
5. Implement Phase 0 + Phase 1 from `docs/05-roadmap.md`

## License (TBD)

Arcify v4 is GPL-3.0 (author: Nisarg Kolhe). Lunma is an independent, clean-room reimplementation by a different author with no shared code, so the license choice is open — MIT for permissive, AGPL-3.0 for copyleft on a browser tool.
