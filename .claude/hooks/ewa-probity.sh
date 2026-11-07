#!/bin/bash
# Claude Code PreToolUse hook (installed by /ewa:quality-gates).
# Runs Probity from the project's node_modules, or the globally installed binary.
# Never uses npx, which would contact the configured npm registry on every call.
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
for bin in node_modules/.bin/probity */node_modules/.bin/probity; do
  if [ -x "$bin" ]; then exec "$bin" --agent claude-code; fi
done
if command -v probity >/dev/null 2>&1; then exec probity --agent claude-code; fi
echo "ewa: Probity is not installed (neither in node_modules nor globally), so the TDD guard is skipped." >&2
exit 0
