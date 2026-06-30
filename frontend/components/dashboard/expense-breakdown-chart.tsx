'use client'

import { TrendingDown } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartTooltip } from './chart-tooltip'

function ChartSkeleton({ height = 250 }: { height?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-1/3 rounded bg-[#e6ebf4]" />
      <div className="w-full rounded-xl bg-[#f1f5f9]" style={{ height }} />
    </div>
  )
}

export function ExpenseBreakdownChart({
  data,
  isLoading,
}: {
  data: Array<{ name: string; value: number; amount: number; color: string }>
  isLoading: boolean
}) {
  if (isLoading) return <ChartSkeleton />

  if (data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center">
        <div className="text-center">
          <TrendingDown size={32} className="mx-auto mb-2 text-[#cbd5e1]" />
          <p className="text-sm font-semibold text-[#6b7a99]">No expenses recorded</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={58} outerRadius={92}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-2 grid gap-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-2 text-[#172554]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold text-[#6b7a99]">{item.value}%</span>
          </div>
        ))}
      </div>
    </>
  )
}