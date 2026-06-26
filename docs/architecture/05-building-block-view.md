# 05 — Bausteinsicht

## Ebene 1: Systemübersicht

```
X-T50 Recipes
├── Frontend (React + TypeScript + Vite)
│   ├── Pages          (Screens / Routen)
│   ├── API Client     (React Query + Axios)
│   ├── Components     (PDF-Renderer)
│   └── Utils          (Similarity, MDS, Labels)
└── Backend (Spring Boot 3 / Java 21)
    ├── auth           (JWT, Security, Rate Limiting)
    ├── recipe         (CRUD, Camera Slots, Export/Import)
    ├── image          (Upload, Storage, Reorder)
    ├── ai             (Suggest, Match, ImageUtils)
    ├── user           (AppUser Entity + Repository)
    └── config         (Security, Web, Images, SPA-Fallback)
```

---

## Backend-Packages

### `auth`

| Klasse | Verantwortung |
|---|---|
| `SecurityConfig` | Spring Security Filterchain: stateless Sessions, CSRF-Deaktivierung, CSP-Header, URL-Autorisierung |
| `JwtAuthFilter` | Servlet-Filter: JWT-Extraktion aus `Authorization`-Header, Token-Validierung, SecurityContext-Befüllung |
| `JwtUtil` | Token-Erzeugung und -Parsing (jjwt 0.12) |
| `AuthController` | `POST /api/auth/login` |
| `LoginRateLimiter` | In-memory Rate-Limiting: 5 Versuche / 15 Min. Lockout per IP (`ConcurrentHashMap`) |
| `AppUserDetailsService` | Spring Security `UserDetailsService`-Implementierung |
| `DataInitializer` | Legt Initial-Admin beim Start an, falls noch kein User in der DB |

### `recipe`

| Klasse | Verantwortung |
|---|---|
| `Recipe` | JPA-Entity mit allen 20+ Kameraparametern inkl. Tags als PostgreSQL-Array |
| `RecipeRepository` | Spring Data JPA; nativer SQL-Filter für alle Kombinationen (filmSim, tag, favorites, scenario) |
| `RecipeService` | CRUD, Duplikation, Camera-Slot-Verwaltung mit Konflikt-Handling (force/nicht-force) |
| `RecipeController` | REST-Endpoints: `/api/recipes/**`, `/api/camera-status` |
| `RecipeExportService` | ZIP-Export (JSON + Bilder) und ZIP-Import |
| `RecipeRequest` | Eingehende DTO (Java Record) |
| `RecipeResponse` | Vollständige Ausgabe-DTO (Java Record) |
| `RecipeListItem` | Kompakte Listen-DTO für die Bibliotheksübersicht (Java Record) |
| Enums | `FilmSimulation`, `DynamicRange`, `GrainStrength`, `GrainSize`, `EffectStrength`, `WhiteBalanceMode`, `CameraSlot`, `ShootingScenario` |
| `SlotConflictException` | Domain-Exception → 409 wenn Slot bereits belegt und `force=false` |

### `image`

| Klasse | Verantwortung |
|---|---|
| `ImageService` | Upload auf Docker-Volume (UUID-Dateiname), Löschung, Reorder per `sortOrder` |
| `ImageController` | `POST/DELETE /api/recipes/{id}/images`, `PUT /api/recipes/{id}/images/reorder` |
| `RecipeImage` | JPA-Entity: `filename`, `caption`, `sortOrder` |
| `RecipeImageRepository` | Spring Data JPA |

### `ai`

| Klasse | Verantwortung |
|---|---|
| `AiSuggestionService` | Claude Vision: bis zu 5 Bilder → Recipe-Parameter vorschlagen |
| `RecipeMatchService` | Claude Vision: 1 Bild + alle Recipes → Top-3-Matches zurückgeben |
| `ImageUtils` | Geteilte Utilities: MIME-Erkennung per Magic Bytes, EXIF-Extraktion (ISO, Belichtung, Blende, Brennweite, WB, Kameramodell) |
| `AiConstants` | Package-private Konstanten: Anthropic-URL, Default-Modell, ALLOWED_MODELS, SUPPORTED_IMAGE_TYPES |
| `AiSuggestionController` | `POST /api/suggest` |
| `RecipeMatchController` | `POST /api/match` |
| `AiSuggestionException` | Domain-Exception → 502 bei Anthropic-API-Fehler |
| `RecipeMatchResponse` | Ausgabe-DTO: `{id, name, filmSimulation, previewImageFilename, cameraSlot, reason}` |

### `config`

| Klasse | Verantwortung |
|---|---|
| `AppProperties` | Typisierte Env-Var-Konfiguration via `@ConfigurationProperties` |
| `SpaFallbackController` | Leitet alle Nicht-API-, Nicht-Static-Routes auf `index.html` (SPA-Routing) |
| `ImageResourceConfig` | Serviert das Docker-Volume `/app/images` als statische Ressource unter `/images/**` |
| `GlobalExceptionHandler` | `@ControllerAdvice`: übersetzt Domain-Exceptions in HTTP-Responses |
| `WebClientConfig` | `RestTemplate`-Bean für die Anthropic-API-Kommunikation |

---

## Frontend-Struktur

### Pages (Screens)

| Page | Route | Beschreibung |
|---|---|---|
| `LibraryPage` | `/` | Kartenraster mit Filtern (Filmsim, Tag, Szenario, Favoriten) |
| `RecipeDetailPage` | `/recipes/:id` | Vollansicht, Bildergalerie, Aktionen (Export, Duplizieren, Match) |
| `RecipeFormPage` | `/recipes/new`, `/recipes/:id/edit` | Anlegen/Bearbeiten aller Parameter inkl. Bild-Upload |
| `CameraDashboardPage` | `/camera` | C1–C7 Slot-Übersicht mit Direktzuweisung |
| `CompareSelectPage` | `/compare` | Bis zu 4 Recipes für Vergleich auswählen |
| `CompareResultPage` | `/compare/result` | Side-by-Side-Tabelle mit Diff-Highlighting und Ähnlichkeits-Score |
| `GenerateRecipePage` | `/generate` | KI-Generierung: Fotos hochladen → Formular vorbefüllt |
| `SimilarityMapPage` | `/map` | Interaktive MDS-Karte; optional nur C1–C7 |
| `RecipeMatchPage` | `/match` | Foto hochladen → Top-3 passende Recipes |
| `ReferencePage` | `/reference` | Parameter-Referenz |
| `LoginPage` | `/login` | Single-User-Login |

### Utils

| Modul | Beschreibung |
|---|---|
| `recipeSimilarity.ts` | `computeSimilarity(a, b)` → 0–100 (100 = identisch); gewichtete Distanz mit Filmsimulations-Distanzmatrix; genutzt in Ähnlichkeits-Map, Compare, Detailansicht und Duplikat-Check im Formular |
| `recipePca.ts` | `computeMds(recipes)` → 2D-Koordinaten via Classical MDS (Double Centering + Power Iteration) |
| `labels.ts` | Deutsche Labels für alle Enum-Werte (kamera-menü-konform) + Select-Daten für Formulare |
| `recipeImageExport.ts` | `exportRecipeAsPng(recipe)` → PNG-Download via Canvas 2D API im fujirecipes.co OCR-Format |
| `api/client.ts` | Axios-Instanz mit JWT-Interceptor (automatischer `Authorization`-Header) |
| `api/recipes.ts` | React Query Hooks für alle Recipe-Endpoints; `['recipe', id]` (Einzel) vs. `['recipes', ...]` (Liste) als separate Cache-Namespaces |
