import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '../test-utils'
import RecipeDetailPage from './RecipeDetailPage'
import type { Recipe } from '../api/types'

vi.mock('../api/recipes', () => ({
  useRecipe: vi.fn(),
  useDeleteRecipe: vi.fn(),
  useToggleFavorite: vi.fn(),
  useRecipes: vi.fn(),
  useDuplicateRecipe: vi.fn(),
  useRecipesBulk: vi.fn(),
}))

vi.mock('@react-pdf/renderer', () => ({
  pdf: vi.fn(() => ({ toBlob: vi.fn().mockResolvedValue(new Blob()) })),
  StyleSheet: { create: (s: unknown) => s },
  Document: ({ children }: { children: React.ReactNode }) => children,
  Page: ({ children }: { children: React.ReactNode }) => children,
  View: ({ children }: { children: React.ReactNode }) => children,
  Text: ({ children }: { children: React.ReactNode }) => children,
  Image: () => null,
  Font: { register: () => {} },
}))

vi.mock('../utils/recipeImageExport', () => ({
  exportRecipeAsPng: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

import { useRecipe, useDeleteRecipe, useToggleFavorite, useRecipes, useDuplicateRecipe, useRecipesBulk } from '../api/recipes'

const recipe: Recipe = {
  id: 'r1',
  name: 'Kodak Vision',
  filmSimulation: 'CLASSIC_NEGATIVE',
  dynamicRange: 'DR200',
  highlightTone: -0.5,
  shadowTone: 1,
  color: -1,
  sharpness: -2,
  noiseReduction: -4,
  grainStrength: 'WEAK',
  grainSize: 'SMALL',
  colorChromeEffect: 'STRONG',
  colorChromeFxBlue: 'WEAK',
  whiteBalanceMode: 'DAYLIGHT',
  wbShiftRed: 2,
  wbShiftBlue: -3,
  colorTempKelvin: null,
  clarity: 0,
  monochromeWarmCool: null,
  monochromeGreenMagenta: null,
  isoMode: 'AUTO_1',
  isoNote: 'max ISO 6400',
  expCompNote: '-1/3',
  description: 'Toller analoger Look',
  inspirationSource: 'https://example.com',
  tags: ['street', 'analog'],
  cameraSlot: 'C1',
  favorite: true,
  aiGenerated: false,
  shootingScenario: 'STREET',
  images: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.mocked(useRecipe).mockReturnValue({ data: recipe, isLoading: false } as any)
  vi.mocked(useDeleteRecipe).mockReturnValue({ mutate: vi.fn() } as any)
  vi.mocked(useToggleFavorite).mockReturnValue({ mutate: vi.fn() } as any)
  vi.mocked(useDuplicateRecipe).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
  vi.mocked(useRecipes).mockReturnValue({ data: [{ id: 'r1' }] } as any)
  vi.mocked(useRecipesBulk).mockReturnValue({ data: [recipe] } as any)
})

function renderDetailPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/recipes/:id" element={<RecipeDetailPage />} />
    </Routes>,
    { initialEntries: ['/recipes/r1'] }
  )
}

describe('RecipeDetailPage', () => {
  it('renders without crashing', () => {
    renderDetailPage()
  })

  it('shows the recipe name', () => {
    renderDetailPage()
    expect(screen.getAllByText('Kodak Vision').length).toBeGreaterThan(0)
  })

  it('shows the film simulation', () => {
    renderDetailPage()
    expect(screen.getAllByText(/Classic Neg/i).length).toBeGreaterThan(0)
  })

  it('shows the description', () => {
    renderDetailPage()
    expect(screen.getAllByText(/analoger Look/i).length).toBeGreaterThan(0)
  })

  it('shows the camera slot badge', () => {
    renderDetailPage()
    expect(screen.getAllByText(/C1/i).length).toBeGreaterThan(0)
  })

  it('shows the export menu button', () => {
    renderDetailPage()
    expect(screen.getAllByRole('button', { name: /Exportieren/i }).length).toBeGreaterThan(0)
  })

  it('shows loader while loading', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: undefined, isLoading: true } as any)
    renderDetailPage()
    // No crash is the primary assertion
  })
})
