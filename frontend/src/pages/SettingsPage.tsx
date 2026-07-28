import { useState } from 'react'
import {
  Stack, Title, Paper, Text, Button, Group, FileButton,
  Select, Switch, Alert, Divider, Anchor,
} from '@mantine/core'
import { IconDownload, IconUpload, IconInfoCircle, IconExternalLink } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useSettings } from '../contexts/SettingsContext'
import { useAiStatus, useImportBackup } from '../api/recipes'
import client from '../api/client'
import { MODEL_OPTIONS } from '../utils/labels'

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const { data: aiStatus } = useAiStatus()
  const importBackup = useImportBackup()
  const [backupLoading, setBackupLoading] = useState(false)

  const aiAvailable = aiStatus?.available ?? true

  async function handleBackupDownload() {
    setBackupLoading(true)
    try {
      const response = await client.get('/backup', { responseType: 'blob' })
      const url = URL.createObjectURL(response.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `xt50-recipes-backup-${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      notifications.show({ message: 'Backup-Download fehlgeschlagen.', color: 'red' })
    } finally {
      setBackupLoading(false)
    }
  }

  return (
    <Stack gap="lg" maw={600}>
      <Title order={2}>Einstellungen</Title>

      <Paper withBorder p="md" radius="md">
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="md">Datensicherung</Text>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={2}>
              <Text size="sm" fw={500}>Backup exportieren</Text>
              <Text size="xs" c="dimmed">Alle Recipes inkl. Bilder als ZIP</Text>
            </Stack>
            <Button
              variant="default"
              loading={backupLoading}
              onClick={handleBackupDownload}
              leftSection={<IconDownload size={16} />}
            >
              Herunterladen
            </Button>
          </Group>
          <Divider />
          <Group justify="space-between" align="flex-start">
            <Stack gap={2}>
              <Text size="sm" fw={500}>Backup importieren</Text>
              <Text size="xs" c="dimmed">Recipes aus Backup-ZIP laden (addiert zu bestehenden)</Text>
            </Stack>
            <FileButton
              accept=".zip"
              onChange={(file) => {
                if (!file) return
                importBackup.mutate(file, {
                  onSuccess: (recipes) =>
                    notifications.show({ message: `${recipes.length} Recipe(s) importiert.`, color: 'green' }),
                  onError: () =>
                    notifications.show({ message: 'Import fehlgeschlagen.', color: 'red' }),
                })
              }}
            >
              {(props) => (
                <Button
                  variant="default"
                  loading={importBackup.isPending}
                  leftSection={<IconUpload size={16} />}
                  {...props}
                >
                  Importieren
                </Button>
              )}
            </FileButton>
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="md">KI-Einstellungen</Text>
        <Stack gap="md">
          {!aiAvailable && (
            <Alert icon={<IconInfoCircle size={16} />} color="orange" variant="light">
              Kein ANTHROPIC_API_KEY konfiguriert – KI-Features nicht verfügbar.
            </Alert>
          )}
          <Switch
            label="KI-Funktionen aktiviert"
            description="Recipe generieren und Recipe Match in der Navigation anzeigen"
            checked={settings.aiEnabled && aiAvailable}
            disabled={!aiAvailable}
            onChange={(e) => updateSettings({ aiEnabled: e.currentTarget.checked })}
          />
          <Select
            label="Standard-Modell"
            description="Wird als Vorauswahl in Recipe generieren und Recipe Match verwendet"
            data={MODEL_OPTIONS}
            value={settings.defaultModel}
            onChange={(v) => v && updateSettings({ defaultModel: v })}
            disabled={!settings.aiEnabled || !aiAvailable}
            allowDeselect={false}
          />
          <Group gap={4}>
            <Anchor
              href="https://console.anthropic.com/settings/billing"
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
            >
              API-Guthaben & Verbrauch in der Anthropic Console
            </Anchor>
            <IconExternalLink size={14} style={{ color: 'var(--mantine-color-anchor)' }} />
          </Group>
        </Stack>
      </Paper>
    </Stack>
  )
}
