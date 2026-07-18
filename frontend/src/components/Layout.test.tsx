import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils'
import Layout from './Layout'

vi.mock('../api/recipes', () => ({
  useAiStatus: vi.fn(),
}))

vi.mock('../api/auth', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}))

import { useAiStatus } from '../api/recipes'

beforeEach(() => {
  vi.mocked(useAiStatus).mockReturnValue({ data: { available: true } } as any)
})

describe('Layout', () => {
  it('renders without crashing', () => {
    renderWithProviders(<Layout />)
  })

  it('shows the app title', () => {
    renderWithProviders(<Layout />)
    expect(screen.getAllByText(/X-T50 Recipes/i).length).toBeGreaterThan(0)
  })

  it('shows main nav links', () => {
    renderWithProviders(<Layout />)
    expect(screen.getAllByText(/Bibliothek/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Kamera-Dashboard/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Vergleichen/i).length).toBeGreaterThan(0)
  })

  it('shows AI nav links when AI is enabled', () => {
    renderWithProviders(<Layout />)
    expect(screen.getAllByText(/Recipe generieren/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Recipe Match/i).length).toBeGreaterThan(0)
  })

  it('hides AI nav links when AI is not available', () => {
    vi.mocked(useAiStatus).mockReturnValue({ data: { available: false } } as any)
    renderWithProviders(<Layout />)
    expect(screen.queryAllByText(/Recipe generieren/i)).toHaveLength(0)
    expect(screen.queryAllByText(/Recipe Match/i)).toHaveLength(0)
  })

  it('shows the logout button', () => {
    renderWithProviders(<Layout />)
    expect(screen.getAllByRole('button', { name: /Abmelden/i }).length).toBeGreaterThan(0)
  })

  it('calls logout when Abmelden is clicked', async () => {
    const { logout } = await import('../api/auth')
    renderWithProviders(<Layout />)
    const logoutBtn = screen.getAllByRole('button', { name: /Abmelden/i })[0]
    await userEvent.click(logoutBtn)
    await waitFor(() => {
      expect(vi.mocked(logout)).toHaveBeenCalled()
    })
  })
})
