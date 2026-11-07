---
id: 0001
title: Recipes are valid for chosen camera models
status: accepted
date: 2026-11-07
decided_by: owner (Sven Lüchow)
source: domain modeling session 2026-11-07
supersedes:
---

## Context

A second camera may come, with partly different film simulations and settings. One recipe can work on several cameras.

## Decision

A recipe is valid for one or more camera models. The owner decides which; the app suggests the models that support all of the recipe's settings.

## Consequences

Recipes need a list of compatible camera models. Camera models and their capabilities come from the camera-catalog context.
