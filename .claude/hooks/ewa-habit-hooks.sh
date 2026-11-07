#!/bin/bash
# Claude Code Stop hook (installed by /ewa:quality-gates).
# Runs Habit Hooks over all changes on this branch compared with main.
# Findings go to Claude as the reason to keep working, at most once per reply,
# so the hook can never loop. If the tool itself fails, nothing is blocked.
input=$(cat)
case "$input" in *'"stop_hook_active": true'*|*'"stop_hook_active":true'*) active=1 ;; *) active=0 ;; esac
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
command -v uvx >/dev/null 2>&1 || { echo "ewa: uvx not found, Habit Hooks skipped." >&2; exit 0; }
out=$(uvx --from 'habit-hooks[java]' habit-hooks --branch main 2>&1)
code=$?
case $code in
  0) exit 0 ;;
  1)
    if [ "$active" = 1 ]; then
      echo "ewa: Habit Hooks still reports code smells. Tell the user which ones remain and why." >&2
      exit 0
    fi
    printf 'Habit Hooks found code smells in your changes. Fix their cause before you finish:\n\n%s\n' "$out" >&2
    exit 2 ;;
  *)
    printf 'ewa: Habit Hooks could not run (exit %s):\n%s\n' "$code" "$(printf '%s' "$out" | tail -5)" >&2
    exit 0 ;;
esac
