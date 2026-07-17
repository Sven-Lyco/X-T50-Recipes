# ADR-002: Mantine UI + @emotion/styled als Frontend-Styling

## Status
Entschieden

## Kontext

Das Frontend benötigt eine umfangreiche Palette an UI-Komponenten: Modal, Select, Badge, Tabs, Slider, NumberInput, Drag-and-Drop-Galerie, Tooltip, ActionIcon. Außerdem eine Styling-Lösung für Custom-Layouts ohne globales CSS.

## Entscheidung

Mantine UI (`@mantine/core`) für Komponenten, `@emotion/styled` für Custom-Styles. Kein Plain CSS, keine Inline-Styles.

## Begründung

Mantine bietet eine vollständige, zugängliche Komponenten-Bibliothek speziell für React. Die benötigten Komponenten (NumberInput mit Inkrement-Buttons, Select mit Gruppen, Dropzone via `@mantine/dropzone`) sind vorhanden und qualitativ hochwertig. Für die Drag-and-Drop-Sortierung der Bildergalerie im Bearbeitungsformular wird `@dnd-kit` (core + sortable) genutzt, da Mantine keine eigene Sortable-Implementierung bietet.

`@emotion/styled` ermöglicht typisierte, komponentenbasierte Custom-Styles ohne Scoping-Probleme. Styles sind lokal zur Komponente, kein globaler Namensraum.

Die Kombination ist in der gesamten Codebasis konsistent durchgehalten — keine Mischung aus verschiedenen Styling-Ansätzen.

**Alternativen verworfen:**
- Tailwind CSS: atomares CSS ohne Komponenten-Abstraktion; für komplexe Formulare und Interaktions-Komponenten erheblich mehr Eigenentwicklung
- Material UI: stärkere „Google-Ästhetik"; weniger neutral für eine Foto-App
- Plain CSS / CSS Modules: kein Scoping, schwer wartbar in einer wachsenden React-Anwendung

## Konsequenzen

- Emotion erhöht Bundle-Größe leicht (CSS-in-JS Runtime)
- Bei Mantine-Major-Upgrades können Breaking Changes entstehen (akzeptiert, da Mantine aktiv gepflegt wird)
