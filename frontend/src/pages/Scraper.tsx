import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowLeft,
  CircleAlert,
  Download,
  Gamepad2,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { PageContainer, useShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { RomFolderView } from '@/components/scraper/RomFolderView'
import { ScrapeRomModal } from '@/components/scraper/ScrapeRomModal'
import { ScrapeSystemModal } from '@/components/scraper/ScrapeSystemModal'
import { ScraperSystemCard } from '@/components/scraper/ScraperSystemCard'
import { Button, IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pill, PillBar } from '@/components/ui/Pill'
import { useApi } from '@/hooks/useApi'
import { triggerHaptic } from '@/hooks/useWebHaptics'
import { api } from '@/lib/api'
import { systemType } from '@/lib/systemIcons'
import type { RomFolderItem, RomSystemSummary } from '@/lib/types'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as const

type StatusFilter = 'with-roms' | 'all' | 'with-media' | 'without-media' | 'empty' | 'gamelist'
type SortKey = 'name' | 'roms-desc' | 'roms-asc' | 'media-desc' | 'coverage'

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'with-roms', label: 'Mit ROMs' },
  { key: 'all', label: 'Alle' },
  { key: 'with-media', label: 'Mit Medien' },
  { key: 'without-media', label: 'Ohne Medien' },
  { key: 'empty', label: 'Leer' },
  { key: 'gamelist', label: 'Mit gamelist' },
]

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'roms-desc', label: 'Meiste ROMs' },
  { key: 'roms-asc', label: 'Wenigste ROMs' },
  { key: 'media-desc', label: 'Meiste Medien' },
  { key: 'coverage', label: 'Abdeckung' },
]

/** ¿Alguna fuente tiene credenciales guardadas? */
function anySourceReady(config: {
  ss_user_set?: boolean
  ss_password_set?: boolean
  tgdb_apikey_set?: boolean
  igdb_client_id_set?: boolean
  igdb_client_secret_set?: boolean
} | null): boolean {
  if (!config) return true
  return Boolean(
    (config.ss_user_set && config.ss_password_set) ||
      config.tgdb_apikey_set ||
      (config.igdb_client_id_set && config.igdb_client_secret_set),
  )
}

