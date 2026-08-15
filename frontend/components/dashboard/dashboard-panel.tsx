import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DashboardPanelProps {
  title?: string
  eyebrow?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function DashboardPanel({
  title,
  eyebrow,
  action,
  children,
  className,
  contentClassName,
}: DashboardPanelProps) {
  const hasHeader = Boolean(title || eyebrow || action)

  return (
    <section className={cn('dashboard-panel overflow-hidden', className)}>
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-5">
          <div>
            {eyebrow && <p className="dashboard-eyebrow">{eyebrow}</p>}
            {title && (
              <h2 className={cn('dashboard-card-title', eyebrow && 'mt-1')}>
                {title}
              </h2>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={cn('p-5', contentClassName)}>{children}</div>
    </section>
  )
}
