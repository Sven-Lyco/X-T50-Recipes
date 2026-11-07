# Glossary: slots

Purpose: which recipe is on which slot of which of the owner's cameras, as actually transferred, and how that changed over time.

| Term | Meaning in this context | Not to be confused with | Name in code |
|---|---|---|---|
| camera | A camera the owner owns, with its own slots | camera model (a type, context camera-catalog) | – (not yet in code) |
| camera model | The type of a camera (for example X-T50), referenced from camera-catalog | camera | – (not yet in code) |
| slot | One of the custom settings banks C1–C7 of a camera | – | `CameraSlot` |
| slot assignment | A recipe on a slot of a camera, together with the settings snapshot that was transferred to the camera | the recipe in the library, which may have changed since | `Recipe.cameraSlot` (today: field on the recipe, see context map) |
| settings snapshot | The recipe settings as they were when the owner transferred them; if the recipe changes later, the slot shows "re-transfer" | the current recipe | – (not yet in code) |
| transfer | Loading a recipe onto the camera with the separate slot app, using the PNG export | export (context export-backup) | – |
| slot protocol | The history of slot assignments per camera; shows which slots stay stable and which change often | – | `SlotChangeLog` |
