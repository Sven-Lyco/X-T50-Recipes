# Fuji Recipe Manager – CLAUDE.md

> X-T50-Recipes

## Projektübersicht

Persönliche Web-Anwendung zur Verwaltung von Fujifilm-JPEG-Recipes (Film-Simulation-Presets)
für die Fujifilm X-T50. Jedes Recipe enthält alle Kameraeinstellungen, Beispielbilder,
eine Beschreibung/Begründung und Tags. Zusätzlich zeigt ein Dashboard, welches Recipe
aktuell auf welcher Custom-Bank (C1–C7) der Kamera geladen ist.

## Scope (v1)

- Nur Fujifilm X-T50 – kein Multi-Kamera-Support
- Keine Historie der C1–C7-Belegung, nur aktueller Stand
- Einfache Bildergalerie pro Recipe (keine Kategorisierung Inspiration/eigene Tests)
- Single-User mit Login (kein Registrierungs-Flow)
- KI-gestützte Recipe-Generierung aus Bildern: **nicht** in v1, aber Datenmodell soll
  das nicht blockieren (z.B. spätere Ergänzung eines Felds für KI-generierte Vorschläge)

## Tech-Stack

### Backend

- Java 21, Spring Boot 3
- Spring Data JPA + Hibernate
- PostgreSQL
- Spring Security + JWT (Single-User-Login, initialer User per Seed/Migration)
- Bild-Upload via Multipart, Speicherung als Dateien auf Docker-Volume,
  nur Pfad/Dateiname wird in der DB referenziert

### Frontend

- React + TypeScript + Vite
- State Management: bewusst leichtgewichtig halten (z.B. React Query für Server-State,
  kein Redux nötig für eine CRUD-App dieser Größe) – bei Bedarf später revidieren
- Responsive/mobilfreundlich, da das "Aktuell auf Kamera"-Dashboard auch unterwegs
  nützlich ist

### Deployment

- Multi-Stage Dockerfile: React-Build wird nach `src/main/resources/static` kopiert,
  Spring Boot liefert Frontend + API aus einem Image
- Ein Coolify-Service (App) + ein Postgres-Service + ein Volume für Bilder
- Hetzner-Server via Coolify

## Datenmodell

### Recipe

| Feld                   | Typ                | Beschreibung                                                                                                                                                       |
| ---------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| id                     | UUID               |                                                                                                                                                                    |
| name                   | String             |                                                                                                                                                                    |
| filmSimulation         | Enum               | PROVIA, VELVIA, ASTIA, CLASSIC_CHROME, CLASSIC_NEGATIVE, REALA_ACE, PRO_NEG_HI, PRO_NEG_STD, ACROS, MONOCHROME, SEPIA, NOSTALGIC_NEG, ETERNA, ETERNA_BLEACH_BYPASS |
| dynamicRange           | Enum               | DR100, DR200, DR400                                                                                                                                                |
| highlightTone          | Decimal            | -2 .. +4, 0,5er-Schritte (13 Stufen)                                                                                                                               |
| shadowTone             | Decimal            | -2 .. +4, 0,5er-Schritte (13 Stufen)                                                                                                                               |
| color                  | Integer            | -4 .. +4                                                                                                                                                           |
| sharpness              | Integer            | -4 .. +4                                                                                                                                                           |
| noiseReduction         | Integer            | -4 .. +4                                                                                                                                                           |
| grainStrength          | Enum               | OFF, WEAK, STRONG                                                                                                                                                  |
| grainSize              | Enum (nullable)    | SMALL, LARGE – nur relevant wenn grainStrength != OFF                                                                                                              |
| colorChromeEffect      | Enum               | OFF, WEAK, STRONG                                                                                                                                                  |
| colorChromeFxBlue      | Enum               | OFF, WEAK, STRONG                                                                                                                                                  |
| whiteBalanceMode       | Enum               | AUTO, DAYLIGHT, SHADE, FLUORESCENT_1/2/3, INCANDESCENT, UNDERWATER, COLOR_TEMP, CUSTOM_1/2/3                                                                       |
| wbShiftRed             | Integer            | typ. -9 .. +9                                                                                                                                                      |
| wbShiftBlue            | Integer            | typ. -9 .. +9                                                                                                                                                      |
| colorTempKelvin        | Integer (nullable) | nur wenn whiteBalanceMode = COLOR_TEMP                                                                                                                             |
| clarity                | Integer            | -5 .. +5                                                                                                                                                           |
| monochromeWarmCool     | Integer (nullable) | nur für ACROS/MONOCHROME                                                                                                                                           |
| monochromeGreenMagenta | Integer (nullable) | nur für ACROS/MONOCHROME                                                                                                                                           |
| isoNote                | String (nullable)  | z.B. "ab ISO 800 für DR400"                                                                                                                                        |
| expCompNote            | String (nullable)  | z.B. "0 bis -1/3"                                                                                                                                                  |
| description            | Text (nullable)    | Begründung / "Warum funktioniert das"                                                                                                                              |
| inspirationSource      | String (nullable)  | z.B. Beschreibung/Link zur Inspirationsquelle                                                                                                                      |
| tags                   | String[]           | z.B. Stimmung, Anlass, Filmstock-Inspiration                                                                                                                       |
| cameraSlot             | Enum (nullable)    | C1..C7, NULL = Bibliothek/Archiv. UNIQUE (partial index, nur wenn nicht NULL)                                                                                      |
| createdAt              | Timestamp          |                                                                                                                                                                    |
| updatedAt              | Timestamp          |                                                                                                                                                                    |

