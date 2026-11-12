import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  FileWarning,
  PackageSearch,
  SkipForward,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { BiosEstado } from './types'

/**
 * Presentación de cada estado de BIOS: etiqueta, icono, color y gravedad.
 *
 * La gravedad ordena lo que hay que mirar primero: lo que impide jugar va
 * antes que lo que está reparable, y lo reparable antes que lo que ya está
 * bien.
 */
export interface BiosEstadoInfo {
  label: string
  icon: LucideIcon
  /** Clases del distintivo: fondo, texto y borde. */
  badge: string
  /** Mayor = menos grave. */
  gravedad: number
  /** Una línea de ayuda para el modal. */
  ayuda: string
}

export const BIOS_ESTADOS: Record<BiosEstado, BiosEstadoInfo> = {
  ausente: {
    label: 'Fehlt',
    icon: PackageSearch,
    badge: 'bg-destructive/15 text-destructive border-destructive/30',
    gravedad: 6,
    ayuda: 'Nicht auf der Konsole: muss besorgt werden.',
  },
  miembro_falta: {
    label: 'Eine Datei fehlt',
    icon: FileWarning,
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    gravedad: 5,
    ayuda: 'Im ZIP fehlt eine Datei, die der Katalog verlangt.',
  },
  ilegible: {
    label: 'Unlesbar',
    icon: CircleAlert,
    badge: 'bg-destructive/15 text-destructive border-destructive/30',
    gravedad: 5,
    ayuda: 'Die Datei ist da, lässt sich aber nicht öffnen.',
  },
  reparable_zip: {
    label: 'Reparierbar',
    icon: Wrench,
    badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    gravedad: 3,
    ayuda: 'Der Inhalt liegt in einem anderen ZIP auf der Konsole.',
  },
  reparable_ruta: {
    label: 'Reparierbar',
    icon: Wrench,
    badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    gravedad: 3,
    ayuda: 'Der Inhalt liegt in einem anderen Ordner: Er kann verschoben werden.',
  },
  sin_verificar: {
    label: 'Keine Daten',
    icon: CircleHelp,
    badge: 'bg-muted text-muted-foreground border-border',
    gravedad: 2,
    ayuda: 'Liegt an seinem Platz, aber der Katalog veröffentlicht nichts zum Prüfen.',
  },
  omitida: {
    label: 'Übersprungen',
    icon: SkipForward,
    badge: 'bg-muted text-muted-foreground border-border',
    gravedad: 1,
    ayuda: 'Als nicht benötigt markiert.',
  },
  ok: {
    label: 'Korrekt',
    icon: CircleCheck,
    badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    gravedad: 0,
    ayuda: 'Liegt in dem Pfad, in dem Batocera es erwartet.',
  },
}

/** Estados en los que la BIOS se puede arreglar sin salir de la consola. */
export const ESTADOS_REPARABLES: BiosEstado[] = ['reparable_zip', 'reparable_ruta']

/** Estados que son un problema: no está o está mal. */
export const ESTADOS_PROBLEMA: BiosEstado[] = ['ausente', 'miembro_falta', 'ilegible']

export function esReparable(estado: BiosEstado): boolean {
  return ESTADOS_REPARABLES.includes(estado)
}

export function esProblema(estado: BiosEstado): boolean {
  return ESTADOS_PROBLEMA.includes(estado)
}

/** El estado más grave de una lista (el que manda en la tarjeta). */
export function peorEstado(estados: BiosEstado[]): BiosEstado {
  let peor: BiosEstado = 'ok'
  for (const estado of estados) {
    if (BIOS_ESTADOS[estado].gravedad > BIOS_ESTADOS[peor].gravedad) {
      peor = estado
    }
  }
  return peor
}
