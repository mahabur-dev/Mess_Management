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
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground">
      <p className="mb-2 text-xs font-bold text-muted-foreground">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm font-bold text-foreground">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
          <span>
            {entry.name}: {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}
