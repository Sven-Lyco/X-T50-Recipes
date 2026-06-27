import { Link } from 'react-router-dom'
import {
  Stack, Title, Text, Badge, SimpleGrid, Card, Table, Center,
  Loader, Anchor,
} from '@mantine/core'
import { useSlotProtocol, useCameraStatus } from '../api/recipes'
import { CAMERA_SLOTS, type CameraSlot, type SlotChangeLog } from '../api/types'

function slotStats(logs: SlotChangeLog[], slot: CameraSlot) {
  const slotLogs = logs.filter((e) => e.slot === slot)
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  const recentCount = slotLogs.filter((e) => new Date(e.changedAt).getTime() >= thirtyDaysAgo).length
  const lastLog = slotLogs[0]
  return { total: slotLogs.length, recentCount, lastChangedAt: lastLog?.changedAt ?? null }
}

function stabilityBadge(recentCount: number, total: number, isOccupied: boolean) {
  if (total === 0) return isOccupied
    ? <Badge color="green" size="sm">stabil</Badge>
    : <Badge color="gray" size="sm">leer</Badge>
  if (recentCount >= 3) return <Badge color="orange" size="sm">aktiv</Badge>
  if (recentCount === 0) return <Badge color="green" size="sm">stabil</Badge>
  return <Badge color="gray" size="sm">{recentCount}× / 30 Tage</Badge>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function RecipeCellContent({ id, name }: { id: string | null; name: string | null }) {
  if (!id) return <Text c="dimmed">—</Text>
  return (
    <Anchor component={Link} to={`/recipes/${id}`} size="sm">
      {name ?? id}
    </Anchor>
  )
}

export default function SlotProtocolPage() {
  const { data: logs, isLoading: logsLoading } = useSlotProtocol()
  const { data: cameraStatus, isLoading: statusLoading } = useCameraStatus()

  if (logsLoading || statusLoading) {
    return <Center h={200}><Loader /></Center>
  }

  const entries = logs ?? []
  const occupiedSlots = new Set((cameraStatus ?? []).map((r) => r.cameraSlot))

  return (
    <Stack gap="xl">
      <Title order={2}>Slot-Protokoll</Title>

      <SimpleGrid cols={{ base: 2, xs: 4, sm: 7 }} spacing="sm">
        {CAMERA_SLOTS.map((slot) => {
          const { total, recentCount, lastChangedAt } = slotStats(entries, slot)
          const isOccupied = occupiedSlots.has(slot)
          return (
            <Card key={slot} withBorder padding="sm" radius="md">
              <Text fw={700} size="lg">{slot}</Text>
              {stabilityBadge(recentCount, total, isOccupied)}
              <Text size="xs" c="dimmed" mt={4}>
                {total === 0
                  ? 'Noch kein Wechsel'
                  : `${total} Wechsel gesamt`}
              </Text>
              {lastChangedAt && (
                <Text size="xs" c="dimmed">
                  Zuletzt: {new Date(lastChangedAt).toLocaleDateString('de-DE')}
                </Text>
              )}
            </Card>
          )
        })}
      </SimpleGrid>

      {entries.length === 0 ? (
        <Text c="dimmed">Noch keine Slot-Wechsel aufgezeichnet.</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Slot</Table.Th>
              <Table.Th>Von</Table.Th>
              <Table.Th>Zu</Table.Th>
              <Table.Th>Wann</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {entries.map((entry) => (
              <Table.Tr key={entry.id}>
                <Table.Td>
                  <Badge variant="light">{entry.slot}</Badge>
                </Table.Td>
                <Table.Td>
                  <RecipeCellContent id={entry.previousRecipeId} name={entry.previousRecipeName} />
                </Table.Td>
                <Table.Td>
                  {entry.newRecipeId
                    ? <RecipeCellContent id={entry.newRecipeId} name={entry.newRecipeName} />
                    : <Text c="dimmed" fs="italic" size="sm">Entfernt</Text>}
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">{formatDate(entry.changedAt)}</Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  )
}
