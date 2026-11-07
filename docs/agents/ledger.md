# Bug ledger

One row per bug, added when it is found.

| Date | What happened | Found by | Where it should have been caught | Fix and follow-up |
|---|---|---|---|---|
| 2026-11-07 | Lint command in AGENTS.md (`npm --prefix frontend exec -- tsc --noEmit`) ran tsc in the repository root without a tsconfig and always failed; the commit gate would have blocked every commit | person: manual check before the first commit | init-project: run each confirmed command once before writing AGENTS.md | fixed: `-p frontend` added |
| 2026-11-07 | Probity PreToolUse hook (`npx --no-install @nizos/probity`) ignored the global install and queried the unreachable machine-wide npm registry, so the TDD guard would fail on every write without checking anything | person: manual verification after /ewa:quality-gates | quality-gates verification step (ran, but was blocked); plugin tests only covered a local devDependency | plugin fix: hook calls a wrapper that uses the local or global probity binary |
| 2026-11-07 | `/ewa:task new` writes the task file on the current branch, which conflicts with the AGENTS.md branch rule when on main | agent while planning cat-1 | ewa task skill design | retro |
| 2026-11-07 | Library glossary says similarity ranges 0 to 1, the code returns 0 to 100 | agent while planning lib-1 | domain modeling (glossary written without checking the code) | correct glossary |
| 2026-11-07 | The test command in AGENTS.md starts with `GRADLE_USER_HOME=$HOME/.gradle-private`; Claude Code's permission rules did not match this env-prefixed command, so a non-interactive session could not run any tests | agent in cat-1 session 1 | init-project: check that confirmed commands are runnable under the agent's permission rules (the env var is already set via settings.local.json) | session restarted; follow-up: retro |
| 2026-11-07 | In a session started with /ewa:task start, the tdd skill was not loaded automatically (no test list, no predictions) | person: trace analysis after cat-1 session 1 | ewa evals: no case combines task start with implementation | follow-up: retro |
| 2026-11-07 | Probity treated its own blocked write (a first test) as written but never run, and then refused every further attempt, so the cat-1 session could not start | agent in cat-1 session 2 | Phase 4 tests of quality-gates only covered a Node project with a single blocked write | agent-setup/probity-instructions: enforceTdd instructions say blocked writes did not happen |
| 2026-11-07 | /ewa:task requires a bounded context from the context map, but technical chores have none | agent while planning chore-1 | ewa task skill design | retro |
| 2026-11-07 | Merging main into a task branch conflicted in ledger.md and assumptions.md, because both branches appended rows to the same table | person: merge of main into feature/cat-1 | ewa templates: append-only logs edited on parallel branches (e.g. one file per entry, or a union merge driver) | resolved by keeping both sides; follow-up: retro |
| 2026-11-07 | Probity blocked the first failing test of cat-1 in three sessions (Java/Spring), last because the test asserted behavior not implemented yet; no code could be written (about 0.90 USD over three sessions) | agent in cat-1 sessions 2 and 3 | ewa quality-gates: Probity was only tried on a small Node project before being recommended for every stack | Probity hook turned off (agent-setup/probity-instructions); follow-up: retro |

"Where it should have been caught" names the earliest check that could have found it: a unit test, a review, a linter, a hook, CI, or a person.
