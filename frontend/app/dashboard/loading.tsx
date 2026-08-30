import { DashboardHeaderSkeleton } from '@/components/dashboard/page-skeleton'

function StatCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`dashboard-card dashboard-stat-card animate-pulse p-5 ${compact ? 'min-h-[104px]' : 'min-h-[112px]'}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="h-3 w-20 rounded bg-[var(--dashboard-line-strong)]" />
          <div className="mt-3 h-6 w-24 rounded bg-[var(--dashboard-surface-subtle)]" />
          <div className="mt-2 h-2.5 w-16 rounded bg-[var(--dashboard-surface-subtle)]" />
        </div>
        <div className="dashboard-stat-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
          <div className="h-5 w-5 rounded bg-current opacity-20" />
        </div>
      </div>
    </div>
  )
}

function PanelSkeleton() {
  return (
    <section className="dashboard-panel animate-pulse overflow-hidden">
      <div className="dashboard-panel-header px-5 pb-2 pt-5">
        <div className="h-2.5 w-20 rounded bg-[var(--dashboard-line-strong)]" />
        <div className="mt-2 h-4 w-36 rounded bg-[var(--dashboard-surface-subtle)]" />
      </div>
      <div className="p-5">
        <div className="h-[280px] w-full rounded-xl bg-[var(--dashboard-surface-subtle)]" />
      </div>
    </section>
  )
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-transparent">
      <DashboardHeaderSkeleton showMonth />

      <div className="p-4 sm:p-6 lg:p-8">
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
