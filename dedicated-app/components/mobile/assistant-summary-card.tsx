import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { ChevronRight, type LucideIcon } from 'lucide-react'

type AssistantSummaryCardProps = {
  icon: LucideIcon
  title: string
  href: ComponentProps<typeof Link>['href']
  actionLabel: string
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function AssistantSummaryCard({
  icon: Icon,
  title,
  href,
  actionLabel,
  children,
  className = '',
  contentClassName = '',
}: AssistantSummaryCardProps) {
  return (
    <section className={`assistant-summary-card ${className}`.trim()} aria-label={title}>
      <span className="assistant-summary-card__glow" aria-hidden="true" />
      <span className="assistant-summary-card__dots" aria-hidden="true" />

      <span className="assistant-summary-card__icon" aria-hidden="true">
        <Icon size={23} strokeWidth={2.2} />
      </span>

      <span className="assistant-summary-card__copy">
        <span className="assistant-summary-card__title">{title}</span>
        <span className={`assistant-summary-card__content ${contentClassName}`.trim()}>{children}</span>
      </span>

      <Link href={href} className="assistant-summary-card__action">
        {actionLabel}
        <ChevronRight size={15} strokeWidth={2.6} aria-hidden="true" />
      </Link>
    </section>
  )
}
