import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Stack, Title, Paper, SimpleGrid, TextInput, Textarea,
  Select, SegmentedControl, NumberInput, TagsInput,
  Button, Group, Text, FileButton, Image, ActionIcon, Box, AspectRatio, Modal,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, rectSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical, IconMaximize, IconMinus, IconPlus, IconX } from '@tabler/icons-react'
import { useRecipe, useCreateRecipe, useUpdateRecipe, useUploadImage, useDeleteImage, useReorderImages } from '../api/recipes'
import { FILM_SIMS, MONOCHROME_SIMS, filmSimLabel } from '../filmSimLabel'
import { CAMERA_SLOTS, type CameraSlot, type EffectStrength, type GrainSize, type GrainStrength, type RecipeRequest, type WhiteBalanceMode } from '../api/types'

const WB_MODES: WhiteBalanceMode[] = [
  'AUTO', 'DAYLIGHT', 'SHADE', 'FLUORESCENT_1', 'FLUORESCENT_2', 'FLUORESCENT_3',
  'INCANDESCENT', 'UNDERWATER', 'COLOR_TEMP', 'CUSTOM_1', 'CUSTOM_2', 'CUSTOM_3',
]
const SLOTS: (CameraSlot | 'BIBLIOTHEK')[] = ['BIBLIOTHEK', ...CAMERA_SLOTS]

const DEFAULTS: RecipeRequest = {
  name: '', filmSimulation: 'PROVIA', dynamicRange: 'DR100',
  highlightTone: 0, shadowTone: 0, color: 0, sharpness: 0,
  noiseReduction: 0, clarity: 0,
  grainStrength: 'OFF', grainSize: null,
  colorChromeEffect: 'OFF', colorChromeFxBlue: 'OFF',
  whiteBalanceMode: 'AUTO', wbShiftRed: 0, wbShiftBlue: 0, colorTempKelvin: null,
  monochromeWarmCool: null, monochromeGreenMagenta: null,
  isoNote: null, expCompNote: null, description: null, inspirationSource: null,
  tags: [], cameraSlot: null,
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">{children}</Text>
  )
}

function NumberStepperField({ label, min, max, step = 1, value, onChange }: {
  label: string; min: number; max: number; step?: number; value: number; onChange: (v: number) => void
}) {
  const round = (v: number) => Math.round(v / step) * step
  const clamp = (v: number) => Math.min(max, Math.max(min, round(v)))
  return (
    <Stack gap={4}>
      <Text size="sm">{label}</Text>
      <Group gap="xs">
        <ActionIcon
          variant="default" size="lg"
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          aria-label={`${label} verringern`}
        >
          <IconMinus size={16} />
        </ActionIcon>
        <Text size="sm" fw={600} ta="center" miw={40}>{value > 0 ? `+${value}` : value}</Text>
        <ActionIcon
          variant="default" size="lg"
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          aria-label={`${label} erhöhen`}
        >
          <IconPlus size={16} />
        </ActionIcon>
      </Group>
    </Stack>
  )
}

interface SortableImageTileProps {
  img: { id: string; filename: string; caption: string | null; sortOrder: number }
  onDelete: (id: string) => void
  onFullscreen: (filename: string) => void
}

function SortableImageTile({ img, onDelete, onFullscreen }: SortableImageTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: img.id })
  return (
    <Box
      ref={setNodeRef}
      pos="relative"
      opacity={isDragging ? 0.5 : 1}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <AspectRatio ratio={3 / 2}>
        <Image src={`/images/${img.filename}`} radius="sm" fit="cover" alt={img.caption ?? ''} />
      </AspectRatio>
      <ActionIcon
        color="dark"
        variant="filled"
        size="sm"
        radius="xl"
        pos="absolute"
        top={6}
        left={6}
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab' }}
      >
        <IconGripVertical size={12} />
      </ActionIcon>
      <ActionIcon
        color="dark"
        variant="filled"
        size="sm"
        radius="xl"
        pos="absolute"
        top={6}
        right={32}
        onClick={() => onFullscreen(img.filename)}
      >
        <IconMaximize size={12} />
      </ActionIcon>
      <ActionIcon
        color="red"
        variant="filled"
        size="sm"
        radius="xl"
        pos="absolute"
        top={6}
        right={6}
        onClick={() => onDelete(img.id)}
      >
        <IconX size={12} />
      </ActionIcon>
    </Box>
  )
}

