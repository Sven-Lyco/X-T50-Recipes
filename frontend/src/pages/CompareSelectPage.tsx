import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Stack, Group, Title, Text, Button, Select, TextInput,
  SimpleGrid, Card, Image, Box, Center, Badge, Checkbox, Loader,
} from '@mantine/core'
import { useRecipes } from '../api/recipes'
import { FILM_SIMS, filmSimLabel } from '../filmSimLabel'
import type { FilmSimulation } from '../api/types'

const FILM_SIM_OPTIONS = FILM_SIMS.map((fs) => ({ value: fs, label: filmSimLabel(fs) }))

export default function CompareSelectPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const initialIds = searchParams.get('ids')?.split(',').filter(Boolean) ?? []
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds)

  const [filmSim, setFilmSim] = useState<FilmSimulation | null>(null)
  const [tag, setTag] = useState('')
  const { data: recipes, isLoading } = useRecipes(filmSim ?? undefined, tag || undefined)

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={2}>Recipes vergleichen</Title>
          <Text c="dimmed" size="sm">Wähle 2 bis 4 Recipes aus, dann klicke „Vergleichen"</Text>
        </Stack>
        <Button
          disabled={selectedIds.length < 2}
          onClick={() => navigate(`/compare/result?ids=${selectedIds.join(',')}`)}
        >
          Vergleichen{selectedIds.length >= 2 ? ` (${selectedIds.length})` : ''}
        </Button>
      </Group>

      <Group gap="sm">
        <Select
          data={FILM_SIM_OPTIONS}
          value={filmSim}
          onChange={(v) => setFilmSim(v as FilmSimulation | null)}
          w={{ base: '100%', sm: 220 }}
          placeholder="Alle Film Sims"
          clearable
        />
        <TextInput
          placeholder="Tag filtern…"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          flex={1}
          miw={120}
        />
      </Group>

      {selectedIds.length > 0 && (
        <Group gap="xs">
          <Text size="sm" c="dimmed">{selectedIds.length} von max. 4 ausgewählt</Text>
          <Button
            variant="subtle"
            size="xs"
            color="gray"
            onClick={() => setSelectedIds([])}
          >
            Auswahl aufheben
          </Button>
        </Group>
      )}

      {isLoading && <Center py="xl"><Loader /></Center>}

      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="md">
        {recipes?.map((recipe) => {
          const selected = selectedIds.includes(recipe.id)
          const maxReached = !selected && selectedIds.length >= 4
          return (
            <Card
              key={recipe.id}
              shadow="sm"
              padding="sm"
              radius="md"
              withBorder
              onClick={() => !maxReached && toggleSelect(recipe.id)}
              style={{
                cursor: maxReached ? 'default' : 'pointer',
                opacity: maxReached ? 0.4 : 1,
                outline: selected ? '2px solid var(--mantine-color-blue-5)' : undefined,
                outlineOffset: selected ? 2 : undefined,
              }}
            >
              <Card.Section pos="relative">
                <Box h={130} bg="gray.1" style={{ overflow: 'hidden' }}>
                  {recipe.previewImageFilename ? (
                    <Image
                      src={`/images/${recipe.previewImageFilename}`}
                      h={130}
                      fit="cover"
                      alt={recipe.name}
                    />
                  ) : (
                    <Center h={130}>
                      <Text size="xs" c="dimmed">Kein Bild</Text>
                    </Center>
                  )}
                </Box>
                <Box pos="absolute" top={8} left={8}>
                  <Checkbox
                    checked={selected}
                    onChange={() => !maxReached && toggleSelect(recipe.id)}
                    onClick={(e) => e.stopPropagation()}
                    styles={{ input: { cursor: 'pointer' } }}
                  />
                </Box>
              </Card.Section>

              <Stack gap={4} mt="sm">
                <Text fw={600} size="sm" lineClamp={1}>{recipe.name}</Text>
                <Text size="xs" c="dimmed">{filmSimLabel(recipe.filmSimulation)}</Text>
                {recipe.cameraSlot && (
                  <Badge size="sm" color="dark" variant="filled" w="fit-content">
                    {recipe.cameraSlot}
                  </Badge>
                )}
              </Stack>
            </Card>
          )
        })}
      </SimpleGrid>

      {recipes?.length === 0 && !isLoading && (
        <Text c="dimmed">Keine Recipes gefunden. <Link to="/recipes/new">Jetzt anlegen?</Link></Text>
      )}
    </Stack>
  )
}
