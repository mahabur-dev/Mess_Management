'use client'

import { useEffect, useRef, useState } from 'react'
import { Building2, Headphones, ShieldCheck, UsersRound, type LucideIcon } from 'lucide-react'
import { useLocaleFormatters, useTranslations, type MessageKey } from '@/lib/i18n'

type MarketingStat = {
  target: number
  labelKey: MessageKey<'marketing'>
  suffix?: string
  suffixNumber?: number
  compact?: boolean
  icon: LucideIcon
}

const stats: MarketingStat[] = [
  { target: 1000, suffix: '+', labelKey: 'stats.messes', icon: Building2 },
  { target: 10000, suffix: '+', compact: true, labelKey: 'stats.members', icon: UsersRound },
  { target: 99, suffix: '%', labelKey: 'stats.uptime', icon: ShieldCheck },
  { target: 24, suffixNumber: 7, labelKey: 'stats.support', icon: Headphones },
]

function Stat({ stat }: { stat: MarketingStat }) {
  const t = useTranslations('marketing')
  const format = useLocaleFormatters()
  const ref = useRef<HTMLDivElement | null>(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    let frame = 0
    let animated = false
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || animated) return
      animated = true
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setValue(stat.target)
        return observer.disconnect()
      }
      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - start) / 1200, 1)
        setValue(stat.target * (1 - Math.pow(1 - progress, 3)))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
      observer.disconnect()
    }, { threshold: 0.35 })
    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [stat.target])

  const rounded = Math.round(value)
  const shown = format.number(rounded, stat.compact ? { notation: 'compact', maximumFractionDigits: 0 } : undefined)
  const Icon = stat.icon

  return (
    <div ref={ref} className="flex items-center justify-center gap-4 px-5 py-4 text-left">
      <Icon size={25} className="shrink-0 text-[var(--brand)]" />
      <div>
        <p className="text-xl font-semibold tabular-nums text-foreground">{shown}{stat.suffixNumber ? `/${format.number(stat.suffixNumber)}` : stat.suffix}</p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{t(stat.labelKey)}</p>
      </div>
    </div>
  )
}

export function MarketingStatsBar({ className = '' }: { className?: string }) {
  return (
    <div className={`marketing-card grid overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {stats.map((stat, index) => (
        <div key={stat.labelKey} className={`${index ? 'border-t border-[var(--marketing-line)] sm:border-l sm:border-t-0' : ''} ${index === 2 ? 'sm:border-l-0 lg:border-l' : ''}`}>
          <Stat stat={stat} />
        </div>
      ))}
    </div>
  )
}
