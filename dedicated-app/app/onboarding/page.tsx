'use client'

import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, BookOpenCheck, Check, Play, X } from 'lucide-react'
import { BrandBuildingArt } from '@/components/brand-building-art'
import { LoadingIndicator } from '@/components/loading-indicator'
import { useNativeBackAction } from '@/components/native-back-actions'
import { OnboardingVisual } from '@/components/onboarding/onboarding-visual'
import {
  buildLoginPath,
  completeOnboarding,
  hasCompletedOnboarding,
  readPostOnboardingPath,
} from '@/lib/auth'
import { onboardingSlides } from '@/lib/onboarding'

export default function OnboardingPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [guideOpen, setGuideOpen] = useState(false)
  const [videoNotice, setVideoNotice] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const lastIndex = onboardingSlides.length - 1
  const slide = onboardingSlides[activeIndex]

  useEffect(() => {
    if (hasCompletedOnboarding()) {
      router.replace(buildLoginPath(readPostOnboardingPath()))
      return
    }
    setReady(true)
  }, [router])

  useNativeBackAction(guideOpen || activeIndex > 0, () => {
    if (guideOpen) setGuideOpen(false)
    else setActiveIndex((current) => Math.max(0, current - 1))
    return true
  })

  function finishOnboarding() {
    completeOnboarding()
    router.replace(buildLoginPath(readPostOnboardingPath()))
  }

  function goForward() {
    if (activeIndex === lastIndex) finishOnboarding()
    else setActiveIndex((current) => Math.min(lastIndex, current + 1))
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const startX = touchStartX.current
    touchStartX.current = null
    if (startX === null) return
    const distance = (event.changedTouches[0]?.clientX ?? startX) - startX
    if (distance < -52) goForward()
    if (distance > 52 && activeIndex > 0) setActiveIndex((current) => current - 1)
  }

  if (!ready) return <LoadingIndicator variant="screen" label="Preparing Messzen" />

  return (
    <div className="onboarding-screen">
      <BrandBuildingArt placement="onboarding" />
      <main className="onboarding-shell" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <header className="onboarding-header">
          <span className="onboarding-mini-brand">MESSZEN</span>
          {activeIndex < lastIndex ? (
            <button type="button" className="onboarding-skip" onClick={finishOnboarding}>Skip</button>
          ) : <span />}
        </header>

        <section className="onboarding-slide" key={slide.id} aria-live="polite">
          <OnboardingVisual visual={slide.visual} />
          <div className="onboarding-copy">
            <p>{slide.eyebrow}</p>
            <h1>{slide.title}</h1>
            <span>{slide.description}</span>
          </div>

          {slide.visual === 'automation' ? (
            <div className="onboarding-secondary-actions">
              <button type="button" onClick={() => setGuideOpen(true)}>
                <BookOpenCheck size={17} /> How it works
              </button>
              <button
                type="button"
                onClick={() => {
                  setVideoNotice(true)
                  window.setTimeout(() => setVideoNotice(false), 2400)
                }}
              >
                <Play size={16} fill="currentColor" /> Demo video
              </button>
            </div>
          ) : null}

          {videoNotice ? <p className="onboarding-video-notice" role="status">Demo video will be added soon.</p> : null}
        </section>

        <footer className="onboarding-footer">
          <div className="onboarding-dots" aria-label={`Slide ${activeIndex + 1} of ${onboardingSlides.length}`}>
            {onboardingSlides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === activeIndex ? 'step' : undefined}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
          <button type="button" className="onboarding-continue" onClick={goForward}>
            <span>{activeIndex === lastIndex ? 'Get Started' : 'Continue'}</span>
            {activeIndex === lastIndex ? <Check size={19} strokeWidth={2.7} /> : <ArrowRight size={19} strokeWidth={2.5} />}
          </button>
        </footer>
      </main>

      {guideOpen ? (
        <div className="onboarding-guide-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-guide-title" onClick={(event) => {
          if (event.target === event.currentTarget) setGuideOpen(false)
        }}>
          <section className="onboarding-guide-sheet">
            <div className="onboarding-guide-heading">
              <div><p>QUICK GUIDE</p><h2 id="onboarding-guide-title">How Messzen works</h2></div>
              <button type="button" aria-label="Close guide" onClick={() => setGuideOpen(false)}><X size={19} /></button>
            </div>
            <ol>
              <li><span>1</span><div><strong>Create or join</strong><small>Connect everyone to one mess workspace.</small></div></li>
              <li><span>2</span><div><strong>Record daily activity</strong><small>Add meals, expenses, utilities and deposits.</small></div></li>
              <li><span>3</span><div><strong>Review together</strong><small>See monthly bills and balances with clear records.</small></div></li>
            </ol>
            <button type="button" className="onboarding-guide-done" onClick={() => setGuideOpen(false)}>Got it</button>
          </section>
        </div>
      ) : null}
    </div>
  )
}
