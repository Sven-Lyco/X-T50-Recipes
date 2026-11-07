#!/bin/bash
# Claude Code PreToolUse hook (retro 2026-11-07, action 1).
# On feature/, bugfix/ and hotfix/ branches, blocks writes to production code
# until at least one test file has changed on the branch.
# It checks that a test comes first, not that the test was red or how big a step is.
# If git or jq is unavailable, nothing is blocked.
input=$(cat)
command -v jq >/dev/null 2>&1 || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

branch=$(git branch --show-current 2>/dev/null) || exit 0
case "$branch" in feature/*|bugfix/*|hotfix/*) ;; *) exit 0 ;; esac

file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
[ -n "$file" ] || exit 0
file=${file#"$PWD/"}

is_test() {
  case "$1" in
    src/test/*) return 0 ;;
    frontend/src/*.test.ts|frontend/src/*.test.tsx) return 0 ;;
  esac
  return 1
}

case "$file" in
  src/main/*|frontend/src/*) ;;
  *) exit 0 ;;
esac
is_test "$file" && exit 0
case "$file" in frontend/src/setupTests.ts|frontend/src/test-utils.tsx) exit 0 ;; esac

changed=$( {
  git diff --name-only main...HEAD 2>/dev/null
  git diff --name-only HEAD 2>/dev/null
  git ls-files --others --exclude-standard 2>/dev/null
} | sort -u)

while IFS= read -r path; do
  is_test "$path" && exit 0
done <<< "$changed"

cat >&2 <<EOF
Test first: no test file has changed on $branch yet, so writing production code ($file) is blocked.
Write a failing test first (src/test/** or frontend/src/**/*.test.ts(x)), state the expected failure, run it, then change the production code.
EOF
exit 2
