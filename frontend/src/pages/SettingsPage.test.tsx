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
import { notifications } from '@mantine/notifications'

const mutateAsync = vi.fn()

function selectBackupFile() {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  return userEvent.upload(input, new File(['zip'], 'backup.zip', { type: 'application/zip' }))
}

async function selectAndConfirmBackupFile() {
  await selectBackupFile()
  await userEvent.click(await screen.findByRole('button', { name: /Alles ersetzen/i }))
}

beforeEach(() => {
  vi.mocked(useAiStatus).mockReturnValue({ data: { available: true } } as any)
  mutateAsync.mockReset()
  vi.mocked(useImportBackup).mockReturnValue({ mutateAsync, isPending: false } as any)
  vi.spyOn(notifications, 'show').mockClear().mockReturnValue('import-notification')
  vi.spyOn(notifications, 'update').mockClear().mockReturnValue('import-notification')
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

  it('reports upload progress and the import result in a persistent notification', async () => {
    mutateAsync.mockImplementation(async ({ onUploadProgress }) => {
      onUploadProgress(40)
      onUploadProgress(100)
      return [{ cameraSlot: 'C1' }, { cameraSlot: null }]
    })
    renderWithProviders(<SettingsPage />)

    await selectAndConfirmBackupFile()

    expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ loading: true, autoClose: false }))
    expect(notifications.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'import-notification', message: 'Wird hochgeladen … 40 %' }))
    expect(notifications.update).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Hochgeladen, wird verarbeitet …' }))
    expect(notifications.update).toHaveBeenLastCalledWith(expect.objectContaining({
      id: 'import-notification',
      message: 'Backup wiederhergestellt: 2 Recipe(s), davon 1 auf C1–C7.',
      color: 'green',
      loading: false,
      autoClose: false,
    }))
  })

  it('reports a failed import in a persistent notification', async () => {
    mutateAsync.mockRejectedValue(new Error('Network error'))
    renderWithProviders(<SettingsPage />)

    await selectAndConfirmBackupFile()

    expect(notifications.update).toHaveBeenLastCalledWith(expect.objectContaining({
      id: 'import-notification',
      message: 'Import fehlgeschlagen. Die vorhandenen Daten wurden nicht verändert.',
      color: 'red',
      autoClose: false,
    }))
  })

  it('shows the reason the server gives for rejecting a backup', async () => {
    mutateAsync.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Backup nicht importiert: Das ZIP enthält keine Recipes.' } },
    })
    renderWithProviders(<SettingsPage />)

    await selectAndConfirmBackupFile()

    expect(notifications.update).toHaveBeenLastCalledWith(expect.objectContaining({
      message: 'Backup nicht importiert: Das ZIP enthält keine Recipes.',
      color: 'red',
    }))
  })

  it('asks for confirmation and does not import when cancelled', async () => {
    renderWithProviders(<SettingsPage />)

    await selectBackupFile()
    expect(await screen.findByText(/lässt sich nicht rückgängig machen/i)).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /Abbrechen/i }))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(notifications.show).not.toHaveBeenCalled()
  })
})
