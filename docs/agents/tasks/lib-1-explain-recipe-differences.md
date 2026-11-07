---
id: lib-1
title: Explain how two recipes differ
type: feature
status: todo
bounded_context: library
depends_on: []
blocks: []
decisions: []
branch: feature/lib-1-explain-recipe-differences
---

## Why

Compare and the duplicate warning only show a similarity score, not what makes two recipes different. Knowing that helps the owner keep the library diverse (vision: success).

## What

A new pure function `topDifferences(a, b, n = 3)` next to `computeSimilarity` in `frontend/src/utils/recipeSimilarity.ts`. It uses the same weights as `computeSimilarity` to rank the settings in which two recipes differ, and returns the `n` most significant ones, each with its label and both values. No UI change in this task.

## Acceptance criteria

Confirmed by the owner:

- Given two recipes that differ only in grain strength (OFF vs STRONG) and color (0 vs +2), when `topDifferences(a, b, 2)` is called, then it returns grain strength first and color second, each with its label and both values.
- Given two identical recipes, when `topDifferences` is called, then it returns an empty list.
- The result never has more entries than there are differing settings.

## Notes

Read first:

- `docs/agents/contexts/library/glossary.md` (terms: recipe, similarity, duplicate warning)
- `frontend/src/utils/recipeSimilarity.ts` (`computeSimilarity`, `filmSimDist`, `ordDiff`; weights are inline in `computeSimilarity`)
- `frontend/src/utils/recipeSimilarity.test.ts` (test style)
- `frontend/src/utils/labels.ts` (label functions, e.g. `strengthLabel`, `dynamicRangeLabel`, `grainSizeLabel`)

Research:

- `computeSimilarity` has the weights inline. To use the same weights without drift, extract the per-setting weighted differences into one shared place that both functions use (refactor while tests are green).
- Ranking is by weighted difference (difference share × weight), descending. Settings with zero difference are left out.
- Conditional settings follow `computeSimilarity`: grain size only if both recipes have grain; monochrome warm/cool and green/magenta only if both film simulations are monochrome.
- Example check: grain strength OFF vs STRONG gives 1.0 × 2.0 = 2.0; color 0 vs +2 gives 2/8 × 1.5 = 0.375, so grain strength ranks first.
- Tie order is not specified; keep it stable (order of settings in `computeSimilarity`).
- Labels in the camera menu wording are German (see CLAUDE.md "Frontend-Labels"). The exact label text and the shape of a result entry are not specified (see `docs/agents/assumptions.md`).
- The glossary says similarity is 0 to 1, `computeSimilarity` returns 0 to 100. Not part of this task.
