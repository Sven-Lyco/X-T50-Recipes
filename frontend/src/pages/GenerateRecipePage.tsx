import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stack, Title, Text, Button, Textarea, Paper, Image,
  Group, Center, Box, Loader, SimpleGrid, ActionIcon,
} from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import '@mantine/dropzone/styles.css'
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useSuggestRecipe } from '../api/recipes'
import { useSettings } from '../contexts/SettingsContext'

const MAX_IMAGES = 5

export default function GenerateRecipePage() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [description, setDescription] = useState('')
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
      const suggestion = await suggest.mutateAsync({ images, description, model: settings.defaultModel })
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
        <Textarea
          label="Hinweis (optional)"
          description='Z.B. "soll wärmer wirken" oder "klassischer Analogfilm-Look"'
          placeholder="Beschreibe den gewünschten Look..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
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
