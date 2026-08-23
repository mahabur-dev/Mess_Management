import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type AssistantMetric = {
  label: string
  value: ReactNode
}

type AssistantMetricsCardProps = {
  icon: LucideIcon
  eyebrow: string
  title: ReactNode
  titleId: string
  subtitle?: ReactNode
  status?: ReactNode
  metrics: AssistantMetric[]
  className?: string
}

export function AssistantMetricsCard({
  icon: Icon,
  eyebrow,
  title,
  titleId,
  subtitle,
  status,
  metrics,
  className = '',
}: AssistantMetricsCardProps) {
  return (
    <section className={`assistant-metrics-card ${className}`.trim()} aria-labelledby={titleId}>
      <span className="assistant-metrics-card__glow" aria-hidden="true" />
      <span className="assistant-metrics-card__dots" aria-hidden="true" />

      <div className="assistant-metrics-card__header">
        <span className="assistant-metrics-card__icon" aria-hidden="true">
          <Icon size={23} strokeWidth={2.2} />
        </span>
        <div className="assistant-metrics-card__identity">
          <p className="assistant-metrics-card__eyebrow">{eyebrow}</p>
          <h2 id={titleId} className="assistant-metrics-card__title">{title}</h2>
          {subtitle ? <div className="assistant-metrics-card__subtitle">{subtitle}</div> : null}
        </div>
        {status ? <div className="assistant-metrics-card__status">{status}</div> : null}
      </div>

      <div className="assistant-metrics-card__metrics">
        {metrics.map((metric) => (
          <div key={metric.label} className="assistant-metrics-card__metric">
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
