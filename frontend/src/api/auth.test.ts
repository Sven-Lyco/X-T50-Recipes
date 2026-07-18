import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('./client', () => ({
  default: {
    post: vi.fn().mockResolvedValue({}),
  },
}))

import client from './client'
import { login, logout, isLoggedIn } from './auth'

describe('isLoggedIn', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('returns false when localStorage is empty', () => {
    expect(isLoggedIn()).toBe(false)
  })

  it('returns false when loggedIn is set to another value', () => {
    localStorage.setItem('loggedIn', 'false')
    expect(isLoggedIn()).toBe(false)
  })

  it('returns true when loggedIn is "true"', () => {
    localStorage.setItem('loggedIn', 'true')
    expect(isLoggedIn()).toBe(true)
  })
})

describe('login', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(client.post).mockResolvedValue({})
  })
  afterEach(() => localStorage.clear())

  it('posts credentials to /auth/login', async () => {
    await login('admin', 'secret')
    expect(client.post).toHaveBeenCalledWith('/auth/login', { username: 'admin', password: 'secret' })
  })

  it('sets loggedIn in localStorage on success', async () => {
    await login('admin', 'secret')
    expect(localStorage.getItem('loggedIn')).toBe('true')
  })
})

describe('logout', () => {
  beforeEach(() => {
    localStorage.setItem('loggedIn', 'true')
    vi.mocked(client.post).mockResolvedValue({})
  })
  afterEach(() => localStorage.clear())

  it('removes loggedIn from localStorage', async () => {
    await logout()
    expect(localStorage.getItem('loggedIn')).toBeNull()
  })

  it('posts to /auth/logout', async () => {
    await logout()
    expect(client.post).toHaveBeenCalledWith('/auth/logout')
  })

  it('removes loggedIn even if the request fails', async () => {
    vi.mocked(client.post).mockRejectedValue(new Error('network'))
    await logout()
    expect(localStorage.getItem('loggedIn')).toBeNull()
  })
})
