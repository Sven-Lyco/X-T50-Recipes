import { useSearchParams, Link } from 'react-router-dom'
import {
  Stack, Group, Title, Text, Button, Badge, Table, ScrollArea,
  Box, Image, AspectRatio, ActionIcon,
} from '@mantine/core'
import { useRecipesBulk } from '../api/recipes'
import { computeSimilarity, similarityColor } from '../utils/recipeSimilarity'
import { filmSimLabel, MONOCHROME_SIMS } from '../filmSimLabel'
import type { Recipe } from '../api/types'

function signed(n: number) {
  return n > 0 ? `+${n}` : String(n)
}

interface ParamRow {
  label: string
  section: string
  getValue: (r: Recipe) => string
  show?: (recipes: Recipe[]) => boolean
}

const ROWS: ParamRow[] = [
  { section: 'Grundeinstellungen', label: 'Film Simulation', getValue: (r) => filmSimLabel(r.filmSimulation) },
  { section: 'Grundeinstellungen', label: 'Dynamic Range', getValue: (r) => r.dynamicRange },
  { section: 'Bildparameter', label: 'Highlight Tone', getValue: (r) => signed(r.highlightTone) },
  { section: 'Bildparameter', label: 'Shadow Tone', getValue: (r) => signed(r.shadowTone) },
  { section: 'Bildparameter', label: 'Color', getValue: (r) => signed(r.color) },
  { section: 'Bildparameter', label: 'Sharpness', getValue: (r) => signed(r.sharpness) },
  { section: 'Bildparameter', label: 'Noise Reduction', getValue: (r) => signed(r.noiseReduction) },
  { section: 'Bildparameter', label: 'Clarity', getValue: (r) => signed(r.clarity) },
  { section: 'Effekte', label: 'Grain Strength', getValue: (r) => r.grainStrength },
  { section: 'Effekte', label: 'Grain Size', getValue: (r) => r.grainSize ?? '—' },
  { section: 'Effekte', label: 'Color Chrome Effect', getValue: (r) => r.colorChromeEffect },
  { section: 'Effekte', label: 'Color Chrome FX Blue', getValue: (r) => r.colorChromeFxBlue },
  { section: 'Weißabgleich', label: 'Modus', getValue: (r) => r.whiteBalanceMode.replace(/_/g, ' ') },
  { section: 'Weißabgleich', label: 'WB Shift R', getValue: (r) => signed(r.wbShiftRed) },
  { section: 'Weißabgleich', label: 'WB Shift B', getValue: (r) => signed(r.wbShiftBlue) },
  {
    section: 'Weißabgleich', label: 'Kelvin',
    getValue: (r) => r.colorTempKelvin ? `${r.colorTempKelvin} K` : '—',
    show: (rs) => rs.some((r) => r.whiteBalanceMode === 'COLOR_TEMP'),
  },
  {
    section: 'Monochrome', label: 'Warm / Cool',
    getValue: (r) => r.monochromeWarmCool != null ? signed(r.monochromeWarmCool) : '—',
    show: (rs) => rs.some((r) => MONOCHROME_SIMS.includes(r.filmSimulation)),
  },
  {
    section: 'Monochrome', label: 'Grün / Magenta',
    getValue: (r) => r.monochromeGreenMagenta != null ? signed(r.monochromeGreenMagenta) : '—',
    show: (rs) => rs.some((r) => MONOCHROME_SIMS.includes(r.filmSimulation)),
  },
]

export default function CompareResultPage() {
  const [searchParams] = useSearchParams()
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) ?? []
  const { data: recipes, isLoading } = useRecipesBulk(ids)

  if (ids.length < 2) {
    return (
      <Stack gap="md">
        <Text c="red">Bitte wähle mindestens 2 Recipes aus.</Text>
        <Button component={Link} to="/compare" variant="default">Auswahl</Button>
      </Stack>
    )
  }

  if (isLoading) return <Text c="dimmed">Laden…</Text>
  if (!recipes) return <Text c="red">Recipes konnten nicht geladen werden.</Text>

  const first = recipes[0]
  const visibleRows = ROWS.filter((row) => !row.show || row.show(recipes))

  const sections = [...new Set(visibleRows.map((r) => r.section))]

  const backUrl = `/compare?ids=${ids.join(',')}`

  return (
    <Stack gap="lg">
      <Group gap="sm" align="center">
        <ActionIcon variant="subtle" color="gray" size="lg" component={Link} to={backUrl} aria-label="Zurück">
          ←
        </ActionIcon>
        <Title order={2}>Vergleich</Title>
      </Group>

      {/* Preview images + similarity badges */}
      <ScrollArea>
        <Group gap="md" wrap="nowrap" align="flex-start" maw="100%">
          {recipes.map((recipe, i) => {
            const score = i === 0 ? null : computeSimilarity(first, recipe)
            const img = recipe.images[0]
            return (
              <Box key={recipe.id} miw={160} maw={200} style={{ flex: '0 0 auto' }}>
                <AspectRatio ratio={3 / 2}>
                  <Box bg="gray.1" style={{ borderRadius: 8, overflow: 'hidden' }}>
                    {img ? (
                      <Image src={`/images/${img.filename}`} fit="cover" h="100%" />
                    ) : (
                      <Box w="100%" h="100%" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text size="xs" c="dimmed">Kein Bild</Text>
                      </Box>
                    )}
                  </Box>
                </AspectRatio>
                <Stack gap={4} mt={8}>
                  <Text fw={600} size="sm" lineClamp={2} component={Link} to={`/recipes/${recipe.id}`} c="inherit" td="none">
                    {recipe.name}
                  </Text>
                  {score !== null && (
                    <Badge color={similarityColor(score)} variant="light" size="sm">
                      {score}% ähnlich
                    </Badge>
                  )}
                  {i === 0 && (
                    <Badge color="blue" variant="light" size="sm">Referenz</Badge>
                  )}
                </Stack>
              </Box>
            )
          })}
        </Group>
      </ScrollArea>

      {/* Parameter table */}
      <ScrollArea>
        <Table withTableBorder withColumnBorders fz="sm" miw={400}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={160}>Parameter</Table.Th>
              {recipes.map((r) => (
                <Table.Th key={r.id}>{r.name}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sections.map((section) => {
              const sectionRows = visibleRows.filter((r) => r.section === section)
              return [
                <Table.Tr key={`section-${section}`}>
                  <Table.Td
                    colSpan={recipes.length + 1}
                    style={{
                      background: 'var(--mantine-color-gray-1)',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--mantine-color-dimmed)',
                    }}
                  >
                    {section}
                  </Table.Td>
                </Table.Tr>,
                ...sectionRows.map((row) => {
                  const values = recipes.map((r) => row.getValue(r))
                  const allSame = values.every((v) => v === values[0])
                  return (
                    <Table.Tr key={row.label}>
                      <Table.Td c="dimmed">{row.label}</Table.Td>
                      {values.map((val, i) => (
                        <Table.Td
                          key={i}
                          fw={!allSame ? 600 : undefined}
                          style={
                            !allSame
                              ? { background: 'var(--mantine-color-yellow-0)' }
                              : undefined
                          }
                        >
                          {val}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  )
                }),
              ]
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Group gap="xs">
        <Button component={Link} to={backUrl} variant="default">
          Auswahl anpassen
        </Button>
        <Button component={Link} to="/compare" variant="subtle" color="gray">
          Neue Auswahl
        </Button>
      </Group>
    </Stack>
  )
}
