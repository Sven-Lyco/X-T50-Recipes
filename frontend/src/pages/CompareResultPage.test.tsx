import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '../test-utils'
import CompareResultPage from './CompareResultPage'
import type { Recipe } from '../api/types'

vi.mock('../api/recipes', () => ({
  useRecipesBulk: vi.fn(),
}))

import { useRecipesBulk } from '../api/recipes'

function makeRecipe(id: string, name: string, overrides: Partial<Recipe> = {}): Recipe {
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
    ...overrides,
  }
}

const recipes = [
  makeRecipe('r1', 'Recipe Alpha', { color: 2 }),
  makeRecipe('r2', 'Recipe Beta', { color: -2, filmSimulation: 'VELVIA' }),
]

beforeEach(() => {
  vi.mocked(useRecipesBulk).mockReturnValue({ data: recipes, isLoading: false } as any)
})

function renderComparePage() {
  return renderWithProviders(
    <Routes>
      <Route path="/compare/result" element={<CompareResultPage />} />
    </Routes>,
    { initialEntries: ['/compare/result?ids=r1,r2'] }
  )
}

describe('CompareResultPage', () => {
  it('renders without crashing', () => {
    renderComparePage()
  })

  it('shows both recipe names', () => {
    renderComparePage()
    expect(screen.getAllByText('Recipe Alpha').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Recipe Beta').length).toBeGreaterThan(0)
  })

  it('shows the parameter comparison table', () => {
    renderComparePage()
    expect(screen.getAllByText('Filmsimulation').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Dynamikbereich').length).toBeGreaterThan(0)
  })

  it('shows differences to the first recipe for every other recipe, first recipe value first', () => {
    vi.mocked(useRecipesBulk).mockReturnValue({
      data: [
        makeRecipe('r1', 'Recipe Alpha'),
        makeRecipe('r2', 'Recipe Beta', { grainStrength: 'STRONG', grainSize: 'SMALL', color: 2 }),
        makeRecipe('r3', 'Recipe Gamma'),
      ],
      isLoading: false,
    } as any)
    renderWithProviders(
      <Routes>
        <Route path="/compare/result" element={<CompareResultPage />} />
      </Routes>,
      { initialEntries: ['/compare/result?ids=r1,r2,r3'] }
    )
    expect(screen.getByText('Körnungseffekt: Aus → Stark')).toBeTruthy()
    expect(screen.getByText('Farbe: 0 → +2')).toBeTruthy()
    // Recipe Gamma equals the first recipe; the reference itself shows no list
    expect(screen.getAllByText('Keine Unterschiede')).toHaveLength(1)
  })

  it('shows the similarity score badge', () => {
    renderComparePage()
    // Score badge is shown (format like "78 % ähnlich")
    expect(screen.getAllByText(/ähnlich/i).length).toBeGreaterThan(0)
  })
})
