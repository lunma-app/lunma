## 1. Copy

- [x] 1.1 Rewrite the chapter-6 smart-folders copy in `apps/site/src/lib/Chapters.svelte`: lead with the idea of a smart folder (fills itself from a service you keep checking, stays current on its own), name the shipped connectors by category + example (code host — GitLab/GitHub; issue tracker — Jira; feed — RSS), keep the self-hosted + on-device claims, end with a name-free/date-free "more on the way". Remove the merge-vs-pull-request and pipeline-status prose.
- [x] 1.2 Revise the chapter `title`/`kicker` so it fits the broadened framing and drops the "not just X" tell ("Pin a live queue, not just a page." → "A folder that fills itself."). Kept the `kicker="Smart folders"`.
- [x] 1.3 Confirmed the staged visual is unchanged (`SmartFolderMock.svelte` stays the GitLab review-queue example) and the chapter still composes the shared `Chapter` form — no new components or primitives. (Refreshed only the in-chapter `:155` comment so it frames GitLab as one demonstrated example, not the sole connector.)

## 2. Voice gate (tell-hunter pass)

- [x] 2.1 Ran the `lunma-voice` tell-hunter pass on the new copy via the `smart-folder-beat-copy` workflow: three drafts, fresh tell-hunter + accuracy critics per draft, synthesised winner, then a SECOND fresh tell-hunter on the final — returned `clean: true`, zero tells.
- [x] 2.2 Verified factual accuracy: the named connector set (GitLab, GitHub, Jira, RSS) matches the shipped `SmartSource` (`gitlab | github | jira | rss`); the self-hosted and on-device claims are true; no unshipped connector is named or implied; the fresh accuracy critic returned `compliant: true`.

## 3. Verify

- [x] 3.1 Ran `pnpm --filter @lunma/site verify` — Biome (36 files clean), svelte-check, vitest 22/22 (incl. the WCAG-AA contrast test), and the static prerender build all pass.
- [x] 3.2 Re-read the rendered beat against the MODIFIED `marketing-site` spec scenarios (live-queue framing, names the four shipped connectors, excludes unshipped, self-hostable + on-device, one-status-mark visual) — each holds.
- [x] 3.3 Confirmed the broadened beat stays consistent with the other site surfaces: `/privacy`'s generic connector description ("a code host, an issue tracker, or a feed") matches the named set; `TrustBand` names no connectors; the "more on the way" line is name-free and date-free.
