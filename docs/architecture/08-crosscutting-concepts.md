# 08 — Querschnittliche Konzepte

## Authentifizierung und Autorisierung

**JWT (Stateless)**
- Login via `POST /api/auth/login` → JWT (24 h Gültigkeit, konfigurierbar via `JWT_EXPIRATION_MS`)
- Alle `/api/**`-Endpoints außer `/api/auth/**` erfordern `Authorization: Bearer <token>`
- `JwtAuthFilter` validiert jeden Request; kein Session-State auf dem Server
- BCrypt für Passwort-Hashing (Spring Security Default-Stärke)
- Initial-Admin wird beim Start angelegt, falls kein User in der DB existiert

**Rate Limiting**
- `LoginRateLimiter`: 5 fehlgeschlagene Versuche → 15 Min. IP-Lockout
- In-memory (`ConcurrentHashMap`); reset bei App-Neustart (akzeptiertes Risiko, Single-Instance)

**Content Security Policy**
```
default-src 'self';
script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
frame-ancestors 'none'
```

---

## Bild-Handling

**Upload**
- Multipart-Upload, max. 20 MB pro Datei (Spring), 25 MB pro Request
- MIME-Typ wird per Magic Bytes erkannt (`ImageUtils.detectMimeType()`) — nicht dem HTTP-`Content-Type`-Header vertraut
- Dateiname: UUID-basiert; Original-Dateinamen werden nie im Filesystem gespeichert

**Storage**
- Docker-Volume `/app/images`; Spring Boot serviert den Ordner als statische Ressource unter `/images/**`
- Nur der Dateiname wird in der DB (`recipe_image.filename`) gespeichert — Storage-Backend kann später ohne DB-Migration gewechselt werden

**EXIF-Extraktion**
- `ImageUtils.extractExifContext()` via `metadata-extractor`-Library
- Extrahiert: ISO, Belichtungszeit, Blende, Brennweite, Weißabgleich, Kameramodell
- Ergebnis wird als Kontext-String an Claude mitgeschickt (verbessert die Qualität der KI-Vorschläge)

---

## Datenbankmigrationen

Flyway in `src/main/resources/db/migration/`. Spring Boot ist auf `ddl-auto: validate` konfiguriert — Hibernate validiert nur das Schema, ändert es nie implizit.

| Migration | Beschreibung |
|---|---|
| V1 | Initiales Schema (`recipe`, `recipe_image`, `app_user`) |
| V2 | `TIMESTAMPTZ` für `created_at`/`updated_at` |
| V3 | `is_favorite` Boolean |
| V4 | `highlight_tone`/`shadow_tone` als `DECIMAL` (0,5er-Schritte) |
| V5 | `iso_mode VARCHAR(20)` |
| V6 | Tags auf lowercase normalisiert (`UPDATE recipe SET tags = ARRAY(SELECT lower(t) FROM unnest(tags) t)`) |
| V7 | `ai_generated` Boolean |
| V8 | `shooting_scenario VARCHAR(20)` |

---

## KI-Integration

**Modell-Allowlist**
Zulässige Modelle: `claude-haiku-4-5-20251001`, `claude-sonnet-4-6`, `claude-opus-4-8`. Ungültige Modell-Parameter fallen auf den Default (`claude-sonnet-4-6`) zurück.

