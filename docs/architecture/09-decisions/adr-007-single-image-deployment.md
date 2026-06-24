# ADR-007: React-Frontend wird in das Spring Boot JAR eingebettet

## Status
Entschieden

## Kontext

Frontend (React SPA) und Backend (Spring Boot API) müssen zusammen deployed werden. Coolify verwaltet Services. Die App soll unter einer einzigen Domain erreichbar sein.

## Entscheidung

Multi-Stage Dockerfile: React-Build wird nach `src/main/resources/static` kopiert. Spring Boot liefert Frontend und API aus einem einzigen Image. `SpaFallbackController` leitet alle Nicht-API-Routen auf `index.html`.

## Begründung

**Ein Service in Coolify** statt zwei (kein separater Nginx oder CDN-Service). Das reduziert Konfigurationsaufwand, Monitoring-Overhead und potenzielle Synchronisations-Probleme.

**Kein CORS**: Frontend und API laufen auf demselben Origin (`/` und `/api/**`). Keine CORS-Konfiguration nötig, keine preflight-Requests.

**Atomares Deployment**: Frontend und Backend werden immer zusammen gebaut und deployed — kein Versionierungs-Mismatch zwischen SPA und API möglich.

**`SpaFallbackController`**: Leitet alle Requests, die keine API-Routes und keine statischen Dateien sind, auf `index.html` — React Router kann dann client-seitig routen.

**`ImageResourceConfig`**: Das Bild-Volume `/app/images` wird als separate statische Ressource unter `/images/**` gemountet — außerhalb des JAR, direkt vom Filesystem.

**Alternativen verworfen:**
- Separater Nginx-Service: zusätzlicher Service in Coolify, CORS-Konfiguration, zwei getrennte Build-Pipelines
- Vercel/Netlify für Frontend: externe Abhängigkeit, CORS, kein Offline-Betrieb

## Konsequenzen

- Build-Zeit: Node.js-Build + Gradle-Build laufen sequenziell im Docker-Build
- Bei Frontend-only-Änderungen muss das gesamte Image neu gebaut werden (kein separates Caching)
- Kein CDN-Edge-Caching für statische Assets (akzeptiert für Single-User-Tool)
- Spring Boot's `spring.web.resources.add-mappings: false` deaktiviert den Default-Static-Handler; nur explizit konfigurierte Pfade (`/images/**`, `/static/**`) werden serviert
