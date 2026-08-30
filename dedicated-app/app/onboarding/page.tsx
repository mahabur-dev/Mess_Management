'use client'

import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, BookOpenCheck, Check, Play, X } from 'lucide-react'
import { BrandBuildingArt } from '@/components/brand-building-art'
import { LoadingIndicator } from '@/components/loading-indicator'
import { useNativeBackAction } from '@/components/native-back-actions'
import { OnboardingVisual } from '@/components/onboarding/onboarding-visual'
import { Button } from '@/components/ui/button'
import {
  buildLoginPath,
  completeOnboarding,
  hasCompletedOnboarding,
  readPostOnboardingPath,
} from '@/lib/auth'
import { onboardingSlides } from '@/lib/onboarding'
import { useTranslations } from '@/lib/i18n'
import { useDialogFocus } from '@/hooks/use-dialog-focus'

export default function OnboardingPage() {
  const router = useRouter()
  const auth = useTranslations('auth')
  const common = useTranslations('common')
  const [ready, setReady] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [guideOpen, setGuideOpen] = useState(false)
  const [videoNotice, setVideoNotice] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const guideDialogRef = useRef<HTMLDivElement>(null)
  const guideCloseRef = useRef<HTMLButtonElement>(null)
  const lastIndex = onboardingSlides.length - 1
  const slide = onboardingSlides[activeIndex]
  const slideCopy = {
    welcome: { eyebrow: '', title: auth('onboardingWelcomeTitle'), description: auth('onboardingWelcomeDescription') },
    workspace: { eyebrow: '', title: auth('onboardingWorkspaceTitle'), description: auth('onboardingWorkspaceDescription') },
    automation: { eyebrow: auth('onboardingAutomationEyebrow'), title: auth('onboardingAutomationTitle'), description: auth('onboardingAutomationDescription') },
    start: { eyebrow: '', title: auth('onboardingStartTitle'), description: auth('onboardingStartDescription') },
  }[slide.id]

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

  useDialogFocus({
    open: guideOpen,
    containerRef: guideDialogRef,
    initialFocusRef: guideCloseRef,
    onClose: () => setGuideOpen(false),
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

  if (!ready) return <LoadingIndicator variant="screen" label={common('preparingApplication')} />

  return (
    <div className="onboarding-screen">
      <BrandBuildingArt placement="onboarding" />
      <main className="onboarding-shell" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <header className="onboarding-header">
          <span className="onboarding-mini-brand">MESSZEN</span>
          <div className="onboarding-header-actions">
            {activeIndex < lastIndex ? (
              <Button type="button" variant="secondary" size="sm" className="onboarding-skip" onClick={finishOnboarding}>
                {auth('skip')}
              </Button>
            ) : null}
          </div>
        </header>

        <section className="onboarding-slide" key={slide.id} aria-live="polite">
          <OnboardingVisual visual={slide.visual} />
          <div className="onboarding-copy">
            {slideCopy.eyebrow ? <p>{slideCopy.eyebrow}</p> : null}
            <h1>{slideCopy.title}</h1>
            <span>{slideCopy.description}</span>
          </div>

          {slide.visual === 'automation' ? (
            <div className="onboarding-secondary-actions">
              <Button type="button" variant="secondary" onClick={() => setGuideOpen(true)}>
                <BookOpenCheck size={17} /> {auth('howMesszenWorks')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setVideoNotice(true)
                  window.setTimeout(() => setVideoNotice(false), 2400)
                }}
              >
                <Play size={16} fill="currentColor" /> {auth('demoVideo')}
              </Button>
            </div>
          ) : null}

          {videoNotice ? <p className="onboarding-video-notice" role="status">{auth('demoComingSoon')}</p> : null}
        </section>

        <footer className="onboarding-footer">
          <div className="onboarding-dots" aria-label={auth('slidePosition', { current: activeIndex + 1, total: onboardingSlides.length })}>
            {onboardingSlides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={auth('goToSlide', { number: index + 1 })}
                aria-current={index === activeIndex ? 'step' : undefined}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
          <Button type="button" className="onboarding-continue" onClick={goForward}>
            <span>{activeIndex === lastIndex ? auth('getStarted') : auth('continue')}</span>
            {activeIndex === lastIndex ? <Check size={19} strokeWidth={2.7} /> : <ArrowRight size={19} strokeWidth={2.5} />}
          </Button>
        </footer>
      </main>

      {guideOpen ? (
        <div ref={guideDialogRef} className="onboarding-guide-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-guide-title" tabIndex={-1} onClick={(event) => {
          if (event.target === event.currentTarget) setGuideOpen(false)
        }}>
          <section className="onboarding-guide-sheet">
            <div className="onboarding-guide-heading">
              <div><p>{auth('quickGuide')}</p><h2 id="onboarding-guide-title">{auth('howMesszenWorks')}</h2></div>
              <button ref={guideCloseRef} type="button" aria-label={auth('closeGuide')} onClick={() => setGuideOpen(false)}><X size={19} /></button>
            </div>
            <ol>
              <li><span>1</span><div><strong>{auth('guideCreateTitle')}</strong><small>{auth('guideCreateDescription')}</small></div></li>
              <li><span>2</span><div><strong>{auth('guideRecordTitle')}</strong><small>{auth('guideRecordDescription')}</small></div></li>
              <li><span>3</span><div><strong>{auth('guideReviewTitle')}</strong><small>{auth('guideReviewDescription')}</small></div></li>
            </ol>
            <Button type="button" className="onboarding-guide-done" onClick={() => setGuideOpen(false)}>
              {auth('gotIt')}
            </Button>
          </section>
        </div>
      ) : null}
    </div>
  )
}
