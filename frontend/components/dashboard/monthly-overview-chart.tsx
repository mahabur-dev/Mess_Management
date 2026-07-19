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
      <div className="h-4 w-1/3 rounded bg-[#e6ebf4]" />
      <div className="w-full rounded-xl bg-[#f1f5f9]" style={{ height }} />
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
          <TrendingUp size={32} className="mx-auto mb-2 text-[#cbd5e1]" />
          <p className="text-sm font-semibold text-[#6b7a99]">No data available for this month</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid stroke="#e6ebf4" vertical={false} />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          fontSize={11}
          tick={{ fill: '#6b7a99' }}
          interval="preserveStartEnd"
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          fontSize={11}
          tick={{ fill: '#6b7a99' }}
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
          stroke="#58d68d"
          strokeWidth={3}
          dot={false}
          name="Expense"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