export function ScraperPage() {
  const { openMenu } = useShell()
  const { data: systems, error, loading, refresh } = useApi(() => api.romSystems(), [])
  const { data: config, refresh: refreshConfig } = useApi(() => api.scraperConfig(), [])

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('with-roms')
  const [sort, setSort] = useState<SortKey>('roms-desc')

  const [selected, setSelected] = useState<RomSystemSummary | null>(null)
  const [subpath, setSubpath] = useState('')
  const [scrapeOpen, setScrapeOpen] = useState(false)
  /** Sistemas a escrapear desde el modal. Vacío = sólo configuración. */
  const [scrapeSystems, setScrapeSystems] = useState<string[]>([])
  const [romItem, setRomItem] = useState<RomFolderItem | null>(null)

  const {
    data: folderData,
    error: folderError,
    loading: folderLoading,
    refresh: refreshFolder,
  } = useApi(() => api.romFolder(selected?.name ?? '', subpath), [selected?.name, subpath], {
    enabled: Boolean(selected),
  })

  /* Tipos de sistema presentes en la biblioteca (para el filtro). */
  const types = useMemo(() => {
    const set = new Set<string>()
    for (const system of systems ?? []) {
      set.add(systemType(system))
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
  }, [systems])

  /* Filtrado y orden de los sistemas. */
  const filtered = useMemo(() => {
    const list = systems ?? []
    const needle = query.trim().toLowerCase()

    const result = list.filter((system) => {
      if (needle) {
        const haystack =
          `${system.name} ${system.fullname} ${system.manufacturer} ${system.platform} ${systemType(system)}`.toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      if (typeFilter !== 'all' && systemType(system) !== typeFilter) return false
      switch (statusFilter) {
        case 'with-roms':
          return system.rom_count > 0
        case 'with-media':
          return system.image_count > 0
        case 'without-media':
          return system.rom_count > 0 && system.image_count === 0
        case 'empty':
          return system.rom_count === 0
        case 'gamelist':
          return system.has_gamelist
        default:
          return true
      }
    })

    result.sort((a, b) => {
      switch (sort) {
        case 'roms-desc':
          return b.rom_count - a.rom_count || a.name.localeCompare(b.name)
        case 'roms-asc':
          return a.rom_count - b.rom_count || a.name.localeCompare(b.name)
        case 'media-desc':
          return b.media_count - a.media_count || a.name.localeCompare(b.name)
        case 'coverage':
          return (
            b.media_count / Math.max(b.rom_count, 1) - a.media_count / Math.max(a.rom_count, 1) ||
            a.name.localeCompare(b.name)
          )
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return result
  }, [systems, query, typeFilter, statusFilter, sort])

  /* Métricas globales de la biblioteca. */
  const totals = useMemo(() => {
    const list = systems ?? []
    const roms = list.reduce((acc, system) => acc + system.rom_count, 0)
    const media = list.reduce((acc, system) => acc + (system.image_count || 0), 0)
    return {
      systems: list.length,
      roms,
      media,
      pending: Math.max(0, roms - media),
    }
  }, [systems])

  /** Al guardar un juego: se refresca la tabla y la vista se queda en el
   *  sistema, para ver cómo el juego pasa a «media presente». */
  const handleRomSaved = () => {
    refresh()
    refreshConfig()
    refreshFolder()
    setRomItem(null)
  }

  /** Al terminar el scrape de un sistema: se refresca todo y se vuelve a la
   *  lista principal. */
  const handleSystemSaved = () => {
    refresh()
    refreshConfig()
    refreshFolder()
    setSelected(null)
    setSubpath('')
  }

  /** Abre el modal de scraping para uno o varios sistemas. */
  const openScrape = (systems: string[]) => {
    triggerHaptic('light')
    setScrapeSystems(systems)
    setScrapeOpen(true)
  }

  const openSystem = (system: RomSystemSummary) => {
    triggerHaptic('light')
    setSelected(system)
    setSubpath('')
  }

  /* ── Vista de la biblioteca de sistemas ──────────────────────────── */
  const listView = (
    <>
      <Topbar
        title="Scraper"
        subtitle={`${totals.systems} Systeme · ${totals.roms.toLocaleString('de-DE')} ROMs`}
        onMenu={openMenu}
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openScrape([])}
            >
              <Settings className="size-4" />
              Konfigurieren
            </Button>
            <IconButton
              label="Systeme neu laden"
              onClick={() => {
                triggerHaptic('light')
                refresh()
              }}
            >
              <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
            </IconButton>
          </>
        }
      />

      <PageContainer>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <CircleAlert className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">{error}</span>
            <Button size="sm" variant="outline" onClick={refresh}>
              Erneut versuchen
            </Button>
          </div>
        )}

        {config && !anySourceReady(config) && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <CircleAlert className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              Keine Scraping-Quelle hat Zugangsdaten. Klicke auf „Konfigurieren“, um sie hinzuzufügen.
            </span>
            <Button size="sm" variant="outline" onClick={() => openScrape([])}>
              <Settings className="size-4" />
              Konfigurieren
            </Button>
          </div>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Systeme" value={totals.systems} icon={Gamepad2} />
          <MetricCard label="ROMs" value={totals.roms.toLocaleString('de-DE')} icon={Sparkles} />
          <MetricCard
            label="Mit Medien"
            value={totals.media.toLocaleString('de-DE')}
            icon={ImageIcon}
            accent="good"
          />
          <MetricCard
            label="Ohne Medien"
            value={totals.pending.toLocaleString('de-DE')}
            icon={Download}
            hint="noch zu scrapen"
          />
        </div>

        {/* Filtros */}
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="System, Hersteller oder Plattform suchen…"
                aria-label="System suchen"
                className={cn(
                  'h-10 w-full rounded-xl border border-input bg-transparent pl-9 pr-3 text-sm text-foreground',
                  'placeholder:text-muted-foreground/70 transition-colors duration-150',
                  'focus:border-ring focus:outline-none focus:ring-3 focus:ring-ring/40',
                )}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Suche leeren"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] font-medium tabular-nums text-muted-foreground">
              {filtered.length} von {totals.systems} Systeme
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <PillBar>
              {STATUS_FILTERS.map((option) => (
                <Pill
                  key={option.key}
                  active={statusFilter === option.key}
                  onClick={() => {
                    triggerHaptic('light')
                    setStatusFilter(option.key)
                  }}
                >
                  {option.label}
                </Pill>
              ))}
            </PillBar>

            {types.length > 1 && (
              <PillBar>
                <Pill active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>
                  Alle Typen
                </Pill>
                {types.map((type) => (
                  <Pill key={type} active={typeFilter === type} onClick={() => setTypeFilter(type)}>
                    {type}
                  </Pill>
                ))}
              </PillBar>
            )}

            <PillBar>
              {SORTS.map((option) => (
                <Pill
                  key={option.key}
                  active={sort === option.key}
                  onClick={() => {
                    triggerHaptic('light')
                    setSort(option.key)
                  }}
                >
                  {option.label}
                </Pill>
              ))}
            </PillBar>
          </div>
        </div>

        {/* Tarjetas */}
        {loading && !systems ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="card h-72 animate-pulse bg-muted/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={<Search className="size-5" />}
              title="Kein System passt"
              description="Versuch es mit einem anderen Text oder ändere die Filter, um mehr Systeme der Bibliothek zu sehen."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('')
                    setTypeFilter('all')
                    setStatusFilter('all')
                  }}
                >
                  Filter entfernen
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((system, index) => (
              <motion.div
                key={system.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  ease: EASE,
                  delay: Math.min(index * 0.015, 0.05),
                }}
              >
                <ScraperSystemCard
                  system={system}
                  onOpen={() => openSystem(system)}
                  onScrape={() => openScrape([system.name])}
                />
              </motion.div>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  )

  /* ── Vista de los ROMs de un sistema ─────────────────────────────── */
  const folder = folderData?.folder ?? null
  const mediaCount = folder
    ? folder.items.filter((item) => item.is_rom && item.has_image).length
    : 0
  const pendingCount = folder
    ? folder.items.filter((item) => item.is_rom && !item.has_image).length
    : 0

  const systemView = selected ? (
    <>
      <Topbar
        title={selected.fullname || selected.name}
        subtitle={`${selected.name} · ${selected.rom_count.toLocaleString('de-DE')} ROMs · ${mediaCount} mit Medien · ${pendingCount} ohne Medien`}
        onMenu={openMenu}
        leading={
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light')
              setSelected(null)
              setSubpath('')
            }}
            aria-label="Zurück zur Systemliste"
            className={cn(
              'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-card',
              'px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors duration-150',
              'hover:bg-muted hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            )}
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Zurück</span>
          </button>
        }
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openScrape([selected.name])}
            >
              <Download className="size-4" />
              System scrapen
            </Button>
            <IconButton
              label="ROMs neu laden"
              onClick={() => {
                triggerHaptic('light')
                refreshFolder()
              }}
            >
              <RefreshCw className={cn('size-4', folderLoading && 'animate-spin')} />
            </IconButton>
          </>
        }
      />

      <PageContainer>
        {folderError && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <CircleAlert className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">{folderError}</span>
            <Button size="sm" variant="outline" onClick={refreshFolder}>
              Erneut versuchen
            </Button>
          </div>
        )}

        <RomFolderView
          folder={folder}
          system={selected.name}
          subpath={subpath}
          loading={folderLoading}
          onOpenRom={(rom) => {
            triggerHaptic('light')
            setRomItem(rom)
          }}
          onOpenFolder={(path) => {
            triggerHaptic('light')
            setSubpath(path)
          }}
          onGoRoot={() => setSubpath('')}
        />
      </PageContainer>
    </>
  ) : null

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={selected ? `sistema-${selected.name}-${subpath}` : 'biblioteca'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          {selected ? systemView : listView}
        </motion.div>
      </AnimatePresence>

      {/* Modal de scraping de sistema completo */}
      <ScrapeSystemModal
        open={scrapeOpen}
        onClose={() => setScrapeOpen(false)}
        systems={scrapeSystems}
        onSaved={handleSystemSaved}
      />

      {/* Modal de un ROM concreto */}
      <ScrapeRomModal
        open={Boolean(romItem)}
        onClose={() => setRomItem(null)}
        system={selected?.name ?? ''}
        subpath={subpath}
        rom={romItem}
        onSaved={handleRomSaved}
      />
    </>
  )
}
