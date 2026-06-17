import React from 'react'
import { Stack, Title, Paper, Text, SimpleGrid, Badge, Group, Divider } from '@mantine/core'
import { filmSimLabel } from '../filmSimLabel'

interface SimInfo { key: string; desc: string }
interface ParamInfo { label: string; range?: string; desc: string }

const COLOR_SIMS: SimInfo[] = [
  { key: 'PROVIA',               desc: 'Ideal für zahlreiche Motive.' },
  { key: 'VELVIA',               desc: 'Lebendige Darstellung, ideal für Landschaften und Natur.' },
  { key: 'ASTIA',                desc: 'Weichere Farbe und Kontrast für gedämpfte Darstellung.' },
  { key: 'CLASSIC_CHROME',       desc: 'Weiche Farbe und mehr Schattenkontrast für ruhige Ausstrahlung.' },
  { key: 'CLASSIC_NEGATIVE',     desc: 'Farbe mit harter Tonalität zur Erhöhung der Bildtiefe.' },
  { key: 'REALA_ACE',            desc: 'Originalgetreue Farbwiedergabe mit harter Tonalität, geeignet für verschiedene Szenen.' },
  { key: 'PRO_NEG_HI',           desc: 'Ideal für Porträts mit leicht verbessertem Kontrast.' },
  { key: 'PRO_NEG_STD',          desc: 'Neutrale Tonalität für die Nachbearbeitung. Ideal für Porträts. Weiche Abstufungen und Hauttöne.' },
  { key: 'NOSTALGIC_NEG',        desc: 'Kräftige Schattentöne und Nuancen von Bernstein in den Lichtern für den Look historischer Fotoabzüge.' },
  { key: 'ETERNA',               desc: 'Für filmähnliche Videos geeignete sanfte Farben und reicher Schattenton.' },
  { key: 'ETERNA_BLEACH_BYPASS', desc: 'Geringe Farbsättigung und hohe Kontraste für Foto und Video.' },
]

const MONO_SIMS: SimInfo[] = [
  { key: 'ACROS',         desc: 'Aufnahme in Schwarz/Weiß, detailliert mit Schärfe.' },
  { key: 'ACROS_YE',      desc: 'Mit Gelbfilter: Verstärkt Kontrast leicht und dunkelt Himmel nach.' },
  { key: 'ACROS_R',       desc: 'Mit Rotfilter: Verstärkt Kontrast und dunkelt Himmel deutlich nach.' },
  { key: 'ACROS_G',       desc: 'Mit Grünfilter: Erzeugt natürliche Hauttöne bei Portraits.' },
  { key: 'MONOCHROME',    desc: 'Aufnahmen in Schwarz/Weiß.' },
  { key: 'MONOCHROME_YE', desc: 'Mit Gelbfilter: Verstärkt Kontrast leicht und dunkelt Himmel nach.' },
  { key: 'MONOCHROME_R',  desc: 'Mit Rotfilter: Verstärkt Kontrast und dunkelt Himmel deutlich nach.' },
  { key: 'MONOCHROME_G',  desc: 'Mit Grünfilter: Erzeugt natürliche Hauttöne bei Portraits.' },
  { key: 'SEPIA',         desc: 'Aufnahmen mit Sepiaton.' },
]

