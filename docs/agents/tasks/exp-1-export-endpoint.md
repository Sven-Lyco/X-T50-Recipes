---
id: exp-1
title: Move the export endpoint to export-backup
type: refactor
status: backlog
bounded_context: export-backup
depends_on: []
blocks: []
decisions: []
branch: refactor/export-endpoint
---

## Why

`RecipeController` (library) calls `RecipeExportService` (export-backup) for the PDF/PNG export of a recipe. The context map allows only export-backup to use library, not the other way round (architecture check, accepted in `docs/agents/architecture-baseline.txt` on 2026-11-12).

## What

Move the export endpoint into a controller of export-backup that reads the recipe through library, so library no longer uses export-backup.

## Acceptance criteria

Written by a person, as examples:

- Given the architecture check, when it runs after this task, then no `library uses export-backup` violation is left and the matching line is gone from the baseline.

## Notes

Frontend: `RecipeDetailPage` binds the PDF and PNG export directly (already in the baseline from 2026-11-12).
