import { Compass } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageContainer, useShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

export function NotFound() {
  const { openMenu } = useShell()
  const navigate = useNavigate()

  return (
    <>
      <Topbar title="Seite nicht gefunden" subtitle="404" onMenu={openMenu} />
      <PageContainer>
        <EmptyState
          icon={<Compass className="size-5" />}
          title="Diesen Bereich gibt es nicht"
          description="Der Link, dem du gefolgt bist, führt zu keiner Seite des Managers."
          action={
            <Button variant="primary" onClick={() => navigate('/')}>
              Zurück zur Übersicht
            </Button>
          }
        />
      </PageContainer>
    </>
  )
}
