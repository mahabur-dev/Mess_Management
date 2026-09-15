'use client'

import { useAuth } from '@/app/context/auth-context'
import { AllMessesTable } from '@/components/admin/running-messes'
import { DashboardHeader } from '@/components/dashboard-header'
import { LoadingSkeleton } from '@/components/dashboard/page-skeleton'
import { useAllAdminMesses } from '@/hooks/use-dashboard-data'
import { useTranslations } from '@/lib/i18n'

export default function AllMessesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const t = useTranslations('adminRunningMesses')
  const { data: messes, isLoading, mutate } = useAllAdminMesses(user?.role === 'ADMIN')

  if (authLoading || !user) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title={t('all.title')} description={t('all.pageDescription')} />
      <div className="p-4 sm:p-5 lg:p-6">
        <AllMessesTable
          messes={messes ?? []}
          isLoading={isLoading}
          onDeleted={(messId) => mutate(
            (current) => current?.filter((mess) => mess.id !== messId),
            { revalidate: false },
          )}
        />
      </div>
    </div>
  )
}
