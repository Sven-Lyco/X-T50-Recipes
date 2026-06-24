import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Center, Paper, Title, TextInput, PasswordInput,
  Button, Alert, Stack,
} from '@mantine/core'
import { login } from '../api/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError('Benutzername oder Passwort falsch.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Center h="100vh" bg="gray.0">
      <Paper shadow="sm" p="xl" radius="md" w={360} withBorder>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Title order={2} ta="center">X-T50 Recipes</Title>
            {error && <Alert color="red">{error}</Alert>}
            <TextInput
              label="Benutzername"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              autoFocus
            />
            <PasswordInput
              label="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} fullWidth mt="xs">
              Anmelden
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  )
}
