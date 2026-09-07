'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { MousePointer2, Pause, Play, RefreshCw } from 'lucide-react'

export type MobileTourStep<TScreen extends string = string> = {
  id: string
  screen: TScreen
  title: string
  detail: string
  x: number
  y: number
  duration: number
  scrollY?: number
  activeItem?: string
}

type MobileTourPlayerProps<TStep extends MobileTourStep> = {
  steps: readonly TStep[]
  children: (step: TStep, index: number) => ReactNode
  ariaLabel: string
  presentation?: 'full' | 'device'
}

export function MobileTourPlayer<TStep extends MobileTourStep>({
  steps,
  children,
  ariaLabel,
  presentation = 'full',
}: MobileTourPlayerProps<TStep>) {
  const [stepIndex, setStepIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const rootRef = useRef<HTMLDivElement | null>(null)
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
    const requestedStep = new URLSearchParams(window.location.search).get('tourStep')
    if (!requestedStep) return
    const requestedIndex = steps.findIndex((step) => step.id === requestedStep)
    if (requestedIndex >= 0) {
      setStepIndex(requestedIndex)
      setPaused(true)
    }
  }, [steps])

  useEffect(() => {
    if (!activeStep || paused || reduceMotion || !isVisible) return
    const timer = window.setTimeout(() => setStepIndex((current) => (current + 1) % steps.length), activeStep.duration)
    return () => window.clearTimeout(timer)
  }, [activeStep, isVisible, paused, reduceMotion, steps.length])

  if (!activeStep) return null

  const isDevicePresentation = presentation === 'device'

  return (
    <div ref={rootRef} className={`marketing-animation ${isDevicePresentation ? 'w-full' : 'grid items-center gap-8 lg:grid-cols-[minmax(300px,390px)_minmax(280px,1fr)] lg:gap-12'}`}>
      <div className={`mx-auto w-full ${isDevicePresentation ? 'max-w-[340px] [@media(max-height:800px)]:max-w-[320px]' : 'max-w-[390px]'}`}>
        {!isDevicePresentation ? (
          <div className="mb-3 flex items-center justify-between rounded-xl border border-[#d8e5e7] bg-white px-3 py-2 shadow-sm">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#008d8c]">Messzen mobile app</p><p className="mt-0.5 text-xs font-bold text-[#607981]">Automatic app walkthrough</p></div>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setPaused((current) => !current)} className="grid size-8 place-items-center rounded-lg border border-[#d8e5e7] text-[#007f76]" aria-label={paused ? 'Play mobile tour' : 'Pause mobile tour'}>{paused ? <Play className="w-3.5" /> : <Pause className="w-3.5" />}</button>
              <button type="button" onClick={() => { setStepIndex(0); setPaused(false) }} className="grid size-8 place-items-center rounded-lg border border-[#d8e5e7] text-[#007f76]" aria-label="Restart mobile tour"><RefreshCw className="w-3.5" /></button>
            </div>
          </div>
        ) : null}

        <div className={`relative overflow-hidden border-[#15343d] bg-white shadow-[0_28px_80px_rgba(18,55,72,.25)] ${isDevicePresentation ? 'aspect-[9/18.35] rounded-[30px] border-[6px]' : 'aspect-[9/20] rounded-[34px] border-[7px]'}`} aria-label={ariaLabel}>
          <div key={activeStep.screen} className="absolute inset-0 animate-in fade-in duration-300">{children(activeStep, stepIndex)}</div>

          {isDevicePresentation ? (
            <>
              <span className="pointer-events-none absolute left-1/2 top-1 z-[90] h-1.5 w-14 -translate-x-1/2 rounded-full bg-[#15343d]" aria-hidden="true" />
              <span className="pointer-events-none absolute bottom-1 left-1/2 z-[90] h-1 w-16 -translate-x-1/2 rounded-full bg-[#15343d]/75" aria-hidden="true" />
            </>
          ) : null}

          {!reduceMotion ? (
            <div className="pointer-events-none absolute z-[80] transition-[left,top] duration-700 ease-[cubic-bezier(.22,1,.36,1)]" style={{ left: `${activeStep.x}%`, top: `${activeStep.y}%` }} aria-hidden="true">
              <span key={stepIndex} className="absolute -left-3 -top-3 size-9 animate-ping rounded-full bg-[#ff7a1a]/35" />
              <span className="absolute -left-2 -top-2 size-7 rounded-full border-2 border-white bg-[#ff7a1a]/80 shadow-lg" />
              <MousePointer2 className="relative ml-1 mt-1 w-5 fill-[#123748] text-white drop-shadow-md" strokeWidth={1.6} />
            </div>
          ) : null}

        </div>
        <div className={`mt-3 h-[66px] items-center gap-3 overflow-hidden rounded-xl border border-[#d8e5e7] bg-white px-3 py-2.5 shadow-sm ${isDevicePresentation ? 'flex' : 'flex lg:hidden'}`}>
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e5f6f4] text-[9px] font-semibold text-[#007f76]">{stepIndex + 1}</span>
          <div className="min-w-0"><p className="truncate text-[10px] font-semibold text-[#123748]">{activeStep.title}</p><p className="mt-0.5 line-clamp-2 text-[8px] font-medium leading-3 text-[#607981]">{activeStep.detail}</p></div>
        </div>
      </div>

      <div className={isDevicePresentation ? 'hidden' : 'hidden lg:block'}>
        <span className="inline-flex rounded-full bg-[#e2f5f3] px-3 py-1 text-[10px] font-semibold uppercase tracking-[.13em] text-[#007f76]">Step {stepIndex + 1} of {steps.length}</span>
        <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-[#123748]">{activeStep.title}</h2>
        <p className="mt-3 max-w-lg text-sm font-medium leading-7 text-[#607981]">{activeStep.detail}</p>
        <div className="mt-7 h-1.5 max-w-lg overflow-hidden rounded-full bg-[#dbe9ea]"><div className="h-full rounded-full bg-[#008d8c] transition-[width] duration-500" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} /></div>
        <div className="mt-5 flex flex-wrap gap-1.5">{steps.map((step, index) => <button key={step.id} type="button" onClick={() => setStepIndex(index)} aria-label={`Show ${step.title}`} className={`h-2 rounded-full transition-all ${index === stepIndex ? 'w-7 bg-[#008d8c]' : 'w-2 bg-[#c5d7d9] hover:bg-[#86afb0]'}`} />)}</div>
      </div>
    </div>
  )
}
