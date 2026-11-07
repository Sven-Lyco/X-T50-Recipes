# Fuji Recipe Manager – Produktreferenz

> Aus `CLAUDE.md` ausgelagert (Retro 2026-11-07). Beschreibt Datenmodell, Screens, API, Migrationen und geplante Features.
> Bei Abweichungen gilt der Code. Architektur: `docs/architecture/` (arc42).

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
| shootingScenario       | Enum (nullable)    | PORTRAIT, LANDSCAPE, STREET, LOW_LIGHT, GOLDEN_HOUR, BLUE_HOUR, NIGHT, NATURE, WILDLIFE, TRAVEL, ARCHITECTURE, INTERIOR, FOOD, MACRO, SPORT, EVENT, WEDDING, BEACH, FOG               |
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
   nach Tags, Filmsimulation, Shooting-Szenario und Favoriten
2. **Detailansicht** – alle Parameter in Sektionen (Bildparameter, Körnung & Effekte,
   Weißabgleich, Monochrome Farbe), Bildergalerie, Beschreibung, Referenz-Link, Tags,
   "Ähnliche Recipes" (Top-5 nach `computeSimilarity()`-Score), PDF-Export, A6-Karten-Export,
   ZIP-Export, PNG-Export (fujirecipes.co Screenshot-Import-Format), Duplizieren
3. **Kamera-Dashboard** – Übersicht der sieben C1–C7-Slots mit jeweils zugeordnetem
   Recipe (Name + Vorschaubild); Neuzuordnung direkt aus dem Dashboard möglich
4. **Anlegen/Bearbeiten-Formular** – alle Recipe-Felder editierbar inkl. Shooting-Szenario,
   Bild-Upload (Multipart, Drag-and-Drop-Sortierung); Bilder können nur im Bearbeitungsmodus
   (nicht beim Neuanlegen) hinzugefügt werden; beim Speichern wird geprüft ob ein anderes
   Recipe ≥ 85 % ähnlich ist (`computeSimilarity()`); wenn ja: Modal mit Links zu den
   ähnlichen Recipes und Score-Badge — kein hartes Blockieren, „Trotzdem speichern" möglich
5. **Recipes vergleichen** – Auswahl von bis zu 4 Recipes, Side-by-Side-Parametertabelle
   mit Hervorhebung von Unterschieden, client-seitiger Ähnlichkeits-Score (0–100%,
   hoch = ähnlich = rot, niedrig = verschieden = grün)
6. **KI-Generierung** – bis zu 5 Referenzfotos hochladen, optionale Beschreibung des
   gewünschten Looks; Claude Vision analysiert die Bilder und befüllt das Recipe-Formular
   vor (Name, alle Parameter, Begründung). EXIF-Metadaten (ISO, Belichtungszeit, Blende)
   werden automatisch extrahiert und als Kontext mitgeschickt. KI-Modell wird aus den
   Einstellungen übernommen. KI-generierte Recipes erhalten ein „KI-Generiert"-Badge in der UI.
7. **Ähnlichkeits-Map** – alle Recipes als interaktive 2D-Punktwolke (MDS-Projektion auf
   Basis von `computeSimilarity()`), ähnliche Recipes clustern zusammen, Farbe = Filmsimulation,
   Klick → Detailansicht; optional nur C1–C7-Slots anzeigen; komplett client-seitig
8. **Recipe Match** – einzelnes Foto hochladen; Claude Vision analysiert visuellen Charakter
   (Tonkurve, Farbpalette, Körnung, Stimmung) und gibt die 3 am besten passenden Recipes
   aus der Bibliothek zurück; optional auf C1–C7-Slots einschränken; KI-Modell aus Einstellungen
