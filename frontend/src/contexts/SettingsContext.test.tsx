import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useSettings, SettingsProvider } from './SettingsContext'
import { DEFAULT_MODEL } from '../utils/labels'

function TestConsumer({ onRender }: { onRender: (s: ReturnType<typeof useSettings>) => void }) {
  const ctx = useSettings()
  onRender(ctx)
  return null
}

describe('SettingsContext', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('provides default settings when localStorage is empty', () => {
    let captured: ReturnType<typeof useSettings> | null = null
    render(
      <SettingsProvider>
        <TestConsumer onRender={(s) => { captured = s }} />
      </SettingsProvider>
    )
    expect(captured!.settings.aiEnabled).toBe(true)
    expect(captured!.settings.defaultModel).toBe(DEFAULT_MODEL)
  })

  it('reads persisted settings from localStorage on mount', () => {
    localStorage.setItem('app-settings', JSON.stringify({ aiEnabled: false, defaultModel: 'claude-haiku' }))
    let captured: ReturnType<typeof useSettings> | null = null
    render(
      <SettingsProvider>
        <TestConsumer onRender={(s) => { captured = s }} />
      </SettingsProvider>
    )
    expect(captured!.settings.aiEnabled).toBe(false)
    expect(captured!.settings.defaultModel).toBe('claude-haiku')
  })

  it('updateSettings merges patch into current settings', () => {
    let captured: ReturnType<typeof useSettings> | null = null
    render(
      <SettingsProvider>
        <TestConsumer onRender={(s) => { captured = s }} />
      </SettingsProvider>
    )
    act(() => captured!.updateSettings({ aiEnabled: false }))
    expect(captured!.settings.aiEnabled).toBe(false)
    expect(captured!.settings.defaultModel).toBe(DEFAULT_MODEL)
  })

  it('updateSettings persists to localStorage', () => {
    let captured: ReturnType<typeof useSettings> | null = null
    render(
      <SettingsProvider>
        <TestConsumer onRender={(s) => { captured = s }} />
      </SettingsProvider>
    )
    act(() => captured!.updateSettings({ aiEnabled: false }))
    const stored = JSON.parse(localStorage.getItem('app-settings')!)
    expect(stored.aiEnabled).toBe(false)
  })
})
