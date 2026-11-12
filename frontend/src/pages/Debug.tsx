import { Bug, CircleAlert, CircleCheck, Radio } from 'lucide-react'
import { useMemo } from 'react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { PageContainer, useShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { LogStream, type LogLevel } from '@/components/overtrue/log-stream'
import { useLogStream } from '@/hooks/useLogStream'

export function DebugPage() {
  const { openMenu } = useShell()
  const { entries, connected } = useLogStream()

  const counts = useMemo(() => {
    const acc: Record<LogLevel, number> = { debug: 0, info: 0, warn: 0, error: 0 }
    for (const entry of entries) acc[entry.level] = (acc[entry.level] ?? 0) + 1
    return acc
  }, [entries])

  return (
    <>
      <Topbar
        title="Fehlersuche"
        subtitle="Live-Ereignisse des Managers"
        onMenu={openMenu}
        actions={
          <span
            className={
              connected
                ? 'inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400'
                : 'inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400'
            }
          >
            <span
              className={
                connected
                  ? 'size-1.5 rounded-full bg-emerald-500'
                  : 'size-1.5 rounded-full bg-amber-500'
              }
            />
            {connected ? 'Live' : 'Verbinde neu…'}
          </span>
        }
      />

      <PageContainer>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard
            label="Ereignisse"
            value={entries.length}
            icon={Radio}
            hint={connected ? 'Stream offen' : 'Keine Verbindung zum Backend'}
            accent={connected ? 'good' : 'warn'}
          />
          <MetricCard label="Information" value={counts.info} icon={CircleCheck} />
          <MetricCard
            label="Warnungen"
            value={counts.warn}
            icon={CircleAlert}
            accent={counts.warn > 0 ? 'warn' : 'default'}
          />
          <MetricCard
            label="Fehler"
            value={counts.error}
            icon={Bug}
            accent={counts.error > 0 ? 'bad' : 'default'}
          />
        </div>

        <div className="mt-4">
          <LogStream
            className="card card-hover rounded-3xl border-border"
            entries={entries}
            title="Ereignisstrom"
            description="Aktionen und Meldungen des Backends. Aktiviere „Debug“, um den HTTP-Verkehr zu sehen; drücke /, um nach Text zu filtern."
            height={520}
            maxEntries={500}
            live
            defaultLevels={['info', 'warn', 'error']}
            timeZone="local"
          />
        </div>
      </PageContainer>
    </>
  )
}
