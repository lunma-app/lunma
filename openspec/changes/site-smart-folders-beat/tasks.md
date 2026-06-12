## 1. The SmartFolderMock visual

- [x] 1.1 Create `apps/site/src/lib/mocks/SmartFolderMock.svelte` — decorative (`aria-hidden`), composing the established mock/token vocabulary: a header (a git/folder glyph + folder name + a quiet `--text-dim` count badge) over 3 GitLab MR rows (source icon + title).
- [x] 1.2 Add the one-per-row status dot as feature-local, token-referencing CSS (the `drift-dot` precedent): row 1 `--success`, row 2 `--info` (a running pipeline — static, no animation), row 3 `--warning`. Exactly one dot per row, never more.
- [x] 1.3 Confirm no animation is introduced (reduced-motion contract intact) and the mock reads correctly inside `Chapter`'s glass panel.

## 2. The sixth feature beat

- [x] 2.1 Import `SmartFolderMock` in `apps/site/src/lib/Chapters.svelte` and add a sixth `<Chapter index={6} kicker="Smart folders" title="Pin a live queue, not just a page." layout="right" color="pink">` after the Pinned tabs beat.
- [x] 2.2 Add the body copy snippet (the final, voice-passed text from `design.md`) and the `SmartFolderMock` visual snippet.
- [x] 2.3 Re-read the copy against the `lunma-voice` checklist (British spelling, no em-dash splice, no tricolon, no banned filler) and against the accuracy guard (GitLab named only; no other connector named; "more connectors are on the way" is name-free/date-free; self-hosted + local stated).

## 3. Spec, gates, verification

- [x] 3.1 Confirm the rendered beat satisfies every scenario in `specs/marketing-site/spec.md` (live-queue framing + GitLab example; only-GitLab-named; self-hostable + local; one status mark per row).
- [x] 3.2 `pnpm --filter @lunma/site verify` is green: biome, svelte-check, the WCAG-AA contrast vitest, and the static prerender build.
- [x] 3.3 Render the `#features` band (full colour journey including the new pink beat) and the beat in isolation to confirm the colour journey reads, the halo/numeral/kicker tint correctly, and the status dots are legible.
- [x] 3.4 `openspec validate site-smart-folders-beat --strict` passes.
