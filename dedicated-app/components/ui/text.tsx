'use client'

import type { ElementType, ReactNode } from 'react'

type TextVariant =
  | 'header-title'
  | 'section-title'
  | 'card-title'
  | 'card-subtitle'
  | 'body'
  | 'label'
  | 'label-muted'
  | 'caption'
  | 'caption-muted'
  | 'display'
  | 'headline'

const VARIANT_CLASSES: Record<TextVariant, { className: string; defaultTag: ElementType }> = {
  'header-title': { className: 'ui-header-title', defaultTag: 'h1' },
  'section-title': { className: 'ui-section-title', defaultTag: 'h2' },
  'card-title': { className: 'ui-card-title', defaultTag: 'h3' },
  'card-subtitle': { className: 'ui-card-subtitle', defaultTag: 'p' },
  body: { className: 'ui-body', defaultTag: 'p' },
  label: { className: 'ui-label', defaultTag: 'span' },
  'label-muted': { className: 'ui-label-muted', defaultTag: 'span' },
  caption: { className: 'ui-caption', defaultTag: 'span' },
  'caption-muted': { className: 'ui-caption-muted', defaultTag: 'span' },
  display: { className: 'text-display font-semibold tracking-tight text-[#1d3a42]', defaultTag: 'h1' },
  headline: { className: 'text-headline font-semibold tracking-tight text-[#1d3a42]', defaultTag: 'h2' },
}

export function Text({
  children,
  variant = 'body',
  as,
  className = '',
  muted = false,
}: {
  children: ReactNode
  variant?: TextVariant
  as?: ElementType
  className?: string
  muted?: boolean
}) {
  const config = VARIANT_CLASSES[variant]
  const Tag = as ?? config.defaultTag

  return <Tag className={`${config.className} ${muted ? 'opacity-70' : ''} ${className}`.trim()}>{children}</Tag>
}

export function SectionTitle({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <Text variant="section-title" className={className}>{children}</Text>
}

export function CardTitle({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <Text variant="card-title" className={className}>{children}</Text>
}

export function Subtitle({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <Text variant="card-subtitle" className={className}>{children}</Text>
}

export function Label({
  children,
  muted = false,
  className = '',
}: {
  children: ReactNode
  muted?: boolean
  className?: string
}) {
  return <Text variant={muted ? 'label-muted' : 'label'} className={className}>{children}</Text>
}

export function Caption({
  children,
  muted = false,
  className = '',
}: {
  children: ReactNode
  muted?: boolean
  className?: string
}) {
  return <Text variant={muted ? 'caption-muted' : 'caption'} className={className}>{children}</Text>
}