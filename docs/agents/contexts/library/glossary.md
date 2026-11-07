# Glossary: library

Purpose: the owner's curated collection of recipes, and everything that describes, compares and groups them.

| Term | Meaning in this context | Not to be confused with | Name in code |
|---|---|---|---|
| recipe | A set of camera settings (film simulation and parameters) with name, tags, shooting scenario and recipe images | a shot (a photo), a slot assignment | `Recipe` |
| library | All recipes of the owner | a collection (a chosen subset) | – |
| favorite | A recipe the owner marks by hand because it works for them, independent of any rating | ranking (derived from shot ratings, context shots) | `Recipe.favorite` |
| tag | A free label on a recipe | shooting scenario | `Recipe.tags` |
| shooting scenario | The kind of situation a recipe is meant for (travel, street, landscape, portrait, …) | tag | `ShootingScenario` |
| compatible camera models | The camera models the owner decided a recipe is for; the app suggests models that support all its settings | a camera (the owner's device, context slots) | – (not yet in code) |
| recipe image | A photo attached to a recipe; a shot taken over into a collection becomes a recipe image | shot (context shots) | `RecipeImage` |
| similarity | How close two recipes are, from 0 to 1 | – | `computeSimilarity` (frontend) |
| duplicate warning | The hint when a saved recipe is at least 85 % similar to another | – | – |
| collection | A named set of recipes, for example all recipes used on a trip | library, tag | – (not yet in code) |
