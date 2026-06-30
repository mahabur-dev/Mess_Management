'use client'

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-[#e6ebf4] bg-white px-4 py-3 shadow-[0_8px_30px_rgba(65,103,153,0.12)]">
      <p className="mb-2 text-xs font-bold text-[#6b7a99]">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm font-bold text-[#172554]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
          <span>
            {entry.name}: {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}