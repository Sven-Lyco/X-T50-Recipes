import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'
import { MemoryRouter } from 'react-router-dom'
import { SettingsProvider } from './contexts/SettingsContext'

interface WrapperOptions extends RenderOptions {
  initialEntries?: string[]
}

export function renderWithProviders(
  ui: React.ReactElement,
  { initialEntries = ['/'], ...options }: WrapperOptions = {}
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <QueryClientProvider client={client}>
          <SettingsProvider>{ui}</SettingsProvider>
        </QueryClientProvider>
      </MemoryRouter>
    </MantineProvider>,
    options
  )
}
