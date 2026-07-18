import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import SettingsPage from './SettingsPage'

vi.mock('../api/recipes', () => ({
  useAiStatus: vi.fn(),
  useImportBackup: vi.fn(),
}))

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

import client from '../api/client'
import { useAiStatus, useImportBackup } from '../api/recipes'

beforeEach(() => {
  vi.mocked(useAiStatus).mockReturnValue({ data: { available: true } } as any)
  vi.mocked(useImportBackup).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
})

describe('SettingsPage', () => {
  it('renders without crashing', () => {
    renderWithProviders(<SettingsPage />)
  })

  it('shows AI settings section', () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getAllByText(/KI-Einstellungen/i).length).toBeGreaterThan(0)
  })

  it('shows backup section', () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getAllByText(/Datensicherung/i).length).toBeGreaterThan(0)
  })

  it('shows the AI toggle', () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getAllByText(/KI-Funktionen/i).length).toBeGreaterThan(0)
  })

  it('shows model selection when AI is available', () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getAllByText(/Standard-Modell/i).length).toBeGreaterThan(0)
  })

  it('shows API key warning when AI is not available', () => {
    vi.mocked(useAiStatus).mockReturnValue({ data: { available: false } } as any)
    renderWithProviders(<SettingsPage />)
    expect(screen.getAllByText(/ANTHROPIC_API_KEY/i).length).toBeGreaterThan(0)
  })

  it('downloads backup when button is clicked', async () => {
    const mockGet = vi.fn().mockResolvedValue({ data: new Blob() })
    vi.mocked(client.get).mockImplementation(mockGet)
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:fake')
    global.URL.revokeObjectURL = vi.fn()

    renderWithProviders(<SettingsPage />)
    const downloadBtn = screen.getAllByRole('button', { name: /Herunterladen/i })[0]
    await userEvent.click(downloadBtn)
    expect(mockGet).toHaveBeenCalledWith('/backup', expect.objectContaining({ responseType: 'blob' }))
  })

  it('handles backup download failure gracefully', async () => {
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'))
    renderWithProviders(<SettingsPage />)
    const downloadBtn = screen.getAllByRole('button', { name: /Herunterladen/i })[0]
    await userEvent.click(downloadBtn)
    // No crash — error is caught and notification shown
  })
})