### RecipeImage

| Feld      | Typ               | Beschreibung                  |
| --------- | ----------------- | ----------------------------- |
| id        | UUID              |                               |
| recipeId  | FK -> Recipe      |                               |
| filename  | String            | Pfad/Dateiname auf dem Volume |
| caption   | String (nullable) |                               |
| sortOrder | Integer           | Reihenfolge in der Galerie    |

## Kernfunktionen / Screens

1. **Bibliotheksübersicht** – Kartenraster aller Recipes (Vorschaubild, Name,
   Filmsimulation, Status-Badge "C1"–"C7" oder "Bibliothek"), filter- und durchsuchbar
   nach Tags und Filmsimulation
2. **Detailansicht** – alle Parameter, Bildergalerie, Beschreibung, Inspirationsquelle, Tags
3. **Kamera-Dashboard** – Übersicht der sieben C1–C7-Slots mit jeweils zugeordnetem
   Recipe (Name + Vorschaubild); Neuzuordnung direkt aus dem Dashboard möglich
4. **Anlegen/Bearbeiten-Formular** – alle Recipe-Felder editierbar, Bild-Upload (Multipart)

## Auth

Single User. Username + Passwort (bcrypt-Hash) in der DB, JWT für die Frontend-Session.
Kein Registrierungs-Flow – initialer User wird per DB-Migration/Seed angelegt.

## API-Skizze (REST)

- `POST /api/auth/login`
- `GET /api/recipes` (mit Filter-Query-Parametern für Tags/Filmsimulation)
- `GET /api/recipes/{id}`
- `POST /api/recipes`
- `PUT /api/recipes/{id}`
- `DELETE /api/recipes/{id}`
- `POST /api/recipes/{id}/images` (Multipart-Upload)
- `DELETE /api/recipes/{id}/images/{imageId}`
- `GET /api/camera-status` (alle Recipes mit cameraSlot != NULL, sortiert C1–C7)
- `PUT /api/recipes/{id}/camera-slot` (Slot zuweisen/entfernen)

## Offene Punkte für spätere Phasen

- KI-gestützte Recipe-Generierung aus Bildern (Anthropic API) – Entscheidung steht noch aus
- Export/Teilen einzelner Recipes (z.B. als druckbare Übersicht für unterwegs)
