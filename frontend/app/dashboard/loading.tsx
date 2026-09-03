import {
  DashboardHeaderSkeleton,
  DashboardLoadingProgress,
  DashboardSkeletonBlock,
} from '@/components/dashboard/page-skeleton'

function StatCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`dashboard-card dashboard-stat-card p-5 ${compact ? 'min-h-[104px]' : 'min-h-[112px]'}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <DashboardSkeletonBlock className="h-3 w-20 rounded-md" />
          <DashboardSkeletonBlock className="mt-3 h-6 w-24 rounded-md" />
          <DashboardSkeletonBlock className="mt-2 h-2.5 w-16 rounded-md" />
        </div>
        <div className="dashboard-stat-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
          <DashboardSkeletonBlock className="h-5 w-5 rounded-md" />
        </div>
      </div>
    </div>
  )
}

function PanelSkeleton() {
  return (
    <section className="dashboard-panel overflow-hidden">
      <div className="dashboard-panel-header px-5 pb-2 pt-5">
        <DashboardSkeletonBlock className="h-2.5 w-20 rounded-md" />
        <DashboardSkeletonBlock className="mt-2 h-4 w-36 rounded-md" />
      </div>
      <div className="p-5">
        <DashboardSkeletonBlock className="h-[280px] w-full rounded-xl" />
      </div>
    </section>
  )
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-transparent" role="status" aria-live="polite" aria-busy="true">
      <DashboardLoadingProgress />
      <span className="sr-only">Loading dashboard overview</span>
      <DashboardHeaderSkeleton showMonth />

      <div className="p-4 sm:p-6 lg:p-8" aria-hidden="true">
        <div className="dashboard-stat-grid grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>

        <div className="dashboard-mini-stat-grid mt-5 grid gap-5 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <StatCardSkeleton key={index} compact />
          ))}
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_.85fr_.7fr]">
          <PanelSkeleton />
          <PanelSkeleton />
          <PanelSkeleton />
        </div>
      </div>
    </div>
  )
}
