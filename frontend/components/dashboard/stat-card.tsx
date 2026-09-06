import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type DashboardStatCardProps = {
  label: string
  value: string | number
  description?: string
  destructive?: boolean
  featured?: boolean
  className?: string
}

export function DashboardStatCard({
  label,
  value,
  description,
  destructive = false,
  featured = false,
  className,
}: DashboardStatCardProps) {
  return (
    <Card
      data-featured={featured || undefined}
      className={cn('gap-0 py-0 shadow-none', className)}
    >
      <CardContent className="flex min-h-[92px] flex-col justify-between p-3.5">
        <p className={cn('text-xs font-medium text-muted-foreground', featured && 'text-primary-foreground/75')}>{label}</p>
        <div className="mt-2">
          <p
            className={cn(
              'truncate text-xl font-semibold tracking-tight text-foreground tabular-nums',
              featured && 'text-primary-foreground',
              destructive && 'text-destructive',
            )}
          >
            {value}
          </p>
          {description ? (
            <p className={cn('mt-0.5 text-[11px] leading-4 text-muted-foreground', featured && 'text-primary-foreground/75')}>{description}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
