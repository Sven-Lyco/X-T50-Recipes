---
id: 0002
title: Slots keep the transferred settings
status: accepted
date: 2026-11-07
decided_by: owner (Sven Lüchow)
source: domain modeling session 2026-11-07
supersedes:
---

## Context

When a recipe on a slot is edited in the library, the camera still has the old settings until the owner transfers again.

## Decision

A slot assignment stores the settings snapshot that was transferred. If the recipe differs from the snapshot, the app shows that the slot needs a new transfer.

## Consequences

Slot assignments become their own records per camera and slot, with a snapshot. Today the slot is a field on the recipe (see context map).
