import { Stack, Text } from '@mantine/core'
import { topDifferences } from '../utils/recipeSimilarity'
import type { Recipe } from '../api/types'

interface Props {
  a: Recipe
  b: Recipe
}

// Zeigt die größten Unterschiede (max. 3) zwischen zwei Recipes: "Label: Wert A → Wert B"
export default function RecipeDifferenceList({ a, b }: Props) {
  const differences = topDifferences(a, b, 3)

  if (differences.length === 0) {
    return <Text size="xs" c="dimmed">Keine Unterschiede</Text>
  }

  return (
    <Stack gap={0}>
      {differences.map(d => (
        <Text key={d.label} size="xs" c="dimmed">
          {`${d.label}: ${d.valueA} → ${d.valueB}`}
        </Text>
      ))}
    </Stack>
  )
}
