---
id: lib-2
title: Show what makes similar recipes different
type: feature
status: done
bounded_context: library
depends_on: [lib-1]
blocks: []
decisions: []
branch: feature/lib-2-show-recipe-differences
---

## Why

Compare, the duplicate warning and the similar-recipes list only show a similarity score, not what makes two recipes different. Seeing the differences helps the owner keep the library diverse. lib-1 added `topDifferences(a, b, n)` without any UI.

## What

Show the differences between two recipes, computed by `topDifferences(a, b, 3)`, in three places: the duplicate warning in the recipe form, the compare result page, and the similar-recipes list on the recipe detail page. One line per difference, format `Label: value A → value B`. If two recipes do not differ in any compared setting, show `Keine Unterschiede` instead. No change to `topDifferences` or the similarity weights.

## Acceptance criteria

Confirmed by the owner (2026-11-07):

1. Duplicate warning (`RecipeFormPage`): given a recipe in the form that is at least 85 % similar to a saved recipe and differs in grain strength (OFF vs STRONG) and color (0 vs +2), when the warning shows, then below that saved recipe it lists `Körnungseffekt: Aus → Stark` and `Farbe: 0 → +2`, the edited recipe's value first.
2. Compare (`CompareResultPage`): given a comparison of three recipes, each recipe except the first shows up to 3 differences to the first recipe, the first recipe's value first.
3. Similar recipes (`RecipeDetailPage`): each entry of the similar-recipes list shows up to 3 differences to the shown recipe, the shown recipe's value first.
4. If two recipes do not differ in any compared setting, `Keine Unterschiede` is shown instead.
5. At most 3 differences per recipe, largest first, in the order of `topDifferences`.

Format: one line per difference, `Label: value A → value B`.

## Notes

Read first:

- `docs/agents/contexts/library/glossary.md` (recipe, similarity, duplicate warning)
- `docs/agents/tasks/lib-1-explain-recipe-differences.md` and its rows in `docs/agents/assumptions.md` (display strings are still `open`)
- `frontend/src/utils/recipeSimilarity.ts`: `topDifferences`, `RecipeDifference { label, valueA, valueB }`
- `frontend/src/test-utils.tsx` (`renderWithProviders`) and the existing tests `RecipeFormPage.test.tsx`, `CompareResultPage.test.tsx`, `RecipeDetailPage.test.tsx`

Entry points (value A = first argument of `topDifferences`):

- `RecipeFormPage.tsx` ~line 233 builds `matches` with `computeSimilarity(payload as unknown as Recipe, r)`; the warning modal renders them at ~line 497. A = edited recipe (`payload`), B = saved recipe `r`.
- `CompareResultPage.tsx` ~line 93: `recipes.map` with `first = recipes[0]`; the score badge is only shown for `i > 0`. A = `first`, B = `recipe`. Show the differences under the badge for `i > 0` only.
- `RecipeDetailPage.tsx` ~line 43 (`similar`, top 3 by score) and ~line 324 (cards). A = `recipe` (shown), B = the similar recipe.

Research:

- Criterion 1 example: grain strength OFF vs STRONG (weighted 2.0) ranks before color 0 vs +2 (0.375), as in the lib-1 test.
- Suggested design (assumption, logged in `assumptions.md`): one small component `RecipeDifferenceList` taking two recipes, used in all three places, so the format and `Keine Unterschiede` exist once. Mantine components and `@emotion/styled` only, no inline styles (CLAUDE.md).
- TDD: write a component test for the list first (differences, order, max 3, `Keine Unterschiede`), then one page-level test per criterion 1–3.
- `scripts/check.sh` must exit 0 before the task is reported done.

Owner decisions (2026-11-07), replacing the open questions of the creating session:

1. Add the term "difference" to `docs/agents/contexts/library/glossary.md`: a setting in which two recipes differ, with both values; name in code `RecipeDifference`. Not to be confused with similarity (a single score).
2. "Keine Unterschiede" refers only to the settings that similarity compares. Recipes may still differ in other fields (name, white balance mode); that is accepted.
3. `null` grain size and monochrome values need no extra work (`topDifferences` already handles them).
