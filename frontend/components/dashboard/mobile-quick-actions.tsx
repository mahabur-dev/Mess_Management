import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type MobileQuickAction = {
  href: string
  icon: LucideIcon
  label: string
}

type MobileQuickActionsProps = {
  actions: MobileQuickAction[]
  title: string
  className?: string
}

/** Compact, touch-friendly navigation for the dashboard's mobile home screen. */
export function MobileQuickActions({
  actions,
  title,
  className,
}: MobileQuickActionsProps) {
  return (
    <section className={cn('sm:hidden', className)} aria-labelledby="mobile-quick-actions-title">
      <h2
        id="mobile-quick-actions-title"
        className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--dashboard-muted)]"
      >
        {title}
      </h2>

      <nav className="grid grid-cols-3 gap-2" aria-label={title}>
        {actions.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-1.5 py-2.5 text-center transition-colors hover:border-[var(--brand-border)] hover:bg-[var(--dashboard-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)] active:bg-[var(--brand-soft)]"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--dashboard-surface-subtle)] text-[var(--brand)] transition-colors group-hover:bg-[var(--brand-soft)]">
              <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.9} />
            </span>
            <span className="line-clamp-2 text-[11px] font-semibold leading-[1.25] text-[var(--dashboard-ink)]">
              {label}
            </span>
          </Link>
        ))}
      </nav>
    </section>
  )
}
