import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Stack, Title, Text, Button, Group, Card, Badge, Image, Box,
  Paper, SimpleGrid, ThemeIcon, Switch, SegmentedControl, TextInput, Chip,
} from '@mantine/core'
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone'
import '@mantine/dropzone/styles.css'
import { IconPhoto, IconUpload, IconX, IconSearch, IconMapPin } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useMatchRecipe, useLocationMatch } from '../api/recipes'
import { useSettings } from '../contexts/SettingsContext'
import { filmSimLabel } from '../filmSimLabel'
import type { RecipeMatchResult } from '../api/types'

type Mode = 'photo' | 'location'
type ChipState = 'unselected' | 'secondary' | 'primary'

const SUBJECTS = [
  { value: 'Landschaft', label: 'Landschaft' },
  { value: 'Strand & Meer', label: 'Strand & Meer' },
  { value: 'Architektur & Stadt', label: 'Architektur & Stadt' },
  { value: 'Street Photography', label: 'Street' },
  { value: 'Natur & Wildlife', label: 'Natur & Wildlife' },
  { value: 'Goldene Stunde', label: 'Goldene Stunde' },
  { value: 'Blaue Stunde & Nacht', label: 'Nacht' },
  { value: 'Nebel & diffuses Licht', label: 'Nebel' },
]

