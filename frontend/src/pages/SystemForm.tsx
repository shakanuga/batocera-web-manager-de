import { motion } from 'motion/react'
import { ArrowLeft, Eye, Save, Wand2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer, useShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Toggle } from '@/components/ui/Field'
import { PanelCard } from '@/components/ui/Card'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import { triggerHaptic } from '@/hooks/useWebHaptics'
import { api } from '@/lib/api'
import type { BatoceraSystemEntry, SystemPayload } from '@/lib/types'

const EASE = [0.16, 1, 0.3, 1] as const

const EMPTY: SystemPayload = {
  fullname: '',
  name: '',
  manufacturer: '',
  release: '',
  hardware: 'console',
  rompath: '',
  extensions: '',
  platform: '',
  theme: '',
  description: '',
  emulator: '',
  core: '',
  extra_cores: '',
  create_roms_dir: true,
  batocera_conf_entry: false,
}

export function SystemForm() {
  const { openMenu } = useShell()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const params = useParams<{ name?: string }>()

  const editingName = params.name ? decodeURIComponent(params.name) : null
  const isEdit = editingName !== null

  const [form, setForm] = useState<SystemPayload>(EMPTY)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<string>('')
  const [refQuery, setRefQuery] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [log, setLog] = useState<string[]>([])

  const info = useApi(() => api.info(), [])
  // Estado (no refs): al cargar el catálogo hay que re-renderizar para que
  // aparezca el panel de sistemas de referencia y la lista de temas.
  const [catalogue, setCatalogue] = useState<Record<string, BatoceraSystemEntry>>({})
  const [themes, setThemes] = useState<string[]>([])

  /* Carga de catálogos y del sistema a editar */
  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      try {
        const [catRes, themeRes] = await Promise.all([api.batoceraSystems(), api.themes()])
        if (cancelled) return
        setCatalogue(catRes.systems)
        setThemes(themeRes.list)
        if (isEdit && editingName) {
          const detail = await api.systemDetail(editingName)
          if (cancelled) return
          if (detail.ok) {
            const s = detail.system
            setForm({
              fullname: s.fullname ?? '',
              name: s.name ?? '',
              manufacturer: s.manufacturer ?? '',
              release: s.release ?? '',
              hardware: s.hardware ?? 'console',
              rompath: s.path ?? '',
              extensions: s.extension ?? '',
              platform: s.platform ?? '',
              theme: s.theme ?? '',
              description: s.description ?? '',
              emulator: s.emulator ?? '',
              core: s.core ?? '',
              extra_cores: s.extra_cores ?? '',
              create_roms_dir: false,
              batocera_conf_entry: false,
              old_name: s.name,
            })
          } else {
            showToast('Das zu bearbeitende System wurde nicht gefunden.', 'error')
            navigate('/sistemas')
          }
        }
      } catch {
        if (!cancelled) showToast('Systemkonfiguration konnte nicht geladen werden.', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [editingName, isEdit, navigate, showToast])

  const set = useCallback(<K extends keyof SystemPayload>(key: K, value: SystemPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  /* Vista previa del XML (con rebote para no castigar el backend) */
  useEffect(() => {
    if (!form.fullname.trim() || !form.rompath.trim()) {
      setPreview('')
      return
    }
    const timer = window.setTimeout(async () => {
      try {
        const res = await api.previewSystem(form)
        setPreview(res.ok ? res.xml : '')
      } catch {
        setPreview('')
      }
    }, 350)
    return () => window.clearTimeout(timer)
  }, [form])

  const applyFromCatalogue = (slug: string) => {
    const entry = catalogue[slug]
    if (!entry) return
    triggerHaptic('light')
    setForm((prev) => ({
      ...prev,
      fullname: entry.n,
      name: slug,
      platform: slug,
      emulator: entry.l[0] ?? '',
      core: entry.l[0] ?? '',
      rompath: prev.rompath || `/userdata/roms/${slug}`,
    }))
    showToast(`Daten von „${entry.n}“ übernommen.`, 'success')
  }

  const validate = (): string[] => {
    const found: string[] = []
    if (!form.fullname.trim()) found.push('Der vollständige Name ist Pflicht.')
    if (!form.name.trim()) found.push('Der Slug ist Pflicht.')
    else if (/\s/.test(form.name.trim())) found.push('Der Slug darf keine Leerzeichen enthalten.')
    if (!form.rompath.trim()) found.push('Der ROM-Pfad ist Pflicht.')
    if (!form.extensions.trim()) found.push('Die Dateiendungen sind Pflicht.')
    return found
  }

  const save = async (dryRun: boolean) => {
    const found = validate()
    setErrors(found)
    if (found.length > 0) {
      triggerHaptic('error')
      showToast('Prüfe die markierten Felder.', 'error')
      return
    }

    setSaving(true)
    try {
      const payload: SystemPayload = { ...form, dry_run: dryRun }
      const res = isEdit
        ? await api.updateSystem({ ...payload, old_name: editingName ?? form.name })
        : await api.createSystem(payload)

      if (!res.ok) {
        const list = res.errors ?? ['System konnte nicht gespeichert werden.']
        setErrors(list)
        triggerHaptic('error')
        showToast(list[0], 'error')
        return
      }

      setLog(res.log)
      triggerHaptic('success')
      showToast(
        dryRun ? 'Simulation abgeschlossen: Es wurde nichts geschrieben.' : 'System gespeichert.',
        'success',
      )
      if (!dryRun) {
        window.setTimeout(() => navigate('/sistemas'), 600)
      }
    } catch (err) {
      triggerHaptic('error')
      showToast(err instanceof Error ? err.message : 'System konnte nicht gespeichert werden.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const catalogueEntries = Object.entries(catalogue)
  const filteredCatalogue = useMemo(() => {
    const q = refQuery.trim().toLowerCase()
    if (!q) return catalogueEntries
    return catalogueEntries.filter(
      ([slug, entry]) => entry.n.toLowerCase().includes(q) || slug.toLowerCase().includes(q),
    )
  }, [catalogueEntries, refQuery])

  return (
    <>
      <Topbar
        title={isEdit ? `Bearbeiten ${form.fullname || editingName}` : 'System hinzufügen'}
        subtitle={
          isEdit
            ? 'Die Änderungen werden beim Neustart von EmulationStation geschrieben.'
            : 'Erzeugt eine es_systems_<slug>.cfg aus dem Batocera-Katalog.'
        }
        onMenu={openMenu}
        actions={
          <Button size="sm" variant="ghost" onClick={() => navigate('/sistemas')}>
            <ArrowLeft className="size-3.5" />
            Zurück
          </Button>
        }
      />

      <PageContainer>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div className="space-y-4">
            {/* Referencia */}
            {!isEdit && catalogueEntries.length > 0 && (
              <PanelCard
                title="Referenzsystem"
                subtitle="Füllt das Formular mit den Batocera-Daten aus"
                icon={<Wand2 className="size-4" />}
              >
                <Input
                  value={refQuery}
                  onChange={(e) => setRefQuery(e.target.value)}
                  placeholder="Im Katalog suchen (NES, Mega Drive, Arcade…)"
                  aria-label="Referenzsystem suchen"
                />
                {filteredCatalogue.length === 0 ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Kein System im Katalog passt zu „{refQuery}».
                  </p>
                ) : (
                  <div className="mt-3 max-h-64 overflow-y-auto pr-1">
                    <div className="flex flex-wrap gap-2">
                      {filteredCatalogue.map(([slug, entry]) => (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => applyFromCatalogue(slug)}
                          className="cursor-pointer rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {entry.n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {refQuery.trim() && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {filteredCatalogue.length} von {catalogueEntries.length} Systeme
                  </p>
                )}
              </PanelCard>
            )}

            {/* Identidad */}
            <PanelCard title="System-Identität">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Vollständiger Name" htmlFor="fullname" error={errors[0]}>
                  <Input
                    id="fullname"
                    value={form.fullname}
                    onChange={(e) => set('fullname', e.target.value)}
                    placeholder="Nintendo Entertainment System"
                    disabled={loading}
                  />
                </Field>
                <Field
                  label="Slug (Dateiname)"
                  htmlFor="name"
                  hint="Ohne Leerzeichen oder Trennzeichen."
                  error={errors[1]}
                >
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="nes"
                    disabled={loading}
                  />
                </Field>
                <Field label="Hersteller" htmlFor="manufacturer">
                  <Input
                    id="manufacturer"
                    value={form.manufacturer}
                    onChange={(e) => set('manufacturer', e.target.value)}
                    placeholder="Nintendo"
                    disabled={loading}
                  />
                </Field>
                <Field label="Erscheinungsjahr" htmlFor="release">
                  <Input
                    id="release"
                    value={form.release}
                    onChange={(e) => set('release', e.target.value)}
                    placeholder="1983"
                    disabled={loading}
                  />
                </Field>
                <Field label="Gerätetyp" htmlFor="hardware">
                  <Select
                    id="hardware"
                    value={form.hardware}
                    onChange={(e) => set('hardware', e.target.value)}
                    disabled={loading}
                  >
                    {(info.data?.hardware_types ?? ['console']).map((h: string) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Plattform" htmlFor="platform">
                  <Input
                    id="platform"
                    value={form.platform}
                    onChange={(e) => set('platform', e.target.value)}
                    placeholder="nes"
                    disabled={loading}
                  />
                </Field>
              </div>
            </PanelCard>

            {/* Rutas y extensiones */}
            <PanelCard title="ROMs und Dateiendungen">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="ROM-Pfad"
                  htmlFor="rompath"
                  hint="Innerhalb von /userdata/roms."
                  error={errors[2]}
                >
                  <Input
                    id="rompath"
                    value={form.rompath}
                    onChange={(e) => set('rompath', e.target.value)}
                    placeholder="/userdata/roms/nes"
                    disabled={loading}
                  />
                </Field>
                <Field
                  label="Dateiendungen"
                  htmlFor="extensions"
                  hint="Durch Leerzeichen getrennt: .zip .7z .rar"
                  error={errors[3]}
                >
                  <Input
                    id="extensions"
                    value={form.extensions}
                    onChange={(e) => set('extensions', e.target.value)}
                    placeholder=".zip .7z .rar"
                    disabled={loading}
                  />
                </Field>
                <Field label="Theme" htmlFor="theme">
                  <Select
                    id="theme"
                    value={form.theme}
                    onChange={(e) => set('theme', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">(kein Theme)</option>
                    {themes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Beschreibung" htmlFor="description">
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="8-Bit-Konsole von Nintendo"
                    disabled={loading}
                  />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Toggle
                  checked={form.create_roms_dir ?? false}
                  onChange={(v) => set('create_roms_dir', v)}
                  label="ROM-Ordner anlegen"
                  description="Führt mkdir -p für den angegebenen Pfad aus."
                />
                <Toggle
                  checked={form.batocera_conf_entry ?? false}
                  onChange={(v) => set('batocera_conf_entry', v)}
                  label="Eintrag in batocera.conf hinzufügen"
                  description="Schreibt <slug>.emulator und <slug>.core."
                />
              </div>
            </PanelCard>

            {/* Emulador */}
            <PanelCard title="Emulator und Core">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Emulator" htmlFor="emulator">
                  <Input
                    id="emulator"
                    value={form.emulator}
                    onChange={(e) => set('emulator', e.target.value)}
                    placeholder="retroarch"
                    disabled={loading}
                  />
                </Field>
                <Field label="Haupt-Core" htmlFor="core">
                  <Input
                    id="core"
                    value={form.core}
                    onChange={(e) => set('core', e.target.value)}
                    placeholder="nestopia"
                    disabled={loading}
                  />
                </Field>
                <Field label="Weitere Cores" htmlFor="extra_cores" hint="Durch Kommas getrennt.">
                  <Input
                    id="extra_cores"
                    value={form.extra_cores}
                    onChange={(e) => set('extra_cores', e.target.value)}
                    placeholder="fceumm,mesen"
                    disabled={loading}
                  />
                </Field>
              </div>
            </PanelCard>
          </div>

          {/* Vista previa */}
          <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <PanelCard
              title="XML-Vorschau"
              subtitle="Was in die .cfg geschrieben wird"
              icon={<Eye className="size-4" />}
            >
              {preview ? (
                <pre className="max-h-[45vh] overflow-auto rounded-2xl border border-border bg-stage p-3 font-mono text-[11px] leading-relaxed text-foreground">
                  {preview}
                </pre>
              ) : (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  Gib Name und Pfad ein, um das XML zu sehen.
                </p>
              )}

              {errors.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {errors.map((err) => (
                    <li key={err} className="text-xs font-medium text-destructive">
                      · {err}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex flex-col gap-2">
                <Button
                  variant="primary"
                  onClick={() => save(false)}
                  disabled={saving || loading}
                  className="w-full"
                >
                  <Save className="size-4" />
                  {saving ? 'Wird gespeichert…' : isEdit ? 'Änderungen speichern' : 'System anlegen'}
                </Button>
                <Button variant="secondary" onClick={() => save(true)} disabled={saving || loading}>
                  Simulieren (nicht schreiben)
                </Button>
              </div>
            </PanelCard>

            {log.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <PanelCard title="Protokoll" subtitle="Ergebnis des letzten Vorgangs">
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-foreground">
                    {log.join('\n')}
                  </pre>
                </PanelCard>
              </motion.div>
            )}
          </div>
        </div>
      </PageContainer>
    </>
  )
}
