@AGENTS.md

# Fuji Recipe Manager – CLAUDE.md

> X-T50-Recipes

Persönliche Web-Anwendung zur Verwaltung von Fujifilm-JPEG-Recipes (Film-Simulation-Presets)
für die Fujifilm X-T50, mit Dashboard der Custom-Banks C1–C7.

- **Produktreferenz** (Datenmodell, Screens, REST-API, DB-Migrationen, geplante Features):
  `docs/product-reference.md`
- **Architektur** (arc42): `docs/architecture/`

Diese Datei enthält nur, was man nicht aus dem Code ablesen kann: Konventionen, Fallstricke, Testregeln.

## Tech-Stack und Konventionen

### Backend

- Java 25, Spring Boot 4 (Gradle ≥ 9.9), Spring Data JPA + Hibernate, PostgreSQL
- JSON: Jackson 3 (`tools.jackson.*`; Annotationen bleiben `com.fasterxml.jackson.annotation`).
  `spring.jackson.deserialization.fail-on-null-for-primitives: false` hält fehlende primitive Felder
  (z.B. `force`, `favorite` in alten Backups) beim Default statt 400 – steht in `src/main/resources/application.yml`
  **und** `src/test/resources/application.yml` (die Test-yml ersetzt die Haupt-yml komplett)
- Spring Security + JWT, Single User: Username + Passwort (bcrypt) in der DB, initialer User per
  Migration/Seed, kein Registrierungs-Flow
- Bilder: Multipart-Upload, Dateien auf Docker-Volume, in der DB nur Pfad/Dateiname

### Frontend

- React + TypeScript + Vite
- State: React Query für Server-State, kein Redux
- Mantine UI (`@mantine/core`) für Komponenten, `@emotion/styled` für Custom-Styling (kein Plain CSS, keine Inline-Styles)
- `@react-pdf/renderer` für PDF-Export
- Responsive/mobilfreundlich inkl. PWA-Konfiguration (apple-mobile-web-app-capable,
  Web App Manifest) für iOS/iPadOS Home-Screen-Installation

### Deployment

- Multi-Stage Dockerfile: React-Build wird nach `src/main/resources/static` kopiert,
  Spring Boot liefert Frontend + API aus einem Image
- Coolify auf Hetzner: ein App-Service, ein Postgres-Service, ein Volume für Bilder

## Frontend-Labels (Kamera-Menü-Konformität)

Alle Labels entsprechen den deutschen Kamera-Menü-Bezeichnungen der X-T50:

- Dynamikbereich (DR_AUTO=Auto, DR100=100%, DR200=200%, DR400=400%)
- Spitzlichter / Schatten (statt Highlight/Shadow Tone)
- Hohe ISO-NR (statt Noise Reduction)
- Körnungseffekt / Körnung Größe (statt Grain Strength/Size)
- Farbe Chrome-Effekt / Farbe Chrom FX Blau
- WA Verschieben R/B (statt WB Shift)
- WA Priorität Weiß / AA Priorität Umgebung (AUTO_WHITE / AUTO_AMBIENT)

Label-Funktionen und Select-Daten in `frontend/src/utils/labels.ts`.

## KI-Features (Anthropic) – Fallstricke

- Env-Var: `ANTHROPIC_API_KEY`; `GET /api/ai-status` meldet, ob er gesetzt ist
- Modelle: `claude-opus-5-5` (Default), `claude-sonnet-5-5`, `claude-haiku-4-5-20251001`
- max_tokens: 16000 (`AiConstants.MAX_TOKENS`, für alle KI-Calls) – Thinking-Tokens zählen mit
- Opus 5.5 / Sonnet 5.5 denken standardmäßig: die Antwort beginnt mit `thinking`-Blöcken,
  der Text wird deshalb über `AnthropicResponse.extractText()` gelesen (nie `content[0]`)
