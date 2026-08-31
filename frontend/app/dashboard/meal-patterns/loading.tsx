import { DashboardHeaderSkeleton } from '@/components/dashboard/page-skeleton'

export default function MealPatternsLoading() {
  return (
    <div className="min-h-screen bg-transparent">
      <DashboardHeaderSkeleton />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="h-36 animate-pulse rounded-2xl bg-[var(--dashboard-surface-subtle)]" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-[var(--dashboard-surface-subtle)]" />)}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-[var(--dashboard-surface-subtle)]" />
      </div>
    </div>
  )
}
