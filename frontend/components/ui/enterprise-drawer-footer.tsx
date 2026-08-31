'use client'

import type { ComponentProps, ReactNode } from 'react'

import { EnterpriseButton } from '@/components/ui/enterprise-button'
import { cn } from '@/lib/utils'

type DrawerActionPriority = 'primary' | 'secondary'

/**
 * Shared drawer action layout. It keeps every drawer's actions anchored in the
 * footer, uses compact 200px desktop actions, and stacks safely on mobile.
 */
export function EnterpriseDrawerFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap justify-end gap-2', className)}>
      {children}
    </div>
  )
}

interface EnterpriseDrawerActionProps extends Omit<ComponentProps<typeof EnterpriseButton>, 'size' | 'className'> {
  priority?: DrawerActionPriority
  className?: string
}

/** A consistently sized, labelled action for a shared drawer footer. */
export function EnterpriseDrawerAction({ priority: _priority = 'secondary', className, ...props }: EnterpriseDrawerActionProps) {
  return (
    <EnterpriseButton
      size="md"
      className={cn(
        'w-[min(100%,300px)] max-w-[300px] shrink-0 sm:w-[200px]',
        className,
      )}
      {...props}
    />
  )
}
