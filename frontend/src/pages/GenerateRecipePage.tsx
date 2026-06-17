import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stack, Title, Text, Button, Textarea, Paper, Image,
  Group, Center, Box, Loader, Select, SimpleGrid, ActionIcon,
} from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import '@mantine/dropzone/styles.css'
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useSuggestRecipe } from '../api/recipes'

const MODEL_OPTIONS = [
  { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 – schnell & günstig' },
  { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6 – besser (empfohlen)' },
  { value: 'claude-opus-4-8', label: 'Opus 4.8 – stärkstes Modell' },
]

const MAX_IMAGES = 5

export default function GenerateRecipePage() {
  const navigate = useNavigate()
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [model, setModel] = useState('claude-sonnet-4-6')
  const suggest = useSuggestRecipe()

  function handleDrop(files: File[]) {
    const remaining = MAX_IMAGES - images.length
    const toAdd = files.slice(0, remaining)
    setImages((prev) => [...prev, ...toAdd])
    setPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))])
  }

  function handleRemove(index: number) {
    URL.revokeObjectURL(previews[index])
    setImages((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleGenerate() {
    if (images.length === 0) return
    try {
      const suggestion = await suggest.mutateAsync({ images, description, model })
      navigate('/recipes/new', { state: { suggestion } })
    } catch {
      notifications.show({ color: 'red', title: 'Fehler', message: 'KI-Service nicht verfügbar. Bitte prüfe den API-Key.' })
    }
  }

  return (
    <Stack gap="lg" maw={600}>
      <Stack gap={4}>
        <Title order={2}>Recipe generieren</Title>
        <Text c="dimmed" size="sm">
          Lade bis zu {MAX_IMAGES} Referenzfotos hoch – die KI analysiert den Look und schlägt passende
          Fujifilm-Einstellungen vor. Mehrere Bilder liefern ein genaueres Ergebnis.
        </Text>
      </Stack>

      <Paper withBorder p="md" radius="md">
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm">
          Referenzfotos ({images.length}/{MAX_IMAGES})
        </Text>

        {previews.length > 0 && (
          <SimpleGrid cols={previews.length === 1 ? 1 : 2} mb="sm">
            {previews.map((src, i) => (
              <Box key={src} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                <Image src={src} fit="cover" h={previews.length === 1 ? 300 : 160} />
                <ActionIcon
                  color="red"
                  variant="filled"
                  size="sm"
                  style={{ position: 'absolute', top: 6, right: 6 }}
                  onClick={() => handleRemove(i)}
                >
                  <IconX size={12} />
                </ActionIcon>
              </Box>
            ))}
          </SimpleGrid>
        )}

        {images.length < MAX_IMAGES && (
          <Dropzone
            onDrop={handleDrop}
            accept={['image/jpeg', 'image/png', 'image/webp', 'image/gif']}
            maxFiles={MAX_IMAGES - images.length}
            maxSize={20 * 1024 * 1024}
          >
            <Group justify="center" gap="md" py={images.length > 0 ? 'md' : 'xl'} style={{ pointerEvents: 'none' }}>
              <Dropzone.Accept><IconUpload size={32} stroke={1.5} /></Dropzone.Accept>
              <Dropzone.Reject><IconX size={32} stroke={1.5} color="red" /></Dropzone.Reject>
              <Dropzone.Idle><IconPhoto size={32} stroke={1.5} /></Dropzone.Idle>
              <Stack gap={2} align="center">
                <Text size="sm" fw={500}>
                  {images.length > 0 ? 'Weitere Fotos hinzufügen' : 'Fotos hierher ziehen oder klicken'}
                </Text>
                <Text size="xs" c="dimmed">JPEG, PNG, WebP, GIF – max. 20 MB pro Bild</Text>
              </Stack>
            </Group>
          </Dropzone>
        )}
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Textarea
            label="Hinweis (optional)"
            description='Z.B. "soll wärmer wirken" oder "klassischer Analogfilm-Look"'
            placeholder="Beschreibe den gewünschten Look..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Select
            label="KI-Modell"
            data={MODEL_OPTIONS}
            value={model}
            onChange={(v) => setModel(v ?? 'claude-sonnet-4-6')}
            allowDeselect={false}
          />
        </Stack>
      </Paper>

      <Group justify="flex-end">
        {suggest.isPending && (
          <Center>
            <Loader size="sm" mr="sm" />
            <Text size="sm" c="dimmed">KI analysiert die Bilder…</Text>
          </Center>
        )}
        <Button
          disabled={images.length === 0}
          loading={suggest.isPending}
          onClick={handleGenerate}
          size="md"
        >
          Recipe generieren
        </Button>
      </Group>
    </Stack>
  )
}
