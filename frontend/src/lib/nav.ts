import {
  Bug,
  FileSignature,
  Gamepad2,
  Gauge,
  Palette,
  Plus,
  Settings,
  Sparkles,
  Trophy,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Si es `true`, la sección todavía no está implementada. */
  pending?: boolean
  /** Coincidencia exacta de ruta en lugar de prefijo. */
  end?: boolean
}

export interface NavGroup {
  /** Título del grupo. El primer grupo puede no llevar título. */
  label?: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'Übersicht', icon: Gauge, end: true },
      { to: '/sistemas', label: 'Eigene Systeme', icon: Gamepad2 },
      { to: '/sistemas/nuevo', label: 'System hinzufügen', icon: Plus },
      { to: '/roms', label: 'ROMs und BIOS', icon: Sparkles },
      { to: '/scraper', label: 'Scraper', icon: Palette },
      { to: '/retroachievements', label: 'Erfolge', icon: Trophy },
    ],
  },
  {
    label: 'Werkzeuge',
    items: [
      { to: '/herramientas/formatos', label: 'Formate', icon: Wrench },
      { to: '/herramientas/renombrado', label: 'Umbenennen', icon: FileSignature },
    ],
  },
  {
    items: [
      { to: '/depuracion', label: 'Fehlersuche', icon: Bug },
      { to: '/configuracion', label: 'Einstellungen', icon: Settings },
    ],
  },
]

/** Lista plana, para quien la necesite (tests, enlaces directos). */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items)
