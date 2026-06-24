# ADR-001: Spring Boot + Java 21 als Backend-Framework

## Status
Entschieden

## Kontext

Für das Backend werden benötigt: HTTP-Server, ORM, Datenbankmigrationen, Security (JWT, BCrypt), EXIF-Verarbeitung und HTTP-Client für die Anthropic API.

## Entscheidung

Java 21 mit Spring Boot 3.

## Begründung

**Spring Security** ist das ausgereifteste Java-Security-Framework. JWT-Integration via `jjwt`, BCrypt via `BCryptPasswordEncoder`, Filter-Chain via `SecurityFilterChain` — alles kommt out-of-the-box ohne Eigenentwicklung.

**Spring Data JPA + Flyway** ist ein erprobtes Gespann für Schema-Evolution. `ddl-auto: validate` stellt sicher, dass das Schema niemals implizit geändert wird — nur Flyway-Migrationen dürfen das.

**`metadata-extractor`** (Drew Noakes) ist eine Java-Bibliothek ohne vollwertige portierbare Entsprechung in anderen Runtimes. Sie extrahiert EXIF-Metadaten direkt aus Binärdaten — ideal für den KI-Kontext.

**Java 21 Records** machen DTOs (`RecipeRequest`, `RecipeResponse`, `RecipeListItem`) kompakt, immutable und typsicher ohne Boilerplate.

**Spring Boot Fat-JAR**: ein einziges Artefakt für das Deployment — kein Application-Server, kein Konfigurationsaufwand. Zusammen mit dem Multi-Stage-Dockerfile und `eclipse-temurin:21-jre-alpine` ergibt sich ein kleines, sicheres Runtime-Image.

**Alternativen verworfen:**
- Node.js/Express: kein nativer EXIF-Support; schwächeres Typ-System zur Runtime; Spring Security hat keinen gleichwertigen Ersatz
- Python/FastAPI: ausgezeichnetes Framework, aber Spring Security + JPA + Flyway bieten für diese Kombination mehr out-of-the-box; GIL kann bei parallelen Bild-Uploads relevant werden

## Konsequenzen

- Build-Zeit länger als bei interpretierten Sprachen (Gradle + Docker-Build)
- Kein Hot-Reload im laufenden Container (Spring DevTools nicht konfiguriert)
- Java 21 Virtual Threads (`spring.threads.virtual.enabled=true`) wären für die blockierenden Anthropic-API-Calls nützlich — aktuell nicht genutzt
