# Vision

Worked out with the owner, one question at a time (2026-11-07). Change it only with their approval.

## Purpose

A personal tool to collect, manage and export Fujifilm film-simulation recipes, to plan which recipes go into the camera's custom slots C1–C7, and to learn from the owner's own shots which recipes work best.

## Users and actors

| Actor | What they want to achieve |
|---|---|
| owner | Build a diverse recipe library, plan and track the camera slots, find their best recipes |
| AI assistant | Proposes recipes, slot choices and recipe matches; never acts on its own |

One owner per installation (single-user, self-hosted). Others run their own instance.

## Core concepts

- **Recipe:** a set of camera settings (film simulation and parameters), with tags, shooting scenario and recipe images
- **Library:** all recipes of the owner
- **Favorite:** a recipe the owner marks by hand, independent of ratings
- **Tag** and **shooting scenario** (travel, street, landscape, portrait, …)
- **Similarity:** how close two recipes are
- **Collection:** a named set of recipes
- **Shot:** a photo taken and uploaded by the owner, linked to the recipe it was taken with, with the owner's rating
- **Recipe image:** a photo attached to a recipe; a shot taken over into a collection becomes one
- **Ranking:** the best recipes of a collection, derived from shot ratings
- **Camera slot** (C1–C7), **slot assignment** and **slot protocol** (history of assignments: stable vs. frequently swapped)
- **Export:** PNG (for the separate slot app), PDF, A6 card, ZIP
- Setting names follow the camera menu

## Situations

1. Capture a recipe from screenshots or reference photos (AI proposal, confirmed in the edit form).
2. Before a trip: plan the slot assignment, with AI suggestions for a place and its subjects.
3. On location: photograph a scene and let the AI suggest the best-fitting slot.
4. After a trip: upload shots, recognize the recipe used for each, rate them, create a collection, and see the best recipes by rating.
5. Keep the library diverse with compare, similarity map and duplicate warning.
6. Look up what each film simulation and setting does and which values it accepts (settings reference, in camera-menu terms).

## What success looks like

- The library holds clearly different recipes (low similarity between them).
- It covers the owner's shooting scenarios.
- Rated shots show which recipes work best.

**Not success:** sharing or social features in the app, controlling the camera directly.

## Technical constraints

- Web app (PWA, usable on a phone on the go). It cannot program the camera; slots are set with a separate app fed by the PNG export.
- The AI never changes data on its own: every suggestion goes through the edit form. The app stays fully usable with AI switched off. The owner chooses the AI model (default in the settings).
- Sharing happens only through exports. The owner can back up and restore the complete library, including slots, favorites and protocol.

## Expected changes

- Recipes created from Fuji JPEG EXIF data
- Shots, ratings and collections
- A second camera (slots and protocol per camera, recipe compatibility per model)
- New film simulations (firmware updates or new cameras)
- New or different AI models