9. **Slot-Protokoll (`/protocol`)** – Verlauf aller C1–C7-Slot-Änderungen; wird automatisch
   bei jeder Slot-Zuweisung via `PUT /api/recipes/{id}/camera-slot` geschrieben; Protokollseite
   zeigt 7 Slot-Cards (aktiv/stabil-Badge basierend auf Wechseln in den letzten 30 Tagen) +
   chronologische Tabelle mit Links auf die beteiligten Recipes; Einträge bleiben nach
   Recipe-Löschung erhalten (kein FK zur Recipe-Tabelle); DB-Tabelle `slot_change_log`
10. **Einstellungsseite (`/settings`)** – zwei Sektionen:
   - *Datensicherung*: Backup aller Recipes (JSON + Bilder) inkl. C1–C7-Belegung, Favoriten und
     Slot-Protokoll als ZIP herunterladen oder aus Backup-ZIP wiederherstellen. Der Import
     **ersetzt** den kompletten Bestand (nach Sicherheitsabfrage), er addiert nicht; Fortschritt
     und Ergebnis erscheinen in einer Meldung, die bis zum Schließen stehen bleibt
   - *KI-Einstellungen*: KI-Funktionen global an-/ausschalten (versteckt „Recipe generieren"
     und „Recipe Match" aus der Navigation); Standard-KI-Modell wählen (Haiku/Sonnet/Opus);
     Toggle ist deaktiviert wenn kein `ANTHROPIC_API_KEY` konfiguriert ist (`GET /api/ai-status`)

## API-Skizze (REST)

- `POST /api/auth/login`
- `GET /api/recipes` (Filter: filmSimulation, tag, favorite, scenario)
- `GET /api/recipes/{id}`
- `POST /api/recipes`
- `PUT /api/recipes/{id}`
- `DELETE /api/recipes/{id}`
- `POST /api/recipes/{id}/duplicate` → neues Recipe (Name = "Kopie von …", kein Slot)
- `GET /api/recipes/{id}/export` → ZIP (JSON + alle Bilder)
- `POST /api/recipes/import` (Multipart: ZIP) → Recipe
- `POST /api/recipes/{id}/images` (Multipart-Upload)
- `DELETE /api/recipes/{id}/images/{imageId}`
- `PUT /api/recipes/{id}/images/reorder`
- `GET /api/camera-status` (alle Recipes mit cameraSlot != NULL, sortiert C1–C7)
- `PUT /api/recipes/{id}/camera-slot` (Slot zuweisen/entfernen)
- `PUT /api/recipes/{id}/favorite`
- `POST /api/suggest` (Multipart: images[], description?, model?) → RecipeRequest JSON
- `POST /api/match` (Multipart: image, model?, onlySlots?) → RecipeMatchResponse[]
- `GET /api/ai-status` → `{ available: boolean }` (prüft ob ANTHROPIC_API_KEY gesetzt)
- `GET /api/backup` → ZIP aller Recipes (je `{uuid}/recipe.json` + `{uuid}/images/*`) plus
  `slot-protocol.json` (alle Slot-Wechsel) im ZIP-Root
- `POST /api/backup` (Multipart: file=ZIP) → wiederhergestellte Recipes als Liste. Vollständiger
  Restore: löscht alle Recipes, Bilder (DB + Dateien) und das Slot-Protokoll und legt den Stand
  des Backups an, inkl. `cameraSlot`, `favorite`, `createdAt`/`updatedAt` und Bild-Captions.
  Recipes bekommen neue IDs, die Protokoll-Referenzen werden darauf umgeschrieben.
  Alles-oder-nichts: das ZIP wird vor dem Löschen validiert (kein Recipe oder ungültiges JSON
  → 400, nichts verändert), Fehler danach rollen die Transaktion zurück; alte Bilddateien werden
  erst nach dem Commit gelöscht. Enthält das ZIP keine `slot-protocol.json` (altes Backup),
  bleibt das vorhandene Protokoll unverändert.
- `POST /api/recipes/import` (einzelnes Recipe-ZIP) addiert weiterhin, ohne Slot und Favorit
- `GET /api/slot-protocol` → alle Slot-Wechsel-Einträge, neueste zuerst

## DB-Migrationen

- V1: Initiales Schema
- V2: Timestamp-Typen
- V3: Favoriten-Feld
- V4: Highlight/Shadow Tone als Decimal (0,5er-Schritte)
- V5: iso_mode VARCHAR(20)
- V6: Tags auf lowercase normalisiert
- V7: ai_generated BOOLEAN
- V8: shooting_scenario VARCHAR(20)
- V9: slot_change_log Tabelle (kein FK zur Recipe-Tabelle)

## Geplante Features

- **Recipe-Variation** – bestehendes Recipe als Ausgangspunkt: KI kennt alle aktuellen
  Werte und schlägt eine gezielte Abwandlung vor („wärmer", „mehr analog", „weniger Körnung");
  Ergebnis landet wie bei der KI-Generierung im Bearbeiten-Formular zur Kontrolle
- **Collections** – Recipes in benannte Sets gruppieren (z.B. „Hochzeit", „Japan-Trip 2024"),
  unabhängig von Tags; eigene DB-Tabelle mit m:n-Relation; Collections als Filter in der
  Bibliothek auswählbar
- **Auto-Beschreibung generieren** – Button in der Detailansicht/Bearbeitungsformular;
  schickt nur die Recipe-Parameter (ohne Bild) an Claude und bekommt eine Erklärung zurück
  warum diese Kombination fotografisch funktioniert (Stimmung, Tonkurve, Farbpalette);
  befüllt das `description`-Feld vor, das der User noch bearbeiten kann
- **Recipe aus Fuji-JPEG erstellen** – Fujifilm schreibt Film-Simulation und Kameraparameter
  in die EXIF-MakerNotes jedes JPEGs; Upload eines Kamera-JPEGs extrahiert die tatsächlich
  verwendeten Einstellungen und befüllt das Recipe-Formular exakt (nicht KI-geschätzt);
  `metadata-extractor`-Library ist bereits im Projekt und unterstützt Fujifilm-MakerNotes


## KI-Features (Anthropic)

### Recipe generieren (`POST /api/suggest`)

- Bis zu 5 Bilder als Multipart (`images[]`), optionale `description`, optionales `model`
- MIME-Typ wird aus Magic Bytes erkannt (nicht dem HTTP-Header vertraut)
- EXIF-Metadaten (ISO, Belichtungszeit, Blende, Kameramodell) werden automatisch extrahiert
  und als Kontext im Prompt mitgeschickt (`metadata-extractor` Library)
- Modelle: `claude-opus-5-5` (Default), `claude-sonnet-5-5`, `claude-haiku-4-5-20251001`
- max_tokens: 16000 (`AiConstants.MAX_TOKENS`, für alle KI-Calls) – Thinking-Tokens zählen mit
- Opus 5.5 / Sonnet 5.5 denken standardmäßig: die Antwort beginnt mit `thinking`-Blöcken,
  der Text wird deshalb über `AnthropicResponse.extractText()` gelesen (nie `content[0]`)
- Prompt-Reihenfolge: technische Felder zuerst, description zuletzt (verhindert Token-Knappheit)
- Env-Var: `ANTHROPIC_API_KEY`

### Recipe Match (`POST /api/match`)

- Ein Bild als Multipart (`image`), optionales `model`, optionaler `onlySlots`-Flag
- Lädt alle Recipes aus der DB (oder nur C1–C7 wenn `onlySlots=true`)
- Formatiert alle Recipes kompakt als Textliste (ID, Name, alle Kameraparameter)
- Schickt Bild + Rezeptliste + EXIF an Claude; Antwort: Top-3-Matches als JSON mit UUID + Begründung
- `@Transactional(readOnly=true)` wegen Lazy-Loading der Images-Collection
- Antwortformat: `[{id, name, filmSimulation, previewImageFilename, cameraSlot, reason}]`

