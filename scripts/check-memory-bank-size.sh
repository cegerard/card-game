#!/usr/bin/env bash
# Claude Code warns when the instruction files it loads exceed 150k chars.
# CLAUDE.md imports the memory bank with @path, so sum those files and fail early.
set -euo pipefail

LIMIT=${MEMORY_BANK_LIMIT:-100000}

files=(CLAUDE.md $(grep -oE '@docs/[A-Za-z0-9_./-]+\.md' CLAUDE.md | sed 's/^@//' | sort -u))
total=$(cat "${files[@]}" | wc -m)

echo "Instruction files: ${#files[@]}, ${total} chars (limit ${LIMIT})"
if [ "$total" -gt "$LIMIT" ]; then
  echo "Memory bank too large: condense the biggest files (see ARCHITECTURE.md, API_DOCS.md)" >&2
  exit 1
fi
