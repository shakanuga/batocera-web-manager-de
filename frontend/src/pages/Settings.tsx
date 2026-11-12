import { motion } from 'motion/react'
import {
  FolderCog,
  Info,
  Power,
  RefreshCw,
  Save,
  Server,
  Terminal,
  Trophy,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageContainer, useShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Field, Input, Toggle } from '@/components/ui/Field'
import { PanelCard, StatRow } from '@/components/ui/Card'
import { PillBar, Pill } from '@/components/ui/Pill'
import { useApi } from '@/hooks/useApi'
import { useTheme } from '@/hooks/useTheme'
import { useToast } from '@/hooks/useToast'
import { triggerHaptic } from '@/hooks/useWebHaptics'
import { api } from '@/lib/api'
import type { ServiceStatus, Settings, UiTheme } from '@/lib/types'

const EASE = [0.16, 1, 0.3, 1] as const

const THEME_OPTIONS: { label: string; value: UiTheme }[] = [
  { label: 'Dunkel', value: 'dark' },
  { label: 'Hell', value: 'light' },
  { label: 'Automatisch', value: 'auto' },
]

const PATH_FIELDS: { key: keyof Settings; label: string; hint?: string }[] = [
  { key: 'es_cfg_dir', label: 'EmulationStation-Konfigurationen' },
  { key: 'roms_base', label: 'ROM-Basisordner' },
  { key: 'themes_user', label: 'Benutzer-Themes' },
  { key: 'themes_sys', label: 'System-Themes' },
  { key: 'bios_dir', label: 'BIOS-Verzeichnis' },
  { key: 'batocera_conf', label: 'Datei batocera.conf' },
  { key: 'python_path', label: 'Pfad zu configgen (emulatorlauncher.py)' },
  { key: 'app_path', label: 'Pfad zu app.py' },
]

