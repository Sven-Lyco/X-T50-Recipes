#!/usr/bin/env bash
# Runs all tests and the linter. Exits non-zero if any of them fails.
# One command with one exit code, so no shell exit-code tricks are needed.
cd "$(dirname "$0")/.." || exit 1
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$HOME/.gradle-private}"

failed=()
./gradlew check || failed+=("backend: ./gradlew check")
npm --prefix frontend test || failed+=("frontend: npm test")
npm --prefix frontend exec -- tsc --noEmit -p frontend || failed+=("lint: tsc")

if [ ${#failed[@]} -eq 0 ]; then
  echo "check.sh: all checks passed"
  exit 0
fi
printf 'check.sh: FAILED: %s\n' "${failed[@]}"
exit 1
