import { createContext, useContext, useState } from 'react'
import { DEFAULT_MODEL } from '../utils/labels'

interface AppSettings {
  aiEnabled: boolean
  defaultModel: string
}

const DEFAULT_SETTINGS: AppSettings = {
  aiEnabled: true,
  defaultModel: DEFAULT_MODEL,
}

const STORAGE_KEY = 'app-settings'

function loadSettings(): AppSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  } catch {
    return DEFAULT_SETTINGS
  }
}

const SettingsContext = createContext<{
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void
}>({ settings: DEFAULT_SETTINGS, updateSettings: () => {} })

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  function updateSettings(patch: Partial<AppSettings>) {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
