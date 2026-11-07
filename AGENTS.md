# xt50-recipes

Persönliche Web-App zur Verwaltung von Fujifilm X-T50 Film-Simulation-Recipes. Recipes enthalten alle JPEG-Kameraeinstellungen, Beispielbilder, Beschreibungen und Tags. Ein Dashboard zeigt, welches Recipe auf welcher Custom-Bank (C1–C7) der Kamera aktiv ist.

## Commands

| Purpose | Command |
|---|---|
| Install dependencies | `npm --prefix frontend ci` |
| Run all tests and the linter | `scripts/check.sh` (exit code 0 = all passed) |
| Run one backend test class | `./gradlew test --tests <TestClass>` |
| Run one frontend test file | `npm --prefix frontend test -- --coverage.enabled=false <file or name>` |
| Lint only | `npm --prefix frontend exec -- tsc --noEmit -p frontend` |
| Build | `./gradlew build` |

Run `scripts/check.sh` before you report a task as done. If a command is marked "not configured", say so instead of inventing one. `GRADLE_USER_HOME` is set in `.claude/settings.local.json`; do not prefix commands with it.

Run every command from the repository root as a single command, without `cd`, pipes or redirects. The Bash tool reports the exit code; do not use `$?`.

## Project structure

- `src/` – Spring-Boot-Backend (`src/main/java`, `src/main/resources`) und Backend-Tests (`src/test`)
- `frontend/` – React/TypeScript/Vite-Frontend inkl. Tests (vitest)
- `gradle/` – Gradle Wrapper
- `docs/` – Dokumentation (`architecture/`, `screenshots/`, `product-reference.md`)
- `scripts/check.sh` – alle Tests und Linter mit einem Exit-Code

## Domain language

- Bounded contexts and how they relate: `docs/agents/context-map.md`.
- Each bounded context has a purpose and a glossary in `docs/agents/contexts/<context>/glossary.md`.
- Use glossary terms exactly, in code, tests, and messages. Do not substitute generic words such as "user", "client", "data", or "item" when the glossary defines a more specific term.
- If a concept you need is not in the glossary, stop and ask instead of inventing a name.
- Work in one bounded context per session. Load the glossary of a neighboring context only where the task touches that interface.

## How to work

### Small steps, fresh context

- Split work so that each task fits into one session and touches one bounded context.
- Before starting a task, read every file the task lists (dependencies, decisions, glossary).
- Prefer several small tasks with fresh context over one long session.

### Tests first

- For new behavior and bug fixes, write a failing test before you write production code.
- For `refactor/`, `chore/`, and `docs/` changes, confirm that the existing tests pass before and after the change.
- Before every test run, state whether you expect it to pass or fail, and with which failure message.
- After a failing test, write only the simplest code that makes it pass. Refactor only while all tests pass.
- Do not report a task as done while any test fails.

### Deterministic before LLM

- Implement a step as ordinary code whenever ordinary code can do it reliably.
- Use an LLM call only for the part that code cannot do. Keep thresholds, sampling, and aggregation in code.
- Validate the output of every LLM step with deterministic code.
- When a step you keep repeating becomes predictable, propose turning it into a script.

### Code health and coupling

- Before changing code that is hard to understand (long functions, duplication, unclear names), describe the problem and propose a refactoring step first.
- Never read or write another component's storage directly. Integrate through its public interface or an explicit contract.
- When you add an integration between components, name what they now share (implementation details, business logic, a domain model, or only a contract) and keep that as small as possible.
- Before building a generic capability (authentication, payments, scheduling), check whether the project already uses a library or service for it, and ask.

## Assumptions, decisions and logs

- Keep assumptions and decisions apart:
  - **Decision:** something a person in this project stated. Record the source (who, where).
  - **Assumption:** something you inferred. Mark it as an assumption.
