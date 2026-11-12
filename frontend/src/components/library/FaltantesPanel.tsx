import { PackageSearch, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Select } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { PanelCard } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pill, PillBar } from '@/components/ui/Pill'
import { Progress } from '@/components/ui/Progress'
import type { LibraryDatSistema, LibraryFaltante, LibraryFaltantes, LibraryJob } from '@/lib/types'

/**
 * Cómo se emparejó el juego con el DAT. No es lo mismo una coincidencia por
 * hash que una por título, así que se dice de dónde salió cada una.
 */
const METODOS: Record<string, string> = {
  nombre: 'über den Namen',
  hash: 'über den Hash',
  gamecode: 'über den Disc-Code',
  serial: 'über die Seriennummer',
  titulo: 'über den Titel (besser prüfen)',
}

/** Por qué falta esa versión. */
function motivo(faltante: LibraryFaltante): string {
  switch (faltante.motivo) {
    case 'disco':
      return `dir fehlt Disc ${faltante.detalle}`
    case 'region':
      return `andere Region (${faltante.detalle})`
    case 'revision':
      return 'andere Revision'
    case 'idioma':
      return `andere Sprache (${faltante.detalle})`
    default:
      return 'andere Version'
  }
}

type Filtro = 'todo' | 'discos' | 'mejores'

interface FaltantesPanelProps {
  sistemas: LibraryDatSistema[]
  sistema: string
  onSistema: (sistema: string) => void
  resultado: LibraryFaltantes | null
  trabajo: LibraryJob | null
  onComparar: () => void
  busy: boolean
}

/**
 * La sección «Lo que falta»: las otras versiones de los juegos que ya tienes.
 *
 * El DAT de un sistema es la lista de todos sus juegos, así que comparado con
 * la biblioteca dice qué te falta. Pero la lista completa no informa de nada
 * (el DAT de PlayStation 2 tiene 13.618 juegos y una biblioteca normal tiene
 * 300), así que aquí se enseña **lo que falta de los juegos que ya tienes**:
 * la otra región, el otro disco, la versión mejor.
 *
 * La comparación es por sistema y va en segundo plano: cargar los 17 índices
 * a la vez son 55 MB de JSON y en la consola eso es memoria que no está.
 */
