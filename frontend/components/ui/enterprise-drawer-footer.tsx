'use client'

import type { ComponentProps, ReactNode } from 'react'

import { EnterpriseButton } from '@/components/ui/enterprise-button'
import { cn } from '@/lib/utils'

type DrawerActionPriority = 'primary' | 'secondary'

/**
 * Shared drawer action layout. It keeps every drawer's actions anchored in the
 * footer, gives all actions a consistent 44px target, and stacks safely on mobile.
 */
export function EnterpriseDrawerFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center', className)}>
      {children}
    </div>
  )
}

interface EnterpriseDrawerActionProps extends Omit<ComponentProps<typeof EnterpriseButton>, 'size' | 'className'> {
  priority?: DrawerActionPriority
  className?: string
}

/** A consistently sized, labelled action for a shared drawer footer. */
export function EnterpriseDrawerAction({ priority = 'secondary', className, ...props }: EnterpriseDrawerActionProps) {
  return (
    <EnterpriseButton
      size="md"
      className={cn(
        'w-full shrink-0 sm:w-auto',
        priority === 'primary' ? 'sm:flex-1' : 'sm:min-w-32',
        className,
      )}
      {...props}
    />
  )
}
