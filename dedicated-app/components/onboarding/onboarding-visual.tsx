'use client'

import Image from 'next/image'
import {
  Building2,
  Check,
  Mic,
  ReceiptText,
  Sparkles,
  Users,
  UtensilsCrossed,
  WalletCards,
} from 'lucide-react'
import type { OnboardingVisual as VisualName } from '@/lib/onboarding'

export function OnboardingVisual({ visual }: { visual: VisualName }) {
  if (visual === 'brand') {
    return (
      <div className="onboarding-visual onboarding-visual--brand" aria-hidden="true">
        <div className="onboarding-logo-halo" />
        <div className="onboarding-logo-shell">
          <Image src="/messZen.webp" alt="" width={190} height={190} priority />
        </div>
        <span className="onboarding-brand-wordmark">MESSZEN</span>
      </div>
    )
  }

  if (visual === 'workspace') {
    return (
      <div className="onboarding-visual onboarding-visual--workspace" aria-hidden="true">
        <span className="onboarding-orbit onboarding-orbit--one" />
        <span className="onboarding-orbit onboarding-orbit--two" />
        <div className="onboarding-illustration-phone">
          <div className="onboarding-illustration-topline"><Building2 size={17} /><span /></div>
          <div className="onboarding-illustration-balance"><small>Monthly overview</small><strong>৳ 24,850</strong></div>
          <div className="onboarding-illustration-grid">
            <span><Users size={17} /><small>Members</small></span>
            <span><UtensilsCrossed size={17} /><small>Meals</small></span>
            <span><ReceiptText size={17} /><small>Expenses</small></span>
            <span><WalletCards size={17} /><small>Deposits</small></span>
          </div>
        </div>
      </div>
    )
  }

  if (visual === 'automation') {
    return (
      <div className="onboarding-visual onboarding-visual--automation" aria-hidden="true">
        <span className="onboarding-spark onboarding-spark--one"><Sparkles size={20} /></span>
        <span className="onboarding-spark onboarding-spark--two"><Sparkles size={14} /></span>
        <div className="onboarding-voice-ring onboarding-voice-ring--outer" />
        <div className="onboarding-voice-ring onboarding-voice-ring--inner" />
        <div className="onboarding-mic"><Mic size={34} strokeWidth={2.1} /></div>
        <div className="onboarding-transcript">
          <span>“আজ বাজার ৮৫০ টাকা...”</span>
          <small><Check size={12} /> Preview ready</small>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-visual onboarding-visual--start" aria-hidden="true">
      <span className="onboarding-celebration onboarding-celebration--one" />
      <span className="onboarding-celebration onboarding-celebration--two" />
      <div className="onboarding-start-building">
        <Building2 size={78} strokeWidth={1.45} />
        <span className="onboarding-start-check"><Check size={27} strokeWidth={3} /></span>
      </div>
      <div className="onboarding-start-members">
        <span>M</span><span>R</span><span>S</span><strong>+8</strong>
      </div>
    </div>
  )
}
