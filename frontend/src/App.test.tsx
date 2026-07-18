import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

vi.mock('./api/auth', () => ({
  isLoggedIn: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./api/recipes', () => ({
  useRecipes: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useAiStatus: vi.fn().mockReturnValue({ data: { available: false } }),
  useToggleFavorite: vi.fn().mockReturnValue({ mutate: vi.fn() }),
  useImportRecipe: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useCameraStatus: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useSlotProtocol: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useRecipesBulk: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useImportBackup: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
  useSuggestRecipe: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
  useMatchRecipe: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

import { isLoggedIn } from './api/auth'

import '@tanstack/react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function renderApp(initialEntries: string[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <QueryClientProvider client={client}>
          <App />
        </QueryClientProvider>
      </MemoryRouter>
    </MantineProvider>
  )
}

beforeEach(() => {
  vi.mocked(isLoggedIn).mockReturnValue(false)
})

describe('App', () => {
  it('renders without crashing', () => {
    renderApp(['/login'])
  })

  it('shows LoginPage at /login', () => {
    renderApp(['/login'])
    expect(screen.getAllByText(/Anmelden/i).length).toBeGreaterThan(0)
  })

  it('redirects unauthenticated users to /login', () => {
    vi.mocked(isLoggedIn).mockReturnValue(false)
    renderApp(['/'])
    expect(screen.getAllByText(/Anmelden/i).length).toBeGreaterThan(0)
  })

  it('renders Library when authenticated', () => {
    vi.mocked(isLoggedIn).mockReturnValue(true)
    renderApp(['/'])
    expect(screen.getAllByText(/Bibliothek/i).length).toBeGreaterThan(0)
  })
})
