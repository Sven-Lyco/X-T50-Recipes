---
id: 0003
title: Warn, do not block, for recipes not released for a camera model
status: accepted
date: 2026-11-07
decided_by: owner (Sven Lüchow)
source: domain modeling session 2026-11-07
supersedes:
---

## Context

A recipe may be put on a camera whose model it is not released for.

## Decision

The app warns and allows the assignment after the owner confirms.

## Consequences

No hard validation between slots and compatible camera models; a warning dialog instead.
