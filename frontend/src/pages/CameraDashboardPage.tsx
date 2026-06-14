import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Stack, Title, SimpleGrid, Card, Image, Text, Badge,
  Select, Box, Modal, Button, Group, Center,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useCameraStatus, useRecipes, useAssignCameraSlot } from '../api/recipes'
import { CAMERA_SLOTS, type CameraSlot, type SlotConflict } from '../api/types'

export default function CameraDashboardPage() {
  const { data: cameraStatus } = useCameraStatus()
  const { data: allRecipes } = useRecipes()
  const assignSlot = useAssignCameraSlot()
  const [conflict, setConflict] = useState<{ slot: CameraSlot; recipeId: string; info: SlotConflict } | null>(null)

  async function handleAssign(recipeId: string, slot: CameraSlot, force = false) {
    try {
      await assignSlot.mutateAsync({ id: recipeId, slot, force })
      notifications.show({ message: `${slot} zugewiesen`, color: 'green' })
    } catch (err: unknown) {
      const response = (err as { response?: { status: number; data: SlotConflict } }).response
      if (response?.status === 409) {
        setConflict({ slot, recipeId, info: response.data })
      } else {
        notifications.show({ message: 'Fehler beim Zuweisen', color: 'red' })
      }
    }
  }

  const slotMap = new Map(cameraStatus?.map((r) => [r.cameraSlot!, r]))
  const recipeOptions = allRecipes?.map((r) => ({ value: r.id, label: r.name })) ?? []

  return (
    <Stack gap="lg">
      <Title order={2}>Kamera-Dashboard</Title>

      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="md">
        {CAMERA_SLOTS.map((slot) => {
          const recipe = slotMap.get(slot)
          return (
            <Card key={slot} shadow="sm" padding="sm" radius="md" withBorder>
              <Card.Section>
                <Box h={130} bg="gray.1" pos="relative" style={{ overflow: 'hidden' }}>
                  {recipe?.previewImageFilename ? (
                    <Image src={`/images/${recipe.previewImageFilename}`} h={130} fit="cover" alt="" />
                  ) : (
                    <Center h={130}>
                      <Text size="xs" c="dimmed">Leer</Text>
                    </Center>
                  )}
                  <Badge
                    color="dark"
                    variant="filled"
                    pos="absolute"
                    top={8}
                    left={8}
                  >
                    {slot}
                  </Badge>
                </Box>
              </Card.Section>

              <Stack gap="xs" mt="sm">
                {recipe ? (
                  <Text
                    size="sm"
                    fw={500}
                    component={Link}
                    to={`/recipes/${recipe.id}`}
                    td="none"
                    c="inherit"
                    lineClamp={1}
                  >
                    {recipe.name}
                  </Text>
                ) : (
                  <Text size="sm" c="dimmed">Kein Recipe</Text>
                )}

                <Select
                  size="xs"
                  placeholder="Recipe zuweisen…"
                  data={recipeOptions}
                  value={recipe?.id ?? null}
                  onChange={(v) => { if (v) handleAssign(v, slot) }}
                  searchable
                  clearable={false}
                />
              </Stack>
            </Card>
          )
        })}
      </SimpleGrid>

      <Modal
        opened={!!conflict}
        onClose={() => setConflict(null)}
        title="Slot bereits belegt"
        centered
      >
        {conflict && (
          <Stack>
            <Text size="sm">
              <strong>{conflict.slot}</strong> ist bereits belegt mit „{conflict.info.occupiedBy.name}".
              Trotzdem zuweisen?
            </Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConflict(null)}>Abbrechen</Button>
              <Button
                color="red"
                onClick={async () => {
                  await handleAssign(conflict.recipeId, conflict.slot, true)
                  setConflict(null)
                }}
              >
                Trotzdem zuweisen
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
