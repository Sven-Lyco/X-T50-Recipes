import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Stack, Group, Title, Button, Badge, SimpleGrid,
  Paper, Text, Image, Divider, ActionIcon, Box, AspectRatio, Modal, CloseButton, Card, Center,
} from '@mantine/core'
import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { Carousel } from '@mantine/carousel'
import { notifications } from '@mantine/notifications'
import '@mantine/carousel/styles.css'
import { useRecipe, useDeleteRecipe, useToggleFavorite, useRecipes } from '../api/recipes'
import { MONOCHROME_SIMS, filmSimLabel } from '../filmSimLabel'

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

  if (isLoading) return <Text c="dimmed">Laden…</Text>
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
          <ParamRow label="Dynamic Range" value={recipe.dynamicRange} />
          <ParamRow label="Highlight Tone" value={signed(recipe.highlightTone)} />
          <ParamRow label="Shadow Tone" value={signed(recipe.shadowTone)} />
          <ParamRow label="Color" value={signed(recipe.color)} />
          <ParamRow label="Sharpness" value={signed(recipe.sharpness)} />
          <ParamRow label="Noise Reduction" value={signed(recipe.noiseReduction)} />
          <ParamRow label="Clarity" value={signed(recipe.clarity)} />
        </SimpleGrid>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="md">Effekte</Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
          <ParamRow label="Grain Strength" value={recipe.grainStrength} />
          {recipe.grainSize && <ParamRow label="Grain Size" value={recipe.grainSize} />}
          <ParamRow label="Color Chrome Effect" value={recipe.colorChromeEffect} />
          <ParamRow label="Color Chrome FX Blue" value={recipe.colorChromeFxBlue} />
        </SimpleGrid>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="md">Weißabgleich</Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
          <ParamRow label="Modus" value={recipe.whiteBalanceMode.replace(/_/g, ' ')} />
          <ParamRow label="Shift R / B" value={`${signed(recipe.wbShiftRed)} / ${signed(recipe.wbShiftBlue)}`} />
          {recipe.colorTempKelvin && <ParamRow label="Kelvin" value={`${recipe.colorTempKelvin} K`} />}
        </SimpleGrid>
      </Paper>

      {MONOCHROME_SIMS.includes(recipe.filmSimulation) && (recipe.monochromeWarmCool != null || recipe.monochromeGreenMagenta != null) && (
        <Paper withBorder p="md" radius="md">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="md">Monochrome</Text>
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
            <ParamRow label="Warm / Cool" value={signed(recipe.monochromeWarmCool ?? 0)} />
            <ParamRow label="Grün / Magenta" value={signed(recipe.monochromeGreenMagenta ?? 0)} />
          </SimpleGrid>
        </Paper>
      )}

      {(recipe.isoNote || recipe.expCompNote || recipe.description || recipe.inspirationSource) && (
        <Paper withBorder p="md" radius="md">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="md">Notizen</Text>
          <Stack gap="sm">
            {recipe.isoNote && <ParamRow label="ISO" value={recipe.isoNote} />}
            {recipe.expCompNote && <ParamRow label="Belichtung" value={recipe.expCompNote} />}
            {recipe.description && (
              <>
                <Divider />
                <Text size="sm">{recipe.description}</Text>
              </>
            )}
            {recipe.inspirationSource && (
              <Text size="sm" c="dimmed">Inspiration: {recipe.inspirationSource}</Text>
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
