'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

type AssistantInfoCardProps = {
  eyebrow: string
  title: string
  description: ReactNode
  icon: LucideIcon
  className?: string
}

export function AssistantInfoCard({
  eyebrow,
  title,
  description,
  icon: Icon,
  className = '',
}: AssistantInfoCardProps) {
  return (
    <Card variant="hero" className={`assistant-info-card ${className}`.trim()}>
      <span className="assistant-info-card__glow" aria-hidden="true" />
      <span className="assistant-info-card__dots" aria-hidden="true" />
      <div className="assistant-info-card__heading">
        <div className="min-w-0 flex-1">
          <p className="assistant-info-card__eyebrow">{eyebrow}</p>
          <h1 className="assistant-info-card__title">{title}</h1>
        </div>
        <span className="assistant-info-card__icon" aria-hidden="true">
          <Icon size={23} strokeWidth={2.2} />
        </span>
      </div>
      <p className="assistant-info-card__description">{description}</p>
    </Card>
  )
}
