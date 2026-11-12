import {
  CircleAlert,
  Copy,
  FileWarning,
  HardDrive,
  Images,
  ListChecks,
  RefreshCw,
  Trash2,
  Undo2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { FaltantesPanel } from '@/components/library/FaltantesPanel'
import { PageContainer, useShell } from '@/components/layout/AppShell'
import { SectionTabs, type SectionTab } from '@/components/layout/SectionTabs'
import { Topbar } from '@/components/layout/Topbar'
import { Button, IconButton } from '@/components/ui/Button'
import { PanelCard } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Progress } from '@/components/ui/Progress'
import { useApi } from '@/hooks/useApi'
import { useNotify } from '@/hooks/useNotify'
import { api } from '@/lib/api'
import type {
  LibraryAudit,
  LibraryDuplicado,
  LibraryFaltantes,
  LibraryJob,
} from '@/lib/types'
import { cn } from '@/lib/utils'

/** La clave con la que se identifica un fichero en la interfaz. */
const clave = (sistema: string, ruta: string) => `${sistema}/${ruta}`

/** Los megabytes, en texto corto. */
function mb(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

interface RomsPageProps {
  tab: SectionTab
  onTab: (tab: SectionTab) => void
}

/**
 * La pestaña de ROMs: la biblioteca vista como conjunto.
 *
 * Antes, la sección «ROMs y BIOS» solo tenía BIOS: no había ninguna forma
 * de ver lo que ocupa la biblioteca, buscar duplicados ni enterarse de las
 * fichas rotas. Aquí está todo eso, y siempre como **trabajo en segundo
 * plano**: en una biblioteca de 1,8 TB la radiografía tarda, así que se ve
 * el progreso en vez de una página en silencio.
 *
 * Nada se borra: lo que sobra se mueve a una cuarentena y se puede deshacer.
 */
export function RomsPage({ tab, onTab }: RomsPageProps) {
  const { openMenu } = useShell()
  const { showNotify } = useNotify()
  const resumen = useApi(() => api.librarySummary(), [])

  const [auditoria, setAuditoria] = useState<LibraryAudit | null>(null)
  const [trabajo, setTrabajo] = useState<LibraryJob | null>(null)
  const [busy, setBusy] = useState(false)
  /** Los ficheros que el usuario ha marcado para mover a la cuarentena. */
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  /** Para no tocar el estado si el usuario se ha ido de la pagina. */
  const montado = useRef(true)

  /* ── Lo que falta ─────────────────────────────────────────────────── */

  const sistemasDat = useApi(() => api.libraryMissingSystems(), [])
  const [sistemaFaltantes, setSistemaFaltantes] = useState('')
  const [faltantes, setFaltantes] = useState<LibraryFaltantes | null>(null)
  const [trabajoFaltantes, setTrabajoFaltantes] = useState<LibraryJob | null>(null)
  const [busyFaltantes, setBusyFaltantes] = useState(false)

  // El primer sistema con DAT es el que se selecciona por defecto.
  useEffect(() => {
    const lista = sistemasDat.data?.sistemas ?? []
    if (!sistemaFaltantes && lista.length) setSistemaFaltantes(lista[0].sistema)
  }, [sistemasDat.data, sistemaFaltantes])

  /**
   * Espera a que termine la comparacion con el DAT. Va en segundo plano:
   * comparar un sistema entero con su DAT tarda, asi que se ve el progreso.
   */
  const esperarJobFaltantes = async (id: string): Promise<LibraryFaltantes | null> => {
    for (;;) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      const estado = await api.libraryJob(id)
      if (!montado.current) return null
      setTrabajoFaltantes(estado)
      if (estado.estado === 'listo') return (estado.resultado as LibraryFaltantes) ?? null
      if (estado.estado === 'error') {
        throw new Error(estado.error || 'Der Vergleich ist fehlgeschlagen')
      }
    }
  }

  /**
   * Cambia el sistema del panel. El resultado anterior es de otro sistema, asi
   * que se limpia: si no, se ven datos que no son de lo que esta elegido.
   */
  const cambiarSistemaFaltantes = (sistema: string) => {
    setSistemaFaltantes(sistema)
    setFaltantes(null)
    setTrabajoFaltantes(null)
  }

  const compararFaltantes = async () => {
    if (!sistemaFaltantes) return
    setBusyFaltantes(true)
    setTrabajoFaltantes(null)
    try {
      const { job } = await api.libraryMissingStart(sistemaFaltantes)
      const resultado = await esperarJobFaltantes(job)
      if (!resultado) return
      setFaltantes(resultado)
      showNotify({
        variant: 'success',
        title: 'Mit dem DAT verglichen',
        message: `${resultado.faltantes} Versionen, die du nicht hast, in ${resultado.sistema}.`,
      })
    } catch (error) {
      showNotify({
        variant: 'error',
        title: 'Vergleich mit dem DAT fehlgeschlagen',
        message: error instanceof Error ? error.message : 'Unerwarteter Fehler.',
      })
    } finally {
      if (montado.current) {
        setBusyFaltantes(false)
        setTrabajoFaltantes(null)
      }
    }
  }
  useEffect(() => () => { montado.current = false }, [])

  /* ── La auditoría ─────────────────────────────────────────────────── */

  /**
   * Espera a que termine el trabajo, preguntando cada poco por su estado.
   * El backend lo calcula en un hilo aparte: asi se ve el progreso.
   */
  const esperarJob = async (id: string): Promise<LibraryAudit | null> => {
    for (;;) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      const estado = await api.libraryJob(id)
      if (!montado.current) return null
      setTrabajo(estado)
      if (estado.estado === 'listo') return (estado.resultado as LibraryAudit) ?? null
      if (estado.estado === 'error') {
        throw new Error(estado.error || 'Das Audit ist fehlgeschlagen')
      }
    }
  }

  const auditar = async () => {
    setBusy(true)
    setTrabajo(null)
    setSeleccion(new Set())
    try {
      const { job } = await api.libraryAuditStart()
      const resultado = await esperarJob(job)
      if (!resultado) return
      setAuditoria(resultado)
      showNotify({
        variant: 'success',
        title: 'Bibliothek geprüft',
        message: `${resultado.resumen.juegos} Spiele geprüft.`,
      })
    } catch (error) {
      showNotify({
        variant: 'error',
        title: 'Bibliothek konnte nicht geprüft werden',
        message: error instanceof Error ? error.message : 'Unerwarteter Fehler.',
      })
    } finally {
      if (montado.current) {
        setBusy(false)
        setTrabajo(null)
      }
    }
  }

  /* ── Las acciones ─────────────────────────────────────────────────── */

  const marcar = (id: string) => {
    setSeleccion((antes) => {
      const nuevo = new Set(antes)
      if (nuevo.has(id)) nuevo.delete(id)
      else nuevo.add(id)
      return nuevo
    })
  }

  const moverSeleccion = async () => {
    const ficheros = [...seleccion]
    if (!ficheros.length) return
    setBusy(true)
    try {
      const result = await api.libraryQuarantine(ficheros)
      showNotify({
        variant: result.ok ? 'success' : 'error',
        title: result.ok
          ? `${result.movidos.length} Dateien in die Quarantäne`
          : 'Einige Dateien konnten nicht verschoben werden',
        message: result.ok
          ? 'Mit „Rückgängig“ wiederherstellbar.'
          : (result.errores?.[0]?.error ?? 'Unbekannter Fehler.'),
      })
      setSeleccion(new Set())
      await auditar()
    } finally {
      setBusy(false)
    }
  }

  const limpiarGamelist = async (sistema: string) => {
    setBusy(true)
    try {
      const result = await api.libraryGamelistClean(sistema)
      showNotify({
        variant: result.ok ? 'success' : 'error',
        title: result.ok
          ? `${result.quitadas} Einträge aus der gamelist entfernt`
          : 'gamelist konnte nicht bereinigt werden',
        message: result.ok
          ? `Mit „Rückgängig“ umkehrbar.`
          : (result.error ?? 'Unbekannter Fehler.'),
      })
      if (result.ok) await auditar()
    } finally {
      setBusy(false)
    }
  }

  const deshacer = async () => {
    setBusy(true)
    try {
      const result = await api.libraryUndo()
      showNotify({
        variant: result.ok ? 'success' : 'error',
        title: result.ok ? 'Durchgang rückgängig gemacht' : 'Rückgängig machen fehlgeschlagen',
        message: result.ok
          ? `${result.restaurados.length} Dateien sind wieder an ihrem Platz.`
          : (result.error ?? 'Unbekannter Fehler.'),
      })
      await auditar()
    } finally {
      setBusy(false)
    }
  }

  /* ── Los datos ────────────────────────────────────────────────────── */

  const datos = resumen.data
  const trabajando = trabajo?.estado === 'trabajando'
  const duplicados = auditoria?.duplicados ?? []
  const sinConfirmar = duplicados.filter((d) => !d.confirmado).length
  const ahorroTotal = duplicados.reduce((suma, d) => suma + d.ahorro, 0)
  const fichasPorSistema = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const ficha of auditoria?.fichas_sin_fichero.lista ?? []) {
      mapa.set(ficha.sistema, (mapa.get(ficha.sistema) ?? 0) + 1)
    }
    return [...mapa.entries()].sort((a, b) => b[1] - a[1])
  }, [auditoria])

  const haySeleccion = seleccion.size > 0

  return (
    <>
      <Topbar
        title="ROMs und BIOS"
        subtitle={
          datos
            ? `${datos.juegos.toLocaleString('de-DE')} Spiele · ${datos.gb.toLocaleString('de-DE')} GB in ${datos.sistemas.length} Systeme`
            : 'Die Bibliothek der Konsole'
        }
        onMenu={openMenu}
        actions={
          <IconButton label="Bibliothek erneut prüfen" onClick={auditar} disabled={busy}>
            <RefreshCw className={cn('size-4', trabajando && 'animate-spin')} />
          </IconButton>
        }
      />

      <PageContainer>
        <SectionTabs value={tab} onChange={onTab} />

        {resumen.error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <CircleAlert className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">{resumen.error}</span>
            <Button size="sm" variant="outline" onClick={resumen.refresh}>
              Erneut versuchen
            </Button>
          </div>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Systeme" value={datos?.sistemas.length ?? 0} icon={HardDrive} />
          <MetricCard
            label="Spiele"
            value={(datos?.juegos ?? 0).toLocaleString('de-DE')}
            icon={ListChecks}
          />
          <MetricCard
            label="Speicherplatz"
            value={`${(datos?.gb ?? 0).toLocaleString('de-DE')} GB`}
            icon={Copy}
            hint="was die Bibliothek belegt"
          />
          <MetricCard
            label="Duplikate"
            value={duplicados.length}
            icon={Copy}
            accent={duplicados.length ? 'bad' : 'good'}
            hint={duplicados.length ? `freigebbar: ${mb(ahorroTotal)}` : 'nichts doppelt'}
          />
        </div>

        {/* La auditoría */}
        <div className="mt-4">
          <PanelCard
            title="Bibliotheks-Audit"
            subtitle={
              auditoria
                ? `${auditoria.resumen.juegos.toLocaleString('de-DE')} Spiele in ${auditoria.resumen.sistemas} Systeme`
                : 'Sucht Duplikate, kaputte Einträge, leere Dateien und Medien ohne Spiel'
            }
            icon={<ListChecks className="size-4" />}
            actions={
              <>
                {haySeleccion && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={busy}
                    onClick={moverSeleccion}
                  >
                    <Trash2 className="size-4" />
                    Verschieben: {seleccion.size} → Quarantäne
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={auditoria ? 'outline' : 'primary'}
                  disabled={busy}
                  onClick={auditar}
                >
                  <RefreshCw className={cn('size-4', trabajando && 'animate-spin')} />
                  Prüfen
                </Button>
              </>
            }
          >
            {trabajando && trabajo ? (
              <div className="rounded-2xl border border-border bg-muted/40 px-4 py-4">
                <Progress
                  value={trabajo.porcentaje}
                  label={
                    trabajo.total
                      ? `${trabajo.mensaje || 'Trabajando'} · ${trabajo.hechos} von ${trabajo.total}`
                      : (trabajo.mensaje || 'Arbeite')
                  }
                />
                {trabajo.actual && (
                  <p className="mt-2 truncate text-[11px] text-muted-foreground">
                    Gerade: {trabajo.actual}
                  </p>
                )}
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/80">
                  Bei großen Bibliotheken dauert das: Die Arbeit läuft auf dem Server weiter, du musst das Fenster also nicht offen lassen. Du kannst hier warten, bis sie fertig ist.
                </p>
              </div>
            ) : !auditoria ? (
              <EmptyState
                icon={<ListChecks className="size-5" />}
                title="Noch kein Audit"
                description="Die Durchleuchtung geht die ganze Bibliothek durch: Bei 1,8 TB dauert sie weniger als eine Minute, und es wird nichts verändert."
                action={
                  <Button variant="primary" onClick={auditar} disabled={busy}>
                    <RefreshCw className="size-4" />
                    Bibliothek prüfen
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {/* Duplicados */}
                <DuplicadosPanel
                  duplicados={duplicados}
                  sinConfirmar={sinConfirmar}
                  seleccion={seleccion}
                  marcar={marcar}
                />

                {/* Fichas rotas */}
                <PanelCard
                  title="Einträge ohne Datei"
                  subtitle={
                    auditoria.fichas_sin_fichero.total
                      ? `${auditoria.fichas_sin_fichero.total} Einträge der gamelist.xml verweisen auf ein Spiel, das es nicht gibt`
                      : 'Alle Einträge der gamelist.xml haben ihre Datei'
                  }
                  icon={<FileWarning className="size-4" />}
                >
                  {fichasPorSistema.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Die gamelist.xml ist aktuell: keine kaputten Einträge.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {fichasPorSistema.map(([sistema, cantidad]) => (
                        <li key={sistema} className="flex items-center gap-3 py-2.5">
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {sistema}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {cantidad} Einträge
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => limpiarGamelist(sistema)}
                          >
                            Bereinigen
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </PanelCard>

                {/* Ficheros vacíos, sobras y media huérfana */}
                <SencillosPanel
                  titulo="Leere Dateien"
                  texto="Spiele mit 0 Bytes: Sie starten nicht, belegen aber ihren Platz in der Bibliothek."
                  vacios={auditoria.ficheros_vacios}
                  seleccion={seleccion}
                  marcar={marcar}
                />
                <SencillosPanel
                  titulo="Dateien, die keine Spiele sind"
                  texto="Notizen, Listen und Ähnliches: Kein Emulator nutzt sie."
                  vacios={auditoria.sobras}
                  seleccion={seleccion}
                  marcar={marcar}
                />
                <PanelCard
                  title="Medien ohne Spiel"
                  subtitle={
                    auditoria.media_huerfana.total
                      ? `${auditoria.media_huerfana.total} Bilder oder Videos, deren Spiel nicht mehr existiert`
                      : 'Alle Bilder haben ihr Spiel'
                  }
                  icon={<Images className="size-4" />}
                >
                  {auditoria.media_huerfana.lista.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Alle Medien gehören zu einem Spiel der Bibliothek.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {auditoria.media_huerfana.lista.slice(0, 200).map((item) => {
                        const id = clave(item.sistema, item.fichero)
                        return (
                          <li key={id} className="flex items-center gap-3 py-2">
                            <input
                              type="checkbox"
                              checked={seleccion.has(id)}
                              onChange={() => marcar(id)}
                              className="size-4 shrink-0 cursor-pointer accent-primary"
                              aria-label={`${item.fichero} markieren`}
                            />
                            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                              {item.sistema}/{item.fichero}
                            </span>
                            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                              {mb(item.bytes)}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </PanelCard>

                {/* Repetidos entre sistemas */}
                {auditoria.repetidos_entre_sistemas.length > 0 && (
                  <PanelCard
                    title="Dasselbe Spiel in mehreren Systemen"
                    subtitle="Arcade-Systeme speichern dieselben ROMs in verschiedenen Ordnern (naomi, atomiswave...)"
                    icon={<Copy className="size-4" />}
                  >
                    <ul className="divide-y divide-border">
                      {auditoria.repetidos_entre_sistemas.slice(0, 100).map((item) => (
                        <li key={item.nombre} className="py-2.5">
                          <p className="truncate text-sm font-medium">{item.nombre}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {item.sistemas.join(' · ')} · {mb(item.bytes)} insgesamt
                          </p>
                        </li>
                      ))}
                    </ul>
                  </PanelCard>
                )}

                {/* Deshacer */}
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" disabled={busy} onClick={deshacer}>
                    <Undo2 className="size-4" />
                    Letzten Durchgang rückgängig machen
                  </Button>
                </div>
              </div>
            )}
          </PanelCard>
        </div>

        {/* Lo que falta */}
        <div className="mt-4">
          <FaltantesPanel
            sistemas={sistemasDat.data?.sistemas ?? []}
            sistema={sistemaFaltantes}
            onSistema={cambiarSistemaFaltantes}
            resultado={faltantes}
            trabajo={trabajoFaltantes}
            onComparar={compararFaltantes}
            busy={busyFaltantes}
          />
        </div>

        {/* El espacio por sistema */}
        {auditoria && auditoria.espacio.length > 0 && (
          <div className="mt-4">
            <PanelCard
              title="Speicherplatz pro System"
              subtitle="Wo der Speicher der Karte hingeht"
              icon={<HardDrive className="size-4" />}
            >
              <ul className="space-y-2">
                {auditoria.espacio.slice(0, 20).map((item) => {
                  const maximo = auditoria.espacio[0]?.bytes || 1
                  const porcentaje = Math.round((item.bytes / maximo) * 100)
                  return (
                    <li key={item.sistema} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 truncate text-xs font-medium">
                        {item.sistema}
                      </span>
                      <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </span>
                      <span className="w-20 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                        {item.gb.toLocaleString('de-DE')} GB
                      </span>
                    </li>
                  )
                })}
              </ul>
            </PanelCard>
          </div>
        )}
      </PageContainer>
    </>
  )
}

/* ── Los grupos de duplicados ─────────────────────────────────────────── */

function DuplicadosPanel({
  duplicados,
  sinConfirmar,
  seleccion,
  marcar,
}: {
  duplicados: LibraryDuplicado[]
  sinConfirmar: number
  seleccion: Set<string>
  marcar: (id: string) => void
}) {
  return (
    <PanelCard
      title="Doppelte Spiele"
      subtitle={
        duplicados.length
          ? `${duplicados.length} Gruppen · ${sinConfirmar ? `${sinConfirmar} unbestätigt` : 'alle mit vollständigem Hash bestätigt'}`
          : 'Kein Spiel ist doppelt'
      }
      icon={<Copy className="size-4" />}
    >
      {duplicados.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Keine doppelten Spiele: Der Schnell-Fingerabdruck hat keine gefunden.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {duplicados.map((grupo, indice) => (
            <li key={`${grupo.md5 ?? 'cand'}-${indice}`} className="py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">
                  {grupo.nombres[0]}
                  {grupo.nombres.length > 1 && (
                    <span className="text-muted-foreground">
                      {' '}
                      und {grupo.nombres.length - 1} weitere
                    </span>
                  )}
                </span>
                <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {grupo.copias} Kopien · {mb(grupo.bytes)} je Kopie
                </span>
                {grupo.confirmado ? (
                  <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                    Hash bestätigt
                  </span>
                ) : (
                  <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                    Kandidat (unbestätigt)
                  </span>
                )}
                <span className="ml-auto text-[11px] font-medium tabular-nums text-muted-foreground">
                  freigebbar: {mb(grupo.ahorro)}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {grupo.ficheros.map((fichero) => {
                  const id = clave(fichero.sistema, fichero.ruta)
                  return (
                    <li key={id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={seleccion.has(id)}
                        onChange={() => marcar(id)}
                        className="size-4 shrink-0 cursor-pointer accent-primary"
                        aria-label={`${fichero.nombre} markieren`}
                      />
                      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                        {fichero.sistema}/{fichero.nombre}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  )
}

/* ── Las listas sencillas ──────────────────────────────────────────────── */

function SencillosPanel({
  titulo,
  texto,
  vacios,
  seleccion,
  marcar,
}: {
  titulo: string
  texto: string
  vacios: { total: number; lista: { sistema: string; ruta: string; nombre: string; bytes: number }[] }
  seleccion: Set<string>
  marcar: (id: string) => void
}) {
  return (
    <PanelCard
      title={titulo}
      subtitle={vacios.total ? `${vacios.total} · ${texto}` : texto}
      icon={<FileWarning className="size-4" />}
    >
      {vacios.lista.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nichts hier: alles in Ordnung.</p>
      ) : (
        <ul className="divide-y divide-border">
          {vacios.lista.slice(0, 200).map((item) => {
            const id = clave(item.sistema, item.ruta)
            return (
              <li key={id} className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  checked={seleccion.has(id)}
                  onChange={() => marcar(id)}
                  className="size-4 shrink-0 cursor-pointer accent-primary"
                  aria-label={`${item.nombre} markieren`}
                />
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {item.sistema}/{item.nombre}
                </span>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {mb(item.bytes)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </PanelCard>
  )
}
