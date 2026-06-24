# ADR-004: Datei-Storage auf Docker-Volume statt Object Storage

## Status
Entschieden

## Kontext

Hochgeladene Rezeptbilder müssen persistent gespeichert werden. Es handelt sich um JPEG/PNG/WebP-Dateien von typischerweise 0,5–5 MB.

## Entscheidung

Bilder auf Docker-Volume `/app/images`; Spring Boot serviert den Ordner als statische Ressource unter `/images/**`. In der DB wird nur der Dateiname gespeichert.

## Begründung

**Kein Setup-Aufwand**: Kein S3-Bucket, keine IAM-Policies, keine Netzwerk-Egress-Kosten, kein SDK. Für ein persönliches Einzel-User-Tool ist der Operational-Overhead von Object Storage nicht gerechtfertigt.

**Ausreichend für die erwartete Datenmenge**: Geschätzte Größenordnung < 2 GB Bilder. Coolify-Volumes können snapshot-gesichert werden.

**Flexibles Backend**: Da nur der Dateiname in der DB gespeichert wird, kann das Storage-Backend später ohne DB-Migration gewechselt werden (z.B. zu MinIO oder S3).

**Direktes Serving**: Spring Boot's `ResourceHttpRequestHandler` liefert die Dateien direkt aus — kein zusätzlicher Nginx nötig.

**Alternativen verworfen:**
- S3 / MinIO: unnötige Komplexität; für ein Einzel-User-Tool kein Mehrwert
- DB-BLOB: schlechte Performance für Bild-Serving; erzwingt App-Routing für jeden Bild-Request

## Konsequenzen

- Volume-Verlust = Bildverlust (kein Built-in Redundancy) — Backup via Coolify-Snapshots
- Bekannte Einschränkung: Traefik/Coolify blockiert aktuell Uploads > ~1 MB (→ [Risiko R1](../11-risks-technical-debt.md))
- Spring Boot ist auf 20 MB pro Datei / 25 MB pro Request konfiguriert
