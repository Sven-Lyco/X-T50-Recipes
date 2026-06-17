import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { pdf } from '@react-pdf/renderer'
import { RecipePdf } from '../components/RecipePdf'
import {
  Stack, Group, Title, Button, Badge, SimpleGrid,
  Paper, Text, Image, Divider, ActionIcon, Box, AspectRatio, Modal, CloseButton, Card, Center, Anchor, Loader,
} from '@mantine/core'
import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { Carousel } from '@mantine/carousel'
import { notifications } from '@mantine/notifications'
import '@mantine/carousel/styles.css'
import { useRecipe, useDeleteRecipe, useToggleFavorite, useRecipes } from '../api/recipes'
import { MONOCHROME_SIMS, filmSimLabel } from '../filmSimLabel'
import { dynamicRangeLabel, grainSizeLabel, isoModeLabel, strengthLabel, wbModeLabel } from '../utils/labels'

function ParamRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null) return null
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="sm" fw={500}>{value}</Text>
    </Stack>
  )
}

function signed(n: number) {
  return n > 0 ? `+${n}` : String(n)
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: recipe, isLoading } = useRecipe(id!)
  const { data: allRecipes } = useRecipes()
  const deleteRecipe = useDeleteRecipe()
  const toggleFavorite = useToggleFavorite()
  const navigate = useNavigate()

  const [lightbox, setLightbox] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  async function handlePdfExport() {
    setPdfLoading(true)
    try {
      let previewImageDataUri: string | null = null
      const firstImage = recipe!.images[0]
      if (firstImage) {
        const res = await fetch(`/images/${firstImage.filename}`)
        const imgBlob = await res.blob()
        previewImageDataUri = await new Promise<string>((resolve) => {
          const img = document.createElement('img')
          const url = URL.createObjectURL(imgBlob)
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            canvas.getContext('2d')!.drawImage(img, 0, 0)
            URL.revokeObjectURL(url)
            resolve(canvas.toDataURL('image/jpeg', 0.9))
          }
          img.src = url
        })
      }
      const pdfBlob = await pdf(<RecipePdf recipe={recipe!} previewImageDataUri={previewImageDataUri} />).toBlob()
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${recipe!.name}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setPdfLoading(false)
    }
  }

  if (isLoading) return <Center py="xl"><Loader /></Center>
  if (!recipe) return <Text c="red">Recipe nicht gefunden.</Text>

  async function confirmDelete() {
    await deleteRecipe.mutateAsync(id!)
    notifications.show({ message: 'Recipe gelöscht', color: 'green' })
    navigate('/')
  }

  return (
    <>
    <Stack gap="lg" maw={800}>
      <Group gap="sm" align="flex-start" justify="space-between">
        <Group gap="sm" align="flex-start">
          <ActionIcon variant="subtle" color="gray" size="lg" component={Link} to="/" aria-label="Zurück" mt={4}>
            ←
          </ActionIcon>
          <Stack gap={6}>
            <Title order={2}>{recipe.name}</Title>
            <Group gap="xs">
              <Badge color="dark" variant="light">{filmSimLabel(recipe.filmSimulation)}</Badge>
              {recipe.cameraSlot && <Badge color="dark" variant="filled">{recipe.cameraSlot}</Badge>}
              {recipe.aiGenerated && <Badge color="violet" variant="light">KI-Generiert</Badge>}
            </Group>
          </Stack>
        </Group>
        <ActionIcon
          variant="default"
          size="lg"
          aria-label={recipe.favorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
          onClick={() => toggleFavorite.mutate({ id: recipe.id, favorite: !recipe.favorite })}
        >
          {recipe.favorite ? (
            <IconStarFilled size={18} color="var(--mantine-color-yellow-5)" />
          ) : (
            <IconStar size={18} />
          )}
        </ActionIcon>
      </Group>

      {recipe.images.length > 0 && (
        <Box>
          <Carousel
            withIndicators
            loop
            slideSize={{ base: '100%', sm: '80%' }}
            slideGap="md"
            align="start"
          >
            {recipe.images.map((img) => (
              <Carousel.Slide key={img.id}>
                <AspectRatio ratio={3 / 2} onClick={() => setLightbox(img.filename)} style={{ cursor: 'zoom-in' }}>
                  <Image
                    src={`/images/${img.filename}`}
                    alt={img.caption ?? recipe.name}
                    radius="md"
                    fit="cover"
                  />
                </AspectRatio>
                {img.caption && (
                  <Text size="xs" c="dimmed" ta="center" mt={6}>{img.caption}</Text>
                )}
              </Carousel.Slide>
            ))}
          </Carousel>
        </Box>
      )}

      <Paper withBorder p="md" radius="md">
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="md">Bildparameter</Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
          <ParamRow label="Dynamikbereich" value={dynamicRangeLabel(recipe.dynamicRange)} />
          {recipe.isoMode && <ParamRow label="ISO-Modus" value={isoModeLabel(recipe.isoMode)} />}
          <ParamRow label="Spitzlichter" value={signed(recipe.highlightTone)} />
          <ParamRow label="Schatten" value={signed(recipe.shadowTone)} />
          <ParamRow label="Farbe" value={signed(recipe.color)} />
          <ParamRow label="Schärfe" value={signed(recipe.sharpness)} />
          <ParamRow label="Hohe ISO-NR" value={signed(recipe.noiseReduction)} />
          <ParamRow label="Klarheit" value={signed(recipe.clarity)} />
        </SimpleGrid>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="md">Körnung & Effekte</Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
          <ParamRow label="Körnungseffekt" value={strengthLabel(recipe.grainStrength)} />
          {recipe.grainSize && <ParamRow label="Körnung Größe" value={grainSizeLabel(recipe.grainSize)} />}
          <ParamRow label="Farbe Chrome-Effekt" value={strengthLabel(recipe.colorChromeEffect)} />
          <ParamRow label="Farbe Chrom FX Blau" value={strengthLabel(recipe.colorChromeFxBlue)} />
        </SimpleGrid>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="md">Weißabgleich</Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
          <ParamRow label="Modus" value={wbModeLabel(recipe.whiteBalanceMode)} />
          <ParamRow label="WA Verschieben R/B" value={`${signed(recipe.wbShiftRed)} / ${signed(recipe.wbShiftBlue)}`} />
          {recipe.colorTempKelvin && <ParamRow label="Farbtemperatur" value={`${recipe.colorTempKelvin} K`} />}
        </SimpleGrid>
      </Paper>

      {MONOCHROME_SIMS.includes(recipe.filmSimulation) && (recipe.monochromeWarmCool != null || recipe.monochromeGreenMagenta != null) && (
        <Paper withBorder p="md" radius="md">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="md">Monochrome Farbe</Text>
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
            <ParamRow label="Warm/Cool" value={signed(recipe.monochromeWarmCool ?? 0)} />
            <ParamRow label="Grün/Magenta" value={signed(recipe.monochromeGreenMagenta ?? 0)} />
          </SimpleGrid>
        </Paper>
      )}

      {(recipe.isoNote || recipe.expCompNote || recipe.description || recipe.inspirationSource) && (
        <Paper withBorder p="md" radius="md">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="md">Notizen</Text>
          <Stack gap="sm">
            {recipe.isoNote && <ParamRow label="ISO Details" value={recipe.isoNote} />}
            {recipe.expCompNote && <ParamRow label="Belichtung" value={recipe.expCompNote} />}
            {recipe.description && (
              <>
                <Divider />
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{recipe.description}</Text>
              </>
            )}
            {recipe.inspirationSource && (
              <Stack gap={2}>
                <Text size="xs" c="dimmed">Referenz</Text>
                {recipe.inspirationSource.startsWith('http://') || recipe.inspirationSource.startsWith('https://') ? (
                  <Anchor href={recipe.inspirationSource} target="_blank" rel="noopener noreferrer" size="sm">
                    {recipe.inspirationSource}
                  </Anchor>
                ) : (
                  <Text size="sm">{recipe.inspirationSource}</Text>
                )}
              </Stack>
            )}
          </Stack>
        </Paper>
      )}

      {recipe.tags.length > 0 && (
        <Group gap="xs">
          {recipe.tags.map((t) => <Badge key={t} variant="light" color="gray">{t}</Badge>)}
        </Group>
      )}

      {(() => {
        const similar = allRecipes?.filter(
          (r) => r.id !== recipe.id && r.filmSimulation === recipe.filmSimulation
        ).slice(0, 3) ?? []
        if (similar.length === 0) return null
        return (
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Ähnliche Recipes – {filmSimLabel(recipe.filmSimulation)}
              </Text>
              <Button
                component={Link}
                to={`/compare?ids=${recipe.id}`}
                variant="subtle"
                size="xs"
                color="gray"
              >
                Alle vergleichen
              </Button>
            </Group>
            <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="sm">
              {similar.map((r) => (
                <Card key={r.id} withBorder radius="sm" padding="xs" style={{ textDecoration: 'none' }}>
                  <Box h={80} bg="gray.1" mb="xs" style={{ borderRadius: 4, overflow: 'hidden' }}>
                    {r.previewImageFilename ? (
                      <Image src={`/images/${r.previewImageFilename}`} h={80} fit="cover" alt={r.name} />
                    ) : (
                      <Center h={80}>
                        <Text size="xs" c="dimmed">Kein Bild</Text>
                      </Center>
                    )}
                  </Box>
                  <Text size="xs" fw={600} lineClamp={1} mb={4}>{r.name}</Text>
                  {r.cameraSlot && (
                    <Badge size="xs" color="dark" variant="filled" mb={4} w="fit-content">
                      {r.cameraSlot}
                    </Badge>
                  )}
                  <Group gap={4}>
                    <Button
                      component={Link}
                      to={`/recipes/${r.id}`}
                      variant="subtle"
                      size="xs"
                      color="gray"
                      px={4}
                    >
                      Öffnen
                    </Button>
                    <Button
                      component={Link}
                      to={`/compare/result?ids=${recipe.id},${r.id}`}
                      variant="subtle"
                      size="xs"
                      px={4}
                    >
                      Vergleichen
                    </Button>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          </Paper>
        )
      })()}

      <Divider />

      <Group gap="xs">
        <Button component={Link} to={`/recipes/${id}/edit`} variant="default">
          Bearbeiten
        </Button>
        <Button variant="default" loading={pdfLoading} onClick={handlePdfExport}>
          Als PDF exportieren
        </Button>
        <Button color="red" variant="light" onClick={() => setDeleteModalOpen(true)} loading={deleteRecipe.isPending}>
          Löschen
        </Button>
      </Group>
    </Stack>

    <Modal
      opened={!!lightbox}
      onClose={() => setLightbox(null)}
      size="xl"
      padding={0}
      withCloseButton={false}
      centered
    >
      {lightbox && (
        <Box pos="relative">
          <Image src={`/images/${lightbox}`} fit="contain" mah="90vh" />
          <CloseButton pos="absolute" top={8} right={8} variant="filled" color="dark" radius="xl" onClick={() => setLightbox(null)} />
        </Box>
      )}
    </Modal>

    <Modal
      opened={deleteModalOpen}
      onClose={() => setDeleteModalOpen(false)}
      title="Recipe löschen"
      centered
    >
      <Stack>
        <Text size="sm">„{recipe.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteModalOpen(false)}>Abbrechen</Button>
          <Button color="red" onClick={confirmDelete} loading={deleteRecipe.isPending}>Löschen</Button>
        </Group>
      </Stack>
    </Modal>
    </>
  )
}
