'use client'

import { TrendingUp } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartTooltip } from './chart-tooltip'

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-1/3 rounded bg-muted" />
      <div className="w-full rounded-xl bg-muted" style={{ height }} />
    </div>
  )
}

export function MonthlyOverviewChart({
  data,
  isLoading,
}: {
  data: Array<{ day: string; income: number; expense: number }>
  isLoading: boolean
}) {
  if (isLoading) return <ChartSkeleton />

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center">
        <div className="text-center">
          <TrendingUp size={32} className="mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm font-semibold text-muted-foreground">No data available for this month</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid stroke="var(--dashboard-line)" vertical={false} />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          fontSize={11}
          tick={{ fill: 'var(--dashboard-muted)' }}
          interval="preserveStartEnd"
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          fontSize={11}
          tick={{ fill: 'var(--dashboard-muted)' }}
        />
        <Tooltip content={<ChartTooltip />} />
        <Line
          type="monotone"
          dataKey="income"
          stroke="var(--brand)"
          strokeWidth={3}
          dot={false}
          name="Income"
        />
        <Line
          type="monotone"
          dataKey="expense"
          stroke="var(--chart-3)"
          strokeWidth={3}
          dot={false}
          name="Expense"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
