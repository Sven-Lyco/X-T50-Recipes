import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stack, Title, Text, Center, Loader, Paper, Group, Box, Switch, Button } from '@mantine/core'
import { useRecipes, useRecipesBulk } from '../api/recipes'
import { filmSimLabel } from '../filmSimLabel'
import { computeMds } from '../utils/recipePca'
import { computeSimilarity } from '../utils/recipeSimilarity'
import type { Recipe } from '../api/types'

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

function simToColor(sim: number): string {
  const hue = Math.round((1 - sim / 100) * 120)
  return `hsl(${hue}, 65%, 50%)`
}

export default function SimilarityMapPage() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [onlySlots, setOnlySlots] = useState(false)

  const { data: list, isLoading: listLoading } = useRecipes()
  const ids = useMemo(() => list?.map((r) => r.id) ?? [], [list])
  const { data: allRecipes, isLoading: recipesLoading } = useRecipesBulk(ids)

  const recipes = useMemo(
    () => onlySlots ? allRecipes?.filter((r) => r.cameraSlot != null) : allRecipes,
    [allRecipes, onlySlots]
  )

  const points = useMemo(() => {
    if (!recipes || recipes.length < 2) return null
    const coords = computeMds(recipes as unknown as Recipe[])
    return recipes.map((r, i) => ({ recipe: r, x: coords[i][0], y: coords[i][1] }))
  }, [recipes])

  const similarities = useMemo(() => {
    if (!selected || !recipes) return null
    const ref = recipes.find((r) => r.id === selected)
    if (!ref) return null
    const map: Record<string, number> = {}
    for (const r of recipes) {
      map[r.id] = Math.round(computeSimilarity(ref as unknown as Recipe, r as unknown as Recipe))
    }
    return map
  }, [selected, recipes])

  const isLoading = listLoading || recipesLoading

  if (isLoading) return <Center py="xl"><Loader /></Center>
  if (!points) {
    return (
      <Stack gap="lg">
        <Title order={2}>Ähnlichkeits-Map</Title>
        <Text c="dimmed">
          {onlySlots
            ? 'Mindestens 2 Recipes müssen einem Kamera-Slot (C1–C7) zugewiesen sein.'
            : 'Mindestens 2 Recipes werden für die Ähnlichkeits-Map benötigt.'}
        </Text>
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

  const selectedRecipe = selected ? recipes?.find((r) => r.id === selected) : null

  const getFill = (id: string, filmSim: string) => {
    if (!selected) return SIM_COLORS[filmSim] ?? '#aaa'
    if (id === selected) return '#1971c2'
    return simToColor(similarities?.[id] ?? 50)
  }

  const hoveredPoint = hovered ? points.find((p) => p.recipe.id === hovered) : null
  const hoveredSim = hovered && similarities && hovered !== selected ? similarities[hovered] : null
  const tooltipText = hoveredPoint
    ? hoveredSim !== null
      ? `${hoveredPoint.recipe.name} · ${hoveredSim}% ähnlich`
      : hoveredPoint.recipe.name
    : null

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={2}>Ähnlichkeits-Map</Title>
          <Text size="sm" c="dimmed">
            {selected
              ? `Farbe = Ähnlichkeit zu „${selectedRecipe?.name}". Tippe einen anderen Punkt zum Wechseln.`
              : 'Tippe einen Punkt als Referenz – dann zeigt die Farbe die Ähnlichkeit zu diesem Recipe.'}
          </Text>
        </Stack>
        <Switch
          label="Nur C1–C7"
          checked={onlySlots}
          onChange={(e) => { setOnlySlots(e.currentTarget.checked); setSelected(null) }}
          mt={4}
        />
      </Group>

      {selectedRecipe && (
        <Paper withBorder p="sm" radius="md">
          <Group justify="space-between" wrap="nowrap">
            <Stack gap={2}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.05em' }}>
                Referenz
              </Text>
              <Text fw={600}>{selectedRecipe.name}</Text>
            </Stack>
            <Group gap="xs" wrap="nowrap">
              <Button size="xs" variant="subtle" color="gray" onClick={() => setSelected(null)}>
                Abwählen
              </Button>
              <Button size="xs" variant="light" onClick={() => navigate(`/recipes/${selected}`)}>
                Öffnen
              </Button>
            </Group>
          </Group>
        </Paper>
      )}

      <Paper withBorder radius="md" style={{ overflowX: 'auto' }}>
        <svg
          width={W}
          height={H}
          style={{ display: 'block', userSelect: 'none' }}
          viewBox={`0 0 ${W} ${H}`}
          onMouseLeave={() => setHovered(null)}
          onClick={() => setSelected(null)}
        >
          <rect width={W} height={H} fill="transparent" />

          {points.map(({ recipe, x, y }) => {
            const sx = toSvgX(x)
            const sy = toSvgY(y)
            const isSelected = selected === recipe.id
            const isHov = hovered === recipe.id
            const dimmed = selected === null && hovered !== null && !isHov
            const r = isSelected ? 12 : isHov ? 10 : 8
            const stroke = isSelected ? '#1864ab' : isHov ? '#000' : 'rgba(0,0,0,0.25)'
            const strokeWidth = isSelected ? 3 : isHov ? 2 : 1
            return (
              <circle
                key={recipe.id}
                cx={sx}
                cy={sy}
                r={r}
                fill={getFill(recipe.id, recipe.filmSimulation)}
                stroke={stroke}
                strokeWidth={strokeWidth}
                opacity={dimmed ? 0.2 : 0.9}
                style={{ cursor: 'pointer', transition: 'r 0.1s, opacity 0.15s, fill 0.25s' }}
                onMouseEnter={() => setHovered(recipe.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelected(selected === recipe.id ? null : recipe.id)
                }}
              />
            )
          })}

          {hoveredPoint && tooltipText && (() => {
            const sx = toSvgX(hoveredPoint.x)
            const sy = toSvgY(hoveredPoint.y)
            const textWidth = Math.min(tooltipText.length * 7 + 16, 300)
            const labelX = sx + 14
            const flipX = labelX + textWidth > W - 8
            const rx = flipX ? sx - textWidth - 14 : labelX
            const labelY = sy + 5
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={rx - 4} y={labelY - 14} width={textWidth} height={22} rx={4} fill="white" stroke="#ddd" strokeWidth={1} />
                <text x={rx + 4} y={labelY + 2} fontSize={12} fill="#333" fontWeight={500}>
                  {tooltipText.length > 40 ? tooltipText.slice(0, 38) + '…' : tooltipText}
                </text>
              </g>
            )
          })()}
        </svg>
      </Paper>

      {selected ? (
        <Group gap="xs" align="center">
          <Text size="xs" c="dimmed">Sehr verschieden</Text>
          <Box style={{
            width: 140,
            height: 12,
            borderRadius: 6,
            background: 'linear-gradient(to right, hsl(120,65%,50%), hsl(60,65%,50%), hsl(0,65%,50%))',
            border: '1px solid rgba(0,0,0,0.1)',
            flexShrink: 0,
          }} />
          <Text size="xs" c="dimmed">Sehr ähnlich</Text>
        </Group>
      ) : (
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
      )}
    </Stack>
  )
}
