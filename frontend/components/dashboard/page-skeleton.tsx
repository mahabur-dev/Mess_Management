import { Loader2 } from 'lucide-react'

export function DashboardHeaderSkeleton({ showMonth = false }: { showMonth?: boolean }) {
  return (
    <div className="dashboard-header-clean sticky top-0 z-20" aria-hidden="true">
      <div className="flex min-h-[72px] flex-col gap-2 px-4 py-3 sm:px-6 lg:h-[72px] lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-0">
        <div className="flex items-center gap-3 pr-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-[var(--dashboard-surface-subtle)] lg:hidden" />
          <div>
            <div className="h-5 w-48 animate-pulse rounded bg-[var(--dashboard-line-strong)]" />
            <div className="mt-1 h-4 w-36 animate-pulse rounded bg-[var(--dashboard-surface-subtle)]" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {showMonth && (
            <div className="hidden h-11 w-44 animate-pulse rounded-xl bg-[var(--dashboard-surface-subtle)] sm:block" />
          )}
          <div className="h-11 w-28 animate-pulse rounded-xl bg-[var(--dashboard-surface-subtle)]" />
          <div className="h-11 w-11 animate-pulse rounded-xl bg-[var(--dashboard-surface-subtle)]" />
          <div className="h-11 w-11 animate-pulse rounded-xl bg-[var(--dashboard-surface-subtle)]" />
          <div className="h-11 w-28 animate-pulse rounded-xl bg-[var(--dashboard-surface-subtle)]" />
        </div>
      </div>
    </div>
  )
}

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-transparent">
      <DashboardHeaderSkeleton />

      <div className="flex items-center justify-center p-12">
        <Loader2 size={32} className="animate-spin text-[var(--brand)]" />
      </div>
    </div>
  )
}