- MIME-Typ hochgeladener Bilder wird aus Magic Bytes erkannt (nicht dem HTTP-Header vertraut)
- EXIF (ISO, Belichtungszeit, Blende, Kameramodell) wird mit `metadata-extractor` gelesen und als Kontext mitgeschickt
- `/api/suggest`: Prompt-Reihenfolge technische Felder zuerst, description zuletzt (verhindert Token-Knappheit)
- `/api/match`: `@Transactional(readOnly=true)` wegen Lazy-Loading der Images-Collection

## Dependency-Overrides (CVE-Fixes)

- Direkte Abhängigkeiten werden direkt angehoben (`frontend/package.json`, Spring-Boot-Version in `build.gradle`)
- Transitive Abhängigkeiten werden überschrieben:
  - Frontend: `overrides` in `frontend/package.json`
  - Backend: aktuell keine. Bei Bedarf `gradle/dependency-overrides.gradle` anlegen (Spring-Boot-BOM-Properties
    wie `ext['tomcat.version']` bzw. `dependencyManagement` für nicht verwaltete Artefakte) und per `apply from`
    in `build.gradle` einbinden
- Overrides entfernen, sobald die Elternabhängigkeit die gefixte Version selbst mitbringt

## Testing-Strategie

### Coverage

Ziel: ≥ 80 % Line-Coverage auf beiden Seiten.

- **Backend:** erzwungen. JaCoCo-Threshold 80 % Lines in `build.gradle`, läuft mit `./gradlew check`
  (lokal und in CI).
- **Frontend:** nicht erzwungen. `vite.config.ts` hat keinen Threshold, `npm test` misst keine Coverage
  (Stand 2026-11-07: 63,9 % Lines laut Owner; messen mit `npm --prefix frontend test -- --coverage`).

### Backend

| Schicht | Test-Ansatz | Beispiel |
|---|---|---|
| Service-Layer | Mockito (`@ExtendWith(MockitoExtension.class)`) | `RecipeServiceTest`, `AiSuggestionServiceTest` |
| HTTP-Layer | `@WebMvcTest` + `@MockitoBean` + MockMvc | `RecipeControllerTest`, `AuthControllerTest` |
| Repository | `@DataJpaTest` + Testcontainers PostgreSQL | `RecipeRepositoryTest` |
| Utility-Klassen | Plain JUnit 5, kein Spring-Kontext | `JwtUtilTest`, `LoginRateLimiterTest` |

**Wichtige Eigenheiten:**
- `RecipeRepositoryTest` wird lokal automatisch übersprungen (docker-java sendet beim Handshake API-Version 1.32, OrbStack 2.x verlangt ≥ 1.40). Lokal: `./gradlew check`; mit Opt-in: `./gradlew check -PallTests`; in CI (`CI`-Env-Var) läuft er immer.
- `@WebMvcTest` lädt `SecurityConfig` nicht (JwtAuthFilter ist `@Component`, wird aus Slice-Scan ausgeschlossen) → Default-Security mit CSRF+Auth-everywhere gilt. Für permit-all-Endpoints (z.B. `/api/auth/login`) deshalb `@WithMockUser` + `.with(csrf())` verwenden.
- `@Value`-injizierte Felder in Services per `ReflectionTestUtils.setField(service, "fieldName", value)` setzen.
- `AppProperties` ist ein Record → direkt instanziieren: `new AppProperties(secret, expMs, storagePath, user, pass, apiKey)`.

### Frontend

- **Test-Umgebung:** jsdom — ermöglicht DOM, localStorage und React-Rendering
- **React-Komponenten:** `@testing-library/react` + `renderWithProviders()` aus `src/test-utils.tsx` (enthält QueryClientProvider, MemoryRouter, SettingsProvider)
- **API-Hooks:** per `vi.mock('../api/recipes')` gemockt — keine echten HTTP-Requests
- **Pure Utils:** Plain vitest ohne Wrapper (`labels.ts`, `recipeSimilarity.ts`, `recipePca.ts`, `filmSimLabel.ts`)

Aus der Coverage ausgeschlossen (nicht testbar mit jsdom):
- `src/components/RecipePdf.tsx` + `RecipeCardPdf.tsx` — @react-pdf/renderer (PDF-DOM)
- `src/utils/recipeImageExport.ts` — Canvas-API + Web Share API (iOS PWA)
