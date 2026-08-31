'use client'

import type { ReactNode } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface EnterpriseDetailsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eyebrow: string
  title: string
  description?: string
  headerIcon: ReactNode
  status?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function EnterpriseDetailsDrawer({
  open,
  onOpenChange,
  eyebrow,
  title,
  description,
  headerIcon,
  status,
  children,
  footer,
}: EnterpriseDetailsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="enterprise-details-drawer w-full gap-0 overflow-hidden border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-0 shadow-2xl sm:max-w-[42rem]">
        <SheetHeader className="shrink-0 border-b border-[var(--dashboard-line)] bg-[linear-gradient(135deg,var(--dashboard-surface),var(--brand-softer))] p-5 pr-14 sm:p-6 sm:pr-16">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">{headerIcon}</span>
              <div className="min-w-0">
                <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">{eyebrow}</p>
                <SheetTitle className="truncate text-xl font-semibold tracking-tight">{title}</SheetTitle>
                {description && <SheetDescription className="truncate font-semibold">{description}</SheetDescription>}
              </div>
            </div>
            {status && <div className="mt-1 shrink-0">{status}</div>}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--dashboard-bg)] p-4 sm:p-6">{children}</div>

        {footer && <div className="shrink-0 border-t border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-3 shadow-[0_-12px_30px_color-mix(in_srgb,var(--dashboard-ink)_6%,transparent)] sm:p-4">{footer}</div>}
      </SheetContent>
    </Sheet>
  )
}
