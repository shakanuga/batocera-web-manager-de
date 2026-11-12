import {
  CircleAlert,
  CircleCheck,
  ExternalLink,
  FileCog,
  FileCode2,
  HardDrive,
  Layers,
  RefreshCw,
  Wand2,
  Wrench,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageContainer, useShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { Button, IconButton } from '@/components/ui/Button'
import { PanelCard } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Pill, PillBar } from '@/components/ui/Pill'
import { useApi } from '@/hooks/useApi'
import { useNotify } from '@/hooks/useNotify'
import { api } from '@/lib/api'
import type { ToolsBatchResult, ToolsFormatAction, ToolsRomFile } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Tamaño legible de un fichero. */
function humanSize(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

/** El backend no ha sabido qué formato tiene este fichero. */
function sinReconocer(file: ToolsRomFile): boolean {
  return !file.label || file.kind === 'desconocido'
}

/**
 * ¿El sistema admite el formato de destino? Si no lo admite, la conversión no
 * se ofrece: sería un trabajo que luego no sirve (un ZIP en un PSP, un CHD en
 * un GameCube).
 */
function admiteSistema(accion: ToolsFormatAction): boolean {
  return accion.admite !== false
}

/** ¿Está en la consola la utilidad que hace falta para la conversión? */
function tieneHerramienta(accion: ToolsFormatAction): boolean {
  return accion.disponible !== false
}

/**
 * Por qué no se puede hacer la conversión, en palabras del backend (que las
 * escribe sin acentos y en minúscula: se empiezan en mayúscula).
 */
function motivo(accion: ToolsFormatAction): string {
  const texto = accion.motivo || (accion.falta ? `Werkzeug fehlt ${accion.falta}` : '')
  if (!texto) return 'Das benötigte Werkzeug ist nicht auf der Konsole.'
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** Un destino de conversión y cuántos ficheros del sistema lo admiten. */
interface Destino {
  id: string
  label: string
  nota?: string
  count: number
  /** Si se puede ejecutar en lote (la utilidad está en la consola). */
  disponible: boolean
}

/** Un formato detectado y cuántos ficheros del sistema lo tienen. */
interface Formato {
  kind: string
  label: string
  count: number
}

export function ToolsFormatsPage() {
  const { openMenu } = useShell()
  const { showNotify } = useNotify()

  const systems = useApi(() => api.romSystems(), [])
  const [system, setSystem] = useState('')
  const [selected, setSelected] = useState<ToolsRomFile | null>(null)
  const [busy, setBusy] = useState(false)

  /* Conversión en lote. */
  const [destino, setDestino] = useState('')
  const [origen, setOrigen] = useState('')
  const [confirmarLote, setConfirmarLote] = useState(false)
  const [lote, setLote] = useState<ToolsBatchResult | null>(null)

  const files = useApi(() => api.toolsRoms(system), [system], { enabled: !!system })

  /** Los formatos que admite cada sistema y el catálogo de utilidades. */
  const catalogo = useApi(() => api.toolsFormatSystems(), [])

  /** Los sistemas que tienen ROMs y ademas tienen formato que ver. */
  const conRom = useMemo(
    () => (systems.data ?? []).filter((item) => (item.rom_count ?? 0) > 0),
    [systems.data],
  )

  /** Los datos del sistema elegido: qué formatos admite y qué compresiones. */
  const sistemaInfo = useMemo(() => {
    const lista = catalogo.data?.sistemas ?? []
    const elegido = system.trim().toLowerCase()
    return (
      lista.find((item) => item.sistema === system) ??
      lista.find((item) => item.sistema.toLowerCase() === elegido) ??
      null
    )
  }, [catalogo.data, system])

  /** El catálogo de utilidades de conversión. */
  const herramientas = useMemo(() => catalogo.data?.herramientas ?? [], [catalogo.data])

  const lista = files.data?.files ?? []

  /** Los parches IPS de la carpeta (no son ROMs, pero se aplican igual). */
  const parches = useMemo(
    () => (files.data?.files ?? []).filter((file) => file.name.toLowerCase().endsWith('.ips')),
    [files.data],
  )

  /** Las conversiones que se ofrecen del fichero abierto: solo las que el
      sistema admite (las demás ni se enseñan). */
  const accionesSeleccionadas = useMemo(
    () => (selected?.acciones ?? []).filter(admiteSistema),
    [selected],
  )

  /** Las que el sistema no admite: no se ofrecen, pero se explican. */
  const accionesOcultas = useMemo(
    () => (selected?.acciones ?? []).filter((accion) => !admiteSistema(accion)),
    [selected],
  )

  /** Cuántos ficheros tienen un formato reconocido. */
  const reconocidos = useMemo(
    () => (files.data?.files ?? []).filter((file) => !sinReconocer(file)).length,
    [files.data],
  )

  /** Destinos de conversión que ofrece el backend para este sistema. */
  const destinos = useMemo<Destino[]>(() => {
    const mapa = new Map<string, Destino>()
    for (const file of files.data?.files ?? []) {
      for (const accion of file.acciones ?? []) {
        // Los formatos que el sistema no admite no se ofrecen ni en lote.
        if (!admiteSistema(accion)) continue
        const actual = mapa.get(accion.id)
        if (actual) {
          actual.count += 1
          // Si un solo fichero lo tiene disponible, la utilidad está puesta.
          if (tieneHerramienta(accion)) actual.disponible = true
        } else
          mapa.set(accion.id, {
            id: accion.id,
            label: accion.label,
            nota: accion.nota,
            count: 1,
            disponible: tieneHerramienta(accion),
          })
      }
    }
    return Array.from(mapa.values()).sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'),
    )
  }, [files.data])

  /** Los destinos que se pueden ejecutar: sin la utilidad no hay lote. */
  const destinosDisponibles = useMemo(
    () => destinos.filter((item) => item.disponible),
    [destinos],
  )

  /** Formatos detectados en el sistema (para filtrar el lote). */
  const formatos = useMemo<Formato[]>(() => {
    const mapa = new Map<string, Formato>()
    for (const file of files.data?.files ?? []) {
      const actual = mapa.get(file.kind)
      if (actual) actual.count += 1
      else
        mapa.set(file.kind, {
          kind: file.kind,
          label: sinReconocer(file) ? 'Format nicht erkannt' : file.label,
          count: 1,
        })
    }
    return Array.from(mapa.values()).sort((a, b) => b.count - a.count)
  }, [files.data])

  /** El destino elegido (si ya no existe, el primero disponible). */
  const destinoActual =
    destinosDisponibles.find((item) => item.id === destino) ?? destinosDisponibles[0] ?? null

  /** Ficheros que entran en el lote con el destino y el filtro elegidos. */
  const candidatos = useMemo(() => {
    if (!destinoActual) return []
    return (files.data?.files ?? []).filter(
      (file) =>
        (file.acciones ?? []).some(
          (accion) =>
            accion.id === destinoActual.id &&
            admiteSistema(accion) &&
            tieneHerramienta(accion),
        ) && (!origen || file.kind === origen),
    )
  }, [files.data, destinoActual, origen])

  /** Convierte un fichero suelto al destino que pide el backend. */
  const convertir = async (accion: ToolsFormatAction) => {
    if (!selected || !system) return
    setBusy(true)
    try {
      const result = await api.toolsConvert({ system, file: selected.name, target: accion.id })
      showNotify({
        variant: 'success',
        title: `Konvertiert nach ${accion.label}`,
        message: result.out
          ? `${result.out}${result.size ? ` · ${humanSize(result.size)}` : ''}`
          : 'Erledigt.',
      })
      setSelected(null)
      files.refresh()
    } catch (error) {
      showNotify({
        variant: 'error',
        title: 'Konvertierung fehlgeschlagen',
        message: error instanceof Error ? error.message : 'Unerwarteter Fehler.',
      })
    } finally {
      setBusy(false)
    }
  }

  /** Aplica un parche IPS a un fichero. */
  const parchear = async (patch: ToolsRomFile) => {
    if (!selected || !system) return
    setBusy(true)
    try {
      const result = await api.toolsPatch({ system, file: selected.name, patch: patch.name })
      showNotify({
        variant: 'success',
        title: 'Patch angewendet',
        message: result.out ?? 'Erledigt.',
      })
      setSelected(null)
      files.refresh()
    } catch (error) {
      showNotify({
        variant: 'error',
        title: 'Patch konnte nicht angewendet werden',
        message: error instanceof Error ? error.message : 'Unerwarteter Fehler.',
      })
    } finally {
      setBusy(false)
    }
  }

  /** Convierte en lote todos los ficheros que admitan el destino. */
  const convertirLote = async () => {
    if (!system || !destinoActual) return
    setBusy(true)
    try {
      const result = await api.toolsConvertBatch({
        system,
        target: destinoActual.id,
        ...(origen ? { kind: origen } : {}),
      })
      const resumen = result.resumen
      const convertidos = resumen?.hechos ?? 0
      const fallidos = resumen?.fallos ?? 0
      const total = resumen?.total ?? (result.hechos?.length ?? 0)
      setLote(result)
      setConfirmarLote(false)
      files.refresh()
      showNotify({
        variant: fallidos > 0 ? 'error' : 'success',
        title: 'Stapelkonvertierung abgeschlossen',
        message: `${convertidos} konvertiert · ${fallidos} fehlgeschlagen von ${total}.`,
      })
    } catch (error) {
      showNotify({
        variant: 'error',
        title: 'Stapelkonvertierung fehlgeschlagen',
        message: error instanceof Error ? error.message : 'Unerwarteter Fehler.',
      })
    } finally {
      setBusy(false)
    }
  }

  const fallos = (lote?.hechos ?? []).filter((item) => !item.ok)

  return (
    <>
      <Topbar
        title="Formate"
        subtitle="ROMs der Konsole konvertieren, patchen und komprimieren"
        onMenu={openMenu}
        actions={
          <IconButton label="Neu auflisten" onClick={() => files.refresh()}>
            <RefreshCw className={cn('size-4', files.loading && 'animate-spin')} />
          </IconButton>
        }
      />

      <PageContainer>
        {systems.error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <CircleAlert className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">{systems.error}</span>
            <Button size="sm" variant="outline" onClick={systems.refresh}>
              Erneut versuchen
            </Button>
          </div>
        )}

        <PanelCard
          title="Wähle ein System"
          subtitle="Die Formate werden anhand des Headers jedes Images erkannt"
          icon={<HardDrive className="size-4" />}
        >
          <select
            value={system}
            onChange={(event) => {
              setSystem(event.target.value)
              setDestino('')
              setOrigen('')
              setLote(null)
            }}
            className="h-10 w-full max-w-sm cursor-pointer rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">— System wählen —</option>
            {conRom.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name} · {item.rom_count} Dateien
              </option>
            ))}
          </select>
        </PanelCard>

        <div className="mt-4">
          <PanelCard
            title={system ? `Formate von ${system}` : 'Formate des Systems'}
            subtitle="Die Formate, die dieses System unterstützt, auch komprimiert"
            icon={<FileCode2 className="size-4" />}
          >
            {!system ? (
              <EmptyState
                title="Kein System gewählt"
                description="Wähle oben ein System, um seine unterstützten Formate zu sehen."
              />
            ) : catalogo.error ? (
              <div className="flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <CircleAlert className="size-4 shrink-0" />
                <span className="min-w-0 flex-1">{catalogo.error}</span>
                <Button size="sm" variant="outline" onClick={catalogo.refresh}>
                  Erneut versuchen
                </Button>
              </div>
            ) : catalogo.loading && !catalogo.data ? (
              <EmptyState title="Formate werden gelesen…" description="Einen Moment." />
            ) : !sistemaInfo ? (
              <EmptyState
                title="Keine Daten zu diesem System"
                description={`Keine Formate hinterlegt für ${system}.`}
              />
            ) : (
              <div className="space-y-4">
                {sistemaInfo.nota && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {sistemaInfo.nota}
                  </p>
                )}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Unterstützte Formate
                  </p>
                  <PillBar>
                    {(sistemaInfo.formatos ?? []).map((extension) => (
                      <Pill
                        key={extension}
                        active={extension === sistemaInfo.preferido}
                        disabled
                      >
                        {extension === sistemaInfo.preferido ? `${extension} *` : extension}
                      </Pill>
                    ))}
                  </PillBar>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Das Format mit * ist das bevorzugte des Systems.
                  </p>
                </div>

                {(sistemaInfo.compresiones ?? []).length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Komprimierungen
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(sistemaInfo.compresiones ?? []).map((compresion) => (
                        <span
                          key={compresion}
                          className="rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-foreground"
                        >
                          {compresion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </PanelCard>
        </div>

        <div className="mt-4">
          <PanelCard
            title={system ? `Dateien von ${system}` : 'Dateien'}
            subtitle={
              system
                ? `${lista.length} Dateien · ${reconocidos} mit erkanntem Format`
                : 'Wähle ein System, um seine Dateien zu sehen'
            }
            icon={<FileCog className="size-4" />}
          >
            {!system ? (
              <EmptyState
                title="Kein System gewählt"
                description="Oben kannst du wählen, von welchem System du die ROMs ansehen willst."
              />
            ) : files.loading && !files.data ? (
              <EmptyState title="Dateien werden gelesen…" description="Einen Moment." />
            ) : !lista.length ? (
              <EmptyState
                title="Keine Dateien"
                description={`Der Ordner von ${system} ist leer.`}
              />
            ) : (
              <ul className="divide-y divide-border">
                {lista.map((file) => {
                  /* Solo se anuncian los destinos que admite el sistema; los
                     que además necesitan una utilidad que no está, en ámbar. */
                  const acciones = (file.acciones ?? []).filter(admiteSistema)
                  const conversiones = acciones.filter(tieneHerramienta).map((a) => a.label)
                  const bloqueadas = acciones.filter((a) => !tieneHerramienta(a))
                  return (
                    <li key={file.name}>
                      <button
                        type="button"
                        onClick={() => setSelected(file)}
                        className="flex w-full cursor-pointer items-center gap-3 py-2.5 text-left transition-colors duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <FileCode2 className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {file.name}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <span
                              className={cn(
                                'rounded-md border px-1.5 py-0.5 font-medium',
                                sinReconocer(file)
                                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                  : 'border-border',
                              )}
                            >
                              {sinReconocer(file) ? 'Format nicht erkannt' : file.label}
                            </span>
                            <span>{humanSize(file.size)}</span>
                            {conversiones.length > 0 && (
                              <span className="truncate">· {conversiones.join(' · ')}</span>
                            )}
                            {bloqueadas.length > 0 && (
                              <span
                                className="truncate text-amber-700 dark:text-amber-400"
                                title={bloqueadas.map((a) => motivo(a)).join(' · ')}
                              >
                                · {bloqueadas.map((a) => a.label).join(' · ')} (keine Werkzeuge)
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </PanelCard>
        </div>

        <div className="mt-4">
          <PanelCard
            title="Stapelkonvertierung"
            subtitle="Konvertiert alle Dateien des Systems, die dasselbe Ziel unterstützen, auf einmal"
            icon={<Layers className="size-4" />}
          >
            {!system ? (
              <EmptyState
                title="Kein System gewählt"
                description="Wähle oben ein System, um seine ROMs auf einmal zu konvertieren."
              />
            ) : files.loading && !files.data ? (
              <EmptyState title="Dateien werden gelesen…" description="Einen Moment." />
            ) : !destinos.length ? (
              <EmptyState
                title="Nichts zu konvertieren"
                description="Keine Datei dieses Systems kann konvertiert werden."
              />
            ) : !destinosDisponibles.length ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    Ohne die nötigen Werkzeuge ist keine Stapelkonvertierung möglich.
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    Dieses System unterstützt{' '}
                    {destinos.map((item) => item.label).join(', ')}, aber auf der Konsole fehlt das Werkzeug dafür. Sieh unten unter „Konvertierungswerkzeuge“ nach, welches du installieren musst.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <select
                    value={destinoActual?.id ?? ''}
                    onChange={(event) => setDestino(event.target.value)}
                    aria-label="Zielformat"
                    className="h-10 w-full max-w-xs cursor-pointer rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {destinosDisponibles.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label} · {item.count} Dateien
                      </option>
                    ))}
                  </select>

                  <select
                    value={origen}
                    onChange={(event) => setOrigen(event.target.value)}
                    aria-label="Quellformat"
                    className="h-10 w-full max-w-xs cursor-pointer rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">Alle Formate</option>
                    {formatos.map((item) => (
                      <option key={item.kind} value={item.kind}>
                        {item.label} · {item.count} Dateien
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-xs text-muted-foreground">
                  Konvertiert werden {candidatos.length} Dateien nach {destinoActual?.label}
                  {origen ? ' (nur ein Quellformat)' : ''}. Das Original wird nicht gelöscht.
                </p>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={busy || !candidatos.length}
                  onClick={() => setConfirmarLote(true)}
                >
                  <Wand2 className="size-4" />
                  Alles konvertieren
                </Button>

                {lote && (
                  <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                    <p className="text-sm font-medium text-foreground">
                      {lote.resumen?.hechos ?? 0} konvertiert · {lote.resumen?.fallos ?? 0} fehlgeschlagen · {lote.resumen?.total ?? 0} versucht
                    </p>
                    {fallos.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {fallos.map((item, index) => (
                          <li
                            key={`${item.file}-${index}`}
                            className="text-[11px] leading-relaxed text-destructive"
                          >
                            {item.file}: {item.error ?? 'Unbekannter Fehler.'}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </PanelCard>
        </div>

        <div className="mt-4">
          <PanelCard
            title="Konvertierungswerkzeuge"
            subtitle="Die Programme, die die Konvertierungen erledigen, woher sie stammen und ob sie auf der Konsole sind"
            icon={<Wrench className="size-4" />}
          >
            {catalogo.error ? (
              <div className="flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <CircleAlert className="size-4 shrink-0" />
                <span className="min-w-0 flex-1">{catalogo.error}</span>
                <Button size="sm" variant="outline" onClick={catalogo.refresh}>
                  Erneut versuchen
                </Button>
              </div>
            ) : catalogo.loading && !catalogo.data ? (
              <EmptyState title="Katalog wird gelesen…" description="Einen Moment." />
            ) : !herramientas.length ? (
              <EmptyState
                title="Kein Katalog"
                description="Keine Konvertierungswerkzeuge hinterlegt."
              />
            ) : (
              <ul className="divide-y divide-border">
                {herramientas.map((herramienta) => (
                  <li key={herramienta.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {herramienta.nombre}
                      </span>
                      {herramienta.licencia && (
                        <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {herramienta.licencia}
                        </span>
                      )}
                      {herramienta.disponible !== false ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CircleCheck className="size-3" />
                          Verfügbar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                          <CircleAlert className="size-3" />
                          Fehlt
                        </span>
                      )}
                    </div>

                    {herramienta.para && (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {herramienta.para}
                      </p>
                    )}

                    {herramienta.instalar && (
                      <p
                        className={cn(
                          'mt-1 text-[11px] leading-relaxed',
                          herramienta.disponible !== false
                            ? 'text-muted-foreground'
                            : 'text-amber-700 dark:text-amber-400',
                        )}
                      >
                        <span className="font-medium">So installierst du es: </span>
                        {herramienta.instalar}
                      </p>
                    )}

                    {herramienta.url && (
                      <a
                        href={herramienta.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        {herramienta.url}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>
        </div>
      </PageContainer>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        description={
          selected
            ? `Erkanntes Format: ${sinReconocer(selected) ? 'nicht erkannt' : selected.label}`
            : undefined
        }
        footer={
          <Button variant="ghost" onClick={() => setSelected(null)}>
            Schließen
          </Button>
        }
      >
        {selected && system && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-md border border-border px-1.5 py-0.5 font-medium text-foreground">
                {sinReconocer(selected) ? 'Format nicht erkannt' : selected.label}
              </span>
              <span>{humanSize(selected.size)}</span>
              {selected.plataforma && <span>{selected.plataforma}</span>}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Verfügbare Konvertierungen
              </p>
              {accionesSeleccionadas.length === 0 ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {accionesOcultas.length > 0
                    ? 'Diese Datei kann nicht konvertiert werden: Das System unterstützt keines der Zielformate.'
                    : `Diese Datei kann nicht konvertiert werden: Das erkannte Format (${selected.kind}) erlaubt keine Konvertierung.`}
                </p>
              ) : (
                <div className="space-y-2">
                  {accionesSeleccionadas.map((accion) => {
                    const falta = !tieneHerramienta(accion)
                    return (
                      <div
                        key={accion.id}
                        className={cn(
                          'flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2',
                          falta
                            ? 'border-amber-500/40 bg-amber-500/10'
                            : 'border-border bg-muted/40',
                        )}
                      >
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={busy || falta}
                          onClick={() => convertir(accion)}
                        >
                          <Wand2 className="size-4" />
                          Konvertieren nach {accion.label}
                        </Button>
                        {falta ? (
                          <span className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                            {motivo(accion)}
                          </span>
                        ) : (
                          accion.nota && (
                            <span className="text-[11px] text-muted-foreground">{accion.nota}</span>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {parches.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  IPS-Patches im Ordner
                </p>
                <div className="flex flex-wrap gap-2">
                  {parches.map((patch) => (
                    <Button
                      key={patch.name}
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => parchear(patch)}
                    >
                      <FileCog className="size-4" />
                      {patch.name}
                    </Button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Beim Anwenden eines Patches wird eine Kopie des Originals (.bak) angelegt, damit er rückgängig gemacht werden kann.
                </p>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              Konvertieren löscht das Original nicht: Das Ergebnis wird mit anderem Namen daneben abgelegt.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        open={confirmarLote}
        onClose={() => setConfirmarLote(false)}
        title={`Alles konvertieren nach ${destinoActual?.label ?? ''}`}
        description={`Geschrieben werden ${candidatos.length} neue Dateien auf die SD. Das Original wird nicht gelöscht.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmarLote(false)}>
              Abbrechen
            </Button>
            <Button
              variant="primary"
              disabled={busy || !candidatos.length}
              onClick={convertirLote}
            >
              {busy ? 'Wird konvertiert…' : `Ja, konvertieren ${candidatos.length}`}
            </Button>
          </>
        }
      >
        <ul className="max-h-64 space-y-1 overflow-y-auto text-xs text-muted-foreground">
          {candidatos.slice(0, 50).map((file) => (
            <li key={file.name} className="truncate">
              {file.name}
            </li>
          ))}
        </ul>
        {candidatos.length > 50 && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            … und {candidatos.length - 50} weitere Dateien.
          </p>
        )}
      </Modal>
    </>
  )
}
