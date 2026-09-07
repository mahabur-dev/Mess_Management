'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { MousePointer2, Pause, Play, RefreshCw } from 'lucide-react'
import { useLocaleFormatters, useTranslations } from '@/lib/i18n'

export type ProductTourStep = {
  id: string
  title: string
  detail: string
  x: number
  y: number
  duration: number
  typeText?: string
}

type TourRenderContext<TStep extends ProductTourStep> = {
  activeStep: TStep
  stepIndex: number
  typedValue: string
}

type ProductTourPlayerProps<TStep extends ProductTourStep> = {
  steps: readonly TStep[]
  address: string
  ariaLabel: string
  children: (context: TourRenderContext<TStep>) => ReactNode
  initialPaused?: boolean
  loop?: boolean
  onComplete?: () => void
}

export function ProductTourPlayer<TStep extends ProductTourStep>({
  steps,
  address,
  ariaLabel,
  children,
  initialPaused = false,
  loop = true,
  onComplete,
}: ProductTourPlayerProps<TStep>) {
  const t = useTranslations('marketing')
  const format = useLocaleFormatters()
  const [stepIndex, setStepIndex] = useState(0)
  const [paused, setPaused] = useState(initialPaused)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [typedValue, setTypedValue] = useState('')
  const activeStep = steps[stepIndex]

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.05 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (paused || reduceMotion || !isVisible || !activeStep) return
    const timer = window.setTimeout(() => {
      if (stepIndex < steps.length - 1) {
        setStepIndex((current) => current + 1)
        return
      }
      if (loop) {
        setStepIndex(0)
        return
      }
      onComplete?.()
    }, activeStep.duration)
    return () => window.clearTimeout(timer)
  }, [activeStep, isVisible, loop, onComplete, paused, reduceMotion, stepIndex, steps.length])

  useEffect(() => {
    setTypedValue('')
    const typeText = activeStep?.typeText
    if (!typeText) return

    let character = 0
    const timer = window.setInterval(() => {
      character += 1
      setTypedValue(typeText.slice(0, character))
      if (character >= typeText.length) window.clearInterval(timer)
    }, 125)

    return () => window.clearInterval(timer)
  }, [activeStep])

  if (!activeStep) return null

  const restart = () => {
    setStepIndex(0)
    setPaused(false)
  }

  return (
    <div ref={rootRef} className="marketing-animation overflow-hidden rounded-[18px] border border-[var(--marketing-line)] bg-[var(--marketing-surface)]">
      <div className="flex items-center gap-2 border-b border-[var(--marketing-line)] bg-[var(--marketing-surface)] px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[var(--brand)]" />
          <span className="size-2.5 rounded-full bg-[var(--brand-border)]" />
          <span className="size-2.5 rounded-full bg-[var(--brand-dark)]" />
        </div>
        <div className="mx-auto flex h-6 w-[48%] items-center justify-center rounded-md border border-[var(--marketing-line)] bg-[var(--marketing-surface)] text-[8px] font-bold text-muted-foreground">
          {address}
        </div>
        <button
          type="button"
          onClick={() => setPaused((current) => !current)}
          className="grid size-7 place-items-center rounded-md border border-[var(--marketing-line)] bg-[var(--marketing-surface)] text-[var(--brand)] transition hover:bg-[var(--brand-soft)]"
          aria-label={paused ? t('tour.play') : t('tour.pause')}
        >
          {paused ? <Play className="w-3" /> : <Pause className="w-3" />}
        </button>
        <button
          type="button"
          onClick={restart}
          className="grid size-7 place-items-center rounded-md border border-[var(--marketing-line)] bg-[var(--marketing-surface)] text-[var(--brand)] transition hover:bg-[var(--brand-soft)]"
          aria-label={t('tour.restart')}
        >
          <RefreshCw className="w-3" />
        </button>
      </div>

        <div className="relative aspect-[1.9/1] overflow-hidden bg-[var(--marketing-subtle)] text-foreground" aria-label={ariaLabel}>
        {children({ activeStep, stepIndex, typedValue })}

        {!reduceMotion ? (
          <div
            className="pointer-events-none absolute z-40 transition-[left,top] duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
            style={{ left: `${activeStep.x}%`, top: `${activeStep.y}%` }}
            aria-hidden="true"
          >
            <span key={stepIndex} className="absolute -left-2 -top-2 size-7 animate-ping rounded-full bg-[var(--brand)]/25" />
            <MousePointer2 className="relative w-[clamp(16px,2.4vw,26px)] fill-[var(--brand-dark)] text-white" strokeWidth={1.5} />
            <div
              className="absolute top-5 w-[165px] rounded-lg bg-[var(--brand-dark)] px-3 py-2 text-white sm:w-[190px]"
              style={activeStep.x > 65 ? { right: '1.25rem' } : { left: '1.25rem' }}
            >
              <p className="text-[9px] font-semibold sm:text-[11px]">{activeStep.title}</p>
              <p className="mt-0.5 text-[7px] font-medium leading-3 text-white/70 sm:text-[9px] sm:leading-4">{activeStep.detail}</p>
            </div>
          </div>
        ) : null}

        <div className="absolute bottom-[1.5%] left-[22%] z-30 flex max-w-[72%] items-center gap-1 rounded-full border border-[var(--marketing-line)] bg-[var(--marketing-surface)]/90 px-2 py-1">
          {steps.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStepIndex(index)}
              aria-label={t('tour.showStep', { step: format.number(index + 1), title: item.title })}
              className={`h-1.5 rounded-full transition-all ${stepIndex === index ? 'w-4 bg-[var(--brand)]' : 'w-1.5 bg-[var(--brand-border-subtle)] hover:bg-[var(--brand-border)]'}`}
            />
          ))}
          <span className="ml-1 whitespace-nowrap text-[6px] font-semibold uppercase tracking-wide text-muted-foreground">{format.number(stepIndex + 1)}/{format.number(steps.length)}</span>
        </div>
      </div>
    </div>
  )
}
