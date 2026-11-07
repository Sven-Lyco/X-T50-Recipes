---
id: cov-1
title: Enforce the current frontend coverage threshold
type: chore
status: todo
bounded_context: none
depends_on: []
blocks: []
decisions: []
branch: chore/cov-1-enforce-frontend-coverage
---

## Why

`CLAUDE.md` claims an 80 % coverage threshold is enforced for the frontend, but `vite.config.ts` has none and `npm test` does not measure coverage (current line coverage 63.9 %). The backend JaCoCo threshold (80 % lines) is only enforced by `./gradlew check`, but CI runs `./gradlew test`. A threshold that is not enforced lets coverage drop unnoticed.

## What

Make `npm --prefix frontend test` measure coverage and fail below 63 % lines. Correct the coverage section of `CLAUDE.md` so it states goal and enforced value separately. Let CI run `./gradlew check` for the backend so the JaCoCo threshold applies there too. Raising the frontend threshold towards 80 % is later work, not part of this task.

## Acceptance criteria

Confirmed by the owner (2026-11-07; extended the same day to branches, functions and the backend):

1. `npm --prefix frontend test` measures coverage and fails when frontend coverage drops below **lines 63 %, branches 60 %, functions 56 %** (today 63.93 / 60.15 / 56.53 %). Because `scripts/check.sh`, the commit gate and CI all run `npm test`, they fail too. The JUnit output `frontend/test-results/junit.xml` stays where CI reads it.
2. `./gradlew check` fails when backend coverage drops below **lines 80 %, branches 63 %, methods 80 %** (JaCoCo counters LINE, BRANCH, METHOD; today locally 85.33 / 63.62 / 84.04 %).
3. CI runs `./gradlew check` instead of `./gradlew test` for the backend, so the JaCoCo thresholds also apply in CI.
4. The coverage section of `CLAUDE.md` says exactly this (wording approved by the owner):

   ```
   Ziel: ≥ 80 % Coverage auf beiden Seiten (Zeilen, Zweige, Funktionen/Methoden).
   - Backend: erzwungen über `./gradlew check` (JaCoCo in build.gradle), lokal und in CI: Zeilen 80 %, Zweige 63 %, Methoden 80 %.
   - Frontend: erzwungen mit `npm test` (thresholds in vite.config.ts): Zeilen 63 %, Zweige 60 %, Funktionen 56 %.
   Schwellen unter 80 % werden in eigenen Tasks angehoben, nie gesenkt.
   ```

Rule for the thresholds (owner): if today's value is at or above the goal of 80 %, the threshold is 80 %; otherwise it is today's value rounded down, so coverage cannot drop.

## Notes

Files to read first (state on main, 2026-11-07):

- `frontend/vite.config.ts` – `test.coverage` already has provider `v8`, reporters and include/exclude lists, but no `thresholds`. Add `thresholds: { lines: 63 }`. Coverage only runs when enabled, so also enable it for the normal run (`coverage.enabled: true`, or `--coverage` in the script).
- `frontend/package.json` – `"test": "vitest run --reporter=verbose --reporter=junit --outputFile.junit=test-results/junit.xml"`; `@vitest/coverage-v8` is already a dev dependency.
- `scripts/check.sh` – already calls `npm --prefix frontend test`; no change expected.
- `.github/workflows/ci.yml` – job `test-backend` runs `./gradlew test` (line 25); the frontend job runs `npm test`. The test-reporter step reads `build/test-results/test/*.xml`, which `check` still produces.
- `CLAUDE.md` – section "Testing-Strategie / Coverage" (goal ≥ 80 % on both sides, frontend "nicht erzwungen"). It is a rule file: per `AGENTS.md` "Changing these rules", propose the exact wording and wait for approval; the owner confirmed the content (criterion 2), not the final wording.
- No bounded-context glossary applies (technical chore).

Suggested test-first approach (chore: confirm the existing tests pass before and after):

- Before: `npm --prefix frontend test` expected to pass (exit 0). After the change expected to pass with coverage ≈ 63.9 %.
- Proof that the gate works: temporarily set the threshold to e.g. 99 %, expect exit code ≠ 0 with a "coverage threshold" error, then set it back to 63.

Owner decisions (2026-11-07), replacing the open questions of the creating session:

1. Enforce lines, branches and functions (backend: methods), not only lines. Values as in the acceptance criteria.
2. Keep the tight margin (63 vs 63.93 %); raise thresholds in later tasks.
3. `RecipeRepositoryTest` already runs in CI with `./gradlew test` (the `CI` variable in `build.gradle`), so switching to `check` only adds the JaCoCo verification. Check the first CI run of the pull request.
4. Verify after the change that `frontend/test-results/junit.xml` is still written.
