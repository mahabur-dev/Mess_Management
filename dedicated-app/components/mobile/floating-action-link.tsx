'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { appHref } from '@/lib/routes'

type FloatingActionLinkProps = {
  href: string
  label: string
  icon: ReactNode
}

export function FloatingActionLink({ href, label, icon }: FloatingActionLinkProps) {
  return (
    <Link href={appHref(href)} aria-label={label} title={label} className="floating-action-link">
      {icon}
    </Link>
  )
}
