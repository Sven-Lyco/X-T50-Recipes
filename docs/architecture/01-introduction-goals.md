# 01 — Einführung und Ziele

## Zweck

X-T50 Recipes ist eine persönliche Web-Applikation zur Verwaltung von Fujifilm JPEG-Recipes für die Fujifilm X-T50. Ein „Recipe" beschreibt die vollständige Kombination aller Kameraeinstellungen, die das JPEG-Bild formen: Filmsimulation, Tonkurven, Farbe, Körnung, Weißabgleich und mehr. Die App dient als strukturiertes Notizbuch — welche Einstellungen erzeugen welchen Look, und was liegt gerade auf welchem Custom-Bank-Slot?

## Motivation

Die X-T50 bietet 20 Filmsimulationen und rund 15 einstellbare Parameter. Die Kombinationsmöglichkeiten sind enorm. Ohne Dokumentation gehen erfolgreiche Recipes verloren. Externe Tools (Notizen-Apps, Screenshots) sind fragmentiert und nicht auf diese Kamera zugeschnitten. Die App schließt diese Lücke mit einem vollständig strukturierten Datenmodell, KI-gestützter Generierung und einer visuellen Ähnlichkeits-Map.

## Wesentliche Ziele

| Priorität | Ziel |
|---|---|
| 1 | Recipes persistent speichern und schnell wiederfinden (nach Filmsimulation, Tags, Szenario, Favoriten) |
| 2 | Aktuelle C1–C7-Kamerabelegung jederzeit im Blick behalten und direkt ändern können |
| 3 | Über KI (Claude Vision) aus Referenzfotos passende Einstellungen vorschlagen lassen |
| 4 | Per „Recipe Match" aus einem Foto der Szene die passendste C1–C7-Einstellung empfehlen lassen |
| 5 | Als PWA auf dem iPhone installierbar sein — für den schnellen Zugriff im Feld |

## Qualitätsziele

| Qualität | Ziel |
|---|---|
| Datenschutz | Vollständig selbst gehostet; keine Drittanbieter-Dienste außer Anthropic API (opt-in) |
| Bedienbarkeit | Deutsche Labels exakt nach Kamera-Menü der X-T50 — kein mentales Übersetzen nötig |
| Responsivität | SPA mit React Query; keine merklichen Wartezeiten bei Listenoperationen |
| Sicherheit | Single-User mit JWT-Auth; Login-Rate-Limiting; Content Security Policy |
| Wartbarkeit | Flyway-Migrationen für sichere Schema-Evolution; klares Package-Layout |

## Stakeholder

| Stakeholder | Erwartung |
|---|---|
| Fotograf (einziger Nutzer) | Schneller, zuverlässiger Zugriff auf seine Recipes; KI-Features die Zeit sparen |
