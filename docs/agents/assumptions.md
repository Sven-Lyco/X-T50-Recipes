# Assumptions

Log an assumption before you rely on it. A person confirms or rejects it; record who and when in the table. A confirmed assumption needs a decision file only if it changes structure or an interface, or is hard to reverse.

| Date | Assumption | Context (task or file) | Status | Resolved by |
|---|---|---|---|---|
| 2026-11-07 | A result entry of `topDifferences` has the shape `{ label, valueA, valueB }` with display strings; labels use the German camera-menu wording from CLAUDE.md (e.g. "Körnungseffekt", "Farbe") | lib-1, `frontend/src/utils/recipeSimilarity.ts` | confirmed | owner, 2026-11-07 |
| 2026-11-07 | "Differing settings" are the settings `computeSimilarity` compares; ranking is by weighted difference (difference share × weight), ties keep the order of `computeSimilarity` | lib-1 | confirmed | owner, 2026-11-07 |
| 2026-11-07 | The weights are shared with `computeSimilarity` by extracting them into one internal structure (small refactor), not by copying the numbers | lib-1 | confirmed | owner, 2026-11-07 |
| 2026-11-07 | Null clarity and white balance shift values are not range-checked | cat-1 | open | – |
| 2026-11-07 | Import (`POST /api/recipes/import`) and backup restore are left unchecked: out-of-range values in a ZIP are still accepted, because the task lists this as an open owner decision | cat-1, `RecipeExportService.saveImported` | open | |
| 2026-11-07 | Duplicating a stored recipe is not range-checked (it bypasses bean validation); stored recipes are expected to be in range | cat-1, `RecipeService.duplicate` | open | |
| 2026-11-07 | The check lives in a class-level bean-validation constraint `@WithinCameraRanges` on `RecipeRequest`, reporting field errors in the existing `{"errors": {field: message}}` format; the error text is German ("Erlaubt: -2 bis +4 in Schritten von 0.5") like the other UI texts | cat-1, `RecipeRequest` | open | |
| 2026-11-07 | The validator is hard-wired to `CameraModel.X_T50`; choosing a camera model per recipe (decision 0001) is later work | cat-1, `WithinCameraRangesValidator` | open | |
| 2026-11-07 | The Dockerfile build stage uses `gradle:9-jdk25` (runs plain `gradle`, currently 9.8.2), not the wrapper's 9.9.0; acceptable because the owner only asked for "a Gradle 9 / JDK 25 image" | chore-1, Dockerfile | open | |
| 2026-11-07 | `distributionSha256Sum` must be copied from gradle.org by the owner; the agent could not fetch it (network tools not permitted) and did not compute or invent one | chore-1, gradle-wrapper.properties | open | |
| 2026-11-07 | Display strings in `topDifferences`: numbers are signed with a plus ("+2", "0", "-2", "+1.5"); film simulation uses `filmSimLabel`; labels follow the form page ("Spitzlichter", "Schatten", "Schärfe", "Klarheit", "Warm / Cool", "Grün / Magenta"); enum values use `strengthLabel`, `dynamicRangeLabel`, `grainSizeLabel` | lib-1, `recipeSimilarity.ts` | open | |
| 2026-11-07 | The settings table is internal (not exported); `RecipeDifference` is the only new exported type | lib-1 | open | |
| 2026-11-07 | Frontend coverage is enabled globally via `coverage.enabled: true` in `vite.config.ts` (not a `--coverage` flag), so `npm test` always measures coverage; a single-file `vitest run <file>` printed no coverage output when tried (reason not investigated) | cov-1, `frontend/vite.config.ts` | open | |
| 2026-11-07 | Switching CI from `./gradlew test` to `check` only adds JaCoCo verification; not yet confirmed by a real CI run (only local) | cov-1, `.github/workflows/ci.yml` | open | |

Status is one of `open`, `confirmed`, `rejected`.
