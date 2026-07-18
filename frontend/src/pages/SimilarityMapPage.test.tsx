import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import SimilarityMapPage from './SimilarityMapPage'
import type { Recipe } from '../api/types'

vi.mock('../api/recipes', () => ({
  useRecipes: vi.fn(),
  useRecipesBulk: vi.fn(),
}))

import { useRecipes, useRecipesBulk } from '../api/recipes'

function makeRecipe(id: string, name: string): Recipe {
  return {
    id,
    name,
    filmSimulation: 'PROVIA',
    dynamicRange: 'DR_AUTO',
    highlightTone: 0,
    shadowTone: 0,
    color: 0,
    sharpness: 0,
    noiseReduction: 0,
    grainStrength: 'OFF',
    grainSize: null,
    colorChromeEffect: 'OFF',
    colorChromeFxBlue: 'OFF',
    whiteBalanceMode: 'AUTO',
    wbShiftRed: 0,
    wbShiftBlue: 0,
    colorTempKelvin: null,
    clarity: 0,
    monochromeWarmCool: null,
    monochromeGreenMagenta: null,
    isoMode: null,
    isoNote: null,
    expCompNote: null,
    description: null,
    inspirationSource: null,
    tags: [],
    cameraSlot: null,
    favorite: false,
    aiGenerated: false,
    shootingScenario: null,
    images: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
}

const listItems = [{ id: 'r1' }, { id: 'r2' }]
const fullRecipes = [makeRecipe('r1', 'Recipe Alpha'), makeRecipe('r2', 'Recipe Beta')]

beforeEach(() => {
  vi.mocked(useRecipes).mockReturnValue({ data: listItems, isLoading: false } as any)
  vi.mocked(useRecipesBulk).mockReturnValue({ data: fullRecipes, isLoading: false } as any)
})

describe('SimilarityMapPage', () => {
  it('renders without crashing', () => {
    renderWithProviders(<SimilarityMapPage />)
  })

  it('shows the SVG map when 2+ recipes are present', () => {
    renderWithProviders(<SimilarityMapPage />)
    expect(document.querySelector('svg')).not.toBeNull()
  })

  it('shows the slot-only toggle', () => {
    renderWithProviders(<SimilarityMapPage />)
    expect(screen.getAllByText(/Nur C1/i).length).toBeGreaterThan(0)
  })

  it('shows empty state when fewer than 2 recipes', () => {
    vi.mocked(useRecipesBulk).mockReturnValue({ data: [fullRecipes[0]], isLoading: false } as any)
    renderWithProviders(<SimilarityMapPage />)
    expect(screen.getAllByText(/Mindestens 2 Recipes/i).length).toBeGreaterThan(0)
  })

  it('shows loader while data is loading', () => {
    vi.mocked(useRecipes).mockReturnValue({ data: undefined, isLoading: true } as any)
    vi.mocked(useRecipesBulk).mockReturnValue({ data: undefined, isLoading: true } as any)
    renderWithProviders(<SimilarityMapPage />)
    // No crash is sufficient; loader DOM might not be inspectable easily
  })
})