export default function RecipeFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const { data: existing } = useRecipe(id)
  const createRecipe = useCreateRecipe()
  const updateRecipe = useUpdateRecipe(id ?? '')
  const uploadImage = useUploadImage(id ?? '')
  const deleteImage = useDeleteImage(id ?? '')
  const reorderImages = useReorderImages(id ?? '')
  const navigate = useNavigate()
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [imageOrder, setImageOrder] = useState<string[]>([])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const form = useForm<RecipeRequest & { slotSelection: string }>({
    initialValues: { ...DEFAULTS, slotSelection: 'BIBLIOTHEK' },
  })

  useEffect(() => {
    if (existing) {
      form.initialize({
        ...existing,
        tags: existing.tags,
        slotSelection: existing.cameraSlot ?? 'BIBLIOTHEK',
      })
      setImageOrder(
        [...existing.images].sort((a, b) => a.sortOrder - b.sortOrder).map((i) => i.id)
      )
    }
  // form.initialize ist eine stabile Referenz (Mantine useForm-Invariante)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setImageOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as string)
      const newIndex = prev.indexOf(over.id as string)
      const next = arrayMove(prev, oldIndex, newIndex)
      reorderImages.mutate(next.map((imgId, idx) => ({ id: imgId, sortOrder: idx })))
      return next
    })
  }

  async function handleSubmit(values: RecipeRequest & { slotSelection: string }) {
    const { slotSelection, ...rest } = values
    const payload: RecipeRequest = {
      ...rest,
      cameraSlot: slotSelection === 'BIBLIOTHEK' ? null : slotSelection as CameraSlot,
      grainSize: values.grainStrength === 'OFF' ? null : values.grainSize,
      colorTempKelvin: values.whiteBalanceMode === 'COLOR_TEMP' ? values.colorTempKelvin : null,
      monochromeWarmCool: MONOCHROME_SIMS.includes(values.filmSimulation) ? values.monochromeWarmCool : null,
      monochromeGreenMagenta: MONOCHROME_SIMS.includes(values.filmSimulation) ? values.monochromeGreenMagenta : null,
    }
    try {
      if (isEdit) {
        await updateRecipe.mutateAsync(payload)
        notifications.show({ message: 'Recipe gespeichert', color: 'green' })
        navigate(`/recipes/${id}`)
      } else {
        const created = await createRecipe.mutateAsync(payload)
        notifications.show({ message: 'Recipe erstellt', color: 'green' })
        navigate(`/recipes/${created.id}`)
      }
    } catch {
      notifications.show({ message: 'Fehler beim Speichern', color: 'red' })
    }
  }

  const isMonochrome = MONOCHROME_SIMS.includes(form.values.filmSimulation)
  const isBusy = createRecipe.isPending || updateRecipe.isPending

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="lg" maw={760}>
        <Title order={2}>{isEdit ? 'Recipe bearbeiten' : 'Neues Recipe'}</Title>

        <Paper withBorder p="md" radius="md">
          <SectionTitle>Basics</SectionTitle>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput label="Name" required {...form.getInputProps('name')} />
            <Select
              label="Film Simulation"
              data={FILM_SIMS.map((fs) => ({ value: fs, label: filmSimLabel(fs) }))}
              {...form.getInputProps('filmSimulation')}
            />
            <Stack gap={4}>
              <Text size="sm">Dynamic Range</Text>
              <SegmentedControl
                data={['DR100', 'DR200', 'DR400']}
                {...form.getInputProps('dynamicRange')}
              />
            </Stack>
          </SimpleGrid>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <SectionTitle>Bildparameter</SectionTitle>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
            <NumberStepperField label="Highlight Tone" min={-2} max={4} step={0.5} value={form.values.highlightTone} onChange={(v) => form.setFieldValue('highlightTone', v)} />
            <NumberStepperField label="Shadow Tone" min={-2} max={4} step={0.5} value={form.values.shadowTone} onChange={(v) => form.setFieldValue('shadowTone', v)} />
            <NumberStepperField label="Color" min={-4} max={4} value={form.values.color} onChange={(v) => form.setFieldValue('color', v)} />
            <NumberStepperField label="Sharpness" min={-4} max={4} value={form.values.sharpness} onChange={(v) => form.setFieldValue('sharpness', v)} />
            <NumberStepperField label="Noise Reduction" min={-4} max={4} value={form.values.noiseReduction} onChange={(v) => form.setFieldValue('noiseReduction', v)} />
            <NumberStepperField label="Clarity" min={-5} max={5} value={form.values.clarity} onChange={(v) => form.setFieldValue('clarity', v)} />
          </SimpleGrid>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <SectionTitle>Effekte</SectionTitle>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Stack gap={4}>
              <Text size="sm">Grain Strength</Text>
              <SegmentedControl
                data={['OFF', 'WEAK', 'STRONG'] as GrainStrength[]}
                {...form.getInputProps('grainStrength')}
              />
            </Stack>
            {form.values.grainStrength !== 'OFF' && (
              <Stack gap={4}>
                <Text size="sm">Grain Size</Text>
                <SegmentedControl
                  data={['SMALL', 'LARGE'] as GrainSize[]}
                  value={form.values.grainSize ?? 'SMALL'}
                  onChange={(v) => form.setFieldValue('grainSize', v as GrainSize)}
                />
              </Stack>
            )}
            <Stack gap={4}>
              <Text size="sm">Color Chrome Effect</Text>
              <SegmentedControl
                data={['OFF', 'WEAK', 'STRONG'] as EffectStrength[]}
                {...form.getInputProps('colorChromeEffect')}
              />
            </Stack>
            <Stack gap={4}>
              <Text size="sm">Color Chrome FX Blue</Text>
              <SegmentedControl
                data={['OFF', 'WEAK', 'STRONG'] as EffectStrength[]}
                {...form.getInputProps('colorChromeFxBlue')}
              />
            </Stack>
          </SimpleGrid>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <SectionTitle>Weißabgleich</SectionTitle>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
            <Select
              label="Modus"
              data={WB_MODES.map((m) => ({ value: m, label: m.replace(/_/g, ' ') }))}
              {...form.getInputProps('whiteBalanceMode')}
            />
            {form.values.whiteBalanceMode === 'COLOR_TEMP' && (
              <NumberInput
                label="Kelvin"
                min={2500} max={10000} step={100}
                {...form.getInputProps('colorTempKelvin')}
              />
            )}
            <NumberStepperField label="WB Shift Rot" min={-9} max={9} value={form.values.wbShiftRed} onChange={(v) => form.setFieldValue('wbShiftRed', v)} />
            <NumberStepperField label="WB Shift Blau" min={-9} max={9} value={form.values.wbShiftBlue} onChange={(v) => form.setFieldValue('wbShiftBlue', v)} />
          </SimpleGrid>
        </Paper>

        {isMonochrome && (
          <Paper withBorder p="md" radius="md">
            <SectionTitle>Monochrome</SectionTitle>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
              <NumberStepperField label="Warm / Cool" min={-9} max={9} value={form.values.monochromeWarmCool ?? 0} onChange={(v) => form.setFieldValue('monochromeWarmCool', v)} />
              <NumberStepperField label="Grün / Magenta" min={-9} max={9} value={form.values.monochromeGreenMagenta ?? 0} onChange={(v) => form.setFieldValue('monochromeGreenMagenta', v)} />
            </SimpleGrid>
          </Paper>
        )}

        <Paper withBorder p="md" radius="md">
          <SectionTitle>Notizen & Tags</SectionTitle>
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput label="ISO-Hinweis" placeholder="z.B. ab ISO 800 für DR400" value={form.values.isoNote ?? ''} onChange={(e) => form.setFieldValue('isoNote', e.target.value || null)} />
              <TextInput label="Belichtung" placeholder="z.B. 0 bis -1/3" value={form.values.expCompNote ?? ''} onChange={(e) => form.setFieldValue('expCompNote', e.target.value || null)} />
            </SimpleGrid>
            <Textarea label="Beschreibung" autosize minRows={3} value={form.values.description ?? ''} onChange={(e) => form.setFieldValue('description', e.target.value || null)} />
            <TextInput label="Inspiration" value={form.values.inspirationSource ?? ''} onChange={(e) => form.setFieldValue('inspirationSource', e.target.value || null)} />
            <TagsInput
              label="Tags"
              placeholder="Tag eingeben und Enter drücken"
              value={form.values.tags}
              onChange={(v) => form.setFieldValue('tags', v)}
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <SectionTitle>Kamera-Slot</SectionTitle>
          <SegmentedControl
            data={SLOTS}
            value={form.values.slotSelection ?? 'BIBLIOTHEK'}
            onChange={(v) => form.setFieldValue('slotSelection', v)}
            fullWidth
          />
        </Paper>

        {isEdit && existing && (
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">Bilder</Text>
              <FileButton
                multiple
                accept="image/*"
                onChange={async (files) => {
                  for (const file of files) {
                    await uploadImage.mutateAsync(file)
                  }
                  notifications.show({ message: `${files.length} Bild(er) hochgeladen`, color: 'green' })
                }}
              >
                {(props) => (
                  <Button size="xs" variant="light" loading={uploadImage.isPending} {...props}>
                    + Bilder hinzufügen
                  </Button>
                )}
              </FileButton>
            </Group>

            {existing.images.length === 0 ? (
              <Text size="sm" c="dimmed">Noch keine Bilder vorhanden.</Text>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={imageOrder} strategy={rectSortingStrategy}>
                  <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
                    {imageOrder
                      .map((imgId) => existing.images.find((i) => i.id === imgId))
                      .filter(Boolean)
                      .map((img) => (
                        <SortableImageTile
                          key={img!.id}
                          img={img!}
                          onDelete={async (imgId) => {
                            await deleteImage.mutateAsync(imgId)
                            notifications.show({ message: 'Bild gelöscht', color: 'green' })
                          }}
                          onFullscreen={(filename) => setLightboxSrc(filename)}
                        />
                      ))}
                  </SimpleGrid>
                </SortableContext>
              </DndContext>
            )}
          </Paper>
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={() => navigate(-1)}>Abbrechen</Button>
          <Button type="submit" loading={isBusy}>Speichern</Button>
        </Group>
      </Stack>

      <Modal
        opened={!!lightboxSrc}
        onClose={() => setLightboxSrc(null)}
        size="xl"
        padding={0}
        withCloseButton={false}
        centered
      >
        {lightboxSrc && (
          <Box pos="relative">
            <Image src={`/images/${lightboxSrc}`} fit="contain" mah="90vh" />
            <ActionIcon
              pos="absolute"
              top={8}
              right={8}
              color="dark"
              variant="filled"
              radius="xl"
              onClick={() => setLightboxSrc(null)}
            >
              <IconX size={14} />
            </ActionIcon>
          </Box>
        )}
      </Modal>
    </form>
  )
}
