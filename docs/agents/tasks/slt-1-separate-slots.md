---
id: slt-1
title: Separate slots from the recipe
type: refactor
status: backlog
bounded_context: slots
depends_on: []
blocks: []
decisions: [docs/agents/decisions/0002-slot-settings-snapshot.md, docs/agents/decisions/0003-incompatible-slot-warning.md]
branch: refactor/separate-slots
---

## Why

The slot is a field on the recipe (`Recipe.cameraSlot`), so library depends on slots in ten places (architecture check, accepted in `docs/agents/architecture-baseline.txt` on 2026-11-12). Decisions 0002 and 0003 want slot assignments per camera with a settings snapshot, owned by slots.

## What

Move the slot assignment out of the recipe into the slots context, so library no longer uses slots. Split this task further before starting; it is larger than one session.

## Acceptance criteria

Written by a person, as examples:

- Given the architecture check, when it runs after this task, then no `library uses slots` violation is left and the matching lines are gone from the baseline.

## Notes

Files from the check: `Recipe`, `RecipeController`, `RecipeListItem`, `RecipeRepository`, `RecipeRequest`, `RecipeResponse`, `RecipeService` (all in `recipe/`) use `CameraSlot`, `SlotChangeLog`, `SlotChangeLogRepository`, `SlotConflictException`.
