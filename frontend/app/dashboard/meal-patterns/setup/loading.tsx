import { DashboardHeaderSkeleton } from '@/components/dashboard/page-skeleton'

export default function MealPatternSetupLoading() {
  return (
    <div className="min-h-screen bg-transparent">
      <DashboardHeaderSkeleton />
      <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="h-16 animate-pulse rounded-2xl bg-[var(--dashboard-surface-subtle)]" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-[var(--dashboard-surface-subtle)]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[var(--dashboard-surface-subtle)]" />
        </div>
      </div>
    </div>
  )
}