export function FaltantesPanel({
  sistemas,
  sistema,
  onSistema,
  resultado,
  trabajo,
  onComparar,
  busy,
}: FaltantesPanelProps) {
  const [filtro, setFiltro] = useState<Filtro>('todo')

  const grupos = useMemo(() => {
    const lista = resultado?.detalle ?? []
    if (filtro === 'discos') return lista.filter((g) => g.discos_faltantes.length > 0)
    if (filtro === 'mejores') {
      return lista.filter((g) => g.faltan.some((f) => f.mejor))
    }
    return lista
  }, [resultado, filtro])

  /**
   * Cuántos juegos tienen alguna versión mejor. Lo cuenta el backend, pero
   * si el resultado viene recortado se usa el de la lista, para que el número
   * del filtro sea el número de cosas que se enseñan.
   */
  const gruposConMejores = useMemo(
    () => (resultado?.detalle ?? []).filter((g) => g.faltan.some((f) => f.mejor)).length,
    [resultado],
  )

  const trabajando = trabajo?.estado === 'trabajando'

  return (
    <PanelCard
      title="Was fehlt"
      subtitle="Die anderen Versionen der Spiele, die du schon hast"
      icon={<PackageSearch className="size-4" />}
      actions={
        <>
          <Select
            value={sistema}
            onChange={(event) => onSistema(event.target.value)}
            className="h-9 w-52 text-xs"
            aria-label="System mit DAT"
          >
            {sistemas.length === 0 && <option value="">kein DAT installiert</option>}
            {sistemas.map((s) => (
              <option key={s.sistema} value={s.sistema}>
                {s.sistema} · {s.juegos_dat.toLocaleString('de-DE')} Spiele
              </option>
            ))}
          </Select>
          <Button size="sm" variant="primary" disabled={busy || !sistema} onClick={onComparar}>
            <Search className="size-4" />
            Mit dem DAT vergleichen
          </Button>
        </>
      }
    >
      {sistemas.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="size-5" />}
          title="Kein DAT installiert"
          description="DATs sind Metadaten (die Liste der Spiele mit ihren Hashes, ohne ein einziges ROM) und werden im Werkzeug-Bereich heruntergeladen."
        />
      ) : trabajando && trabajo ? (
        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-4">
          <Progress
            value={trabajo.porcentaje}
            label={
              trabajo.total
                ? `${trabajo.mensaje || 'Comparando'} · ${trabajo.hechos} von ${trabajo.total}`
                : (trabajo.mensaje || 'Vergleiche')
            }
          />
          {trabajo.actual && (
            <p className="mt-2 truncate text-[11px] text-muted-foreground">
              Gerade: {trabajo.actual}
            </p>
          )}
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/80">
            Das ganze System wird mit seinem DAT verglichen: Das kann eine Weile dauern. Die Arbeit läuft auf dem Server weiter, du musst das Fenster also nicht offen lassen.
          </p>
        </div>
      ) : !resultado ? (
        <EmptyState
          icon={<PackageSearch className="size-5" />}
          title="Noch kein Vergleich"
          description="Wähle ein System und klicke auf „Mit dem DAT vergleichen“: Es wird gesucht, welche anderen Versionen es von deinen Spielen gibt. Es wird nichts verändert."
        />
      ) : resultado.detalle.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {resultado.sin_dat > 0 ? (
            <>
              Die {resultado.encontrados} Spiele dieses Systems sind in seinem DAT und es gibt keine weiteren Versionen davon. Es gibt {resultado.sin_dat} Spiele, die nicht im DAT stehen (Mods, Übersetzungen oder Homebrew).
            </>
          ) : (
            'Nichts zu vergleichen: Dieses System hat keine Spiele in der Bibliothek.'
          )}
        </p>
      ) : (
        <div className="space-y-4">
          {/* El resumen */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Resumen valor={resultado.grupos} texto="Spiele mit weiteren Versionen" />
            <Resumen valor={resultado.faltantes} texto="Versionen, die du nicht hast" />
            <Resumen valor={resultado.mejores} texto="Versionen, die besser sind" />
            <Resumen valor={resultado.discos} texto="Spiele, denen eine Disc fehlt" />
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Verglichen <span className="font-medium text-foreground">{resultado.sistema}</span> ·{' '}
            {resultado.encontrados.toLocaleString('de-DE')} Spiele mit dem DAT abgeglichen ·{' '}
            {resultado.sin_dat.toLocaleString('de-DE')} die nicht im DAT stehen
            {resultado.quizas
              ? ` · ${resultado.quizas.toLocaleString('de-DE')} mit unsicherer Übereinstimmung (vielleicht hast du sie schon)`
              : ''}
          </p>

          {/* Los dudosos: puede que ya los tengas y el nombre no cuadre */}
          {resultado.quizas_lista && resultado.quizas_lista.length > 0 && (
            <details className="rounded-2xl border border-border px-3 py-2">
              <summary className="cursor-pointer text-[11px] text-muted-foreground">
                {resultado.quizas?.toLocaleString('de-DE') ?? resultado.quizas_lista.length} Spiele mit unsicherer Übereinstimmung: Vielleicht hast du sie schon und der Name passt nicht
              </summary>
              <ul className="mt-2 space-y-1">
                {resultado.quizas_lista.map((quiza) => (
                  <li key={quiza.fichero} className="text-[11px] text-muted-foreground">
                    <span className="text-foreground">{quiza.fichero}</span>
                    {' · vielleicht ist es «'}
                    {quiza.candidato}
                    {'»'}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Los filtros */}
          <PillBar>
            <Pill active={filtro === 'todo'} onClick={() => setFiltro('todo')}>
              Alle ({resultado.grupos})
            </Pill>
            <Pill active={filtro === 'discos'} onClick={() => setFiltro('discos')}>
              Spiele mit fehlenden Discs ({resultado.discos})
            </Pill>
            <Pill active={filtro === 'mejores'} onClick={() => setFiltro('mejores')}>
              Spiele mit besserer Version ({resultado.grupos_mejores ?? gruposConMejores})
            </Pill>
          </PillBar>

          {/* Los juegos */}
          <ul className="space-y-2">
            {grupos.map((grupo) => (
              <li key={grupo.titulo} className="rounded-2xl border border-border p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">{grupo.titulo}</p>
                  {grupo.discos_faltantes.length > 0 && (
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-medium text-destructive">
                      dir fehlt Disc {grupo.discos_faltantes.join(', ')}
                    </span>
                  )}
                </div>

                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Du hast</p>
                    <ul className="mt-1 space-y-1">
                      {grupo.variantes.map((variante) => (
                        <li key={variante.fichero} className="text-xs">
                          <span className="text-foreground">{variante.nombre}</span>
                          <span className="text-muted-foreground">
                            {' '}
                            · {METODOS[variante.metodo] ?? variante.metodo} · {variante.fichero}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Fehlen</p>
                    <ul className="mt-1 space-y-1">
                      {grupo.faltan.map((faltante) => (
                        <li key={faltante.nombre} className="text-xs">
                          <span className="text-foreground">{faltante.nombre}</span>
                          {faltante.copias && faltante.copias > 1 && (
                            <span className="text-muted-foreground"> ×{faltante.copias}</span>
                          )}
                          <span className="text-muted-foreground"> · {motivo(faltante)}</span>
                          {faltante.mejor && (
                            <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              bessere Version
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {resultado.detalle_recortado && (
            <p className="text-[11px] text-muted-foreground">
              Angezeigt werden {resultado.detalle.length} von {resultado.grupos} Spiele: Es gibt noch mehr.
            </p>
          )}
          {!resultado.hasheado && (
            <p className="text-[11px] leading-relaxed text-muted-foreground/80">
              Große Dateien wurden nicht gehasht (eine 4-GB-ISO zu hashen dauert), daher wurden manche Spiele über den Namen oder den Titel abgeglichen. Das DAT wird nicht verändert.
            </p>
          )}
        </div>
      )}
    </PanelCard>
  )
}

/** Una cifra con su texto, para el resumen. */
function Resumen({ valor, texto }: { valor: number; texto: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 px-3 py-2">
      <p className="text-lg font-semibold tabular-nums">{valor.toLocaleString('de-DE')}</p>
      <p className="text-[11px] leading-tight text-muted-foreground">{texto}</p>
    </div>
  )
}