const BILDPARAMETER: ParamInfo[] = [
  {
    label: 'Dynamic Range', range: 'DR100 / DR200 / DR400',
    desc: 'DR100 = Standard. DR200/400 schützt Lichter vor Überbelichtung durch interne Unterbelichtung und anschließende Anhebung der Schatten. Erfordert jeweils höhere ISO-Mindestwerte (DR200 ab ISO 320, DR400 ab ISO 640).',
  },
  {
    label: 'Highlight Tone', range: '−2 bis +4',
    desc: 'Helligkeit der hellen Bildbereiche. Negative Werte erhalten mehr Zeichnung in den Lichtern und vermeiden ausgebrannte Stellen.',
  },
  {
    label: 'Shadow Tone', range: '−2 bis +4',
    desc: 'Helligkeit der Schattenbereiche. Negative Werte heben Schatten an und erzeugen einen flacheren, filmischeren Look.',
  },
  {
    label: 'Color', range: '−4 bis +4',
    desc: 'Gesamte Farbsättigung. +4 = sehr kräftige Farben, −4 = nahezu monochrom.',
  },
  {
    label: 'Sharpness', range: '−4 bis +4',
    desc: 'Kantenschärfung (Unschärfemaske). Niedrige Werte wirken weicher und filmischer; hohe Werte erzeugen knackige Kanten, können aber zu Halos führen.',
  },
  {
    label: 'Noise Reduction', range: '−4 bis +4',
    desc: '−4 zeigt das natürliche Rauschen des Sensors – das wirkt filmisch und texturiert. +4 glättet das Bild stark, was bei hohen ISO-Werten auf Kosten der Detailschärfe geht.',
  },
  {
    label: 'Clarity', range: '−5 bis +5',
    desc: 'Lokaler Kontrast in den Mitteltönen. Positive Werte erzeugen einen knackigen, plastischen Look. Negative Werte machen das Bild weich und glatt – gut für Portraits und Skincare-Look.',
  },
]

const EFFEKTE: ParamInfo[] = [
  {
    label: 'Grain Strength', range: 'OFF / WEAK / STRONG',
    desc: 'Simuliert Filmkorn. WEAK für subtilen analogen Charakter, STRONG für ausgeprägten Push-Processing-Look.',
  },
  {
    label: 'Grain Size', range: 'SMALL / LARGE',
    desc: 'SMALL erinnert an feines Kleinbild-Negativ. LARGE imitiert Mittelformat oder stark gepushtes Material.',
  },
  {
    label: 'Color Chrome Effect', range: 'OFF / WEAK / STRONG',
    desc: 'Erhöht Kontrast und Sättigung in tiefen, gesättigten Farbbereichen – besonders bei Rot, Orange und Grün. Macht Farben plastischer ohne sie zu übertreiben. Sehr wirksam bei VELVIA.',
  },
  {
    label: 'Color Chrome FX Blue', range: 'OFF / WEAK / STRONG',
    desc: 'Wie Color Chrome Effect, aber speziell für Blautöne. Gibt Himmel und Wasser mehr Tiefe und Leuchtkraft.',
  },
]

const BELICHTUNG: ParamInfo[] = [
  {
    label: 'ISO', range: '125 – 51200',
    desc: 'Lichtempfindlichkeit des Sensors. Niedrige Werte (ISO 125–400) liefern saubere Bilder mit wenig Rauschen. Hohe Werte ermöglichen Aufnahmen bei wenig Licht, erzeugen aber mehr Rauschen – das kann bei manchen Film-Simulationen (z.B. ACROS) bewusst als analoges Korn eingesetzt werden. Wichtig: DR200 benötigt mindestens ISO 320, DR400 mindestens ISO 640.',
  },
  {
    label: 'Belichtungszeit',
    desc: 'Steuert, wie lange der Sensor belichtet wird. Kurze Zeiten (1/500 s oder kürzer) frieren Bewegung ein. Lange Zeiten (1/30 s oder länger) erzeugen Bewegungsunschärfe – bei Handaufnahmen droht Verwacklung. Die X-T50 hat einen mechanischen und einen elektronischen Verschluss; der elektronische ist lautlos, kann aber bei Kunstlicht zu Bandenbildung führen.',
  },
  {
    label: 'Blende',
    desc: 'Steuert Lichtmenge und Schärfentiefe. Kleine Blendenzahl (z.B. f/1.4) = große Öffnung = viel Licht, sehr geringe Schärfentiefe (Hintergrund unscharf). Große Zahl (z.B. f/11) = wenig Licht, große Schärfentiefe. Ab f/8–f/11 können Beugungsunschärfen entstehen und die Detailschärfe leicht reduzieren.',
  },
  {
    label: 'Belichtungskorrektur (EV)',
    desc: 'Verschiebt die von der Kamera ermittelte Belichtung nach oben oder unten. −1/3 bis −2/3 EV sind bei vielen Filmsimulationen sinnvoll, um Lichter zu schützen. Die X-T50 zeigt die Belichtungsvorschau live im EVF/Display.',
  },
]

