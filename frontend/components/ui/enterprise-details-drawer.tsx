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
      <SheetContent className="dashboard-portal-surface enterprise-details-drawer w-full gap-0 overflow-hidden border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-0 sm:max-w-[42rem]">
        <SheetHeader className="shrink-0 border-b border-border bg-background p-5 pr-14 sm:p-6 sm:pr-16">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">{headerIcon}</span>
              <div className="min-w-0">
                <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">{eyebrow}</p>
                <SheetTitle className="break-words text-xl font-semibold tracking-tight">{title}</SheetTitle>
                {description && <SheetDescription className="break-words leading-6">{description}</SheetDescription>}
              </div>
            </div>
            {status && <div className="mt-1 shrink-0">{status}</div>}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--dashboard-bg)] p-4 sm:p-6">{children}</div>

        {footer && <div className="shrink-0 border-t border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-3  sm:p-4">{footer}</div>}
      </SheetContent>
    </Sheet>
  )
}
