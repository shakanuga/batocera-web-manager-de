import {
  CircleAlert,
  Database,
  FileSignature,
  History,
  ListChecks,
  RefreshCw,
  Undo2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PageContainer, useShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { Button, IconButton } from '@/components/ui/Button'
import { PanelCard } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Progress } from '@/components/ui/Progress'
import { useApi } from '@/hooks/useApi'
import { useNotify } from '@/hooks/useNotify'
import { api } from '@/lib/api'
import type { ToolsJob, ToolsRenameItem, ToolsRenamePlan, ToolsRenameResult } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Como se explica cada tipo de coincidencia. */
const METODOS: Record<string, string> = {
  hash: 'exakter Hash aus dem DAT',
  nombre: 'identischer Name wie im DAT',
  serial: 'Seriennummer der Disc',
  titulo: 'ähnlicher Titel',
  gamecode: 'Spielcode der Disc',
}

function etiquetaAccion(item: ToolsRenameItem): { texto: string; clase: string } {
  switch (item.action) {
    case 'renombrar':
      return { texto: 'Umbenennen', clase: 'text-emerald-600 dark:text-emerald-400' }
    case 'revisar':
      return { texto: 'Prüfen', clase: 'text-amber-600 dark:text-amber-400' }
    case 'igual':
      return { texto: 'Schon korrekt', clase: 'text-muted-foreground' }
    default:
      return { texto: 'Kein DAT', clase: 'text-muted-foreground' }
  }
}

