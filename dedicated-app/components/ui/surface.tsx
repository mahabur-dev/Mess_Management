'use client'

import type { AriaRole, ReactNode } from 'react'

type SurfaceElement = 'article' | 'div' | 'section'
type SurfaceTone = 'default' | 'subtle' | 'brand'
type SurfaceElevation = 'none' | 'low'

export function Surface({
  children,
  as = 'section',
  tone = 'default',
  elevation = 'low',
  className = '',
  role,
  ariaLabel,
}: {
  children: ReactNode
  as?: SurfaceElement
  tone?: SurfaceTone
  elevation?: SurfaceElevation
  className?: string
  role?: AriaRole
  ariaLabel?: string
}) {
  const Element = as

  return (
    <Element
      className={`ui-surface ui-surface--${tone} ui-surface--${elevation} ${className}`.trim()}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </Element>
  )
}
