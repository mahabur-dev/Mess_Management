import { ArrowUpRight } from 'lucide-react'

const LOADING_CARDS = [
  { accent: 'from-[#2f80ed] to-[#6f3df4]' },
  { accent: 'from-[#10b981] to-[#34d399]' },
  { accent: 'from-[#6f3df4] to-[#8b5cf6]' },
  { accent: 'from-[#0ea5e9] to-[#2563eb]' },
  { accent: 'from-[#f59e0b] to-[#f97316]' },
  { accent: 'from-[#8b5cf6] to-[#6f3df4]' },
]

function StatCardSkeleton({ accent }: { accent: string }) {
  return (
    <div
      className={`group relative min-h-[92px] overflow-hidden rounded-xl bg-gradient-to-r ${accent} p-5 text-white animate-pulse shadow-[0_8px_25px_rgba(0,0,0,0.08)]`}
    >
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-white/8 blur-xl" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="h-3 w-20 rounded bg-white/20" />
          <div className="mt-3 h-7 w-24 rounded bg-white/20" />
          <div className="mt-2 flex items-center gap-1">
            <ArrowUpRight size={11} className="text-white/30" />
            <div className="h-2.5 w-16 rounded bg-white/20" />
          </div>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <div className="h-5 w-5 rounded bg-white/10" />
        </div>
      </div>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-1/3 rounded bg-[#e6ebf4]" />
      <div className="h-[280px] w-full rounded-xl bg-[#f1f5f9]" />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#fafcff]">
      {/* Header skeleton */}
      <div className="border-b border-[#e6ebf4] bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-5 w-48 rounded bg-[#e6ebf4]" />
            <div className="mt-1.5 h-4 w-36 rounded bg-[#f1f5f9]" />
          </div>
          <div className="h-9 w-40 rounded-xl bg-[#e6ebf4]" />
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {LOADING_CARDS.map((card, i) => (
            <StatCardSkeleton key={i} accent={card.accent} />
          ))}
        </div>

        {/* Mini stats row */}
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div className="h-[92px] animate-pulse rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#f97316] p-5" />
          <div className="h-[92px] animate-pulse rounded-xl bg-gradient-to-r from-[#10b981] to-[#34d399] p-5" />
          <div className="h-[92px] animate-pulse rounded-xl bg-gradient-to-r from-[#ef4444] to-[#f43f5e] p-5" />
        </div>

        {/* Charts skeletons */}
        <div className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_.85fr_.7fr]">
          <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
            <ChartSkeleton />
          </div>
          <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
            <ChartSkeleton />
          </div>
          <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
            <ChartSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}