export function ToolsRenamePage() {
  const { openMenu } = useShell()
  const { showNotify } = useNotify()

  const systems = useApi(() => api.romSystems(), [])
  const dats = useApi(() => api.toolsDats(), [])
  const [system, setSystem] = useState('')
  const [plan, setPlan] = useState<ToolsRenamePlan | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  /** El trabajo en curso (el plan o el renombrado), con su progreso. */
  const [trabajo, setTrabajo] = useState<ToolsJob | null>(null)
  /** Para no tocar el estado si el usuario se ha ido de la pagina. */
  const montado = useRef(true)
  useEffect(() => () => { montado.current = false }, [])

  const conRom = useMemo(
    () => (systems.data ?? []).filter((item) => (item.rom_count ?? 0) > 0),
    [systems.data],
  )

  const datDelSistema = useMemo(
    () => (dats.data?.sistemas ?? []).find((item) => item.system === system) ?? null,
    [dats.data, system],
  )

  /**
   * Si el backend no ha resuelto un DAT para este sistema no hay plan que
   * calcular: se avisa y se bloquea el botón.
   */
  const sinDat =
    !!system && !!dats.data && (!datDelSistema || datDelSistema.resuelto === 'ninguno')

  /**
   * Espera a que termine un trabajo, preguntando cada poco por su estado.
   *
   * El backend lo calculates en un hilo aparte: asi se ve el progreso y la
   * pagina no parece congelada mientras identify miles de ficheros.
   */
  const esperarJob = async (id: string): Promise<unknown> => {
    for (;;) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      const estado = await api.toolsRenameJob(id)
      if (!montado.current) return null
      setTrabajo(estado)
      if (estado.estado === 'listo') return estado.resultado ?? null
      if (estado.estado === 'error') {
        throw new Error(estado.error || 'Der Auftrag ist fehlgeschlagen')
      }
    }
  }

  const calcular = async () => {
    if (!system) return
    setBusy(true)
    setTrabajo(null)
    try {
      const { job } = await api.toolsRenamePlanStart(system)
      const resultado = await esperarJob(job)
      if (!resultado) return
      setPlan(resultado as ToolsRenamePlan)
    } catch (error) {
      showNotify({
        variant: 'error',
        title: 'Plan konnte nicht berechnet werden',
        message: error instanceof Error ? error.message : 'Unerwarteter Fehler.',
      })
    } finally {
      if (montado.current) {
        setBusy(false)
        setTrabajo(null)
      }
    }
  }

  const instalarDat = async () => {
    if (!system) return
    setBusy(true)
    try {
      const result = await api.toolsInstallDats([system])
      const item = result.results[0]
      showNotify({
        variant: item?.ok ? 'success' : 'error',
        title: item?.ok ? 'DAT heruntergeladen' : 'DAT konnte nicht heruntergeladen werden',
        message: item?.ok
          ? `${item.system}: bereit zum Umbenennen.`
          : item?.error ?? 'Unbekannter Fehler.',
      })
      dats.refresh()
    } finally {
      setBusy(false)
    }
  }

  const aplicar = async (includeReview: boolean) => {
    if (!system) return
    setBusy(true)
    setTrabajo(null)
    try {
      const { job } = await api.toolsRenameApplyStart({
        system,
        include_review: includeReview,
      })
      const salida = await esperarJob(job)
      if (!salida) return
      const result = salida as ToolsRenameResult
      const fichas = result.gamelist?.cambios ?? 0
      const imagenes = result.gamelist?.media ?? 0
      showNotify({
        variant: result.ok ? 'success' : 'error',
        title: result.ok ? `${result.renamed ?? 0} Dateien umbenannt` : 'Umbenennen mit Problemen',
        message: result.ok
          ? `${fichas} Einträge und ${imagenes} Mediendateien in der gamelist.xml aktualisiert. Über den Rückgängig-Button umkehrbar.`
          : (result.errores?.[0]?.error ?? 'Unbekannter Fehler.'),
      })
      setConfirmar(false)
      setPlan(null)
    } catch (error) {
      showNotify({
        variant: 'error',
        title: 'Umbenennen fehlgeschlagen',
        message: error instanceof Error ? error.message : 'Unerwarteter Fehler.',
      })
    } finally {
      if (montado.current) {
        setBusy(false)
        setTrabajo(null)
      }
    }
  }

  const deshacer = async () => {
    setBusy(true)
    try {
      const result = await api.toolsRenameUndo()
      showNotify({
        variant: result.ok ? 'success' : 'error',
        title: result.ok ? 'Umbenennen rückgängig gemacht' : 'Rückgängig machen fehlgeschlagen',
        message: result.ok ? 'Die alten Namen sind zurück.' : result.error ?? '',
      })
      setPlan(null)
    } finally {
      setBusy(false)
    }
  }

  const cambios = plan?.items.filter((item) => item.action === 'renombrar') ?? []
  const revisables = plan?.items.filter((item) => item.action === 'revisar') ?? []
  /** Hay un trabajo en marcha: se enseña la barra en vez del plan. */
  const trabajando = trabajo?.estado === 'trabajando'

  return (
    <>
      <Topbar
        title="Umbenennen"
        subtitle="ROMs nach den Namen aus dem DAT benennen"
        onMenu={openMenu}
        actions={
          <IconButton label="Plan neu berechnen" onClick={calcular} disabled={!system || sinDat}>
            <RefreshCw className={cn('size-4', busy && 'animate-spin')} />
          </IconButton>
        }
      />

      <PageContainer>
        {(systems.error || dats.error) && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <CircleAlert className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">{systems.error ?? dats.error}</span>
            <Button size="sm" variant="outline" onClick={() => { systems.refresh(); dats.refresh() }}>
              Erneut versuchen
            </Button>
          </div>
        )}

        <PanelCard
          title="Wähle ein System"
          subtitle="Das DAT ist die Liste der Spiele mit ihren Namen und Hashes"
          icon={<Database className="size-4" />}
        >
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={system}
              onChange={(event) => {
                setSystem(event.target.value)
                setPlan(null)
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

            {system && dats.data ? (
              sinDat ? (
                <span className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                  Für dieses System ist kein DAT verfügbar
                </span>
              ) : datDelSistema?.instalado ? (
                <span
                  title={datDelSistema?.dat ?? undefined}
                  className="rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground"
                >
                  {datDelSistema?.resuelto === 'nombre'
                    ? `DAT über Namen · ${datDelSistema?.dat} (confianza ${Math.round((datDelSistema?.confianza ?? 0) * 100)} %)`
                    : `DAT bereit · ${(datDelSistema?.juegos ?? 0).toLocaleString('de-DE')} Spiele`}
                </span>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!system || busy}
                  onClick={instalarDat}
                >
                  <Database className="size-4" />
                  DAT herunterladen
                </Button>
              )
            ) : null}
          </div>
        </PanelCard>

        <div className="mt-4">
          <PanelCard
            title="Umbenennungsplan"
            subtitle={
              plan
                ? `${plan.stats.total} Dateien · ${plan.stats.renombrar} zum Umbenennen · ${plan.stats.revisar} zum Prüfen`
                : sinDat
                  ? 'Für dieses System ist kein DAT verfügbar: Der Plan kann nicht berechnet werden'
                  : 'Wähle zuerst das System und berechne den Plan: Nichts wird verändert, bis du ihn anwendest'
            }
            icon={<FileSignature className="size-4" />}
            actions={
              <>
                {plan && (
                  <Button size="sm" variant="ghost" onClick={deshacer} disabled={busy}>
                    <Undo2 className="size-4" />
                    Rückgängig
                  </Button>
                )}
                {cambios.length > 0 && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setConfirmar(true)}
                    disabled={busy}
                  >
                    <ListChecks className="size-4" />
                    Anwenden {cambios.length}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={cambios.length > 0 ? 'outline' : 'primary'}
                  onClick={calcular}
                  disabled={!system || busy || sinDat}
                >
                  <History className="size-4" />
                  Plan berechnen
                </Button>
              </>
            }
          >
            {sinDat ? (
              <EmptyState
                icon={<FileSignature className="size-5" />}
                title="Für dieses System ist kein DAT verfügbar"
                description="Der Manager hat für dieses System kein DAT gefunden, daher gibt es keinen Umbenennungsplan zu berechnen."
              />
            ) : trabajando && trabajo ? (
              <div className="rounded-2xl border border-border bg-muted/40 px-4 py-4">
                <Progress
                  value={trabajo.porcentaje}
                  label={
                    trabajo.total
                      ? `${trabajo.mensaje || 'Trabajando'} · ${trabajo.hechos} von ${trabajo.total} Dateien`
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
            ) : !plan ? (
              <EmptyState
                icon={<FileSignature className="size-5" />}
                title="Noch kein Plan"
                description="Der Plan wird im Speicher berechnet: Es sind die Namen, die jedes ROM laut seinem DAT hätte."
              />
            ) : plan.items.length === 0 ? (
              <EmptyState
                title="Keine Dateien zum Umbenennen"
                description={`Der Ordner von ${plan.system} ist leer.`}
              />
            ) : (
              <ul className="divide-y divide-border">
                {plan.items.map((item) => {
                  const etiqueta = etiquetaAccion(item)
                  return (
                    <li key={item.path} className="py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('text-[11px] font-semibold uppercase tracking-wide', etiqueta.clase)}>
                          {etiqueta.texto}
                        </span>
                        {item.method && (
                          <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {METODOS[item.method] ?? item.method}
                            {item.confidence > 0 && ` · ${Math.round(item.confidence * 100)}%`}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{item.current}</p>
                      {item.action === 'renombrar' && (
                        <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                          {item.proposed}
                        </p>
                      )}
                      {item.reason && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground/80">{item.reason}</p>
                      )}
                      {item.hashes?.archivo?.game_code && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                          Code {item.hashes.archivo.game_code}
                          {item.hashes.archivo.region ? ` (${item.hashes.archivo.region})` : ''}
                          {item.hashes.archivo.md5
                            ? ` · MD5 des Spiels ${item.hashes.archivo.md5.slice(0, 12)}…`
                            : ''}
                          {item.hashes.dat?.crc ? ` · DAT crc ${item.hashes.dat.crc}` : ''}
                          {item.hashes.dat?.md5 ? ` · md5 ${item.hashes.dat.md5.slice(0, 12)}…` : ''}
                        </p>
                      )}
                      {item.companions.length > 0 && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                          Ebenfalls umbenannt werden: {item.companions.join(', ')}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}

            {plan && plan.stats.sin_dat > 0 && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                <CircleAlert className="size-4 shrink-0" />
                <span>
                  {plan.stats.sin_dat} Dateien bleiben unverändert: Sie stehen nicht im DAT.
                </span>
              </p>
            )}
          </PanelCard>
        </div>
      </PageContainer>

      <Modal
        open={confirmar}
        onClose={() => setConfirmar(false)}
        title="Umbenennen anwenden"
        description="Umbenannt werden die Dateien, ihre Begleitdateien (CUE, M3U…) und die Medien (die Bilder), und die gamelist.xml wird aktualisiert, damit Einträge und Cover weiter passen. Es wird nichts gelöscht."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmar(false)}>
              Abbrechen
            </Button>
            {revisables.length > 0 && (
              <Button variant="outline" disabled={busy} onClick={() => aplicar(true)}>
                Umbenennen {cambios.length + revisables.length}
              </Button>
            )}
            <Button variant="primary" disabled={busy || cambios.length === 0} onClick={() => aplicar(false)}>
              Umbenennen {cambios.length}
            </Button>
          </>
        }
      >
        <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
          {cambios.map((item) => (
            <li key={item.path} className="rounded-xl border border-border bg-muted/40 px-3 py-2">
              <p className="truncate text-muted-foreground">{item.current}</p>
              <p className="truncate font-medium text-foreground">{item.proposed}</p>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  )
}
