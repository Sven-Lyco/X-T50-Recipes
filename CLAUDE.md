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
- KI-gestützte Recipe-Generierung aus Bildern via Anthropic API (implementiert)

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
- State Management: bewusst leichtgewichtig halten (React Query für Server-State,
  kein Redux nötig für eine CRUD-App dieser Größe)
- Mantine UI (`@mantine/core`) für Komponenten, `@emotion/styled` für Custom-Styling (kein Plain CSS, keine Inline-Styles)
- `@react-pdf/renderer` für PDF-Export
- Responsive/mobilfreundlich inkl. PWA-Konfiguration (apple-mobile-web-app-capable,
  Web App Manifest) für iOS/iPadOS Home-Screen-Installation

### Deployment

- Multi-Stage Dockerfile: React-Build wird nach `src/main/resources/static` kopiert,
  Spring Boot liefert Frontend + API aus einem Image
- Ein Coolify-Service (App) + ein Postgres-Service + ein Volume für Bilder
- Hetzner-Server via Coolify

## Datenmodell

### Recipe

| Feld                   | Typ                | Beschreibung                                                                                                                                                                          |
| ---------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                     | UUID               |                                                                                                                                                                                       |
| name                   | String             |                                                                                                                                                                                       |
| filmSimulation         | Enum               | PROVIA, VELVIA, ASTIA, CLASSIC_CHROME, CLASSIC_NEGATIVE, REALA_ACE, PRO_NEG_HI, PRO_NEG_STD, ACROS, ACROS_YE, ACROS_R, ACROS_G, MONOCHROME, MONOCHROME_YE, MONOCHROME_R, MONOCHROME_G, SEPIA, NOSTALGIC_NEG, ETERNA, ETERNA_BLEACH_BYPASS |
| dynamicRange           | Enum               | DR_AUTO, DR100, DR200, DR400                                                                                                                                                          |
| highlightTone          | Decimal            | -2 .. +4, 0,5er-Schritte (13 Stufen)                                                                                                                                                  |
| shadowTone             | Decimal            | -2 .. +4, 0,5er-Schritte (13 Stufen)                                                                                                                                                  |
| color                  | Integer            | -4 .. +4                                                                                                                                                                              |
| sharpness              | Integer            | -4 .. +4                                                                                                                                                                              |
| noiseReduction         | Integer            | -4 .. +4                                                                                                                                                                              |
| grainStrength          | Enum               | OFF, WEAK, STRONG                                                                                                                                                                     |
| grainSize              | Enum (nullable)    | SMALL, LARGE – nur relevant wenn grainStrength != OFF; wird automatisch auf SMALL defaulted wenn grainStrength aktiviert wird                                                          |
| colorChromeEffect      | Enum               | OFF, WEAK, STRONG                                                                                                                                                                     |
| colorChromeFxBlue      | Enum               | OFF, WEAK, STRONG                                                                                                                                                                     |
| whiteBalanceMode       | Enum               | AUTO_WHITE, AUTO, AUTO_AMBIENT, DAYLIGHT, SHADE, FLUORESCENT_1/2/3, INCANDESCENT, UNDERWATER, COLOR_TEMP, CUSTOM_1/2/3                                                                |
| wbShiftRed             | Integer            | -9 .. +9                                                                                                                                                                              |
| wbShiftBlue            | Integer            | -9 .. +9                                                                                                                                                                              |
| colorTempKelvin        | Integer (nullable) | nur wenn whiteBalanceMode = COLOR_TEMP; wird automatisch auf 5200 K defaulted beim Umschalten                                                                                         |
| clarity                | Integer            | -5 .. +5                                                                                                                                                                              |
| monochromeWarmCool     | Integer (nullable) | nur für ACROS*/MONOCHROME*-Simulationen                                                                                                                                               |
| monochromeGreenMagenta | Integer (nullable) | nur für ACROS*/MONOCHROME*-Simulationen                                                                                                                                               |
| isoMode                | String (nullable)  | MANUAL, AUTO_1, AUTO_2, AUTO_3 – ISO-Modus der Kamera                                                                                                                                |
| isoNote                | String (nullable)  | ISO Details, z.B. "max ISO 6400, 1/125 min."                                                                                                                                          |
| expCompNote            | String (nullable)  | z.B. "0 bis -1/3"                                                                                                                                                                     |
| description            | Text (nullable)    | Begründung / "Warum funktioniert das" – wird mit white-space: pre-wrap dargestellt                                                                                                    |
| inspirationSource      | String (nullable)  | "Referenz" – URL oder Freitext; URLs werden als klickbarer Link dargestellt                                                                                                           |
| tags                   | String[]           | z.B. Stimmung, Anlass, Filmstock-Inspiration                                                                                                                                          |
| cameraSlot             | Enum (nullable)    | C1..C7, NULL = Bibliothek/Archiv. UNIQUE (partial index, nur wenn nicht NULL)                                                                                                         |
| favorite               | Boolean            | Favoriten-Markierung                                                                                                                                                                  |
| aiGenerated            | Boolean            | true wenn per KI-Generierung erstellt                                                                                                                                                 |
| createdAt              | Timestamp          |                                                                                                                                                                                       |
| updatedAt              | Timestamp          |                                                                                                                                                                                       |

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
   nach Tags, Filmsimulation und Favoriten
