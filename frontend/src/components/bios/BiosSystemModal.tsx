import {
  CircleAlert,
  Copy,
  ExternalLink,
  SkipForward,
  Upload,
  Wrench,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, IconButton } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useNotify } from '@/hooks/useNotify'
import { triggerHaptic } from '@/hooks/useWebHaptics'
import { api } from '@/lib/api'
import { BIOS_ESTADOS, esProblema, esReparable } from '@/lib/biosStates'
import type { BiosFile } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BiosSystemModalProps {
  open: boolean
  onClose: () => void
  /** Slug del sistema. */
  slug: string
  /** Nombre legible del catálogo de Batocera. */
  name: string
  /** Ficheros de BIOS que exige el catálogo para este sistema. */
  files: BiosFile[]
  /** Enlace para buscar las BIOS de este sistema en Google. */
  busqueda?: string | null
  /** Se llama cuando algo ha cambiado y hay que refrescar la lista. */
  onRepaired: () => void
}

/** Tamaño legible (el backend lo manda en bytes). */
function humanSize(bytes: number | null): string {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

/** Enlace de respaldo si el backend no lo manda. */
function busquedaGoogle(file: string): string {
  const nombre = file.split('/').pop() ?? file
  return `https://www.google.com/search?q=${encodeURIComponent(`"${nombre}"`)}`
}

/**
 * Detalle de las BIOS de un sistema: cada fichero con su estado y las
 * acciones para arreglarlo.
 *
 * El flujo es el de Batocera en la realidad: si el fichero está en su sitio,
 * no hay nada que hacer; si no está, se busca por fuera (Google) o lo sube el
 * usuario. «Reparar» mueve contenido que ya está en la propia consola, que es
 * lo único que se puede hacer sin red.
 */
export function BiosSystemModal({
  open,
  onClose,
  slug,
  name,
  files,
  busqueda,
  onRepaired,
}: BiosSystemModalProps) {
  const { showNotify } = useNotify()
  const [busy, setBusy] = useState<string | null>(null)
  const [batch, setBatch] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadTarget, setUploadTarget] = useState<string | null>(null)

  const reparables = files.filter((file) => esReparable(file.estado))
  const correctas = files.filter((file) => file.estado === 'ok' || file.estado === 'sin_verificar')
  const problemas = files.filter(
    (file) => !esReparable(file.estado) && file.estado !== 'ok' && file.estado !== 'sin_verificar' && file.estado !== 'omitida',
  )

  /** Sube un fichero a mano (la última vía, siempre disponible). */
  const pickFile = (file: string) => {
    setUploadTarget(file)
    inputRef.current?.click()
  }

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const blob = event.target.files?.[0]
    const target = uploadTarget
    event.target.value = ''
    if (!blob || !target) return
    setBusy(target)
    try {
      await api.biosUpload({ system: slug, file: target, blob })
      showNotify({ variant: 'success', title: `${target} hochgeladen` })
      onRepaired()
    } catch (error) {
      showNotify({
        variant: 'error',
        title: `Hochladen fehlgeschlagen ${target}`,
        message: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(null)
    }
  }

  /**
   * Repara un fichero con lo que ya hay en la consola (otro ZIP u otra
   * carpeta). Si no hay nada, se dice con claridad: hay que buscarlo por
   * fuera o subirlo.
   */
  const repair = async (file: BiosFile) => {
    setBusy(file.file)
    triggerHaptic('light')
    try {
      await api.biosRepair({ system: slug, file: file.file })
      showNotify({
        variant: 'success',
        title: `${file.file} abgelegt`,
        message: 'Dort abgelegt, wo Batocera sie erwartet.',
      })
      onRepaired()
    } catch (error) {
      showNotify({
        variant: 'error',
        title: 'Auf der Konsole gibt es nichts zu reparieren',
        message:
          error instanceof Error
            ? error.message
            : 'Der Inhalt ist nicht auf der Karte: Suche ihn bei Google oder lade ihn hoch.',
      })
    } finally {
      setBusy(null)
    }
  }

  /** Repara todo lo reparable SIN salir de la consola. */
  const repairAll = async () => {
    if (!reparables.length) return
    setBatch(true)
    triggerHaptic('medium')
    let ok = 0
    let fail = 0
    for (const file of reparables) {
      try {
        await api.biosRepair({ system: slug, file: file.file })
        ok += 1
      } catch {
        fail += 1
      }
    }
    setBatch(false)
    showNotify({
      variant: fail ? 'error' : 'success',
      title: fail ? `${ok} repariert und ${fail} mit Problemen` : `${ok} BIOS repariert`,
      message: fail
        ? 'Die fehlgeschlagenen musst du woanders besorgen oder von Hand hochladen.'
        : 'Alles dort abgelegt, wo Batocera es erwartet.',
    })
    onRepaired()
  }

  const toggleSkip = async (file: BiosFile) => {
    try {
      if (file.estado === 'omitida') {
        await api.biosUnskip(file.skip_key)
      } else {
        await api.biosSkip(file.skip_key)
      }
      onRepaired()
    } catch (error) {
      showNotify({
        variant: 'error',
        title: 'Status konnte nicht geändert werden',
        message: error instanceof Error ? error.message : undefined,
      })
    }
  }

  /** Copia el hash que publica Batocera (o el que hay en disco) al portapapeles. */
  const copyHash = async (file: BiosFile) => {
    const hash = file.md5s[0] ?? file.md5
    if (!hash) {
      showNotify({ variant: 'error', title: 'Für dieses BIOS ist kein Hash veröffentlicht' })
      return
    }
    try {
      await navigator.clipboard.writeText(hash)
      showNotify({ variant: 'success', title: 'Hash kopiert', message: hash })
    } catch {
      showNotify({ variant: 'error', title: 'Hash konnte nicht kopiert werden' })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={name}
      description={`${slug} · ${correctas.length} korrekt von ${files.length} · ${problemas.length} mit Problemen`}
      className="max-w-3xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Schließen
          </Button>
          {/* El botón sólo aparece si hay algo que reparar: si no, es un botón
              inerte que no hace nada. */}
          {reparables.length > 0 && (
            <Button variant="primary" size="sm" disabled={batch} onClick={repairAll}>
              <Wrench className="size-4" />
              {batch ? 'Wird repariert…' : `Reparieren ${reparables.length}`}
            </Button>
          )}
        </>
      }
    >
      {/* El input está oculto, pero no se esconde con `display: none` (con
          `hidden` no lo alcanza ni el teclado): se queda en el flujo, con
          tamaño 0, para no ensanchar el documento. */}
      <input
        ref={inputRef}
        type="file"
        className="h-px w-px border-0 p-0 opacity-0"
        onChange={upload}
        aria-label="BIOS hochladen"
      />

      <ul className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
        {files.map((file) => {
          const info = BIOS_ESTADOS[file.estado]
          const EstadoIcon = info.icon
          const working = busy === file.file
          const reparable = esReparable(file.estado)
          const conProblema = esProblema(file.estado)
          /** Sin contenido en la consola: hay que buscarlo por fuera o subirlo. */
          const buscar = conProblema
          const enlaceFichero = file.busqueda || busquedaGoogle(file.file)
          /** El enlace busca el nombre del fichero, no su ruta. */
          const nombreFichero = file.file.split('/').pop() ?? file.file
          return (
            <li
              key={file.file}
              className="rounded-2xl border border-border bg-muted/30 p-3 transition-colors duration-150 hover:bg-muted/50"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                        info.badge,
                      )}
                    >
                      <EstadoIcon className="size-3" />
                      {info.label}
                    </span>
                    <span className="truncate font-mono text-xs font-medium text-foreground">
                      {file.file}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {file.members.length > 0
                      ? `ZIP mit ${file.members.length} ${
                          file.members.length === 1 ? 'geforderten Datei' : 'geforderten Dateien'
                        } darin`
                      : info.ayuda}
                    {file.fuente ? ` · verfügbar in ${file.fuente}` : ''}
                    {file.faltan.length ? ` · fehlt: ${file.faltan.join(', ')}` : ''}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {reparable && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={working}
                      onClick={() => repair(file)}
                    >
                      <Wrench className="size-3.5" />
                      {working ? 'Wird repariert…' : 'Reparieren'}
                    </Button>
                  )}
                  <IconButton label={`Hochladen ${file.file}`} onClick={() => pickFile(file.file)}>
                    <Upload className="size-3.5" />
                  </IconButton>
                  <IconButton
                    label="Hash kopieren"
                    onClick={() => copyHash(file)}
                  >
                    <Copy className="size-3.5" />
                  </IconButton>
                  <IconButton
                    label={file.estado === 'omitida' ? 'Dieses BIOS nicht mehr überspringen' : 'Dieses BIOS überspringen'}
                    onClick={() => toggleSkip(file)}
                  >
                    <SkipForward className="size-3.5" />
                  </IconButton>
                </div>
              </div>

              {/* Detalle: hash, tamaño y ruta */}
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground sm:grid-cols-4">
                <span className="truncate" title={file.md5s.join(', ')}>
                  veröffentlichter MD5:{' '}
                  <span className="font-mono text-foreground">
                    {file.md5s[0] ? `${file.md5s[0].slice(0, 12)}…` : 'nicht veröffentlicht'}
                  </span>
                </span>
                <span className="truncate" title={file.md5 ?? ''}>
                  MD5 auf der Platte:{' '}
                  <span className="font-mono text-foreground">
                    {file.md5 ? `${file.md5.slice(0, 12)}…` : '—'}
                  </span>
                </span>
                <span>Größe: {humanSize(file.size)}</span>
                <span className="truncate" title={`/userdata/bios/${file.file}`}>
                  Ziel: <span className="font-mono text-foreground">/userdata/bios/{file.file}</span>
                </span>
              </div>

              {/* Falta contenido: se busca por fuera o lo sube el usuario */}
              {buscar && (
                <div className="mt-2 rounded-xl border border-border bg-background/60 p-3">
                  <p className="text-[11px] font-medium text-foreground">
                    {file.file} ist nicht auf der Konsole
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Hier gibt es nichts zu reparieren: Der Inhalt ist nicht auf der Karte.
                    Suche ihn selbst bei Google und lade ihn hier hoch; die App legt ihn an die richtige Stelle.
                    {file.members.length > 0 && ' Wenn es ein ZIP ist, lade das vollständige ZIP hoch.'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <a
                      href={enlaceFichero}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      Suchen {nombreFichero} bei Google
                    </a>
                    {busqueda && (
                      <a
                        href={busqueda}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        BIOS suchen für {name} bei Google
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={working}
                      onClick={() => pickFile(file.file)}
                    >
                      <Upload className="size-3.5" />
                      Datei hochladen
                    </Button>
                  </div>
                  <p className="mt-2 flex items-start gap-1 text-[10px] leading-relaxed text-muted-foreground">
                    <CircleAlert className="mt-0.5 size-3 shrink-0" />
                    BIOS-Dateien sind urheberrechtlich geschützt: Die App lädt nichts von selbst herunter. Nur du entscheidest, welche Datei du hochlädst.
                  </p>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
