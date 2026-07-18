import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils'
import CompareSelectPage from './CompareSelectPage'

vi.mock('../api/recipes', () => ({
  useRecipes: vi.fn(),
}))

import { useRecipes } from '../api/recipes'

const recipes = [
  { id: 'r1', name: 'Recipe A', filmSimulation: 'PROVIA', cameraSlot: null, tags: [], favorite: false, aiGenerated: false, previewImageFilename: null, shootingScenario: null },
  { id: 'r2', name: 'Recipe B', filmSimulation: 'VELVIA', cameraSlot: null, tags: [], favorite: false, aiGenerated: false, previewImageFilename: null, shootingScenario: null },
]

beforeEach(() => {
  vi.mocked(useRecipes).mockReturnValue({ data: recipes, isLoading: false } as any)
})

describe('CompareSelectPage', () => {
  it('renders without crashing', () => {
    renderWithProviders(<CompareSelectPage />)
  })

  it('shows recipe names as checkboxes', () => {
    renderWithProviders(<CompareSelectPage />)
    expect(screen.getAllByText('Recipe A').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Recipe B').length).toBeGreaterThan(0)
  })

  it('shows a compare button', () => {
    renderWithProviders(<CompareSelectPage />)
    expect(screen.getAllByRole('button', { name: /Vergleichen/i }).length).toBeGreaterThan(0)
  })

  it('shows camera slot badge when recipe has a slot', () => {
    vi.mocked(useRecipes).mockReturnValue({
      data: [{ id: 'r1', name: 'Slotted Recipe', filmSimulation: 'PROVIA', cameraSlot: 'C3', tags: [], favorite: false, aiGenerated: false, previewImageFilename: null, shootingScenario: null }],
      isLoading: false,
    } as any)
    renderWithProviders(<CompareSelectPage />)
    expect(screen.getAllByText('C3').length).toBeGreaterThan(0)
  })

  it('shows preview image when recipe has previewImageFilename', () => {
    vi.mocked(useRecipes).mockReturnValue({
      data: [{ id: 'r1', name: 'Photo Recipe', filmSimulation: 'PROVIA', cameraSlot: null, tags: [], favorite: false, aiGenerated: false, previewImageFilename: 'preview.jpg', shootingScenario: null }],
      isLoading: false,
    } as any)
    renderWithProviders(<CompareSelectPage />)
    const imgs = document.querySelectorAll('img[src="/images/preview.jpg"]')
    expect(imgs.length).toBeGreaterThan(0)
  })

  it('shows empty state when no recipes exist', () => {
    vi.mocked(useRecipes).mockReturnValue({ data: [], isLoading: false } as any)
    renderWithProviders(<CompareSelectPage />)
    expect(screen.getAllByText(/Keine Recipes gefunden/i).length).toBeGreaterThan(0)
  })

  it('enables Vergleichen button after selecting 2 recipes', async () => {
    renderWithProviders(<CompareSelectPage />)
    const cards = screen.getAllByText(/Recipe A|Recipe B/)
    // Click first two cards to select them
    await userEvent.click(cards[0])
    await userEvent.click(cards[1])
    const btn = screen.getAllByRole('button', { name: /Vergleichen \(2\)/i })[0]
    expect(btn).not.toBeDisabled()
  })
})
