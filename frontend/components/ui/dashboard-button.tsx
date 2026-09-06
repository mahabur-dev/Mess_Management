import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DashboardButtonTone = 'primary' | 'secondary' | 'danger' | 'warning'

const toneClasses: Record<DashboardButtonTone, string> = {
  primary: 'border border-transparent bg-[var(--brand)] text-primary-foreground hover:bg-[var(--brand-hover)]',
  secondary: 'border border-[var(--dashboard-line-strong)] bg-[var(--dashboard-surface)] text-[var(--dashboard-ink)] hover:border-[var(--brand-border)] hover:bg-[var(--dashboard-hover)]',
  danger: 'border border-transparent bg-destructive text-primary-foreground hover:bg-destructive',
  warning: 'border border-transparent bg-primary/100 text-primary-foreground hover:bg-primary',
}

type DashboardButtonProps = React.ComponentProps<typeof Button> & {
  tone?: DashboardButtonTone
}

export function DashboardButton({
  tone = 'primary',
  className,
  ...props
}: DashboardButtonProps) {
  return (
    <Button
      data-dashboard-button="true"
      data-tone={tone}
      className={cn(
        'dashboard-button rounded-xl font-bold transition-[background-color,border-color,color,box-shadow,transform] active:translate-y-px',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  )
}