2. **Detailansicht** – alle Parameter in Sektionen (Bildparameter, Körnung & Effekte,
   Weißabgleich, Monochrome Farbe), Bildergalerie, Beschreibung, Referenz-Link, Tags,
   "Ähnliche Recipes" (gleiche Filmsimulation), PDF-Export
3. **Kamera-Dashboard** – Übersicht der sieben C1–C7-Slots mit jeweils zugeordnetem
   Recipe (Name + Vorschaubild); Neuzuordnung direkt aus dem Dashboard möglich
4. **Anlegen/Bearbeiten-Formular** – alle Recipe-Felder editierbar, Bild-Upload (Multipart,
   Drag-and-Drop-Sortierung); Bilder können nur im Bearbeitungsmodus (nicht beim Neuanlegen)
   hinzugefügt werden
5. **Recipes vergleichen** – Auswahl von bis zu 4 Recipes, Side-by-Side-Parametertabelle
   mit Hervorhebung von Unterschieden, client-seitiger Ähnlichkeits-Score (0–100%,
   hoch = ähnlich = rot, niedrig = verschieden = grün)
6. **KI-Generierung** – bis zu 5 Referenzfotos hochladen, optionale Beschreibung des
   gewünschten Looks, Modellauswahl (Haiku/Sonnet/Opus); Claude Vision analysiert die Bilder
   und befüllt das Recipe-Formular vor (Name, alle Parameter, Begründung). KI-generierte
   Recipes erhalten ein „KI-Generiert"-Badge in der UI.

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

## Auth

Single User. Username + Passwort (bcrypt-Hash) in der DB, JWT für die Frontend-Session.
Kein Registrierungs-Flow – initialer User wird per DB-Migration/Seed angelegt.

## API-Skizze (REST)

- `POST /api/auth/login`
- `GET /api/recipes` (mit Filter-Query-Parametern für Tags/Filmsimulation/favorite)
- `GET /api/recipes/{id}`
- `POST /api/recipes`
- `PUT /api/recipes/{id}`
- `DELETE /api/recipes/{id}`
- `POST /api/recipes/{id}/images` (Multipart-Upload)
- `DELETE /api/recipes/{id}/images/{imageId}`
- `PUT /api/recipes/{id}/images/reorder`
- `GET /api/camera-status` (alle Recipes mit cameraSlot != NULL, sortiert C1–C7)
- `PUT /api/recipes/{id}/camera-slot` (Slot zuweisen/entfernen)
- `PUT /api/recipes/{id}/favorite`
- `POST /api/suggest` (Multipart: images[], description?, model?) → RecipeRequest JSON

## DB-Migrationen

- V1: Initiales Schema
- V2: Timestamp-Typen
- V3: Favoriten-Feld
- V4: Highlight/Shadow Tone als Decimal (0,5er-Schritte)
- V5: iso_mode VARCHAR(20)
- V6: Tags auf lowercase normalisiert
- V7: ai_generated BOOLEAN

## KI-Generierung (Anthropic)

- Endpoint: `POST /api/suggest` (JWT-geschützt)
- Bis zu 5 Bilder als Multipart (`images[]`), optionale `description`, optionales `model`
- MIME-Typ wird aus Magic Bytes erkannt (nicht dem HTTP-Header vertraut)
- Modelle: `claude-sonnet-4-6` (Default), `claude-haiku-4-5-20251001`, `claude-opus-4-8`
- max_tokens: 2048 (erhöht wegen description-Feld)
- Prompt-Reihenfolge: technische Felder zuerst, description zuletzt (verhindert Token-Knappheit bei Zahlenwerten)
- Env-Var: `ANTHROPIC_API_KEY`

## Offene Punkte

- Bild-Upload-Limit: Coolify/Traefik blockiert große Uploads (>1 MB?) – Traefik-Middleware
  für Body-Buffering muss in Coolify konfiguriert werden

## Geplante Features

### Kurzfristig

- **Sortierung in der Bibliothek** – nach Name, Datum, Filmsimulation (aktuell nur Datum desc)
- **JSON Export/Import** – einzelnes Recipe als `.json` herunterladen und wieder importieren
- **EXIF aus Referenzfotos lesen** – beim KI-Upload EXIF-Daten (Belichtung, ISO, Weißabgleich)
  extrahieren und als zusätzlichen Kontext an die KI mitschicken
- **Shooting-Szenarien / Kategorien** – strukturierte Zuordnung neben Tags
  (Portrait, Landschaft, Street, Low Light etc.), Filteroption in der Bibliothek

### Ideen für später

- **Visuelle Ähnlichkeits-Map** – alle Recipes als Punkte in 2D (PCA-Dimensionsreduktion
  der numerischen Kameraparameter), ähnliche Recipes clustern zusammen,
  Farbe = Filmsimulation, Klick → Detailansicht; komplett client-seitig, kein Backend nötig