export function SettingsPage() {
  const { openMenu } = useShell()
  const { showToast } = useToast()
  const { mode, setMode } = useTheme()

  const settings = useApi(() => api.getSettings(), [])
  const service = useApi(() => api.serviceStatus(), [])
  const info = useApi(() => api.systemInfo(), [])

  const [draft, setDraft] = useState<Partial<Settings>>({})
  const [raKey, setRaKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (settings.data) setDraft(settings.data)
  }, [settings.data])

  const value = <K extends keyof Settings>(key: K): string => {
    const v = draft[key]
    return v === undefined || v === null ? '' : String(v)
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload: Partial<Settings> & { ra_api_key?: string } = { ...draft }
      // La clave real nunca se devuelve al cliente: sólo se envía si el
      // usuario escribe una nueva.
      if (raKey.trim()) payload.ra_api_key = raKey.trim()
      else delete payload.ra_api_key

      await api.saveSettings(payload)
      triggerHaptic('success')
      showToast('Einstellungen gespeichert.', 'success')
      setRaKey('')
      settings.refresh()
    } catch {
      triggerHaptic('error')
      showToast('Einstellungen konnten nicht gespeichert werden.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const serviceAction = async (action: 'install' | 'remove' | 'restart') => {
    setBusy(action)
    triggerHaptic('medium')
    try {
      if (action === 'install') await api.serviceInstall()
      else if (action === 'remove') await api.serviceRemove()
      else await api.serviceRestart()
      showToast(
        action === 'install'
          ? 'Autostart eingerichtet.'
          : action === 'remove'
            ? 'Autostart entfernt.'
            : 'Dienst neu gestartet.',
        'success',
      )
      service.refresh()
    } catch {
      showToast('Der Vorgang konnte nicht abgeschlossen werden.', 'error')
    } finally {
      setBusy(null)
    }
  }

  const status: ServiceStatus | null = service.data
  // Carpeta de instalación: la ruta de app.py sin el nombre del fichero.
  const installDir = (info.data?.app_path || '/userdata/system/batocera_web/app.py').replace(
    /\/app\.py$/,
    '',
  )

  return (
    <>
      <Topbar
        title="Einstellungen"
        subtitle="Pfade, Design der Oberfläche und Autostart"
        onMenu={openMenu}
        actions={
          <Button size="sm" variant="primary" onClick={save} disabled={saving}>
            <Save className="size-3.5" />
            {saving ? 'Wird gespeichert…' : 'Speichern'}
          </Button>
        }
      />

      <PageContainer>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Tema */}
          <PanelCard
            title="Design der Oberfläche"
            subtitle="Wird sofort übernommen und im Manager gespeichert"
            icon={<RefreshCw className="size-4" />}
          >
            <PillBar>
              {THEME_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  active={mode === opt.value}
                  onClick={() => {
                    triggerHaptic('light')
                    setMode(opt.value)
                  }}
                >
                  {opt.label}
                </Pill>
              ))}
            </PillBar>
            <p className="mt-3 text-xs text-muted-foreground">
              „Automatisch“ folgt der Systemeinstellung (hell oder dunkel).
            </p>
          </PanelCard>

          {/* Servicio */}
          <PanelCard
            title="Autostart"
            subtitle={status?.autostart.installed ? 'In custom.sh eingerichtet' : 'Nicht eingerichtet'}
            icon={<Power className="size-4" />}
            actions={
              status?.autostart.installed ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => serviceAction('restart')}
                    disabled={busy !== null}
                  >
                    Neu starten
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => serviceAction('remove')}
                    disabled={busy !== null}
                  >
                    Entfernen
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => serviceAction('install')}
                  disabled={busy !== null}
                >
                  Installieren
                </Button>
              )
            }
          >
            <div className="space-y-1">
              <StatRow
                label="Status"
                value={status?.autostart.installed ? 'Installiert' : 'Nicht eingerichtet'}
              />
              <StatRow
                label="Prozess"
                value={
                  status?.process.running
                    ? `Aktiv · PID ${status.process.pid ?? '—'}`
                    : 'Gestoppt'
                }
              />
              <StatRow
                label="Laufender Port"
                value={status?.process.port ? String(status.process.port) : '—'}
              />
              <StatRow label="Datei" value={status?.custom_sh ?? '—'} />
            </div>
            {status?.autostart.manual_mode && (
              <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                Der Manager läuft im manuellen Modus: Er wurde nicht mit dem System gestartet.
              </p>
            )}
            <div className="mt-3">
              <p className="text-xs font-medium text-foreground">Block in custom.sh</p>
              <pre className="mt-1 overflow-auto rounded-xl border border-border bg-stage p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                {status?.autostart.block?.trim() || '(kein Block)'}
              </pre>
            </div>
          </PanelCard>

          {/* Información del sistema */}
          <PanelCard
            title="Systeminformationen"
            subtitle="Was der Manager gerade ausliefert"
            icon={<Info className="size-4" />}
          >
            <div className="space-y-1">
              <StatRow label="Manager-Version" value={info.data ? `v${info.data.version}` : '—'} />
              <StatRow
                label="Oberfläche"
                value={
                  !info.data
                    ? '—'
                    : info.data.frontend === 'react'
                      ? 'React- + Tailwind-SPA'
                      : 'Klassische Oberfläche (eine Datei)'
                }
              />
              <StatRow label="Python" value={info.data?.python_version ?? '—'} />
              <StatRow
                label="Node"
                value={
                  !info.data
                    ? '—'
                    : info.data.node_version
                      ? `${info.data.node_version} · installiert`
                      : 'nicht installiert · nicht nötig'
                }
              />
              <StatRow
                label="Pillow (logos)"
                value={
                  !info.data ? '—' : info.data.has_pil ? 'verfügbar' : 'nicht verfügbar'
                }
              />
              <StatRow label="Port" value={info.data ? String(info.data.port) : '—'} />
              <StatRow label="Frontend-Bundle" value={info.data?.dist_dir ?? '—'} />
              <StatRow label="Startskript" value={info.data?.custom_sh ?? '—'} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {info.data?.frontend === 'react'
                ? 'Das Frontend wird fertig kompiliert aus frontend/dist ausgeliefert: Die Konsole braucht kein Node, um zu funktionieren.'
                : 'In frontend/dist gibt es kein kompiliertes Bundle, daher wird die klassische Ein-Datei-Oberfläche ausgeliefert. Kompiliere das Frontend, um die React-Version zu nutzen.'}
            </p>
          </PanelCard>

          {/* Instrucciones */}
          <PanelCard
            title="Anleitung"
            subtitle="Installieren, aktualisieren und neu kompilieren"
            icon={<Terminal className="size-4" />}
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-foreground">Zugriff</p>
                <pre className="mt-1 overflow-auto rounded-xl border border-border bg-stage p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                  {`http://<IP-DER-KONSOLE>:${info.data?.port ?? 5000}`}
                </pre>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Installieren oder aktualisieren (per SSH)</p>
                <pre className="mt-1 overflow-auto rounded-xl border border-border bg-stage p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                  {`cd ${installDir}
