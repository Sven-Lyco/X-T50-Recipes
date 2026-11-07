---
id: chore-1
title: Upgrade to Gradle 9.9 and Java 25
type: chore
status: doing
bounded_context: none (technical)
depends_on: []
blocks: []
decisions: []
branch: chore/chore-1-gradle-9-java-25
---

## Why

IntelliJ runs with JDK 25, which Gradle 8.14 cannot run on, so it rewrote the wrapper on its own. Project, IDE, CI and container should use the same Java and Gradle versions.

## What

Upgrade the Gradle wrapper to 9.9.0 with the official wrapper task (including the distribution checksum), and use Java 25 in `build.gradle`, CI and the Dockerfile (build and runtime image).

## Acceptance criteria

Confirmed by the owner:

1. `gradle-wrapper.properties` names Gradle 9.9.0 with its checksum (`distributionSha256Sum`).
2. `build.gradle`, `ci.yml` and the Dockerfile (build and runtime image) use Java 25.
3. `./gradlew check` and the frontend tests are green locally.
4. CI is green on the pull request.
5. The Docker image builds, the app starts locally, and login and the recipe list work with the owner's imported state (29 recipes).
6. Gradle deprecation warnings are listed in the report but not fixed in this task.

## Notes

Files to read first (state on main, 2026-11-07):

- `gradle/wrapper/gradle-wrapper.properties` – currently `gradle-8.14.6-bin.zip`, no `distributionSha256Sum`. Use `./gradlew wrapper --gradle-version 9.9.0 --gradle-distribution-sha256-sum <sum>` (official checksum from gradle.org).
- `build.gradle` – `java { sourceCompatibility = JavaVersion.VERSION_21 }`; Spring Boot plugin 4.0.9.
- `.github/workflows/ci.yml` – `actions/setup-java` with `java-version: '21'`, `temurin` (backend job).
- `Dockerfile` – build stage `gradle:8-jdk21` (must become a Gradle 9 / JDK 25 image), runtime stage `eclipse-temurin:21-jre-alpine`.
- `CLAUDE.md` names "Java 21" and "Gradle ≥ 8.14" in the tech stack; changing it needs owner approval (rule file, see AGENTS.md "Changing these rules").

Open points to check during the task (not decisions):

- Assumption: Gradle 9.9.0 exists and Spring Boot 4.0.9 plus the JaCoCo/Testcontainers setup work with Java 25. Verify before relying on it.
- Assumption: an `eclipse-temurin:25-jre-alpine` image and a `gradle:9-jdk25` image exist. Verify.
- Deprecation warnings: collect with `./gradlew check --warning-mode all` and list them in the report only.
- Criterion 5 needs the owner's imported state (29 recipes) locally; the owner does that check or provides the data. Do not copy personal data into the repository.
