import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  AppShell, Burger, Group, NavLink as MantineNavLink,
  Text, Button, Stack,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { logout } from '../api/auth'

export default function Layout() {
  const [opened, { toggle, close }] = useDisclosure()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg">X-T50 Recipes</Text>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack flex={1} gap="xs">
          <MantineNavLink
            component={NavLink}
            to="/"
            end
            label="Bibliothek"
            onClick={close}
          />
          <MantineNavLink
            component={NavLink}
            to="/camera"
            label="Kamera-Dashboard"
            onClick={close}
          />
          <MantineNavLink
            component={NavLink}
            to="/reference"
            label="Referenz"
            onClick={close}
          />
          <MantineNavLink
            component={NavLink}
            to="/compare"
            label="Vergleichen"
            onClick={close}
          />
        </Stack>
        <Button variant="subtle" color="gray" onClick={handleLogout} mt="auto">
          Abmelden
        </Button>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
