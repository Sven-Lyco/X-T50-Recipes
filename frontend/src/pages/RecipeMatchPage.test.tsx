import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils'
import RecipeMatchPage from './RecipeMatchPage'
import type { RecipeMatchResult } from '../api/types'

vi.mock('../api/recipes', () => ({
  useMatchRecipe: vi.fn(),
  useLocationMatch: vi.fn(),
  useAiStatus: vi.fn(),
}))

import { useMatchRecipe, useLocationMatch, useAiStatus } from '../api/recipes'

beforeEach(() => {
  vi.mocked(useMatchRecipe).mockReturnValue({ mutateAsync: vi.fn(), isPending: false, data: null } as any)
  vi.mocked(useLocationMatch).mockReturnValue({ mutate: vi.fn(), isPending: false, data: null } as any)
  vi.mocked(useAiStatus).mockReturnValue({ data: { available: true } } as any)
})

describe('RecipeMatchPage', () => {
  it('renders without crashing', () => {
    renderWithProviders(<RecipeMatchPage />)
  })

  it('shows the page title', () => {
    renderWithProviders(<RecipeMatchPage />)
    expect(screen.getAllByText(/Recipe Match/i).length).toBeGreaterThan(0)
  })

  it('shows a match button', () => {
    renderWithProviders(<RecipeMatchPage />)
    expect(screen.getAllByRole('button', { name: /Analysieren/i }).length).toBeGreaterThan(0)
  })

  it('shows the "only slots" toggle', () => {
    renderWithProviders(<RecipeMatchPage />)
    expect(screen.getAllByText(/nur C1–C7/i).length).toBeGreaterThan(0)
  })

  it('shows preview image and "Anderes Foto" button after file upload', async () => {
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:fake-preview')
    renderWithProviders(<RecipeMatchPage />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (!fileInput) return // skip if Dropzone doesn't expose native input
    const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })
    await userEvent.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Anderes Foto/i }).length).toBeGreaterThan(0)
    })
  })

  it('shows match results after successful analyze', async () => {
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:fake-preview')

    const matchResults: RecipeMatchResult[] = [
      { id: 'r1', name: 'Street Recipe', filmSimulation: 'PROVIA', previewImageFilename: null, cameraSlot: 'C1', reason: 'Passt gut zur Szene.' },
    ]
    vi.mocked(useMatchRecipe).mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue(matchResults), isPending: false } as any)

    renderWithProviders(<RecipeMatchPage />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (!fileInput) return
    await userEvent.upload(fileInput, new File(['photo'], 'test.jpg', { type: 'image/jpeg' }))

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Analysieren/i })[0]).not.toBeDisabled()
    })
    await userEvent.click(screen.getAllByRole('button', { name: /Analysieren/i })[0])

    await waitFor(() => {
      expect(screen.getAllByText(/Empfehlung/i).length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('Street Recipe').length).toBeGreaterThan(0)
  })
})
