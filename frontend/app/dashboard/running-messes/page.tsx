'use client'

import { useAuth } from '@/app/context/auth-context'
import { DashboardHeader } from '@/components/dashboard-header'
import { RunningMessesTable } from '@/components/admin/running-messes'
import { LoadingSkeleton } from '@/components/dashboard/page-skeleton'
import { useRunningMesses } from '@/hooks/use-dashboard-data'
import { useTranslations } from '@/lib/i18n'

export default function RunningMessesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const t = useTranslations('adminRunningMesses')
  const { data: messes, isLoading } = useRunningMesses(user?.role === 'ADMIN', 1, 100)

  if (authLoading || !user) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title={t('title')} description={t('description')} />
      <div className="p-4 sm:p-5 lg:p-6">
        <RunningMessesTable messes={messes ?? []} isLoading={isLoading} />
      </div>
    </div>
  )
}
