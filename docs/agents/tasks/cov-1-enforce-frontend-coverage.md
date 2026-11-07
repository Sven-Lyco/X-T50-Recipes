---
id: cov-1
title: Enforce the current frontend coverage threshold
type: chore
status: backlog
bounded_context: none (technical)
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

Confirmed by the owner (session input, 2026-11-07):

1. `npm --prefix frontend test` measures coverage and fails when frontend line coverage drops below 63 %. Because `scripts/check.sh`, the commit gate and CI all run `npm test`, they fail too.
2. `CLAUDE.md` states it honestly: goal 80 %; enforced in the frontend at 63 %, in the backend at 80 %.
3. CI runs `./gradlew check` instead of `./gradlew test` for the backend, so the JaCoCo threshold also applies in CI.

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

Open questions (nobody could answer in the creating session; recommendation given):

1. **Which metric?** Recommendation: only `lines` at 63, as stated in the criteria; no statements/branches/functions thresholds.
2. **Margin.** 63.9 % vs. 63 % leaves 0.9 points; a small change in untested code may trip the gate. Recommendation: keep 63 as agreed; raise it step by step in later tasks.
3. **`RecipeRepositoryTest` in CI.** `./gradlew check` runs the Testcontainers test in CI (`CI` env var set). `ubuntu-latest` has Docker, so it should work, but this has not been verified. Recommendation: check the first CI run on the pull request; if it fails for Docker reasons, report it instead of skipping the test silently.
4. **JUnit output path.** Coverage mode must not change `frontend/test-results/junit.xml`, which the CI reporter reads. Verify after the change.
5. **63.9 % is the owner's figure** (`CLAUDE.md`, 2026-11-07). Measure it once with `npm --prefix frontend test -- --coverage` before setting the threshold; if it is below 63, report it and stop.
