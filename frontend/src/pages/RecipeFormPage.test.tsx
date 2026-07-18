import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '../test-utils'
import RecipeFormPage from './RecipeFormPage'

vi.mock('../api/recipes', () => ({
  useRecipe: vi.fn(),
  useRecipes: vi.fn(),
  useRecipesBulk: vi.fn(),
  useCreateRecipe: vi.fn(),
  useUpdateRecipe: vi.fn(),
  useUploadImage: vi.fn(),
  useDeleteImage: vi.fn(),
  useReorderImages: vi.fn(),
}))

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

import {
  useRecipe, useRecipes, useRecipesBulk,
  useCreateRecipe, useUpdateRecipe, useUploadImage, useDeleteImage, useReorderImages,
} from '../api/recipes'

const createMutate = vi.fn()
const updateMutate = vi.fn()

beforeEach(() => {
  vi.mocked(useRecipe).mockReturnValue({ data: undefined, isLoading: false } as any)
  vi.mocked(useRecipes).mockReturnValue({ data: [] } as any)
  vi.mocked(useRecipesBulk).mockReturnValue({ data: [] } as any)
  vi.mocked(useCreateRecipe).mockReturnValue({ mutateAsync: createMutate, isPending: false } as any)
  vi.mocked(useUpdateRecipe).mockReturnValue({ mutateAsync: updateMutate, isPending: false } as any)
  vi.mocked(useUploadImage).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
  vi.mocked(useDeleteImage).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
  vi.mocked(useReorderImages).mockReturnValue({ mutate: vi.fn() } as any)
})

function renderNewRecipeForm() {
  return renderWithProviders(
    <Routes>
      <Route path="/recipes/new" element={<RecipeFormPage />} />
    </Routes>,
    { initialEntries: ['/recipes/new'] }
  )
}

describe('RecipeFormPage – new recipe', () => {
  it('renders without crashing', () => {
    renderNewRecipeForm()
  })

  it('shows the form heading', () => {
    renderNewRecipeForm()
    expect(screen.getAllByText(/Neues Recipe/i).length).toBeGreaterThan(0)
  })

  it('shows the recipe name field', () => {
    renderNewRecipeForm()
    expect(screen.getAllByText(/^Name$/i).length).toBeGreaterThan(0)
  })

  it('shows the film simulation section', () => {
    renderNewRecipeForm()
    expect(screen.getAllByText(/Filmsimulation/i).length).toBeGreaterThan(0)
  })

  it('shows the Bildparameter section', () => {
    renderNewRecipeForm()
    expect(screen.getAllByText(/Bildparameter/i).length).toBeGreaterThan(0)
  })

  it('shows the Weißabgleich section', () => {
    renderNewRecipeForm()
    expect(screen.getAllByText(/Weißabgleich/i).length).toBeGreaterThan(0)
  })

  it('shows the save button', () => {
    renderNewRecipeForm()
    expect(screen.getAllByRole('button', { name: /Speichern/i }).length).toBeGreaterThan(0)
  })
})
