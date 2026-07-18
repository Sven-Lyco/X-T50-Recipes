import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { waitFor } from '@testing-library/react'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import CameraDashboardPage from './CameraDashboardPage'

vi.mock('../api/recipes', () => ({
  useCameraStatus: vi.fn(),
  useRecipes: vi.fn(),
  useAssignCameraSlot: vi.fn(),
}))

import { useCameraStatus, useRecipes, useAssignCameraSlot } from '../api/recipes'

beforeEach(() => {
  vi.mocked(useCameraStatus).mockReturnValue({ data: [], isLoading: false } as any)
  vi.mocked(useRecipes).mockReturnValue({ data: [], isLoading: false } as any)
  vi.mocked(useAssignCameraSlot).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
})

describe('CameraDashboardPage', () => {
  it('renders without crashing', () => {
    renderWithProviders(<CameraDashboardPage />)
  })

  it('shows all seven C-slot labels', () => {
    renderWithProviders(<CameraDashboardPage />)
    for (const slot of ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7']) {
      expect(screen.getAllByText(slot).length).toBeGreaterThan(0)
    }
  })

  it('shows assigned recipe name in the correct slot', () => {
    vi.mocked(useCameraStatus).mockReturnValue({
      data: [{ id: 'r1', name: 'Street Recipe', filmSimulation: 'PROVIA', cameraSlot: 'C1', tags: [], favorite: false, aiGenerated: false, previewImageFilename: null, shootingScenario: null }],
      isLoading: false,
    } as any)
    renderWithProviders(<CameraDashboardPage />)
    expect(screen.getAllByText('Street Recipe').length).toBeGreaterThan(0)
  })

  it('renders preview image when recipe has previewImageFilename', () => {
    vi.mocked(useCameraStatus).mockReturnValue({
      data: [{ id: 'r1', name: 'Film Recipe', filmSimulation: 'VELVIA', cameraSlot: 'C2', tags: [], favorite: false, aiGenerated: false, previewImageFilename: 'preview.jpg', shootingScenario: null }],
      isLoading: false,
    } as any)
    renderWithProviders(<CameraDashboardPage />)
    // Image renders when previewImageFilename is set
    const imgs = document.querySelectorAll('img[src="/images/preview.jpg"]')
    expect(imgs.length).toBeGreaterThan(0)
  })

  it('shows "Kein Recipe" placeholder for empty slots', () => {
    renderWithProviders(<CameraDashboardPage />)
    const noRecipeTexts = screen.getAllByText(/Kein Recipe/i)
    expect(noRecipeTexts.length).toBeGreaterThan(0)
  })
})
