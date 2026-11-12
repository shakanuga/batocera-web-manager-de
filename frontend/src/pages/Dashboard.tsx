import { motion } from 'motion/react'
import { Cpu, Gamepad2, HardDrive, RefreshCw, Trophy } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AreaTrend } from '@/components/charts/AreaTrend'
import { ChartCard } from '@/components/charts/ChartCard'
import { DonutChart } from '@/components/charts/DonutChart'
import { GaugeArc } from '@/components/charts/GaugeArc'
import { RoundedBarChart } from '@/components/charts/RoundedBarChart'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { RandomGameCard } from '@/components/dashboard/RandomGameCard'
import {
  BatteryPanel,
  EsPanel,
  FansPanel,
  GpuPanel,
  NetworkPanel,
} from '@/components/dashboard/StatusPanels'
import { TopGamesPanel } from '@/components/dashboard/TopGamesPanel'
import { PageContainer, useShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { IconButton } from '@/components/ui/Button'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { PanelCard, StatRow } from '@/components/ui/Card'
import { PillBar, Pill } from '@/components/ui/Pill'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import { triggerHaptic } from '@/hooks/useWebHaptics'
import { api, unwrap } from '@/lib/api'
import type { RandomGame } from '@/lib/types'
import { humanDuration } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as const

const REFRESH_OPTIONS = [
  { label: 'Automatisch', value: 10000 },
  { label: 'Alle 30 s', value: 30000 },
  { label: 'Manuell', value: 0 },
]

export function Dashboard() {
  const { openMenu } = useShell()
  const { showToast } = useToast()
  const [pollMs, setPollMs] = useState(10000)
  const [randomGame, setRandomGame] = useState<RandomGame | null>(null)
  const [rolling, setRolling] = useState(false)
  const [restarting, setRestarting] = useState(false)

  const dash = useApi(() => api.dashboard(), [], { pollMs })
  const stats = useApi(() => api.gameStats(), [], { pollMs: 60000 })
  const info = useApi(() => api.info(), [], { pollMs: 60000 })

  const data = dash.data
  const primaryDisk = useMemo(() => {
    if (!data?.disk?.length) return null
    return [...data.disk].sort((a, b) => b.size_gb - a.size_gb)[0]
  }, [data?.disk])

  const rollRandom = useCallback(async () => {
    setRolling(true)
    try {
      const res = unwrap(await api.randomGame())
      setRandomGame(res.game)
      if (!res.game) showToast('Noch keine ROMs in der Bibliothek.')
    } catch {
      showToast('Es konnte kein Zufallsspiel gewählt werden.', 'error')
    } finally {
      setRolling(false)
    }
  }, [showToast])

  /* Al cargar la app la tarjeta de juego al azar no se queda vacía: se pide
     uno nada más montar. El botón «Girar» sigue funcionando igual. */
  useEffect(() => {
    let alive = true
    setRolling(true)
    void (async () => {
      try {
        const res = unwrap(await api.randomGame())
        if (alive) setRandomGame(res.game)
      } catch {
        /* sin biblioteca o sin red: la tarjeta se queda en su estado vacío */
      } finally {
        if (alive) setRolling(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const restartEs = useCallback(async () => {
    setRestarting(true)
    triggerHaptic('medium')
    try {
      const res = await api.esRestart()
      if (res.ok) {
        showToast('EmulationStation wird neu gestartet.', 'success')
        dash.refresh()
      } else {
        showToast('EmulationStation konnte nicht neu gestartet werden.', 'error')
      }
    } catch {
      showToast('EmulationStation konnte nicht neu gestartet werden.', 'error')
    } finally {
      setRestarting(false)
    }
  }, [dash, showToast])

  const topProcesses = useMemo(
    () =>
      (data?.processes ?? []).slice(0, 6).map((p) => ({
        label: p.cmd || p.pid,
        value: Number.parseFloat(p.cpu) || 0,
      })),
    [data?.processes],
  )

  const activity = useMemo(
    () =>
      (stats.data?.activity ?? []).slice(-14).map((a) => ({
        label: a.date.slice(5),
        value: a.count,
      })),
    [stats.data?.activity],
  )

  const title = 'Übersicht'
  const subtitle = data
    ? `Batocera ${data.batocera_version} · eingeschaltet seit ${data.uptime}`
    : 'Gerätestatus wird geladen…'

  return (
    <>
      <Topbar
        title={title}
        subtitle={subtitle}
        onMenu={openMenu}
        actions={
          <>
            <PillBar className="hidden md:flex">
              {REFRESH_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  active={pollMs === opt.value}
                  onClick={() => {
                    triggerHaptic('light')
                    setPollMs(opt.value)
                  }}
                >
                  {opt.label}
                </Pill>
              ))}
            </PillBar>
            <IconButton label="Jetzt aktualisieren" onClick={() => dash.refresh()}>
              <RefreshCw className={cnRefresh(dash.loading)} />
            </IconButton>
          </>
        }
      />

      <PageContainer>
        {/* Halo ambiental: dos manchas de color muy tenues que le dan aire
            al panel sin manchar el fondo ni salir del diseño. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 h-72 w-[52rem] -translate-x-1/2 opacity-45 blur-3xl"
          style={{
            background:
              'radial-gradient(45% 55% at 28% 40%, var(--tone-1-soft) 0%, transparent 70%),' +
              'radial-gradient(40% 50% at 72% 26%, var(--tone-2-soft) 0%, transparent 70%)',
          }}
        />

        {dash.error && (
          <div className="relative z-10 mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {dash.error}
          </div>
        )}

        {dash.loading && !data ? (
          <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : data ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="relative z-10 space-y-4"
          >
            {/* Métricas principales */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ChartCard
                label="CPU"
                tag="Last"
                tone="amber"
                value={`${data.cpu.cores} Kerne`}
                footer={
                  <>
                    <span>{data.cpu.model || 'Unbekanntes Modell'}</span>
                    <span className="font-medium text-foreground">{data.cpu.usage}%</span>
                  </>
                }
              >
                <GaugeArc value={data.cpu.usage} caption="belegt" tone="amber" />
              </ChartCard>

              <ChartCard
                label="Arbeitsspeicher"
                tag="Belegt"
                tone="cyan"
                value={`${data.memory.used_mb.toLocaleString('de-DE')} MB`}
                footer={
                  <>
                    <span>von {data.memory.total_mb.toLocaleString('de-DE')} MB</span>
                    <span className="font-medium text-foreground">{data.memory.used_pct}%</span>
                  </>
                }
              >
                <GaugeArc value={data.memory.used_pct} caption="belegt" tone="cyan" />
              </ChartCard>

              <ChartCard
                label="Temperatur"
                tag={data.cpu.temp_src || 'CPU'}
                tone="rose"
                value={data.cpu.temp != null ? `${data.cpu.temp} °C` : 'Kein Sensor'}
                footer={
                  <>
                    <span>Quelle: {data.cpu.temp_src}</span>
                    <span className="font-medium text-foreground">
                      {data.cpu.temp != null && data.cpu.temp > 80 ? 'Hoch' : 'Normal'}
                    </span>
                  </>
                }
              >
                <GaugeArc
                  value={data.cpu.temp != null ? Math.min((data.cpu.temp / 100) * 100, 100) : 0}
                  suffix="°C"
                  caption="von 100 °C"
                  tone="rose"
                />
              </ChartCard>

              <ChartCard
                label="Hauptlaufwerk"
                tag={primaryDisk ? primaryDisk.mount : '—'}
                tone="violet"
                value={primaryDisk ? `${primaryDisk.used_gb} GB belegt` : 'Keine Daten'}
                footer={
                  <>
                    <span>{primaryDisk ? `${primaryDisk.free_gb} GB frei` : ''}</span>
                    <span className="font-medium text-foreground">
                      {primaryDisk ? `${primaryDisk.pct}%` : ''}
                    </span>
                  </>
                }
              >
                <DonutChart
                  tone="violet"
                  data={
                    primaryDisk
                      ? [
                          { name: 'Belegt', value: primaryDisk.pct },
                          { name: 'Frei', value: Math.max(0, 100 - primaryDisk.pct) },
                        ]
                      : []
                  }
                  centerLabel="belegt"
                  centerValue={primaryDisk ? primaryDisk.pct : 0}
                  formatValue={(v) => `${v.toFixed(0)}%`}
                />
              </ChartCard>
            </div>

            {/* Resumen rápido */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <MetricCard
                label="Systeme"
                tone="sky"
                value={info.data?.rom_systems_count ?? 0}
                icon={Gamepad2}
                hint={
                  info.data?.systems_count
                    ? `${info.data.systems_count} eigene`
                    : 'von Batocera'
                }
              />
              <MetricCard
                label="Prozesse"
                tone="amber"
                value={data.processes.length}
                icon={Cpu}
                hint={`${topProcesses[0]?.label ?? 'keine Daten'} vorne`}
              />
              <MetricCard
                label="Partitionen"
                tone="cyan"
                value={data.disk.length}
                icon={HardDrive}
                hint={data.disk_updated ? `Aktualisiert ${data.disk_updated}` : 'Kein Datum'}
              />
              <MetricCard
                label="Spiele"
                tone="emerald"
                value={info.data?.disk_games_count ?? 0}
                icon={Trophy}
                hint={
                  stats.data?.has_playtime
                    ? humanDuration(stats.data.totals.playtime_s)
                    : 'Keine Stunden erfasst'
                }
              />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <ChartCard
                label="Top-Prozesse"
                tag="CPU %"
                tone="sky"
                value={`${data.processes.length}`}
                footer={<span>Die 6 Prozesse mit der höchsten Last</span>}
              >
                <RoundedBarChart
                  tone="sky"
                  data={topProcesses}
                  formatValue={(v) => `${v.toFixed(1)}%`}
                />
              </ChartCard>

              <ChartCard
                label="Spielaktivität"
                tag="Letzte 14 Tage"
                tone="emerald"
                value={stats.data ? `${stats.data.totals.playcount}` : '—'}
                footer={<span>Erfasste Partien pro Tag</span>}
              >
                <AreaTrend tone="emerald" data={activity} formatValue={(v) => `${v} Partien`} />
              </ChartCard>
            </div>

            {/* Estado */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <EsPanel status={data.es} onRestart={restartEs} busy={restarting} />
              <NetworkPanel interfaces={data.network} />
              <FansPanel fans={data.fans} />
              <GpuPanel gpu={data.gpu} />
              <BatteryPanel battery={data.battery} />

              <PanelCard
                title="Speicher"
                subtitle={`${data.disk.length} Partition(en)`}
                icon={<HardDrive className="size-4" />}
                tone="amber"
              >
                {data.disk.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Es wurden keine Partitionen erkannt.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {data.disk.map((part) => (
                      <div key={part.mount} className="py-1.5 first:pt-0 last:pb-0">
                        <StatRow
                          label={part.mount}
                          value={`${part.used_gb} / ${part.size_gb} GB`}
                          hint={`${part.pct}%`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </PanelCard>
            </div>

            {/* Juego y library */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <RandomGameCard
                game={randomGame}
                loading={rolling}
                onRoll={rollRandom}
              />
              <TopGamesPanel stats={stats.data} />
            </div>
          </motion.div>
        ) : null}
      </PageContainer>
    </>
  )
}

function cnRefresh(loading: boolean) {
  return `size-3.5 ${loading ? 'animate-spin' : ''}`
}
