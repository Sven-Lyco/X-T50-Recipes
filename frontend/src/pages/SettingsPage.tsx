import { useRef, useState } from 'react'
import {
  Stack, Title, Paper, Text, Button, Group, FileButton,
  Select, Switch, Alert, Divider, Anchor, Modal,
} from '@mantine/core'
import { isAxiosError } from 'axios'
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
  const [pendingImport, setPendingImport] = useState<File | null>(null)
  const resetFileInput = useRef<() => void>(null)

  const aiAvailable = aiStatus?.available ?? true

  // Uses mutateAsync and one updatable notification, so the result is still reported
  // after the user has left this page during a long upload.
  function closeImportConfirm() {
    setPendingImport(null)
    // Lets the same file be picked again after cancelling
    resetFileInput.current?.()
  }

  async function handleBackupImport(file: File) {
    closeImportConfirm()
    const id = notifications.show({
      title: 'Backup-Import',
      message: 'Wird hochgeladen … 0 %',
      loading: true,
      autoClose: false,
      withCloseButton: false,
    })
    try {
      const recipes = await importBackup.mutateAsync({
        file,
        onUploadProgress: (percent) =>
          notifications.update({
            id,
            message: percent < 100 ? `Wird hochgeladen … ${percent} %` : 'Hochgeladen, wird verarbeitet …',
          }),
      })
      const onCamera = recipes.filter((r) => r.cameraSlot).length
      notifications.update({
        id,
        message: `Backup wiederhergestellt: ${recipes.length} Recipe(s), davon ${onCamera} auf C1–C7.`,
        color: 'green',
        loading: false,
        autoClose: false,
        withCloseButton: true,
      })
    } catch (e) {
      const reason = isAxiosError(e) ? e.response?.data?.message : undefined
      notifications.update({
        id,
        message: reason ?? 'Import fehlgeschlagen. Die vorhandenen Daten wurden nicht verändert.',
        color: 'red',
        loading: false,
        autoClose: false,
        withCloseButton: true,
      })
    }
  }

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

      <Modal opened={pendingImport !== null} onClose={closeImportConfirm} title="Backup wiederherstellen?" centered>
        <Stack gap="md">
          <Text size="sm">
            Alle vorhandenen Recipes, Bilder, die C1–C7-Belegung und das Slot-Protokoll werden gelöscht und
            durch den Inhalt von „{pendingImport?.name}“ ersetzt. Das lässt sich nicht rückgängig machen.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeImportConfirm}>Abbrechen</Button>
            <Button color="red" onClick={() => pendingImport && handleBackupImport(pendingImport)}>
              Alles ersetzen
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Paper withBorder p="md" radius="md">
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="md">Datensicherung</Text>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={2}>
              <Text size="sm" fw={500}>Backup exportieren</Text>
              <Text size="xs" c="dimmed">Alle Recipes inkl. Bilder, C1–C7-Belegung, Favoriten und Slot-Protokoll als ZIP</Text>
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
              <Text size="xs" c="dimmed">Ersetzt alle vorhandenen Recipes, Bilder, die C1–C7-Belegung und das Slot-Protokoll durch den Stand des Backup-ZIPs</Text>
            </Stack>
            <FileButton
              accept=".zip"
              resetRef={resetFileInput}
              onChange={(file) => {
                if (file) setPendingImport(file)
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
