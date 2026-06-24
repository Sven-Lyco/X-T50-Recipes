# 04 — Lösungsstrategie

## Zentrale Architekturentscheidungen

### 1. Single-Deployable-Artifact
Das React-Frontend wird im Multi-Stage-Docker-Build in das Spring Boot JAR eingebettet. Ein einziges Image liefert Frontend und API — kein CORS, kein separater Service, atomares Deployment. → [ADR-007](09-decisions/adr-007-single-image-deployment.md)

### 2. Klassisches REST-API-Design
Kein GraphQL, kein tRPC. REST passt für eine CRUD-App dieser Größe — vollständige Tool-Unterstützung, einfaches Debuggen über curl/Postman, kein zusätzlicher Build-Aufwand.

### 3. Stateless JWT-Authentifizierung
Kein serverseitiger Session-State. JWT erlaubt zustandslose Anfragen — ideal für die PWA auf iOS und einfach zu implementieren für Single-User. → [ADR-003](09-decisions/adr-003-jwt-auth.md)

### 4. Clientseitige Ähnlichkeitsberechnung
`computeSimilarity()` und die MDS-Projektion laufen vollständig im Browser. Kein Server-Roundtrip für Echtzeit-Ähnlichkeitsanzeigen im Vergleich und in der Map. → [ADR-005](09-decisions/adr-005-mds-similarity.md)

### 5. Datei-Storage für Bilder
Bilder auf Docker-Volume; nur Pfadnamen in der DB. Kein S3-Setup-Aufwand für ein persönliches Tool mit moderatem Bildvolumen. → [ADR-004](09-decisions/adr-004-file-storage.md)

### 6. Anthropic Claude Vision für KI-Features
Zwei KI-Features nutzen Claude Vision. Die Integration ist opt-in: ohne `ANTHROPIC_API_KEY` sind beide Endpoints vollständig deaktiviert. → [ADR-006](09-decisions/adr-006-anthropic-claude.md)

### 7. Java 21 + Spring Boot als Backend
Ausgereiftes Ökosystem für Security (Spring Security), Migrations (Flyway), ORM (JPA) und EXIF-Verarbeitung (metadata-extractor). → [ADR-001](09-decisions/adr-001-spring-boot-java.md)

### 8. Mantine UI + Emotion für das Frontend
Vollständige Komponenten-Bibliothek ohne eigene CSS-Verwaltung; typisierte Custom-Styles via `@emotion/styled`. → [ADR-002](09-decisions/adr-002-mantine-emotion.md)
