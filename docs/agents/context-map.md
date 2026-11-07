# Context map

Worked out with the owner on 2026-11-07 (domain modeling session). See `vision.md` for purpose and expected changes.

| Bounded context | Type | Purpose | Key actors | Folder |
|---|---|---|---|---|
| library | core | Recipes, tags, shooting scenarios, favorites (set by hand), compatible camera models (decided by the owner, the app suggests), recipe images, similarity, duplicate warning, collections | owner | contexts/library/ |
| slots | core | The owner's cameras and their slots C1–C7; per slot the recipe and the settings snapshot that was transferred; slot protocol per camera | owner | contexts/slots/ |
| shots | core | Uploaded shots, recognition of the recipe from EXIF data, ratings, ranking per collection | owner | contexts/shots/ |
| camera-catalog | supporting | Camera models and what they support (film simulations, settings, value ranges, slots); settings reference | owner | – |
| ai-assistance | supporting | Recipe from screenshots or photos, slot match on location, location match for trips, AI model choice | owner, AI assistant | – |
| export-backup | supporting | PNG (for the separate slot app), PDF, A6 card and ZIP exports; backup and restore | owner | – |
| access | generic | Login of the single owner (use the framework's standard solution) | owner | – |

Type is one of `core` (competitive advantage, build it carefully), `supporting` (needed, but not a differentiator) or `generic` (solved problem, prefer an existing solution).

## Relationships

| Upstream | Downstream | Relationship | Integration |
|---|---|---|---|
| camera-catalog | library | published language | camera models and their capabilities, read only |
| camera-catalog | slots | published language | the camera model of each camera, read only |
| library | slots | customer-supplier | contract: recipe ID and settings; slots stores its own snapshot at transfer time |
| library | shots | customer-supplier | contract: recipe ID and settings for recognition, read only |
| shots | library | customer-supplier | contract: one command "take shot over into collection", which creates a recipe image |
| library | export-backup | customer-supplier | contract: recipes as read model |
| ai-assistance | library | – | proposals only; the owner confirms them in the edit form, the AI never writes |

## Model and code differ (as of 2026-11-07)

- The slot is a field on the recipe (`Recipe.cameraSlot`): one recipe can be on at most one slot, there is no camera and no transferred snapshot. Decisions 0002 and 0003 require slot assignments per camera with a snapshot.
- Camera knowledge (film simulations, value ranges) lives in three places: the settings reference page, the similarity calculation, and backend enums without ranges. The camera-catalog context should own it.
- Camera models, shots, ratings, rankings and collections do not exist in the code yet.

## Open questions

- Which settings and value ranges do other camera models support? Research once the second camera is known.
- Temperament (exploratory or strict) per bounded context has not been discussed yet.