git pull
bash install.sh`}
                </pre>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  Frontend auf der Konsole neu kompilieren (optional, braucht Node)
                </p>
                <pre className="mt-1 overflow-auto rounded-xl border border-border bg-stage p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                  {`cd ${installDir}/frontend
npm ci
npm run build`}
                </pre>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Die Konsole bringt Node nicht von Haus aus mit: <code className="font-mono text-foreground">bash install.sh</code>{' '}
                kann es für dich installieren (offizielles Tarball von nodejs.org, mit geprüftem SHA256) und die Links für jeden Start einrichten. Das Bundle wird kompiliert ausgeliefert, der Manager funktioniert also auch ohne Node.
              </p>
            </div>
          </PanelCard>

          {/* Rutas */}
          <PanelCard
            title="Systempfade"
            subtitle="Wo der Manager sucht und schreibt"
            icon={<FolderCog className="size-4" />}
          >
            <div className="grid grid-cols-1 gap-4">
              {PATH_FIELDS.map((field) => (
                <Field key={String(field.key)} label={field.label} hint={field.hint}>
                  <Input
                    value={value(field.key)}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    spellCheck={false}
                  />
                </Field>
              ))}
              <Field label="Server-Port" hint="Wird nach einem Neustart des Managers übernommen.">
                <Input
                  type="number"
                  value={value('server_port')}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, server_port: Number(e.target.value) || 5000 }))
                  }
                />
              </Field>
            </div>
          </PanelCard>

          {/* RetroAchievements */}
          <PanelCard
            title="RetroAchievements"
            subtitle="Fortschritt und Erfolge im Panel"
            icon={<Trophy className="size-4" />}
          >
            <Toggle
              checked={draft.ra_enabled ?? false}
              onChange={(v) => setDraft((prev) => ({ ...prev, ra_enabled: v }))}
              label="RetroAchievements aktivieren"
              description="Wenn deaktiviert, fragt das Panel die API nicht mehr ab."
            />

            <div className="mt-4 grid grid-cols-1 gap-4">
              <Field label="Benutzer" htmlFor="ra_user">
                <Input
                  id="ra_user"
                  value={value('ra_user')}
                  onChange={(e) => setDraft((prev) => ({ ...prev, ra_user: e.target.value }))}
                  spellCheck={false}
                />
              </Field>
              <Field
                label="Web API Key"
                htmlFor="ra_key"
                hint={
                  settings.data?.ra_api_key_set
                    ? 'Es ist bereits ein Schlüssel gespeichert. Gib einen neuen ein, um ihn zu ersetzen.'
                    : 'Es ist noch kein Schlüssel gespeichert.'
                }
              >
                <Input
                  id="ra_key"
                  type="password"
                  value={raKey}
                  onChange={(e) => setRaKey(e.target.value)}
                  placeholder={settings.data?.ra_api_key_set ? '••••••••••••' : ''}
                  spellCheck={false}
                  autoComplete="off"
                />
              </Field>
            </div>
          </PanelCard>

          {/* Servidor */}
          <PanelCard
            title="Server"
            subtitle="Manager-Prozess läuft"
            icon={<Server className="size-4" />}
          >
            <div className="space-y-1">
              <StatRow label="Dienststatus" value={status?.process.running ? 'Aktiv' : 'Gestoppt'} />
              <StatRow
                label="Modus"
                value={status?.autostart.manual_mode ? 'Manuell' : 'Autostart'}
              />
              <StatRow
                label="PID"
                value={status?.process.pid ? String(status.process.pid) : '—'}
              />
              <StatRow
                label="Laufender Port"
                value={status?.process.port ? String(status.process.port) : '—'}
              />
              <StatRow
                label="Konfigurierter Port"
                value={value('server_port') || '—'}
              />
            </div>
            {status?.process.cmd && (
              <pre className="mt-3 overflow-auto rounded-xl border border-border bg-stage p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                {status.process.cmd}
              </pre>
            )}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="mt-3 text-xs leading-relaxed text-muted-foreground"
            >
              Die Oberfläche wird vom selben Prozess ausgeliefert, der die API bereitstellt: Kein anderer Dienst ist beteiligt.
            </motion.p>
          </PanelCard>
        </div>
      </PageContainer>
    </>
  )
}
