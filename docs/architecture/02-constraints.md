# 02 — Randbedingungen

## Technische Randbedingungen

| Randbedingung | Begründung |
|---|---|
| Deployment auf Coolify / Hetzner | Bestehende Infrastruktur; kein Cloud-Anbieter-Lock-in |
| Docker / Docker Compose | Reproduzierbare Builds; einfaches lokales Entwickeln und Deployen |
| PostgreSQL als Datenbank | Native Array-Unterstützung für Tags; bewährte Flyway-Integration |
| Single-Deployable-Artifact | Ein Docker-Image liefert Frontend + API — kein separater CDN/Webserver nötig |
| Bild-Storage als Datei-Volume | Kein S3-Setup für ein persönliches Projekt erforderlich |
| Anthropic Claude API (extern) | Nur für KI-Features; App ist ohne API-Key vollständig funktionsfähig |
| Java 21 + Spring Boot 3 | Typsicheres, produktionsreifes Backend-Ökosystem |
| React + TypeScript + Vite | Modernes, typsicheres Frontend-Tooling |

## Organisations- und Scope-Randbedingungen

| Randbedingung | Begründung |
|---|---|
| Ausschließlich Fujifilm X-T50 | Multi-Kamera-Support würde das Datenmodell erheblich komplizieren |
| Single-User, kein Registrierungs-Flow | Persönliches Tool; kein öffentlicher Zugang |
| Deutsche Benutzeroberfläche | Labels entsprechen dem deutschen Kamera-Menü der X-T50 |
| Kein direktes Kamera-Interface | Die X-T50 hat keine offizielle API; Slots werden manuell gepflegt |

## Bekannte technische Einschränkungen

| Einschränkung | Status |
|---|---|
| Traefik (Coolify) blockiert Uploads > ~1 MB | Offen: Traefik-Middleware für Body-Buffering muss in Coolify konfiguriert werden. Spring Boot selbst ist auf 20 MB konfiguriert. |
| Rate-Limiter ist in-memory | Akzeptiert: Reset bei App-Neustart; kein Problem bei Single-Instance-Deployment |
