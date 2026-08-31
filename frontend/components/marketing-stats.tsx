'use client'

import { useEffect, useRef, useState } from 'react'
import { Building2, Headphones, ShieldCheck, UsersRound, type LucideIcon } from 'lucide-react'

type MarketingStat = {
  target: number
  label: string
  suffix?: string
  compact?: boolean
  icon: LucideIcon
}

const stats: MarketingStat[] = [
  { target: 1000, suffix: '+', label: 'Messes supported', icon: Building2 },
  { target: 10000, suffix: '+', compact: true, label: 'Community members', icon: UsersRound },
  { target: 99, suffix: '%', label: 'Reliable uptime', icon: ShieldCheck },
  { target: 24, suffix: '/7', label: 'Helpful support', icon: Headphones },
]

const compactFormatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 0 })

function Stat({ stat }: { stat: MarketingStat }) {
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
  const shown = stat.compact ? compactFormatter.format(rounded) : rounded.toLocaleString('en')
  const Icon = stat.icon

  return (
    <div ref={ref} className="flex items-center justify-center gap-4 px-5 py-4 text-left">
      <Icon size={25} className="shrink-0 text-[var(--brand)]" />
      <div>
        <p className="text-xl font-semibold tabular-nums text-foreground">{shown}{stat.suffix}</p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{stat.label}</p>
      </div>
    </div>
  )
}

export function MarketingStatsBar({ className = '' }: { className?: string }) {
  return (
    <div className={`marketing-card grid overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {stats.map((stat, index) => (
        <div key={stat.label} className={`${index ? 'border-t border-[var(--marketing-line)] sm:border-l sm:border-t-0' : ''} ${index === 2 ? 'sm:border-l-0 lg:border-l' : ''}`}>
          <Stat stat={stat} />
        </div>
      ))}
    </div>
  )
}
