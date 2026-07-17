# 12 — Glossar

| Begriff | Bedeutung |
|---|---|
| **Recipe** | Vollständige Kombination aller Fujifilm-Kameraeinstellungen für die JPEG-Ausgabe: Filmsimulation, Tonkurven, Farbe, Körnung, Weißabgleich u.v.m. |
| **Filmsimulation** | Kernfeature der Fujifilm X-Serie: Emulation von analogen Filmrollen und Looks (z.B. Provia/Standard, Velvia/Vivid, Classic Chrome). Bestimmt maßgeblich den visuellen Charakter des JPEGs. |
| **C1–C7 / Kamera-Slot** | Die sieben Custom-Slots der Fujifilm X-T50. Auf jeden Slot kann ein Recipe gespeichert werden, das direkt am Kamerawahlrad abrufbar ist. Jeder Slot kann maximal ein Recipe belegen. |
| **KI-Generierung** | Feature: Bis zu 5 Referenzfotos hochladen → Claude Vision analysiert den Look → Recipe-Formular wird automatisch mit Einstellungen und Begründung vorbefüllt. |
| **Recipe Match** | Feature: Foto der Szene hochladen → Claude analysiert Lichtstimmung, Motiv und Atmosphäre → empfiehlt welcher C1–C7-Slot am besten zu dieser Situation passt, mit kurzer Begründung pro Empfehlung. |
| **Ähnlichkeits-Score** | Ganzzahliger Wert 0–100 (100 = identisch) aus `computeSimilarity()`. Berechnet aus gewichteten Parameterabständen inkl. einer fotografischen Filmsimulations-Distanzmatrix. |
| **MDS (Multidimensional Scaling)** | Dimensionsreduktionsalgorithmus: bildet eine paarweise Distanzmatrix in einen niedrigdimensionalen Raum ab. Hier: Ähnlichkeits-Distanzmatrix → 2D-Scatter-Plot (Ähnlichkeits-Map). |
| **Classical MDS** | Variante von MDS via Double Centering der quadrierten Distanzmatrix und anschließender Eigenwertzerlegung (Power Iteration + Deflation). Komplett client-seitig in TypeScript implementiert. |
| **EXIF** | In Bilddateien eingebettete Metadaten (ISO, Belichtungszeit, Blende, Brennweite, Kameramodell). Werden automatisch extrahiert und als Kontext-String an Claude übermittelt. |
| **Magic Bytes** | Datei-Signatur in den ersten Bytes einer Datei (z.B. `FF D8 FF` = JPEG, `89 50 4E 47` = PNG). Zuverlässiger zur MIME-Typ-Erkennung als der HTTP-`Content-Type`-Header. |
| **PWA (Progressive Web App)** | Web-Standard, der Installation auf dem Home-Screen (iOS/iPadOS) ermöglicht. X-T50 Recipes ist für iOS-PWA-Installation konfiguriert (`apple-mobile-web-app-capable`, Web App Manifest). |
| **Flyway** | Datenbank-Migrations-Tool: versionierte SQL-Skripte (`V1__`, `V2__`, ...) werden beim App-Start automatisch und genau einmal angewendet. |
| **JWT (JSON Web Token)** | Selbst-enthaltenes, signiertes Token für stateless Authentifizierung. Wird im `localStorage` gespeichert und mit jedem API-Request als `Authorization: Bearer`-Header mitgeschickt. |
| **Shooting Scenario** | Optionale Klassifikation eines Recipes nach Aufnahmesituation: Portrait, Landscape, Street, Low Light, Golden Hour, Macro u.a. Dient als zusätzliches Filterkriterium. |
| **Force (Slot-Zuweisung)** | Parameter bei `PUT /api/recipes/{id}/camera-slot`: `force=true` überschreibt einen bereits belegten Slot ohne Rückfrage; `force=false` gibt einen 409-Fehler zurück, wenn der Slot belegt ist. |
