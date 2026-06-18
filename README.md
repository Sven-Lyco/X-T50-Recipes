# X-T50 Recipes

Persönliche Web-App zur Verwaltung von Fujifilm X-T50 Film-Simulation-Recipes. Recipes enthalten alle JPEG-Kameraeinstellungen, Beispielbilder, Beschreibungen und Tags. Ein Dashboard zeigt, welches Recipe auf welcher Custom-Bank (C1–C7) der Kamera aktiv ist.

## Features

- **Bibliothek** – Kartenraster aller Recipes, filterbar nach Filmsimulation, Tags und Favoriten
- **Detailansicht** – alle Parameter in Sektionen, Bildergalerie, PDF-Export
- **Kamera-Dashboard** – C1–C7-Slots mit Direktzuweisung
- **Vergleichen** – bis zu 4 Recipes Side-by-Side mit Unterschieds-Highlighting und Ähnlichkeits-Score
- **KI-Generierung** – Referenzfoto(s) hochladen → Claude Vision schlägt passende Einstellungen vor
- **PWA** – installierbar auf iOS/iPadOS über den Home-Screen

## Tech-Stack

| Schicht | Technologie |
|---|---|
| Backend | Java 21, Spring Boot 3, Spring Data JPA, Spring Security + JWT |
| Datenbank | PostgreSQL, Flyway-Migrationen |
| Frontend | React, TypeScript, Vite, Mantine UI, React Query |
| KI | Anthropic Claude Vision API |
| Deployment | Docker (Multi-Stage), Coolify, Hetzner |

## Lokale Entwicklung

### Voraussetzungen

- Java 21
- Node.js 20+
- Docker (für PostgreSQL)

### Setup

```bash
# PostgreSQL starten
docker compose up db -d

# Backend starten (Port 8080)
./gradlew bootRun

# Frontend starten (Port 5173, mit Proxy auf Backend)
cd frontend
npm install
npm run dev
```

Die App ist dann unter `http://localhost:5173` erreichbar.

Alternativ alles per Docker starten (entspricht dem Produktiv-Setup):

```bash
docker-compose up --build -d
```

Die App ist dann unter `http://localhost:8080` erreichbar.

### Erster Login

Der initiale Admin-User wird per Flyway-Migration angelegt. Zugangsdaten über die Env-Vars `APP_ADMIN_USERNAME` / `APP_ADMIN_PASSWORD` konfigurierbar (Default: `admin` / kein Passwort gesetzt → muss gesetzt sein).

## Umgebungsvariablen

| Variable | Pflicht | Beschreibung |
|---|---|---|
| `DB_URL` | Ja | JDBC-URL, z.B. `jdbc:postgresql://db:5432/xt50recipes` |
| `DB_USERNAME` | Ja | Datenbankbenutzer |
| `DB_PASSWORD` | Ja | Datenbankpasswort |
| `JWT_SECRET` | Ja | Mindestens 32 Zeichen, zufällig generieren |
| `APP_ADMIN_USERNAME` | Nein | Login-Username (Default: `admin`) |
| `APP_ADMIN_PASSWORD` | Ja | Login-Passwort (bcrypt wird intern erzeugt) |
| `IMAGE_STORAGE_PATH` | Nein | Pfad für Bild-Uploads (Default: `./images`) |
| `ANTHROPIC_API_KEY` | Nein | Für KI-Recipe-Generierung (ohne Key ist der Feature deaktiviert) |
| `JWT_EXPIRATION_MS` | Nein | Token-Gültigkeit in ms (Default: 86400000 = 24h) |

## Deployment (Coolify)

Das Projekt nutzt ein Multi-Stage Dockerfile: Das React-Build wird nach `src/main/resources/static` kopiert, Spring Boot liefert Frontend und API aus einem einzigen Image aus.

In Coolify:
1. **App-Service** aus diesem Repo aufbauen
2. **PostgreSQL-Service** hinzufügen, Credentials via Env-Vars verbinden
3. **Volume** für Bild-Uploads mounten auf `/app/images`
4. Alle Pflicht-Env-Vars als Secrets eintragen
5. `ANTHROPIC_API_KEY` optional für KI-Feature

## KI-Generierung

Unter „Recipe generieren" können bis zu 5 Referenzfotos (JPEG, PNG, WebP, GIF) hochgeladen werden. Claude Vision analysiert den Look und befüllt das Recipe-Formular vor – inklusive Name und Begründung auf Deutsch. Das Ergebnis kann vor dem Speichern frei angepasst werden.

Modellauswahl im UI:
- **Haiku 4.5** – schnell und günstig
- **Sonnet 4.6** – bessere Bildanalyse (empfohlen)
- **Opus 4.8** – stärkstes Modell

KI-generierte Recipes erhalten in der Bibliothek und Detailansicht ein violettes „KI-Generiert"-Badge.
