# 07 — Verteilungssicht

## Multi-Stage Docker Build

```
Dockerfile
├── Stage 1: frontend-build  (node:20-alpine)
│   ├── npm ci
│   └── npm run build  →  /app/frontend/dist/
│
├── Stage 2: backend-build  (gradle:8-jdk21)
│   ├── COPY --from=frontend-build  dist/  →  src/main/resources/static/
│   └── gradle bootJar  →  build/libs/xt50recipes-*.jar
│
└── Stage 3: runtime  (eclipse-temurin:21-jre-alpine)
    ├── COPY app.jar
    ├── EXPOSE 8080
    └── ENTRYPOINT ["java", "-jar", "app.jar"]
```

Das finale Runtime-Image enthält nur das JRE und das Spring Boot Fat-JAR. Kein Node.js, kein Gradle, kein Source-Code.

## Coolify-Deployment auf Hetzner

```
Internet (HTTPS)
       │
  Traefik (Coolify-Reverse-Proxy)
       │
  ┌────┴──────────────────────────────────────┐
  │  Coolify                                  │
  │                                           │
  │  ┌─────────────────────────────────────┐  │
  │  │  App-Service (Spring Boot JAR)      │  │
  │  │  Port: 8080                         │  │
  │  │  Volume: images_data → /app/images  │  │
  │  └──────────────────┬──────────────────┘  │
  │                     │ JDBC (intern)        │
  │  ┌──────────────────▼──────────────────┐  │
  │  │  PostgreSQL-Service (postgres:16)   │  │
  │  │  Volume: postgres_data              │  │
  │  └─────────────────────────────────────┘  │
  └───────────────────────────────────────────┘
```

## Volumes

| Volume | Mount im Container | Inhalt |
|---|---|---|
| `postgres_data` | PostgreSQL-Datenverzeichnis | Alle Recipe-Daten, User-Tabelle |
| `images_data` | `/app/images` | Hochgeladene Rezeptbilder (UUID-Dateinamen) |

## Umgebungsvariablen

Alle sensiblen Werte werden als Coolify-Secrets hinterlegt — niemals im Source-Code oder im Image.

| Variable | Erforderlich | Beschreibung |
|---|---|---|
| `DB_URL` | Ja | JDBC-URL, z.B. `jdbc:postgresql://db:5432/xt50recipes` |
| `DB_USERNAME` | Ja | Datenbankbenutzer |
| `DB_PASSWORD` | Ja | Datenbankpasswort |
| `JWT_SECRET` | Ja | Mindestens 32 Zeichen, zufällig generieren |
| `APP_ADMIN_PASSWORD` | Ja | Login-Passwort (bcrypt-Hash wird intern erzeugt) |
| `ANTHROPIC_API_KEY` | Nein | KI-Features; ohne Key sind `/api/suggest` und `/api/match` deaktiviert |
| `IMAGE_STORAGE_PATH` | Nein | Pfad für Bild-Uploads (Default: `/app/images`) |
| `APP_ADMIN_USERNAME` | Nein | Login-Username (Default: `admin`) |
| `JWT_EXPIRATION_MS` | Nein | Token-Gültigkeit in ms (Default: `86400000` = 24 h) |

## Traefik-Buffering für große Uploads

Ohne die Traefik-Buffering-Middleware kam es bei Bild-Uploads über den Reverse-Proxy zu Problemen (Timeouts/blockierte Requests). Der `app`-Service in [`docker-compose.yml`](../../docker-compose.yml) trägt daher zwei zusätzliche Labels:

```yaml
labels:
  - "traefik.http.middlewares.buffer-uploads.buffering.maxRequestBodyBytes=31457280"
  - "coolify.traefik.middlewares=buffer-uploads"
```

`coolify.traefik.middlewares` ist Coolifys Shorthand-Label: Es wird beim Deployment ausgewertet und in die intern generierte Traefik-Router-Konfiguration eingehängt (erscheint nicht im laufenden Container) — man muss dafür nicht den auto-generierten Router-Namen kennen. Die 30-MB-Grenze liegt knapp über dem Spring-Boot-Limit (`max-request-size: 25MB`, siehe `application.yml`), damit die Middleware nicht selbst zur neuen Engstelle wird.

Diese Labels gehören ins Repo statt in Coolifys UI-Label-Editor, weil "Preserve Repository During Deployment" nicht aktiviert ist — manuelle UI-Änderungen würden beim nächsten Git-Deploy wieder überschrieben.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) führt bei jedem Push auf `main` und bei Pull Requests zwei parallele Jobs aus:
- **test-backend**: `./gradlew test` inkl. Testcontainers-Integration (PostgreSQL); ubuntu-latest hat nativen Docker-Zugang
- **test-frontend**: `npm test` mit Vitest 2.x; Testergebnisse als JUnit XML

Testergebnisse werden via `dorny/test-reporter` als GitHub-native Check-Run-Annotationen im Checks-Tab angezeigt — bei Erfolg und Fehler.

Coolify baut und deployt das Image automatisch bei jedem Push auf `main` (Webhook-Trigger).

## Lokale Entwicklung

```
docker compose up db -d     # PostgreSQL auf Port 5432
./gradlew bootRun            # Backend auf Port 8080
cd frontend && npm run dev   # Frontend auf Port 5173 (Proxy → 8080)
```

Alternativ alles per Docker (entspricht dem Produktiv-Setup):
```
cp docker-compose.override.yml.example docker-compose.override.yml
docker compose up --build -d   # App auf Port 8080
```
