import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Stack, Title, Text, Button, Group, Card, Badge, Image, Box,
  Paper, SimpleGrid, ThemeIcon, Switch,
} from '@mantine/core'
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone'
import '@mantine/dropzone/styles.css'
import { IconPhoto, IconUpload, IconX, IconSearch } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useMatchRecipe } from '../api/recipes'
import { useSettings } from '../contexts/SettingsContext'
import { filmSimLabel } from '../filmSimLabel'
import type { RecipeMatchResult } from '../api/types'

export default function RecipeMatchPage() {
  const { settings } = useSettings()
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [onlySlots, setOnlySlots] = useState(true)
  const [results, setResults] = useState<RecipeMatchResult[] | null>(null)

  const matchRecipe = useMatchRecipe()

  function handleDrop(files: File[]) {
    const file = files[0]
    setImage(file)
    setResults(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  async function handleAnalyze() {
    if (!image) return
    try {
      const matches = await matchRecipe.mutateAsync({ image, model: settings.defaultModel, onlySlots })
      setResults(matches)
      if (matches.length === 0) {
        notifications.show({ message: 'Keine passenden Einstellungen gefunden.', color: 'orange' })
      }
    } catch {
      notifications.show({ message: 'Analyse fehlgeschlagen.', color: 'red' })
    }
  }

  return (
    <Stack gap="lg" maw={800}>
      <Stack gap={4}>
        <Title order={2}>Recipe Match</Title>
        <Text size="sm" c="dimmed">
          Foto der Szene aufnehmen – die KI empfiehlt welche Kamera-Einstellung (C1–C7) du verwenden sollst.
        </Text>
      </Stack>

      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          {preview ? (
            <Box pos="relative">
              <Image
                src={preview}
                radius="md"
                mah={320}
                fit="contain"
                style={{ background: 'var(--mantine-color-gray-1)' }}
              />
              <Button
                size="xs"
                variant="default"
                mt="xs"
                onClick={() => { setImage(null); setPreview(null); setResults(null) }}
              >
                Anderes Foto wählen
              </Button>
            </Box>
          ) : (
            <Dropzone
              onDrop={handleDrop}
              accept={IMAGE_MIME_TYPE}
              maxFiles={1}
              maxSize={20 * 1024 * 1024}
            >
              <Group justify="center" gap="xl" mih={140} style={{ pointerEvents: 'none' }}>
                <Dropzone.Accept>
                  <ThemeIcon size={48} radius="md" variant="light" color="blue">
                    <IconUpload size={28} />
                  </ThemeIcon>
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <ThemeIcon size={48} radius="md" variant="light" color="red">
                    <IconX size={28} />
                  </ThemeIcon>
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <ThemeIcon size={48} radius="md" variant="light" color="gray">
                    <IconPhoto size={28} />
                  </ThemeIcon>
                </Dropzone.Idle>
                <Stack gap={4}>
                  <Text size="md" fw={500}>Foto hierher ziehen oder klicken</Text>
                  <Text size="xs" c="dimmed">JPEG, PNG, WebP – max. 20 MB</Text>
                </Stack>
              </Group>
            </Dropzone>
          )}

          <Group>
            <Switch
              label="Nur C1–C7"
              checked={onlySlots}
              onChange={(e) => setOnlySlots(e.currentTarget.checked)}
              size="sm"
            />
            <Button
              leftSection={<IconSearch size={16} />}
              disabled={!image}
              loading={matchRecipe.isPending}
              onClick={handleAnalyze}
            >
              Analysieren
            </Button>
          </Group>
        </Stack>
      </Paper>

      {results && results.length > 0 && (
        <Stack gap="sm">
          <Text fw={600} size="sm" c="dimmed" tt="uppercase">
            Empfehlung
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {results.map((match, i) => (
              <Card key={match.id} withBorder radius="md" padding="md">
                <Group gap="xs" mb="sm" align="center">
                  <Badge size="xl" variant="filled" color="dark" radius="sm" style={{ fontSize: 18, padding: '6px 12px' }}>
                    {match.cameraSlot ?? `#${i + 1}`}
                  </Badge>
                  <Badge size="sm" color="gray" variant="light">{filmSimLabel(match.filmSimulation)}</Badge>
                </Group>

                <Text fw={600} size="sm" mb={4} lineClamp={1}>{match.name}</Text>
                <Text size="xs" c="dimmed" lineClamp={4} mb="sm">{match.reason}</Text>

                {match.previewImageFilename && (
                  <Box mb="sm" style={{ borderRadius: 6, overflow: 'hidden' }}>
                    <Image src={`/images/${match.previewImageFilename}`} h={80} fit="cover" alt={match.name} />
                  </Box>
                )}

                <Button
                  component={Link}
                  to={`/recipes/${match.id}`}
                  variant="light"
                  size="xs"
                  fullWidth
                >
                  Recipe öffnen
                </Button>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      )}
    </Stack>
  )
}
