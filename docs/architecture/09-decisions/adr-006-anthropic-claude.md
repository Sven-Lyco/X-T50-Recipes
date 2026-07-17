# ADR-006: Anthropic Claude Vision für KI-Features

## Status
Entschieden

## Kontext

Zwei KI-Features sind geplant: (1) Aus Referenzfotos passende Recipe-Parameter vorschlagen; (2) Foto der Szene hochladen → KI analysiert Lichtstimmung und Motiv und empfiehlt welcher C1–C7-Slot am besten passt. Beide Features erfordern Bild-Analyse (Vision) und strukturierten Text-Output (JSON).

## Entscheidung

Anthropic Claude Vision API. Verfügbare Modelle: `claude-haiku-4-5-20251001` (schnell/günstig), `claude-sonnet-4-6` (empfohlen), `claude-opus-4-8` (stärkstes Modell). Der Nutzer wählt das Modell pro Aufruf.

## Begründung

**Vision-Qualität**: Claude Vision analysiert Farbpaletten, Tonkurven, Körnung und fotografischen Stil zuverlässig. Die Antwortqualität für „welche Filmsimulation erzeugt diesen Look" ist hoch.

**Strukturierter JSON-Output**: Claude folgt strikten Prompts mit JSON-Ausgabe konsistent. Das JSON-Parsing ist robust (Markdown-Code-Fences werden automatisch entfernt).

**Deutsche Prompts**: Claude antwortet auf Deutsch — das Beschreibungsfeld des Recipes wird auf Deutsch befüllt, was der deutschen UI entspricht.

**Modell-Flexibilität**: Haiku für schnelle/günstige Anfragen (Batch-Testing neuer Recipes), Sonnet als produktiver Default, Opus für maximale Analyse-Tiefe.

**Opt-in-Integration**: Ohne `ANTHROPIC_API_KEY` sind beide Endpoints vollständig deaktiviert. Die App ist ohne KI-Features voll funktionsfähig.

**Alternativen verworfen:**
- OpenAI GPT-4V: gleichwertige Vision-Qualität, aber kein struktureller Vorteil gegenüber Claude
- Lokale Modelle (Ollama/LLaVA): zu schwach für präzise Filmsimulations-Analyse; Infra-Aufwand nicht gerechtfertigt

## Konsequenzen

- Externe Netzwerk-Abhängigkeit auf `api.anthropic.com` bei KI-Aufrufen
- Kosten entstehen pro API-Call (Haiku: sehr günstig; Opus: signifikant teurer)
- Base64-Kodierung großer Bilder erhöht Request-Größe (5 × 5 MB = ~34 MB Request — Traefik-Limit beachten)
- Antwortformat kann sich bei Modell-Updates leicht ändern — robustes JSON-Parsing wichtig
