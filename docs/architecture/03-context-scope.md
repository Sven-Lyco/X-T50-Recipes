# 03 — Systemkontext und Abgrenzung

## Systemkontext

```
                    ┌──────────────────────────────────────┐
                    │          X-T50 Recipes App            │
                    │                                       │
  Browser / PWA ───►│  React SPA  ◄──►  Spring Boot API   │
  (Desktop, iOS)    │                         │             │
                    │                     PostgreSQL        │
                    │                     (Recipes, User)  │
                    │                         │             │
                    │                     Docker Volume     │
                    │                     (Bilder)          │
                    └────────────────────────┬─────────────┘
                                             │
                                    Anthropic Claude API
                                    (Vision, optional)
```

## Externe Schnittstellen

| Schnittstelle | Richtung | Protokoll | Beschreibung |
|---|---|---|---|
| Browser / iOS PWA | → App | HTTPS (über Coolify/Traefik) | Alle Nutzerinteraktionen |
| Anthropic Claude API | App → | HTTPS / REST | KI-Generierung und Recipe Match (opt-in) |
| PostgreSQL | App ↔ | JDBC | Persistenz aller Recipe-Daten und des Admin-Users |
| Docker Volume | App ↔ | Filesystem | Bild-Uploads der Rezeptgalerie |

## Bewusste Abgrenzungen

- **Keine Kamera-Anbindung**: Die X-T50 hat keine offizielle API. C1–C7-Slots werden manuell in der App gepflegt.
- **Kein Sharing oder Multi-User**: Persönliches Einzelnutzer-Tool.
- **Keine Sync mit Fujifilm-Diensten** (X RAW STUDIO, Fujifilm X App etc.).
- **Kein Raw-Processing**: Die App verwaltet JPEG-Recipe-Einstellungen, keine Raw-Dateien.
