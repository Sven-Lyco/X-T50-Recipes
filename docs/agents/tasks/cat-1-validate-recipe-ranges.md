---
id: cat-1
title: New recipe values are checked against the capabilities of the X-T50 camera model
type: feature
status: done
bounded_context: camera-catalog
depends_on: []
blocks: []
decisions: [docs/agents/decisions/0001-recipe-camera-models.md]
branch: feature/cat-1-validate-recipe-ranges
---

## Why

Today the API accepts values the camera does not know (for example highlight tone +7). Camera knowledge belongs in one place (camera-catalog, see context map).

## What

The backend gets a catalog entry for camera model X-T50 with its value ranges. Creating or updating a recipe rejects values outside these ranges with HTTP 400, naming the field and the allowed range.

## Acceptance criteria

Confirmed by the owner:

- Given highlight tone 4.5, when the recipe is saved, then the response is 400 and names the field highlightTone with the allowed range -2 to +4.
- Given highlight tone 1.3 (not a 0.5 step), when the recipe is saved, then the response is 400.
- Given all values within their ranges, when the recipe is saved, then it is saved as before.
- Ranges: highlight and shadow tone -2 to +4 in steps of 0.5; color, sharpness and noise reduction -4 to +4; clarity -5 to +5; white balance shift red and blue -9 to +9.

## Notes

All 29 recipes of the owner's current backup are within these ranges (checked 2026-11-07 in the local app).

Same ranges are hard-coded in the frontend (`ReferencePage.tsx`, `recipeSimilarity.ts`); this task only adds the backend catalog.

**Read first**

- `docs/agents/context-map.md` (camera-catalog is upstream of library, "published language", read only; "Model and code differ" section)
- `docs/agents/decisions/0001-recipe-camera-models.md`
- `docs/agents/contexts/library/glossary.md`. camera-catalog has no glossary yet (context map folder is "–"). The names used here (camera model, value range) come from the context map; if the implementer needs more terms, stop and ask.

**Code entry points (researched 2026-11-07)**

- `src/main/java/de/fuji/xt50recipes/recipe/RecipeRequest.java`: record with `@NotNull` on tone/color/sharpness/noiseReduction; `wbShiftRed`, `wbShiftBlue`, `clarity` are nullable `Integer`.
- `RecipeController.create/update`: `@Valid @RequestBody RecipeRequest`.
- `config/GlobalExceptionHandler.java`: `MethodArgumentNotValidException` → 400 `{"errors": {field: message}}`; `IllegalArgumentException` → 400 `{"message": ...}`. A new check can reuse either format; the field name must appear in the response.
- `RecipeService.create/update/duplicate` all go through `applyRequest`. A null `wbShiftRed`, `wbShiftBlue` or `clarity` is silently stored as 0 (see assumption below).
- Tests: `RecipeControllerTest` (`@WebMvcTest`, see CLAUDE.md for the `csrf()` / `@WithMockUser` notes), `RecipeServiceTest` (Mockito).
- Write the failing tests first (AGENTS.md "Tests first").

**Where else recipes are written, not covered by the criteria (reported, not decided)**

- `RecipeExportService.saveImported` builds a `Recipe` entity directly from the imported JSON. It is used by both single-recipe import (`POST /api/recipes/import`) and backup restore (`POST /api/backup`). It does not use `RecipeRequest` or `RecipeService`, so a check added to the create/update path will **not** apply there: out-of-range values in a ZIP are still accepted. Whether import and restore should reject them, warn, or accept them is an open owner decision.
- `RecipeService.duplicate` uses `applyRequest` on a copy of an existing recipe, without bean validation. It would only be affected if the check sits in `applyRequest`/the service rather than in `@Valid`. Decide when implementing; a stored recipe that is out of range today is not expected (see the 29-recipe check above).
- `POST /api/suggest` (AI) returns a `RecipeRequest` that is not validated against ranges; the owner confirms it in the edit form, and saving goes through update/create, so the check applies then.
