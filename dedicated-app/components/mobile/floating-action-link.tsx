'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

type FloatingActionLinkProps = {
  href: string
  label: string
  icon: ReactNode
}

export function FloatingActionLink({ href, label, icon }: FloatingActionLinkProps) {
  return (
    <Link href={href} aria-label={label} title={label} className="floating-action-link">
      {icon}
    </Link>
  )
}
