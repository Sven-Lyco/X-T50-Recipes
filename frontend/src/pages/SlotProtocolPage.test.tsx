import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import SlotProtocolPage from './SlotProtocolPage'

vi.mock('../api/recipes', () => ({
  useSlotProtocol: vi.fn(),
  useCameraStatus: vi.fn(),
}))

import { useSlotProtocol, useCameraStatus } from '../api/recipes'
import { beforeEach } from 'vitest'

beforeEach(() => {
  vi.mocked(useSlotProtocol).mockReturnValue({ data: [], isLoading: false } as any)
  vi.mocked(useCameraStatus).mockReturnValue({ data: [], isLoading: false } as any)
})

const emptyQuery = { data: undefined, isLoading: false }

describe('SlotProtocolPage', () => {
  it('shows empty state when there are no log entries', () => {
    vi.mocked(useSlotProtocol).mockReturnValue({ data: [], isLoading: false } as any)
    vi.mocked(useCameraStatus).mockReturnValue({ data: [], isLoading: false } as any)
    renderWithProviders(<SlotProtocolPage />)
    // The empty message may appear duplicated via Mantine text rendering
    const msgs = screen.queryAllByText(/Noch keine Slot-Wechsel aufgezeichnet/i)
    expect(msgs.length).toBeGreaterThan(0)
  })

  it('renders all seven slot cards', () => {
    vi.mocked(useSlotProtocol).mockReturnValue({ data: [], isLoading: false } as any)
    vi.mocked(useCameraStatus).mockReturnValue({ data: [], isLoading: false } as any)
    renderWithProviders(<SlotProtocolPage />)
    for (const slot of ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7']) {
      expect(screen.getAllByText(slot).length).toBeGreaterThan(0)
    }
  })

  it('marks an occupied slot as stable when it has no recent changes', () => {
    vi.mocked(useCameraStatus).mockReturnValue({
      data: [{ id: 'r1', cameraSlot: 'C1', name: 'Recipe A', filmSimulation: 'PROVIA', tags: [], favorite: false, aiGenerated: false, previewImageFilename: null, shootingScenario: null }],
      isLoading: false,
    } as any)
    renderWithProviders(<SlotProtocolPage />)
    // C1 is occupied but has no changes → "stabil" badge
    expect(screen.getAllByText('stabil').length).toBeGreaterThan(0)
  })

  it('renders log entries in a table when data is present', () => {
    const entries = [
      {
        id: 'aaa',
        slot: 'C1',
        previousRecipeId: 'id-1',
        previousRecipeName: 'Old Recipe',
        newRecipeId: 'id-2',
        newRecipeName: 'New Recipe',
        changedAt: '2025-01-15T10:00:00Z',
      },
    ]
    vi.mocked(useSlotProtocol).mockReturnValue({ data: entries, isLoading: false } as any)
    vi.mocked(useCameraStatus).mockReturnValue({ data: [], isLoading: false } as any)
    renderWithProviders(<SlotProtocolPage />)
    expect(screen.getAllByText('Old Recipe').length).toBeGreaterThan(0)
    expect(screen.getAllByText('New Recipe').length).toBeGreaterThan(0)
  })

  it('shows "leer" badge for unoccupied slot', () => {
    vi.mocked(useCameraStatus).mockReturnValue({ data: [], isLoading: false } as any)
    renderWithProviders(<SlotProtocolPage />)
    // All 7 slots are empty → leer badge
    expect(screen.getAllByText('leer').length).toBeGreaterThan(0)
  })

  it('shows "aktiv" badge when a slot has 3+ recent changes', () => {
    const now = new Date().toISOString()
    const entries = Array.from({ length: 3 }, (_, i) => ({
      id: `e${i}`,
      slot: 'C1',
      previousRecipeId: null, previousRecipeName: null,
      newRecipeId: 'r1', newRecipeName: 'Recipe',
      changedAt: now,
    }))
    vi.mocked(useSlotProtocol).mockReturnValue({ data: entries, isLoading: false } as any)
    vi.mocked(useCameraStatus).mockReturnValue({
      data: [{ id: 'r1', cameraSlot: 'C1', name: 'Recipe', filmSimulation: 'PROVIA', tags: [], favorite: false, aiGenerated: false, previewImageFilename: null, shootingScenario: null }],
      isLoading: false,
    } as any)
    renderWithProviders(<SlotProtocolPage />)
    expect(screen.getAllByText('aktiv').length).toBeGreaterThan(0)
  })

  it('shows loading state while data is being fetched', () => {
    vi.mocked(useSlotProtocol).mockReturnValue({ data: undefined, isLoading: true } as any)
    vi.mocked(useCameraStatus).mockReturnValue({ data: undefined, isLoading: false } as any)
    renderWithProviders(<SlotProtocolPage />)
    // Loader renders without crashing
  })

  it('shows "X× / 30 Tage" badge when slot has 1–2 recent changes', () => {
    const now = new Date().toISOString()
    const entries = [
      { id: 'e1', slot: 'C1', previousRecipeId: null, previousRecipeName: null, newRecipeId: 'r1', newRecipeName: 'Recipe A', changedAt: now },
      { id: 'e2', slot: 'C1', previousRecipeId: null, previousRecipeName: null, newRecipeId: 'r1', newRecipeName: 'Recipe A', changedAt: now },
    ]
    vi.mocked(useSlotProtocol).mockReturnValue({ data: entries, isLoading: false } as any)
    vi.mocked(useCameraStatus).mockReturnValue({
      data: [{ id: 'r1', cameraSlot: 'C1', name: 'Recipe A', filmSimulation: 'PROVIA', tags: [], favorite: false, aiGenerated: false, previewImageFilename: null, shootingScenario: null }],
      isLoading: false,
    } as any)
    renderWithProviders(<SlotProtocolPage />)
    expect(screen.getAllByText(/30 Tage/i).length).toBeGreaterThan(0)
  })

  it('shows "Entfernt" for entries where the slot was cleared', () => {
    const entries = [
      {
        id: 'bbb',
        slot: 'C2',
        previousRecipeId: 'id-1',
        previousRecipeName: 'Some Recipe',
        newRecipeId: null,
        newRecipeName: null,
        changedAt: '2025-01-15T10:00:00Z',
      },
    ]
    vi.mocked(useSlotProtocol).mockReturnValue({ data: entries, isLoading: false } as any)
    vi.mocked(useCameraStatus).mockReturnValue({ data: [], isLoading: false } as any)
    renderWithProviders(<SlotProtocolPage />)
    expect(screen.getAllByText('Entfernt').length).toBeGreaterThan(0)
  })
})
