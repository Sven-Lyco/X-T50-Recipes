import client from './client'

export async function login(username: string, password: string): Promise<void> {
  await client.post('/auth/login', { username, password })
  localStorage.setItem('loggedIn', 'true')
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout').catch(() => {})
  localStorage.removeItem('loggedIn')
}

export function isLoggedIn(): boolean {
  return localStorage.getItem('loggedIn') === 'true'
}