const WEISSABGLEICH: ParamInfo[] = [
  { label: 'Auto',           desc: 'Kamera wählt automatisch. Für die meisten Situationen gut geeignet.' },
  { label: 'Daylight',       desc: 'Tageslicht (~5500 K). Für Außenaufnahmen im direkten Sonnenlicht.' },
  { label: 'Shade',          desc: 'Schatten (~7500 K). Wärmer als Daylight – kompensiert den blauen Farbstich im Schatten.' },
  { label: 'Fluorescent 1',  desc: 'Tageslicht-Leuchtstoffröhre.' },
  { label: 'Fluorescent 2',  desc: 'Warmweiße Leuchtstoffröhre.' },
  { label: 'Fluorescent 3',  desc: 'Kaltweiße Leuchtstoffröhre.' },
  { label: 'Incandescent',   desc: 'Glühlampe / Wolfram (~3200 K). Verhindert den starken Gelbstich bei Kunstlicht.' },
  { label: 'Underwater',     desc: 'Kompensiert den blauen Farbstich unter Wasser.' },
  { label: 'Color Temp',     desc: 'Manueller Kelvin-Wert (2500–10000 K). Vollständige Kontrolle über die Farbtemperatur.' },
  { label: 'Custom 1/2/3',   desc: 'Gespeicherte manuelle Weißabgleich-Messungen direkt an der Kamera.' },
  {
    label: 'WB Shift (Rot / Blau)', range: '−9 bis +9',
    desc: 'Feinabstimmung auf der Rot-Blau-Achse. Positives Rot wärmt das Bild, positives Blau kühlt es – unabhängig vom gewählten Modus.',
  },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="md">{children}</Text>
}

function SimCard({ item }: { item: SimInfo }) {
  return (
    <Stack gap={4}>
      <Badge color="dark" variant="light" w="fit-content">{filmSimLabel(item.key)}</Badge>
      <Text size="sm" c="dimmed">{item.desc}</Text>
    </Stack>
  )
}

function ParamRow({ item }: { item: ParamInfo }) {
  return (
    <Stack gap={2}>
      <Group gap="xs" align="baseline">
        <Text size="sm" fw={600}>{item.label}</Text>
        {item.range && <Text size="xs" c="dimmed">{item.range}</Text>}
      </Group>
      <Text size="sm" c="dimmed">{item.desc}</Text>
    </Stack>
  )
}

export default function ReferencePage() {
  return (
    <Stack gap="lg" maw={800}>
      <Title order={2}>Einstellungen-Referenz</Title>

      <Paper withBorder p="md" radius="md">
        <SectionTitle>Film Simulationen – Farbe</SectionTitle>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          {COLOR_SIMS.map((s) => <SimCard key={s.key} item={s} />)}
        </SimpleGrid>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <SectionTitle>Film Simulationen – Schwarzweiß</SectionTitle>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          {MONO_SIMS.map((s) => <SimCard key={s.key} item={s} />)}
        </SimpleGrid>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <SectionTitle>Bildparameter</SectionTitle>
        <Stack gap="md">
          {BILDPARAMETER.map((p, i) => (
            <React.Fragment key={p.label}>
              {i > 0 && <Divider />}
              <ParamRow item={p} />
            </React.Fragment>
          ))}
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <SectionTitle>Effekte</SectionTitle>
        <Stack gap="md">
          {EFFEKTE.map((p, i) => (
            <React.Fragment key={p.label}>
              {i > 0 && <Divider />}
              <ParamRow item={p} />
            </React.Fragment>
          ))}
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <SectionTitle>Weißabgleich</SectionTitle>
        <Stack gap="md">
          {WEISSABGLEICH.map((p, i) => (
            <React.Fragment key={p.label}>
              {i > 0 && <Divider />}
              <ParamRow item={p} />
            </React.Fragment>
          ))}
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <SectionTitle>Belichtung</SectionTitle>
        <Stack gap="md">
          {BELICHTUNG.map((p, i) => (
            <React.Fragment key={p.label}>
              {i > 0 && <Divider />}
              <ParamRow item={p} />
            </React.Fragment>
          ))}
        </Stack>
      </Paper>
    </Stack>
  )
}
