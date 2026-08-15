'use client'

import { UtensilsCrossed } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartTooltip } from './chart-tooltip'

function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-1/3 rounded bg-muted" />
      <div className="w-full rounded-xl bg-muted" style={{ height }} />
    </div>
  )
}

export function WeeklyMealsChart({
  data,
  isLoading,
}: {
  data: Array<{ day: string; breakfast: number; lunch: number; dinner: number }>
  isLoading: boolean
}) {
  if (isLoading) return <ChartSkeleton />

  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center">
        <div className="text-center">
          <UtensilsCrossed size={32} className="mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm font-semibold text-muted-foreground">No meal data this week</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid stroke="var(--dashboard-line)" vertical={false} />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          fontSize={11}
          tick={{ fill: 'var(--dashboard-muted)' }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          fontSize={11}
          tick={{ fill: 'var(--dashboard-muted)' }}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="breakfast" fill="var(--brand)" radius={[4, 4, 0, 0]} name="Breakfast" />
        <Bar dataKey="lunch" fill="var(--chart-2)" radius={[4, 4, 0, 0]} name="Lunch" />
        <Bar dataKey="dinner" fill="var(--chart-3)" radius={[4, 4, 0, 0]} name="Dinner" />
      </BarChart>
    </ResponsiveContainer>
  )
}
