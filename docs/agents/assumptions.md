# Assumptions

Log an assumption before you rely on it. A person confirms it (then record a decision) or rejects it.

| Date | Assumption | Context (task or file) | Status | Resolved by |
|---|---|---|---|---|
| 2026-11-07 | A result entry of `topDifferences` has the shape `{ label, valueA, valueB }` with display strings; labels use the German camera-menu wording from CLAUDE.md (e.g. "Körnungseffekt", "Farbe") | lib-1, `frontend/src/utils/recipeSimilarity.ts` | open | |
| 2026-11-07 | "Differing settings" are the settings `computeSimilarity` compares; ranking is by weighted difference (difference share × weight), ties keep the order of `computeSimilarity` | lib-1 | open | |
| 2026-11-07 | The weights are shared with `computeSimilarity` by extracting them into one internal structure (small refactor), not by copying the numbers | lib-1 | open | |

Status is one of `open`, `confirmed`, `rejected`.
