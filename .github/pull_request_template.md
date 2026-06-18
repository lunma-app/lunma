## Summary

<!-- What does this change do, and why? One or two sentences. -->

## Linked OpenSpec change

<!-- The openspec/changes/<name> this implements, or "n/a — trivial". -->

`openspec/changes/`

## Checks

- [ ] `pnpm -r verify` passes locally
- [ ] `pnpm test:e2e` passes locally (or n/a — nothing the MV3 smoke covers changed)
- [ ] Docs are in lockstep — the affected `docs/`, this change's OpenSpec
      artifacts, and any matching `openspec/specs/` capability spec agree with
      the code (per CLAUDE.md)
- [ ] Every commit is signed off under the [DCO](../DCO) (`git commit -s`) — the
      `Signed-off-by` trailer matches the author; the `dco` check enforces this
