'use client'

import { useEffect, useRef, useState } from 'react'
import { Building2, ShieldCheck, Utensils, UsersRound, type LucideIcon } from 'lucide-react'

type MarketingStat = {
  target: number
  label: string
  suffix?: string
  compact?: boolean
  icon: LucideIcon
}

const marketingStats: MarketingStat[] = [
  {
    target: 1000,
    suffix: '+',
    label: 'Hostels & Messes',
    icon: Building2,
  },
  {
    target: 10000,
    suffix: '+',
    compact: true,
    label: 'Active Users',
    icon: UsersRound,
  },
  {
    target: 50000,
    suffix: '+',
    compact: true,
    label: 'Meals Managed',
    icon: Utensils,
  },
  {
    target: 99,
    suffix: '%',
    label: 'Customer Satisfaction',
    icon: ShieldCheck,
  },
]

const compactFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 0,
})

function formatStatValue(value: number, stat: MarketingStat) {
  const roundedValue = Math.round(value)
  const displayValue = stat.compact
    ? compactFormatter.format(roundedValue)
    : roundedValue.toLocaleString('en')

  return `${displayValue}${stat.suffix ?? ''}`
}

function useCountUpOnView(target: number) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setValue(target)
      return
    }

    let frameId = 0
    let hasAnimated = false

    const animate = () => {
      const duration = 1400
      const startedAt = performance.now()

      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1)
        const easedProgress = 1 - Math.pow(1 - progress, 3)

        setValue(target * easedProgress)

        if (progress < 1) {
          frameId = requestAnimationFrame(tick)
        } else {
          setValue(target)
        }
      }

      frameId = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated) return

        hasAnimated = true
        animate()
        observer.disconnect()
      },
      { threshold: 0.35 },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frameId)
    }
  }, [target])

  return { ref, value }
}

function AnimatedStatValue({ stat }: { stat: MarketingStat }) {
  const { ref, value } = useCountUpOnView(stat.target)

  return (
    <div ref={ref}>
      <p className="min-w-[5ch] font-mono text-2xl font-black leading-none tabular-nums sm:text-3xl">
        {formatStatValue(value, stat)}
      </p>
      <p className="mt-1 text-sm font-medium text-white/90">{stat.label}</p>
    </div>
  )
}

export function MarketingStatsBar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`grid gap-4 rounded-xl bg-gradient-to-r from-[#00645c] to-[#008f85] p-5 text-white shadow-[0_18px_42px_rgba(0,107,99,0.24)] sm:grid-cols-2 lg:grid-cols-4 ${className}`}
    >
      {marketingStats.map((stat) => {
        const Icon = stat.icon

        return (
          <div key={stat.label} className="flex items-center justify-center gap-4 text-center sm:text-left">
            <Icon size={34} className="shrink-0 text-white/80" />
            <AnimatedStatValue stat={stat} />
          </div>
        )
      })}
    </div>
  )
}
