'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'

export type MonthlyOverviewPoint = {
  day: string
  income: number
  expense: number
  meals: number
}

const chartConfig = {
  expense: {
    label: 'Bazar',
    color: 'var(--brand)',
  },
  income: {
    label: 'Deposit',
    color: 'var(--brand)',
  },
  meals: {
    label: 'Meals',
    color: 'var(--brand)',
  },
} satisfies ChartConfig

function ChartSkeleton() {
  return (
    <div className="flex h-[240px] min-h-[210px] flex-col gap-3 p-1 xl:h-full xl:min-h-0">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="min-h-[180px] w-full flex-1" />
    </div>
  )
}

export function MonthlyOverviewChart({
  data,
  isLoading,
}: {
  data: MonthlyOverviewPoint[]
  isLoading: boolean
}) {
  if (isLoading) return <ChartSkeleton />

  if (data.length === 0) {
    return (
      <div className="flex h-[240px] min-h-[210px] items-center justify-center text-sm text-muted-foreground xl:h-full xl:min-h-0">
        No data available for this month.
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[240px] min-h-[210px] w-full aspect-auto xl:h-full xl:min-h-0">
      <BarChart data={data} margin={{ top: 12, right: 10, left: -12, bottom: 0 }} barGap={1}>
        <CartesianGrid vertical={false} strokeDasharray="2 4" />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tickMargin={10}
          minTickGap={32}
        />
        <YAxis axisLine={false} tickLine={false} tickMargin={8} width={52} />
        <ChartTooltip
          cursor={{ fill: 'var(--brand-soft)', opacity: 0.55 }}
          content={
            <ChartTooltipContent
              indicator="line"
              formatter={(value, name) => (
                <div className="flex min-w-32 items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {chartConfig[name as keyof typeof chartConfig]?.label || String(name)}
                  </span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {name === 'meals'
                      ? Number(value).toLocaleString()
                      : `৳ ${Number(value).toLocaleString()}`}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar
          dataKey="expense"
          fill="var(--color-expense)"
          fillOpacity={1}
          radius={[3, 3, 0, 0]}
          maxBarSize={9}
        />
        <Bar
          dataKey="income"
          fill="var(--color-income)"
          fillOpacity={0.68}
          radius={[3, 3, 0, 0]}
          maxBarSize={9}
        />
        <Bar
          dataKey="meals"
          fill="var(--color-meals)"
          fillOpacity={0.36}
          radius={[3, 3, 0, 0]}
          maxBarSize={9}
        />
      </BarChart>
    </ChartContainer>
  )
}
