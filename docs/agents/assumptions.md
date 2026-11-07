# Assumptions

Log an assumption before you rely on it. A person confirms it (then record a decision) or rejects it.

| Date | Assumption | Context (task or file) | Status | Resolved by |
|---|---|---|---|---|
| 2026-11-07 | The Dockerfile build stage uses `gradle:9-jdk25` (runs plain `gradle`, currently 9.8.2), not the wrapper's 9.9.0; acceptable because the owner only asked for "a Gradle 9 / JDK 25 image" | chore-1, Dockerfile | open | |
| 2026-11-07 | `distributionSha256Sum` must be copied from gradle.org by the owner; the agent could not fetch it (network tools not permitted) and did not compute or invent one | chore-1, gradle-wrapper.properties | open | |

Status is one of `open`, `confirmed`, `rejected`.
