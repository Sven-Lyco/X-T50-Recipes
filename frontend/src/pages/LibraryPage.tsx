import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Group, Title, Button, Select,
  SimpleGrid, Card, Image, Text, Badge, Stack, Box, Center, ActionIcon, Loader,
} from '@mantine/core'
import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { useRecipes, useToggleFavorite } from '../api/recipes'
import { FILM_SIMS, filmSimLabel } from '../filmSimLabel'
import type { FilmSimulation, RecipeListItem } from '../api/types'

const FILM_SIM_OPTIONS = FILM_SIMS.map((fs) => ({ value: fs, label: filmSimLabel(fs) }))

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Neueste zuerst' },
  { value: 'date_asc', label: 'Älteste zuerst' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'filmsim', label: 'Filmsimulation' },
]

function sortRecipes(recipes: RecipeListItem[], sort: string): RecipeListItem[] {
  const copy = [...recipes]
  switch (sort) {
    case 'date_asc': return copy.reverse()
    case 'name_asc': return copy.sort((a, b) => a.name.localeCompare(b.name))
    case 'name_desc': return copy.sort((a, b) => b.name.localeCompare(a.name))
    case 'filmsim': return copy.sort((a, b) => filmSimLabel(a.filmSimulation).localeCompare(filmSimLabel(b.filmSimulation)))
    default: return copy // date_desc – Backend-Reihenfolge beibehalten
  }
}

export default function LibraryPage() {
  const [filmSim, setFilmSim] = useState<FilmSimulation | null>(null)
  const [tag, setTag] = useState<string | null>(null)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [sort, setSort] = useState('date_desc')
  const { data: recipes, isLoading } = useRecipes(filmSim ?? undefined, tag ?? undefined, onlyFavorites)
  const { data: allRecipes } = useRecipes()
  const tagOptions = useMemo(
    () => [...new Set((allRecipes ?? []).flatMap((r) => r.tags).map((t) => t.toLowerCase()))].sort(),
    [allRecipes]
  )
  const sortedRecipes = useMemo(() => sortRecipes(recipes ?? [], sort), [recipes, sort])
  const toggleFavorite = useToggleFavorite()

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={2}>Bibliothek</Title>
        <Button component={Link} to="/recipes/new">+ Neues Recipe</Button>
      </Group>

      <Group gap="sm">
        <Select
          data={FILM_SIM_OPTIONS}
          value={filmSim}
          onChange={(v) => setFilmSim(v as FilmSimulation | null)}
          w={{ base: '100%', sm: 200 }}
          placeholder="Alle Film Sims"
          clearable
        />
        <Select
          data={tagOptions}
          value={tag}
          onChange={(v) => setTag(v)}
          placeholder="Tag filtern…"
          clearable
          searchable
          flex={1}
          miw={120}
        />
        <Select
          data={SORT_OPTIONS}
          value={sort}
          onChange={(v) => setSort(v ?? 'date_desc')}
          w={{ base: '100%', sm: 180 }}
          allowDeselect={false}
        />
        <ActionIcon
          variant={onlyFavorites ? 'filled' : 'default'}
          color="yellow"
          size="lg"
          aria-label="Nur Favoriten"
          onClick={() => setOnlyFavorites((v) => !v)}
        >
          {onlyFavorites ? <IconStarFilled size={18} /> : <IconStar size={18} />}
        </ActionIcon>
      </Group>

      {isLoading && <Center py="xl"><Loader /></Center>}

      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="md">
        {sortedRecipes.map((recipe) => (
          <Card
            key={recipe.id}
            component={Link}
            to={`/recipes/${recipe.id}`}
            shadow="sm"
            padding="sm"
            radius="md"
            withBorder
            td="none"
            c="inherit"
          >
            <Card.Section pos="relative">
              <Box h={150} bg="gray.1" style={{ overflow: 'hidden' }}>
                {recipe.previewImageFilename ? (
                  <Image
                    src={`/images/${recipe.previewImageFilename}`}
                    h={150}
                    fit="cover"
                    alt={recipe.name}
                  />
                ) : (
                  <Center h={150}>
                    <Text size="xs" c="dimmed">Kein Bild</Text>
                  </Center>
                )}
              </Box>
              <ActionIcon
                variant="filled"
                color="dark"
                size="md"
                pos="absolute"
                top={6}
                right={6}
                aria-label={recipe.favorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleFavorite.mutate({ id: recipe.id, favorite: !recipe.favorite })
                }}
              >
                {recipe.favorite ? (
                  <IconStarFilled size={14} color="var(--mantine-color-yellow-5)" />
                ) : (
                  <IconStar size={14} />
                )}
              </ActionIcon>
            </Card.Section>

            <Stack gap={6} mt="sm">
              <Text fw={600} size="sm" lineClamp={1}>{recipe.name}</Text>
              <Text size="xs" c="dimmed">{filmSimLabel(recipe.filmSimulation)}</Text>
              {recipe.cameraSlot && (
                <Badge size="sm" color="dark" variant="filled" w="fit-content">
                  {recipe.cameraSlot}
                </Badge>
              )}
              {recipe.aiGenerated && (
                <Badge size="sm" color="violet" variant="light" w="fit-content">KI</Badge>
              )}
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  )
}
