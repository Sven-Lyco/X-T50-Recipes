import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Stack, Title, Text, Button, Group, Card, Badge, Image, Box, Center,
  Paper, SimpleGrid, ThemeIcon, Select, Switch,
} from '@mantine/core'
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone'
import '@mantine/dropzone/styles.css'
import { IconPhoto, IconUpload, IconX, IconSearch } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useMatchRecipe } from '../api/recipes'
import { filmSimLabel } from '../filmSimLabel'
import type { RecipeMatchResult } from '../api/types'

const MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-6', label: 'Sonnet (Standard)' },
  { value: 'claude-haiku-4-5-20251001', label: 'Haiku (Schnell)' },
  { value: 'claude-opus-4-8', label: 'Opus (Genau)' },
]

export default function RecipeMatchPage() {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [model, setModel] = useState('claude-sonnet-4-6')
  const [onlySlots, setOnlySlots] = useState(false)
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
      const matches = await matchRecipe.mutateAsync({ image, model, onlySlots })
      setResults(matches)
      if (matches.length === 0) {
        notifications.show({ message: 'Keine passenden Recipes gefunden.', color: 'orange' })
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
          Foto hochladen – die KI findet die Recipes aus deiner Bibliothek, die diesen Look am besten reproduzieren.
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
            <Select
              data={MODEL_OPTIONS}
              value={model}
              onChange={(v) => v && setModel(v)}
              size="sm"
              w={200}
            />
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
            Beste Treffer
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {results.map((match, i) => (
              <Card key={match.id} withBorder radius="md" padding="sm">
                <Box h={120} mb="sm" style={{ borderRadius: 6, overflow: 'hidden', background: 'var(--mantine-color-gray-1)' }}>
                  {match.previewImageFilename ? (
                    <Image src={`/images/${match.previewImageFilename}`} h={120} fit="cover" alt={match.name} />
                  ) : (
                    <Center h={120}>
                      <IconPhoto size={32} color="var(--mantine-color-gray-5)" />
                    </Center>
                  )}
                </Box>

                <Group gap="xs" mb={6}>
                  <Badge size="xs" variant="filled" color="dark">#{i + 1}</Badge>
                  {match.cameraSlot && (
                    <Badge size="xs" color="dark" variant="light">{match.cameraSlot}</Badge>
                  )}
                  <Badge size="xs" color="gray" variant="light">{filmSimLabel(match.filmSimulation)}</Badge>
                </Group>

                <Text fw={600} size="sm" lineClamp={1} mb={4}>{match.name}</Text>
                <Text size="xs" c="dimmed" lineClamp={3} mb="sm">{match.reason}</Text>

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
