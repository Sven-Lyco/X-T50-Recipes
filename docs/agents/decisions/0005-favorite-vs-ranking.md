---
id: 0005
title: Favorite and ranking stay separate
status: accepted
date: 2026-11-07
decided_by: owner (Sven Lüchow)
source: domain modeling session 2026-11-07
supersedes:
---

## Context

Favorites exist already. Ratings of shots will show which recipes work best.

## Decision

A favorite is set by hand and is independent of ratings. The ranking per collection is derived from shot ratings and never changes favorites.

## Consequences

Two separate concepts in two contexts (library, shots).
