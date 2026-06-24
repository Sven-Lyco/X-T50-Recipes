# ADR-005: Classical MDS für die Ähnlichkeits-Map

## Status
Entschieden (Nachfolger von PCA)

## Kontext

Die Ähnlichkeits-Map soll Recipes visuell nach fotografischer Ähnlichkeit clustern. Das zentrale Problem: Die Filmsimulation ist der wichtigste Parameter, ist aber ein nominales Enum — sie kann nicht sinnvoll in einen numerischen Feature-Vektor kodiert werden.

## Entscheidung

Classical MDS (Multidimensional Scaling) auf Basis der `computeSimilarity()`-Distanzmatrix, implementiert in `recipePca.ts` (clientseitig, TypeScript).

## Begründung

**PCA (vorheriger Ansatz)** baute einen numerischen Feature-Vektor aus den Parametern und projizierte ihn auf 2 Hauptkomponenten. Das Problem: Filmsimulations-Enums können nicht sinnvoll als Zahlen kodiert werden. Ordinale Kodierung (PROVIA=1, VELVIA=2, ...) würde willkürliche Abstände erzeugen. One-Hot-Kodierung mit 20 Dimensionen würde den Feature-Raum dominieren.

**MDS** startet von einer Distanzmatrix statt Feature-Vektoren. `computeSimilarity()` liefert bereits die semantisch sinnvollen paarweisen Abstände — inklusive einer expliziten Filmsimulations-Distanzmatrix, die fotografische Gruppen abbildet (mono vs. Farbe, neutral vs. cinematic vs. vivid). MDS bildet diese Abstände optimal in 2D ab.

**Implementierung**: Classical MDS via Double Centering + Power Iteration + Deflation. Kein externes Library nötig — komplett client-seitig in TypeScript, ~80 Zeilen Code.

**Alternativen verworfen:**
- UMAP / t-SNE: mächtigere Algorithmen, aber zu komplex für Client-seitige Implementierung ohne Library-Abhängigkeit
- Server-seitige Berechnung: unnötiger Roundtrip; die Daten sind bereits im Client (React Query Cache)

## Konsequenzen

- O(n²) für den Aufbau der Distanzmatrix (akzeptabel bis ~150 Recipes, < 500 ms)
- Power Iteration mit 200 Iterationen konvergiert bei kleinen Bibliotheken (< 5 Recipes) nicht immer zu stabilen Ergebnissen
- Die Map ist nicht deterministisch wenn zwei Eigenwerte sehr ähnlich sind (seltener Grenzfall)
