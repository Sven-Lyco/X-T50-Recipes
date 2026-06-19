import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stack, Title, Text, Center, Loader, Paper, Group, Box } from '@mantine/core'
import { useRecipes, useRecipesBulk } from '../api/recipes'
import { filmSimLabel } from '../filmSimLabel'
import { buildFeatureVector, computePca } from '../utils/recipePca'

const SIM_COLORS: Record<string, string> = {
  PROVIA: '#74c0fc',
  VELVIA: '#f03e3e',
  ASTIA: '#f783ac',
  CLASSIC_CHROME: '#868e96',
  CLASSIC_NEGATIVE: '#20c997',
  REALA_ACE: '#2f9e44',
  PRO_NEG_HI: '#f76707',
  PRO_NEG_STD: '#f59f00',
  NOSTALGIC_NEG: '#c0eb75',
  ETERNA: '#cc5de8',
  ETERNA_BLEACH_BYPASS: '#7048e8',
  ACROS: '#1c1c1c',
  ACROS_YE: '#3a3a3a',
  ACROS_R: '#141414',
  ACROS_G: '#555555',
  MONOCHROME: '#adb5bd',
  MONOCHROME_YE: '#868e96',
  MONOCHROME_R: '#6c757d',
  MONOCHROME_G: '#ced4da',
  SEPIA: '#a0522d',
}

const W = 800
const H = 520
const PAD = 48

export default function SimilarityMapPage() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)

  const { data: list, isLoading: listLoading } = useRecipes()
  const ids = useMemo(() => list?.map((r) => r.id) ?? [], [list])
  const { data: recipes, isLoading: recipesLoading } = useRecipesBulk(ids)

  const points = useMemo(() => {
    if (!recipes || recipes.length < 3) return null
    const features = recipes.map(buildFeatureVector)
    const coords = computePca(features)
    return recipes.map((r, i) => ({ recipe: r, x: coords[i][0], y: coords[i][1] }))
  }, [recipes])

  const isLoading = listLoading || recipesLoading

  if (isLoading) return <Center py="xl"><Loader /></Center>
  if (!points) {
    return (
      <Stack gap="lg">
        <Title order={2}>Ähnlichkeits-Map</Title>
        <Text c="dimmed">Mindestens 3 Recipes werden für die Ähnlichkeits-Map benötigt.</Text>
      </Stack>
    )
  }

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  const toSvgX = (x: number) => PAD + ((x - minX) / rangeX) * (W - 2 * PAD)
  const toSvgY = (y: number) => H - PAD - ((y - minY) / rangeY) * (H - 2 * PAD)

  const usedSims = [...new Set(points.map((p) => p.recipe.filmSimulation))]
    .sort((a, b) => filmSimLabel(a).localeCompare(filmSimLabel(b)))

  const hoveredPoint = hovered ? points.find((p) => p.recipe.id === hovered) : null

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>Ähnlichkeits-Map</Title>
        <Text size="sm" c="dimmed">
          Recipes mit ähnlichen Kameraparametern clustern zusammen. Farbe = Filmsimulation. Klick öffnet das Recipe.
        </Text>
      </Stack>

      <Paper withBorder radius="md" style={{ overflowX: 'auto' }}>
        <svg
          width={W}
          height={H}
          style={{ display: 'block', userSelect: 'none' }}
          viewBox={`0 0 ${W} ${H}`}
        >
          {points.map(({ recipe, x, y }) => {
            const sx = toSvgX(x)
            const sy = toSvgY(y)
            const isHov = hovered === recipe.id
            const dimmed = hovered !== null && !isHov
            return (
              <circle
                key={recipe.id}
                cx={sx}
                cy={sy}
                r={isHov ? 11 : 8}
                fill={SIM_COLORS[recipe.filmSimulation] ?? '#aaa'}
                stroke={isHov ? '#000' : 'rgba(0,0,0,0.25)'}
                strokeWidth={isHov ? 2 : 1}
                opacity={dimmed ? 0.2 : 0.9}
                style={{ cursor: 'pointer', transition: 'r 0.1s, opacity 0.15s' }}
                onMouseEnter={() => setHovered(recipe.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              />
            )
          })}

          {hoveredPoint && (() => {
            const sx = toSvgX(hoveredPoint.x)
            const sy = toSvgY(hoveredPoint.y)
            const labelX = sx + 14
            const labelY = sy + 5
            const text = hoveredPoint.recipe.name
            const textWidth = Math.min(text.length * 7 + 16, 260)
            const flipX = labelX + textWidth > W - 8
            const rx = flipX ? sx - textWidth - 14 : labelX
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={rx - 4} y={labelY - 14} width={textWidth} height={22} rx={4} fill="white" stroke="#ddd" strokeWidth={1} />
                <text x={rx + 4} y={labelY + 2} fontSize={12} fill="#333" fontWeight={500}>
                  {text.length > 32 ? text.slice(0, 30) + '…' : text}
                </text>
              </g>
            )
          })()}
        </svg>
      </Paper>

      <Group gap="md" wrap="wrap">
        {usedSims.map((sim) => (
          <Group key={sim} gap={6} align="center">
            <Box
              w={12} h={12}
              style={{ borderRadius: '50%', background: SIM_COLORS[sim] ?? '#aaa', flexShrink: 0, border: '1px solid rgba(0,0,0,0.2)' }}
            />
            <Text size="xs">{filmSimLabel(sim)}</Text>
          </Group>
        ))}
      </Group>
    </Stack>
  )
}
