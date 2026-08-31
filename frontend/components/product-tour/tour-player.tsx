'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { MousePointer2, Pause, Play, RefreshCw } from 'lucide-react'

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
  const [stepIndex, setStepIndex] = useState(0)
  const [paused, setPaused] = useState(initialPaused)
  const [reduceMotion, setReduceMotion] = useState(false)
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
    if (paused || reduceMotion || !activeStep) return
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
  }, [activeStep, loop, onComplete, paused, reduceMotion, stepIndex, steps.length])

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
    <div className="overflow-hidden rounded-[18px] border border-[#dce7ea] bg-white shadow-[0_24px_70px_rgba(18,55,72,.16)]">
      <div className="flex items-center gap-2 border-b border-[#dce7ea] bg-[#f7f9fb] px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-rose-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="mx-auto flex h-6 w-[48%] items-center justify-center rounded-md border border-[#e2e8eb] bg-white text-[8px] font-bold text-[#7b8d92]">
          {address}
        </div>
        <button
          type="button"
          onClick={() => setPaused((current) => !current)}
          className="grid size-7 place-items-center rounded-md border border-[#dce7ea] bg-white text-[#007f76] transition hover:bg-[#ecf8f7]"
          aria-label={paused ? 'Play product tour' : 'Pause product tour'}
        >
          {paused ? <Play className="w-3" /> : <Pause className="w-3" />}
        </button>
        <button
          type="button"
          onClick={restart}
          className="grid size-7 place-items-center rounded-md border border-[#dce7ea] bg-white text-[#007f76] transition hover:bg-[#ecf8f7]"
          aria-label="Restart product tour"
        >
          <RefreshCw className="w-3" />
        </button>
      </div>

      <div className="relative aspect-[1.9/1] overflow-hidden bg-[#f4f8fb] text-[#123748]" aria-label={ariaLabel}>
        {children({ activeStep, stepIndex, typedValue })}

        {!reduceMotion ? (
          <div
            className="pointer-events-none absolute z-40 transition-[left,top] duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
            style={{ left: `${activeStep.x}%`, top: `${activeStep.y}%` }}
            aria-hidden="true"
          >
            <span key={stepIndex} className="absolute -left-2 -top-2 size-7 animate-ping rounded-full bg-[#ff7a1a]/35" />
            <MousePointer2 className="relative w-[clamp(16px,2.4vw,26px)] fill-[#123748] text-white drop-shadow-[0_3px_4px_rgba(0,0,0,.32)]" strokeWidth={1.5} />
            <div className={`absolute left-5 top-5 w-[165px] rounded-lg bg-[#102f39] px-3 py-2 text-white shadow-xl sm:w-[190px] ${activeStep.x > 65 ? '-ml-6 -translate-x-full' : ''}`}>
              <p className="text-[9px] font-semibold sm:text-[11px]">{activeStep.title}</p>
              <p className="mt-0.5 text-[7px] font-medium leading-3 text-white/70 sm:text-[9px] sm:leading-4">{activeStep.detail}</p>
            </div>
          </div>
        ) : null}

        <div className="absolute bottom-[1.5%] left-[22%] z-30 flex max-w-[72%] items-center gap-1 rounded-full border border-white/80 bg-white/90 px-2 py-1 shadow-md backdrop-blur-sm">
          {steps.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStepIndex(index)}
              aria-label={`Show step ${index + 1}: ${item.title}`}
              className={`h-1.5 rounded-full transition-all ${stepIndex === index ? 'w-4 bg-[#008d8c]' : 'w-1.5 bg-[#bfd3d7] hover:bg-[#7fa9ad]'}`}
            />
          ))}
          <span className="ml-1 whitespace-nowrap text-[6px] font-semibold uppercase tracking-wide text-[#5e747a]">{stepIndex + 1}/{steps.length}</span>
        </div>
      </div>
    </div>
  )
}
