import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import LibraryPage from './LibraryPage'

vi.mock('../api/recipes', () => ({
  useRecipes: vi.fn(),
  useToggleFavorite: vi.fn(),
  useImportRecipe: vi.fn(),
}))

import { useRecipes, useToggleFavorite, useImportRecipe } from '../api/recipes'

const recipe = {
  id: 'r1',
  name: 'Mein Recipe',
  filmSimulation: 'PROVIA',
  cameraSlot: null,
  tags: ['street'],
  favorite: false,
  aiGenerated: false,
  previewImageFilename: null,
  shootingScenario: null,
}

beforeEach(() => {
  vi.mocked(useRecipes).mockReturnValue({ data: [recipe], isLoading: false } as any)
  vi.mocked(useToggleFavorite).mockReturnValue({ mutate: vi.fn() } as any)
  vi.mocked(useImportRecipe).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
})

describe('LibraryPage', () => {
  it('renders without crashing', () => {
    renderWithProviders(<LibraryPage />)
  })

  it('shows recipe name', () => {
    renderWithProviders(<LibraryPage />)
    expect(screen.getAllByText('Mein Recipe').length).toBeGreaterThan(0)
  })

  it('shows the Bibliothek heading', () => {
    renderWithProviders(<LibraryPage />)
    expect(screen.getAllByText(/Bibliothek/i).length).toBeGreaterThan(0)
  })

  it('shows sort options', () => {
    renderWithProviders(<LibraryPage />)
    expect(screen.getAllByText(/Neueste zuerst/i).length).toBeGreaterThan(0)
  })

  it('shows import button', () => {
    renderWithProviders(<LibraryPage />)
    expect(screen.getAllByRole('button', { name: /Importieren/i }).length).toBeGreaterThan(0)
  })
})