- Log every assumption that affects behavior, structure, or an interface in `docs/agents/assumptions.md` before you rely on it.
- When a person confirms or rejects an assumption, set its status in `assumptions.md` and record who and when. Write a decision file only if the choice changes structure or an interface, or is hard to reverse.
- Never present an assumption as a decision.
- Treat statements made while prototyping as experiments, not as architecture decisions, unless the person says otherwise.
- Record decisions in `docs/agents/decisions/`, one file per decision. A decision you write yourself has status `proposed` until a person confirms it.
- When the user says "log this", append it to `docs/agents/annoyances.md` immediately.
- When a bug is found, add a row to `docs/agents/ledger.md`, including where it should have been caught.
- At the end of a session, update `docs/agents/handover.md` so the next session can continue without this conversation.

## Changing these rules

- Never edit `AGENTS.md`, `CLAUDE.md`, or any rule file on your own. Propose the exact change and the reason, then wait for approval.
- When you make a mistake, fix it and state the fix in one sentence. Then propose how to prevent it:
  - a task you keep repeating → a skill
  - a mistake → a rule
  - the same mistake again → a hook or an automated check
- Make changes to the agent setup (this file, skills, hooks, templates) on an `agent-setup/` branch, separate from product changes.

## Branches

- Never commit to `main` directly, and never push to it.
- Before the first file change of a task, check the current branch. If it is `main`, update it with `git pull --ff-only` (if it has a remote) and create a new branch from it. If the update fails, stop and ask.
- If you notice uncommitted changes on `main`, stop and ask whether to move them to a new branch.
- Name branches `<type>/<short-description>`, with the description in kebab-case, for example `feature/invoice-export`.

| Type | Use for |
|---|---|
| `feature/` | New behavior |
| `bugfix/` | Fixing a defect found during development or testing |
| `hotfix/` | Urgent fix for a defect in production |
| `refactor/` | Restructuring without changing behavior |
| `chore/` | Dependencies, build, tooling |
| `docs/` | Documentation only |
| `agent-setup/` | `AGENTS.md`, `CLAUDE.md`, skills, hooks, templates |

- Use one branch per task. If a task needs two types of change, ask whether to split it.
- Agent working files that a task produces (assumptions, decisions, ledger, handover, task files) go on the same branch as the task. They do not count as a second type of change.
- Every branch goes back into `main` through a pull request.

## Commits

- Decide whether tests and the linter passed by their exit codes, never by searching their output.
- Commit only when all tests and the linter pass.
- Before committing, run `git status` and stage only the files that belong to the change, by name. Never commit caches, build output, installed dependencies, or local agent files.

## Pull requests

- Write every pull request so that a reviewer who does not use AI can review it without redoing your work.
- Every description contains: what changed, why, alternatives you rejected, how to test it, what is not tested, and who is responsible for the change.
- Do not cite passing CI as proof of correctness. List which tests and checks cover the change and which risks remain.

## Data and safety

- Never write personal data or customer data into the repository, test fixtures, logs, or prompts.
- Never commit secrets. If you find one, stop and tell the user.
- Run large experiments (rewrites, migrations, bulk changes) on a separate branch or a copy of the system first, never directly on shared environments.

## Agent working files

| File | Purpose |
|---|---|
| `docs/agents/vision.md` | Purpose, users, core concepts, constraints, expected changes |
| `docs/agents/context-map.md` | Bounded contexts, their type (core, supporting, generic) and relationships |
| `docs/agents/contexts/<context>/glossary.md` | Ubiquitous language of one bounded context |
| `docs/agents/decisions/` | One file per decision, with status `proposed` or `accepted` |
| `docs/agents/assumptions.md` | Assumptions you made, with the date and context |
| `docs/agents/ledger.md` | Bugs: what happened, who found it, where it should have been caught |
| `docs/agents/annoyances.md` | Friction the user asked you to log |
| `docs/agents/handover.md` | State at the end of the last session |
| `docs/agents/tasks/` | Task files with front matter |
| `docs/agents/retros/` | One file per retrospective, with actions and their status |
