'use client'

import { useLocaleFormatters } from '@/lib/i18n'

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  const format = useLocaleFormatters()
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>
      {payload.map((entry, i) => (
        <div key={`${entry.name}-${i}`} className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
          <span>
            {entry.name}: {format.number(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}
