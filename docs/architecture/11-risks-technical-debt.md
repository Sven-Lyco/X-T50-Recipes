# 11 — Risiken und technische Schulden

## Risiken

| ID | Risiko | Wahrscheinlichkeit | Impact | Maßnahme |
| --- | --- | --- | --- | --- |
| R1 | Traefik/Coolify blockiert Bild-Uploads > ~1 MB | Hoch (bereits beobachtet) | Mittel | ✅ Buffering-Middleware im `app`-Service von `docker-compose.yml` ergänzt (`maxRequestBodyBytes` 30 MB via `coolify.traefik.middlewares`-Shorthand, siehe [07-deployment-view.md](07-deployment-view.md#traefik-buffering-für-große-uploads)); Wirksamkeit nach dem nächsten Produktiv-Deploy noch zu verifizieren |
| R2 | Rate-Limiter reset bei App-Neustart | Niedrig (Single-User) | Niedrig | Akzeptiert; bei Bedarf Redis-backed Limiter nachrüsten |
| R3 | ~~Keine automatisierten Tests~~ | ~~Mittel~~ | ~~Hoch~~ | ✅ Behoben: Unit-Tests (`RecipeServiceTest`, `ImageUtilsTest`), Web-Slice-Tests (`RecipeControllerTest`), Integrationstests mit Testcontainers (`RecipeRepositoryTest`); GitHub Actions CI auf `main` |
| R4 | ~~Power Iteration konvergiert nicht immer perfekt~~ | ~~Niedrig~~ | Niedrig | ✅ Konvergenz-Check ergänzt: bricht ab sobald der Vektor stabil ist (Winkel-Toleranz `1e-10`), `maxIters = 500` als Sicherheitsnetz + `console.warn` bei Nicht-Konvergenz; in 1500+ synthetischen Testfällen (auch < 5 Recipes) immer konvergiert. Verbleibend, nicht behebbar: bei < 5 Recipes bleibt die Karte inhärent wenig aussagekräftig (zu wenige Punkte für ein Cluster-Muster) — Informationsproblem, kein Algorithmus-Fehler |

## Technische Schulden

| ID | Schuld | Schwere | Status |
| --- | --- | --- | --- |
| T1 | ~~Duplizierter Code (`detectMimeType`, `extractExifContext`) in `AiSuggestionService` und `RecipeMatchService`~~ | Mittel | ✅ Behoben: in `ImageUtils` extrahiert |
| T2 | ~~In-Memory-Filterung für `onlyFavorites` und `scenario` in `RecipeService.findAll()`~~ | Mittel | ✅ Behoben: SQL-Filter in `RecipeRepository.findByFilters()` |
| T3 | ~~`docker-compose.yml` nutzt `service_started` statt `service_healthy`~~ | Niedrig | ✅ Behoben: Healthcheck für PostgreSQL konfiguriert |
| T4 | ~~`duplicate()` in `RecipeService` listet alle Felder manuell auf — bei neuen Feldern leicht zu vergessen~~ | Niedrig | ✅ Behoben: `RecipeRequest.copyFrom(Recipe)` zentralisiert die Feld-Kopie |
| T5 | ~~AI-Response-Parsing per manuellem `JsonNode`-Parsing statt typisiertem Schema (keine Validierung)~~ | Niedrig | ✅ Behoben: `AiRecipeResponse` Record + `safeEnum`-Helper mit Fallback |
| T6 | `extractExifContext` in `RecipeMatchService` extrahierte ursprünglich weniger Felder als in `AiSuggestionService` — jetzt durch `ImageUtils` vereinheitlicht | Niedrig | ✅ Behoben |
| T7 | ~~Keine Sortierung in der Bibliothek (nur nach Datum desc)~~ | Niedrig | ✅ Behoben: Client-seitige Sortierung nach Datum, Name, Filmsimulation |
| T8 | ~~„Ähnliche Recipes" in der Detailansicht filtert nach gleicher Filmsimulation statt `computeSimilarity()`~~ | Niedrig | ✅ Behoben: `useRecipesBulk` + `computeSimilarity()` + Ähnlichkeits-Score als Badge |
