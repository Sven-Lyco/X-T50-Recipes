---
id: 0004
title: Shot recognition: exact match automatic, otherwise the owner chooses
status: accepted
date: 2026-11-07
decided_by: owner (Sven Lüchow)
source: domain modeling session 2026-11-07
supersedes:
---

## Context

Fujifilm writes the film simulation and settings into the EXIF data of each JPEG. Settings may have been changed slightly at the camera.

## Decision

An exact match between a shot's EXIF settings and a recipe is assigned automatically. Otherwise the app shows the most similar recipes and the owner chooses. Recognition is deterministic; no AI is needed.

## Consequences

Recognition reuses the similarity calculation; the owner's choice is part of the workflow.
