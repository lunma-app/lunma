#!/usr/bin/env bash
# SessionStart(compact): re-inject the active OpenSpec change list after
# compaction. There is no `openspec` CLI in this repo, so read the dir directly.
set -euo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}"

dir="openspec/changes"
[ -d "$dir" ] || exit 0

active="$(find "$dir" -mindepth 1 -maxdepth 1 -type d ! -name archive -exec basename {} \; | sort)"
if [ -n "$active" ]; then
  printf 'Active OpenSpec changes (openspec/changes/):\n'
  printf '%s\n' "$active" | sed 's/^/  - /'
else
  printf 'No active OpenSpec changes.\n'
fi
