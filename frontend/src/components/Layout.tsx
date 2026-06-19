import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  AppShell, Burger, Group, NavLink as MantineNavLink,
  Text, Button, Stack, ThemeIcon,
} from '@mantine/core'
import {
  IconLayoutGrid, IconCamera, IconWand, IconSearch,
  IconScale, IconChartDots, IconBook,
} from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import { logout } from '../api/auth'

function NavIcon({ icon: Icon, color }: { icon: React.ElementType; color: string }) {
  return (
    <ThemeIcon size="sm" variant="light" color={color}>
      <Icon size={14} />
    </ThemeIcon>
  )
}

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
            leftSection={<NavIcon icon={IconLayoutGrid} color="gray" />}
            onClick={close}
          />
          <MantineNavLink
            component={NavLink}
            to="/camera"
            label="Kamera-Dashboard"
            leftSection={<NavIcon icon={IconCamera} color="gray" />}
            onClick={close}
          />
          <MantineNavLink
            component={NavLink}
            to="/generate"
            label="Recipe generieren"
            leftSection={<NavIcon icon={IconWand} color="violet" />}
            onClick={close}
          />
          <MantineNavLink
            component={NavLink}
            to="/match"
            label="Recipe Match"
            leftSection={<NavIcon icon={IconSearch} color="teal" />}
            onClick={close}
          />
          <MantineNavLink
            component={NavLink}
            to="/compare"
            label="Recipes vergleichen"
            leftSection={<NavIcon icon={IconScale} color="gray" />}
            onClick={close}
          />
          <MantineNavLink
            component={NavLink}
            to="/map"
            label="Ähnlichkeits-Map"
            leftSection={<NavIcon icon={IconChartDots} color="gray" />}
            onClick={close}
          />
          <MantineNavLink
            component={NavLink}
            to="/reference"
            label="Referenz"
            leftSection={<NavIcon icon={IconBook} color="gray" />}
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