function MatchResultCards({ results }: { results: RecipeMatchResult[] }) {
  return (
    <Stack gap="sm">
      <Text fw={600} size="sm" c="dimmed" tt="uppercase">Empfehlung</Text>
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        {results.map((match, i) => (
          <Card key={match.id} withBorder radius="md" padding="md">
            <Group gap="xs" mb="sm" align="center">
              <Badge size="xl" variant="filled" color="dark" radius="sm" style={{ fontSize: 18, padding: '6px 12px' }}>
                {match.cameraSlot ?? `#${i + 1}`}
              </Badge>
              <Badge size="sm" color="gray" variant="light">{filmSimLabel(match.filmSimulation)}</Badge>
            </Group>
            <Text fw={600} size="sm" mb={6}>{match.name}</Text>
            <Text size="xs" c="dimmed" mb="sm" style={{ whiteSpace: 'pre-wrap' }}>{match.reason}</Text>
            {match.previewImageFilename && (
              <Box mb="sm" style={{ borderRadius: 6, overflow: 'hidden' }}>
                <Image src={`/images/${match.previewImageFilename}`} h={80} fit="cover" alt={match.name} />
              </Box>
            )}
            <Button component={Link} to={`/recipes/${match.id}`} variant="light" size="xs" fullWidth>
              Recipe öffnen
            </Button>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  )
}

export default function RecipeMatchPage() {
  const { settings } = useSettings()
  const [mode, setMode] = useState<Mode>('photo')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [location, setLocation] = useState('')
  const [onlySlots, setOnlySlots] = useState(true)
  const [primarySubjects, setPrimarySubjects] = useState<string[]>([])
  const [secondarySubjects, setSecondarySubjects] = useState<string[]>([])
  const [results, setResults] = useState<RecipeMatchResult[] | null>(null)

  const matchRecipe = useMatchRecipe()
  const locationMatch = useLocationMatch()

  function getChipState(value: string): ChipState {
    if (primarySubjects.includes(value)) return 'primary'
    if (secondarySubjects.includes(value)) return 'secondary'
    return 'unselected'
  }

  function handleChipClick(value: string) {
    const state = getChipState(value)
    if (state === 'unselected') {
      setSecondarySubjects((prev) => [...prev, value])
    } else if (state === 'secondary') {
      setSecondarySubjects((prev) => prev.filter((s) => s !== value))
      setPrimarySubjects((prev) => [...prev, value])
    } else {
      setPrimarySubjects((prev) => prev.filter((s) => s !== value))
    }
    setResults(null)
  }

  function handleModeChange(val: string) {
    setMode(val as Mode)
    setResults(null)
    setPrimarySubjects([])
    setSecondarySubjects([])
  }

  function handleDrop(files: File[]) {
    const file = files[0]
    setImage(file)
    setResults(null)
    setPreview(URL.createObjectURL(file))
  }

  async function handleAnalyzePhoto() {
    if (!image) return
    try {
      const matches = await matchRecipe.mutateAsync({ image, model: settings.defaultModel, onlySlots })
      setResults(matches)
      if (matches.length === 0) notifications.show({ message: 'Keine passenden Einstellungen gefunden.', color: 'orange' })
    } catch {
      notifications.show({ message: 'Analyse fehlgeschlagen.', color: 'red' })
    }
  }

  async function handleAnalyzeLocation() {
    if (!location.trim()) return
    try {
      const matches = await locationMatch.mutateAsync({
        location: location.trim(),
        primarySubjects,
        secondarySubjects,
        model: settings.defaultModel,
        onlySlots,
      })
      setResults(matches)
      if (matches.length === 0) notifications.show({ message: 'Keine passenden Einstellungen gefunden.', color: 'orange' })
    } catch {
      notifications.show({ message: 'Analyse fehlgeschlagen.', color: 'red' })
    }
  }

  const isPending = matchRecipe.isPending || locationMatch.isPending

  return (
    <Stack gap="lg" maw={800}>
      <Stack gap={4}>
        <Title order={2}>Recipe Match</Title>
        <Text size="sm" c="dimmed">
          {mode === 'photo'
            ? 'Foto der Szene hochladen – die KI empfiehlt welche Kamera-Einstellung passt.'
            : 'Reiseziel eingeben – die KI empfiehlt Recipes passend zu Licht, Farben und Motiven vor Ort.'}
        </Text>
      </Stack>

      <SegmentedControl
        value={mode}
        onChange={handleModeChange}
        data={[
          { value: 'photo', label: 'Nach Foto' },
          { value: 'location', label: 'Nach Reiseziel' },
        ]}
        w={{ base: '100%', sm: 280 }}
      />

      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          {mode === 'photo' ? (
            <>
              {preview ? (
                <Box pos="relative">
                  <Image src={preview} radius="md" mah={320} fit="contain" style={{ background: 'var(--mantine-color-gray-1)' }} />
                  <Button size="xs" variant="default" mt="xs"
                    onClick={() => { setImage(null); setPreview(null); setResults(null) }}>
                    Anderes Foto wählen
                  </Button>
                </Box>
              ) : (
                <Dropzone onDrop={handleDrop} accept={IMAGE_MIME_TYPE} maxFiles={1} maxSize={20 * 1024 * 1024}>
                  <Group justify="center" gap="xl" mih={140} style={{ pointerEvents: 'none' }}>
                    <Dropzone.Accept>
                      <ThemeIcon size={48} radius="md" variant="light" color="blue"><IconUpload size={28} /></ThemeIcon>
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <ThemeIcon size={48} radius="md" variant="light" color="red"><IconX size={28} /></ThemeIcon>
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <ThemeIcon size={48} radius="md" variant="light" color="gray"><IconPhoto size={28} /></ThemeIcon>
                    </Dropzone.Idle>
                    <Stack gap={4}>
                      <Text size="md" fw={500}>Foto hierher ziehen oder klicken</Text>
                      <Text size="xs" c="dimmed">JPEG, PNG, WebP – max. 20 MB</Text>
                    </Stack>
                  </Group>
                </Dropzone>
              )}
              <Group>
                <Switch label="Nur C1–C7" checked={onlySlots} onChange={(e) => setOnlySlots(e.currentTarget.checked)} size="sm" />
                <Button leftSection={<IconSearch size={16} />} disabled={!image} loading={isPending} onClick={handleAnalyzePhoto}>
                  Analysieren
                </Button>
              </Group>
            </>
          ) : (
            <>
              <TextInput
                leftSection={<IconMapPin size={16} />}
                placeholder="z. B. Island im September, Toskana, Kyoto im Herbst"
                value={location}
                onChange={(e) => { setLocation(e.currentTarget.value); setResults(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyzeLocation() }}
                size="md"
              />
              <Stack gap={6}>
                <Group gap={6}>
                  <Text size="xs" c="dimmed">Was möchtest du fotografieren?</Text>
                  <Text size="xs" c="dimmed">·  Einmal = Nebenmotiv &nbsp;·&nbsp; Zweimal = Hauptmotiv ★</Text>
                </Group>
                <Group gap="xs">
                  {SUBJECTS.map((s) => {
                    const state = getChipState(s.value)
                    return (
                      <Chip
                        key={s.value}
                        checked={state !== 'unselected'}
                        color={state === 'primary' ? 'blue' : 'gray'}
                        variant={state === 'primary' ? 'filled' : 'outline'}
                        size="sm"
                        onClick={() => handleChipClick(s.value)}
                      >
                        {state === 'primary' ? `★ ${s.label}` : s.label}
                      </Chip>
                    )
                  })}
                </Group>
              </Stack>
              <Group>
                <Switch label="Nur C1–C7" checked={onlySlots} onChange={(e) => setOnlySlots(e.currentTarget.checked)} size="sm" />
                <Button leftSection={<IconSearch size={16} />} disabled={!location.trim()} loading={isPending} onClick={handleAnalyzeLocation}>
                  Recipes finden
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Paper>

      {results && results.length > 0 && <MatchResultCards results={results} />}
    </Stack>
  )
}
