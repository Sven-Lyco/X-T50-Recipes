# 10 — Qualitätsanforderungen

## Qualitätsszenarien

| ID | Qualität | Szenario | Zielwert |
|---|---|---|---|
| Q1 | Bedienbarkeit | Fotograf öffnet App im Feld (iPhone) und findet sein Recipe | < 3 Klicks; Filter nach Filmsimulation + Tag + Favorit |
| Q2 | Performance | Bibliothek mit 50 Recipes lädt vollständig | < 1 Sekunde (React Query Cache nach erstem Load) |
| Q3 | Performance | MDS-Karte mit 50 Recipes wird berechnet und gerendert | < 500 ms (O(n²) clientseitig, akzeptabel bis ~150 Recipes) |
| Q4 | Sicherheit | Brute-Force-Angriff auf Login | Rate-Limiting: 5 Versuche / 15 Min. Lockout per IP |
| Q5 | Sicherheit | XSS-Angriff via präpariertem Rezeptinhalt | Strikte CSP; kein `eval()` im App-Code; React escapet per Default |
| Q6 | Datenschutz | Keine Daten an Dritte ohne explizite Nutzeraktion | Keine Analytics; kein Telemetry; Anthropic API nur on-demand |
| Q7 | Wartbarkeit | Neues Datenbankfeld hinzufügen | Flyway-Migration schreiben, deployen — kein manueller SQL nötig |
| Q8 | Portabilität | App auf neuem iOS-Gerät nutzen | Als PWA über Safari „Zum Home-Bildschirm" installierbar |
| Q9 | Zuverlässigkeit | App-Neustart nach Update | Flyway-Migrationen laufen automatisch; kein manueller Eingriff |

## Noch nicht erfüllte Anforderungen

| Qualität | Lücke | Verweis |
|---|---|---|
| Testbarkeit | Keine automatisierten Tests vorhanden | [Risiko R3](11-risks-technical-debt.md) |
| Upload-Zuverlässigkeit | Traefik blockiert Uploads > ~1 MB | [Risiko R1](11-risks-technical-debt.md) |
