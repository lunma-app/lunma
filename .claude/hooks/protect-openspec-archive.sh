#!/usr/bin/env bash
# PreToolUse(Edit|Write) guard: keep archived OpenSpec changes immutable.
# Archiving CREATES new files under openspec/changes/archive/<date>-<name>/, so
# we allow Writes to *new* paths there but block any Edit, or any Write that
# would overwrite an existing archived file. Reads the hook JSON from stdin.
set -euo pipefail

input="$(cat)"
tool="$(printf '%s' "$input" | jq -r '.tool_name // empty')"
path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"

case "$path" in
  *openspec/changes/archive/*) ;;
  *) exit 0 ;;
esac

if [ "$tool" = "Edit" ]; then
  echo "Archived OpenSpec changes are immutable (openspec/changes/archive/**). Propose a new change instead." >&2
  exit 2
fi

if [ "$tool" = "Write" ] && [ -e "$path" ]; then
  echo "Refusing to overwrite an existing archived file: $path (archived changes are immutable)." >&2
  exit 2
fi

exit 0
