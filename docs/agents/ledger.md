# Bug ledger

One row per bug, added when it is found.

| Date | What happened | Found by | Where it should have been caught | Fix and follow-up |
|---|---|---|---|---|
| 2026-11-07 | Lint command in AGENTS.md (`npm --prefix frontend exec -- tsc --noEmit`) ran tsc in the repository root without a tsconfig and always failed; the commit gate would have blocked every commit | person: manual check before the first commit | init-project: run each confirmed command once before writing AGENTS.md | fixed: `-p frontend` added |
| 2026-11-07 | Probity PreToolUse hook (`npx --no-install @nizos/probity`) ignored the global install and queried the unreachable machine-wide npm registry, so the TDD guard would fail on every write without checking anything | person: manual verification after /ewa:quality-gates | quality-gates verification step (ran, but was blocked); plugin tests only covered a local devDependency | plugin fix: hook calls a wrapper that uses the local or global probity binary |

"Where it should have been caught" names the earliest check that could have found it: a unit test, a review, a linter, a hook, CI, or a person.