**Prompt-Struktur**
- Bilder werden Base64-kodiert als `image`-Content-Blöcke übermittelt
- Textprompt folgt nach den Bildern (verhindert Token-Knappheit beim Description-Feld)
- Antwortformat ist immer reines JSON; Markdown-Codeblöcke (` ```json `) werden vor dem Parsing entfernt

**Fehlerbehandlung**
- `HttpStatusCodeException` von Anthropic → `AiSuggestionException` → 502 via `GlobalExceptionHandler`
- Fehlender API-Key → Feature nicht verfügbar (503)
- Ungültige Enum-Werte in der KI-Antwort → 502 mit Fehlermeldung

---

## Ähnlichkeits-Algorithmus

`computeSimilarity(a, b)` in `frontend/src/utils/recipeSimilarity.ts` gibt 0–100 zurück (100 = identisch).

**Gewichtung der Parameter:**

| Parameter | Gewicht | Begründung |
|---|---|---|
| Filmsimulation | 4,0 | Visuelle DNA des Recipes; Distanzmatrix statt binär |
| GrainStrength | 2,0 | OFF vs. STRONG ist dramatisch sichtbar |
| HighlightTone / ShadowTone | je 1,5 | Definiert die Stimmung |
| Color / ColorChromeEffect | je 1,5 | Sehr sichtbarer Farbunterschied |
| DynamicRange | 1,0 | |
| ColorChromeFxBlue / WbShiftR / WbShiftB / Clarity | je 0,8 | Subtil aber sichtbar |
| GrainSize | 0,5 | Nur relevant wenn Grain aktiv |
| Sharpness / NoiseReduction | je 0,3 | Geringster Einfluss auf Gesamtlook |

Die **Filmsimulations-Distanzmatrix** teilt Simulationen in 7 fotografische Gruppen ein: `mono` (Acros), `acros` (Acros-Varianten), `sepia`, `neutral` (Provia, Astia, Pro Neg), `filmic` (Classic Chrome, Classic Neg, Nostalgic Neg), `cinema` (Eterna), `vivid` (Velvia). Monochrom vs. Farbe → maximale Distanz (1,0).

`computeMds(recipes)` in `recipePca.ts`:
1. Paarweise Distanzmatrix aus `computeSimilarity()`
2. Classical MDS: Double Centering → Matrix B
3. Power Iteration + Deflation → Top-2 Eigenvektoren mit Eigenwerten
4. 2D-Koordinaten = Eigenvektoren skaliert mit √Eigenwert

**Konvergenz-Check in `powerIter()`:** Statt einer festen Anzahl Iterationen bricht die Power Iteration ab, sobald sich der Vektor zwischen zwei Runden kaum noch ändert (Winkel-Toleranz `1e-10`). `maxIters = 500` ist nur ein Sicherheitsnetz für Fälle mit sehr kleinem Eigenwert-Abstand (typischerweise sehr kleine Bibliotheken); wird es erreicht, loggt die Funktion eine `console.warn`. In Tests mit 1500+ synthetischen Recipe-Kombinationen (auch < 5 Recipes, auch mit gemischten Mono-/Farb-Ausreißern) konvergierte die Iteration immer, im Schnitt nach ~14 Runden.

---

## Error Handling

`GlobalExceptionHandler` (`@ControllerAdvice`) übersetzt Domain-Exceptions in HTTP-Responses:

| Exception | HTTP-Status | Payload |
|---|---|---|
| `RecipeNotFoundException` | 404 | `{message}` |
| `SlotConflictException` | 409 | `{conflictingRecipeId, conflictingRecipeName}` |
| `AiSuggestionException` | 502 | `{message}` |
| Alle anderen | 500 | `{message}` |

---

## Frontend State Management

- **Server-State**: React Query (`@tanstack/react-query`) — Caching, automatisches Re-fetching, Mutation-Handling
- **UI-State**: Lokales `useState` in den jeweiligen Komponenten — kein globaler Store nötig
- **Auth**: JWT im `localStorage`; `isLoggedIn()` prüft Token-Existenz; `RequireAuth`-Wrapper für geschützte Routes
- **Routing**: React Router v6 mit geschachteltem Layout-Route

---

## Logging

Spring Boot Logging via SLF4J/Logback. Log-Level `DEBUG` für `de.fuji.xt50recipes` (konfigurierbar). KI-Requests und -Responses werden vollständig auf `INFO`/`DEBUG` geloggt (inkl. Prompt-Länge, Antwort-Dauer, EXIF-Kontext).

---

## Automatisierte Tests

**Test-Pyramide:**

**Backend (Java/JUnit 5):**

| Schicht | Klasse | Scope | Tooling |
| --- | --- | --- | --- |
| Unit | `RecipeServiceTest` | Slot-Konflikt-Logik, duplicate, setFavorite | Mockito, kein Spring-Context |
| Unit | `ImageUtilsTest` | MIME-Erkennung via Magic Bytes, EXIF-Parsing | JUnit 5, kein Spring-Context |
| Web Slice | `RecipeControllerTest` | HTTP-Mapping, Auth (401), Validation (400/201) | `@WebMvcTest`, MockMvc, `@WithMockUser` |
| Integration | `RecipeRepositoryTest` | PostgreSQL-spezifische `ANY()`-Abfrage, alle Filter | `@DataJpaTest` + Testcontainers (`postgres:16-alpine`) |

**Testcontainers-Hinweis:** `RecipeRepositoryTest` erfordert Docker mit API-Version ≥ 1.40. Lokal mit OrbStack schlägt der Test fehl (docker-java 3.3.6 nutzt API-Version 1.32 hardcoded); in GitHub Actions CI (ubuntu-latest mit nativem Docker) läuft er korrekt durch.

**Frontend (Vitest 2.x):**

| Datei | Scope | Tooling |
| --- | --- | --- |
| `labels.test.ts` | Alle Label-Funktionen und Select-Daten (`dynamicRangeLabel`, `strengthLabel`, `wbModeLabel`, `scenarioLabel` etc.) | Vitest, reines Node-Environment |
| `recipeSimilarity.test.ts` | `computeSimilarity()` (Grenzwerte, Filmsimulations-Gruppen, Monochrome-Gewichtung) und `similarityColor()` | Vitest, reines Node-Environment |

**CI/CD:** GitHub Actions Workflow (`.github/workflows/ci.yml`) führt bei jedem Push auf `main` und bei Pull Requests zwei parallele Jobs aus — `test-backend` (`./gradlew test`) und `test-frontend` (`npm test`). Testergebnisse werden via `dorny/test-reporter` als GitHub-native Check-Run-Annotationen angezeigt (immer verfügbar, nicht nur bei Fehler).
