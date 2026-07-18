import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import GenerateRecipePage from './GenerateRecipePage'

vi.mock('../api/recipes', () => ({
  useSuggestRecipe: vi.fn(),
}))

import { useSuggestRecipe } from '../api/recipes'

beforeEach(() => {
  vi.mocked(useSuggestRecipe).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
})

describe('GenerateRecipePage', () => {
  it('renders without crashing', () => {
    renderWithProviders(<GenerateRecipePage />)
  })

  it('shows the page title', () => {
    renderWithProviders(<GenerateRecipePage />)
    expect(screen.getAllByText(/Recipe generieren/i).length).toBeGreaterThan(0)
  })

  it('shows a generate button', () => {
    renderWithProviders(<GenerateRecipePage />)
    expect(screen.getAllByRole('button', { name: /Generieren/i }).length).toBeGreaterThan(0)
  })

  it('shows the hint text area', () => {
    renderWithProviders(<GenerateRecipePage />)
    expect(screen.getAllByText(/Hinweis/i).length).toBeGreaterThan(0)
  })
})
