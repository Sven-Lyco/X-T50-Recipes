import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import LoginPage from './LoginPage'

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  isLoggedIn: vi.fn().mockReturnValue(false),
}))

import { login } from '../api/auth'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(login).mockReset()
  })

  it('renders username and password fields', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getAllByText('Benutzername').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Passwort').length).toBeGreaterThan(0)
  })

  it('renders a submit button', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getAllByRole('button', { name: /Anmelden/i }).length).toBeGreaterThan(0)
  })

  it('calls login with entered credentials on submit', async () => {
    vi.mocked(login).mockResolvedValue()
    renderWithProviders(<LoginPage />)

    const usernameInput = screen.getAllByLabelText(/Benutzername/i)[0]
    const passwordInput = screen.getAllByLabelText(/Passwort/i)[0]

    fireEvent.change(usernameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: 'secret' } })
    fireEvent.click(screen.getAllByRole('button', { name: /Anmelden/i })[0])

    await waitFor(() => expect(login).toHaveBeenCalledWith('admin', 'secret'))
  })

  it('shows error message on login failure', async () => {
    vi.mocked(login).mockRejectedValue(new Error('Unauthorized'))
    renderWithProviders(<LoginPage />)

    fireEvent.change(screen.getAllByLabelText(/Benutzername/i)[0], { target: { value: 'admin' } })
    fireEvent.change(screen.getAllByLabelText(/Passwort/i)[0], { target: { value: 'wrong' } })
    fireEvent.click(screen.getAllByRole('button', { name: /Anmelden/i })[0])

    await waitFor(() =>
      expect(screen.getAllByText(/Benutzername oder Passwort falsch/i).length).toBeGreaterThan(0)
    )
  })
})
