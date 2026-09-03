import { cn } from '@/lib/utils'

export function DashboardLoadingProgress({ className }: { className?: string }) {
  return (
    <div
      className={cn('dashboard-loading-progress fixed inset-x-0 top-0 z-[120] h-1', className)}
      aria-hidden="true"
    />
  )
}

export function DashboardSkeletonBlock({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('dashboard-skeleton', className)} aria-hidden="true" {...props} />
}

export function DashboardHeaderSkeleton({ showMonth = false }: { showMonth?: boolean }) {
  return (
    <div className="dashboard-header-clean sticky top-0 z-20" aria-hidden="true">
      <div className="flex min-h-[72px] flex-col gap-2 px-4 py-3 sm:px-6 lg:h-[72px] lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-0">
        <div className="flex items-center gap-3 pr-3">
          <DashboardSkeletonBlock className="h-10 w-10 shrink-0 rounded-xl lg:hidden" />
          <div>
            <DashboardSkeletonBlock className="h-5 w-48 rounded-md" />
            <DashboardSkeletonBlock className="mt-2 h-3 w-36 rounded-md" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {showMonth && (
            <DashboardSkeletonBlock className="hidden h-11 w-44 rounded-xl sm:block" />
          )}
          <DashboardSkeletonBlock className="h-11 w-28 rounded-xl" />
          <DashboardSkeletonBlock className="h-11 w-11 rounded-xl" />
          <DashboardSkeletonBlock className="h-11 w-11 rounded-xl" />
          <DashboardSkeletonBlock className="h-11 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function SummaryCardSkeleton() {
  return (
    <div className="dashboard-card min-h-[116px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <DashboardSkeletonBlock className="h-3 w-24 rounded-md" />
          <DashboardSkeletonBlock className="mt-4 h-7 w-28 rounded-md" />
          <DashboardSkeletonBlock className="mt-3 h-2.5 w-20 rounded-md" />
        </div>
        <DashboardSkeletonBlock className="h-11 w-11 shrink-0 rounded-xl" />
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <section className="dashboard-panel overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--dashboard-line)] px-5 py-5">
        <div>
          <DashboardSkeletonBlock className="h-4 w-36 rounded-md" />
          <DashboardSkeletonBlock className="mt-2 h-3 w-52 max-w-full rounded-md" />
        </div>
        <DashboardSkeletonBlock className="h-10 w-28 rounded-xl" />
      </div>

      <div className="px-5 py-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="grid min-h-16 grid-cols-[40px_minmax(0,1.3fr)_minmax(80px,.7fr)_80px] items-center gap-4 border-b border-[var(--dashboard-line)]/70 last:border-0"
          >
            <DashboardSkeletonBlock className="h-9 w-9 rounded-lg" />
            <div>
              <DashboardSkeletonBlock className="h-3.5 w-36 max-w-full rounded-md" />
              <DashboardSkeletonBlock className="mt-2 h-2.5 w-24 rounded-md" />
            </div>
            <DashboardSkeletonBlock className="h-7 w-20 rounded-full" />
            <DashboardSkeletonBlock className="ml-auto h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </section>
  )
}

function ActivitySkeleton() {
  return (
    <aside className="dashboard-panel p-5">
      <DashboardSkeletonBlock className="h-4 w-32 rounded-md" />
      <DashboardSkeletonBlock className="mt-2 h-3 w-44 max-w-full rounded-md" />
      <div className="mt-6 space-y-5">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <DashboardSkeletonBlock className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <DashboardSkeletonBlock className="h-3.5 w-full max-w-44 rounded-md" />
              <DashboardSkeletonBlock className="mt-2 h-2.5 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-transparent" role="status" aria-live="polite" aria-busy="true">
      <DashboardLoadingProgress />
      <span className="sr-only">Loading dashboard workspace</span>
      <DashboardHeaderSkeleton />

      <div className="p-4 sm:p-6 lg:p-8" aria-hidden="true">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <DashboardSkeletonBlock className="h-5 w-52 rounded-md" />
            <DashboardSkeletonBlock className="mt-2 h-3 w-72 max-w-[70vw] rounded-md" />
          </div>
          <div className="dashboard-subtle-card hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[var(--dashboard-muted)] sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--brand)]" />
            Loading workspace
          </div>
        </div>

        <div className="dashboard-stat-grid grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SummaryCardSkeleton key={index} />
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,.7fr)]">
          <TableSkeleton />
          <ActivitySkeleton />
        </div>
      </div>
    </div>
  )
}
