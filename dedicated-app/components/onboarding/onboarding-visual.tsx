'use client'

import type { ReactNode } from 'react'
import {
  BarChart3,
  BedDouble,
  Bell,
  Building2,
  Check,
  ClipboardCheck,
  CookingPot,
  FileText,
  IndianRupee,
  Leaf,
  LockKeyhole,
  Mic,
  ReceiptText,
  ShieldCheck,
  Users,
  UtensilsCrossed,
  WalletCards,
} from 'lucide-react'
import type { OnboardingVisual as VisualName } from '@/lib/onboarding'

type BadgePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

function FloatingBadge({ position, children }: { position: BadgePosition; children: ReactNode }) {
  return <span className={`onboarding-floating-badge onboarding-floating-badge--${position}`}>{children}</span>
}

function WaveField() {
  return (
    <svg className="onboarding-wave-field" viewBox="0 0 360 130" preserveAspectRatio="none">
      {Array.from({ length: 11 }, (_, index) => (
        <path
          key={index}
          d={`M-20 ${42 + index * 6} C 54 ${4 + index * 7}, 112 ${98 + index * 2}, 188 ${55 + index * 5} S 304 ${32 + index * 6}, 390 ${66 + index * 4}`}
        />
      ))}
    </svg>
  )
}

function BuildingBackdrop() {
  return (
    <div className="onboarding-building-backdrop">
      <Building2 size={112} strokeWidth={1.15} />
      <span className="onboarding-building-tree" />
    </div>
  )
}

function VisualPanel({ modifier, children }: { modifier: string; children: ReactNode }) {
  return (
    <div className={`onboarding-visual onboarding-visual--${modifier}`} aria-hidden="true">
      <BuildingBackdrop />
      <WaveField />
      {children}
    </div>
  )
}

export function OnboardingVisual({ visual }: { visual: VisualName }) {
  if (visual === 'brand') {
    return (
      <VisualPanel modifier="brand">
        <div className="onboarding-radar-rings" />
        <div className="onboarding-welcome-mark">
          <Building2 className="onboarding-welcome-building" size={88} strokeWidth={1.55} />
          <Leaf className="onboarding-welcome-leaf onboarding-welcome-leaf--left" size={52} strokeWidth={1.7} />
          <Leaf className="onboarding-welcome-leaf onboarding-welcome-leaf--right" size={55} strokeWidth={1.7} />
        </div>
        <FloatingBadge position="top-left"><BedDouble /></FloatingBadge>
        <FloatingBadge position="top-right"><UtensilsCrossed /></FloatingBadge>
        <FloatingBadge position="bottom-right"><FileText /></FloatingBadge>
      </VisualPanel>
    )
  }

  if (visual === 'workspace') {
    return (
      <VisualPanel modifier="workspace">
        <div className="onboarding-illustration-phone">
          <div className="onboarding-illustration-topline"><strong>Dashboard</strong><Bell size={12} /></div>
          <div className="onboarding-illustration-balance"><small>Monthly overview</small><strong>৳ 24,850</strong><i /></div>
          <div className="onboarding-illustration-grid">
            <span><Users size={17} /><small>Members</small></span>
            <span><UtensilsCrossed size={17} /><small>Meals</small></span>
            <span><ReceiptText size={17} /><small>Expenses</small></span>
            <span><WalletCards size={17} /><small>Deposits</small></span>
          </div>
          <div className="onboarding-recent-activity"><strong>Recent activity</strong><i /><i /><i /></div>
        </div>
        <FloatingBadge position="top-left"><Users /></FloatingBadge>
        <FloatingBadge position="top-right"><CookingPot /></FloatingBadge>
        <FloatingBadge position="bottom-left"><FileText /></FloatingBadge>
        <FloatingBadge position="bottom-right"><WalletCards /></FloatingBadge>
      </VisualPanel>
    )
  }

  if (visual === 'automation') {
    return (
      <VisualPanel modifier="automation">
        <div className="onboarding-radar-rings" />
        <div className="onboarding-waveform onboarding-waveform--left"><i /><i /><i /><i /><i /></div>
        <div className="onboarding-waveform onboarding-waveform--right"><i /><i /><i /><i /><i /></div>
        <div className="onboarding-mic"><Mic size={34} strokeWidth={2.1} /></div>
        <div className="onboarding-transcript">
          <span><i className="onboarding-transcript-wave" />আজ রাতের খাবার- ২৫ জন,<br />খরচ ৩,৫০০ টাকা...</span>
          <small><Check size={12} /> Preview ready</small>
        </div>
        <div className="onboarding-action-track">
          <span>৳</span><span><Users /></span><span><UtensilsCrossed /></span><span><FileText /></span>
        </div>
      </VisualPanel>
    )
  }

  return (
    <VisualPanel modifier="start">
      <div className="onboarding-radar-rings" />
      <div className="onboarding-start-mark">
        <ClipboardCheck className="onboarding-start-clipboard" size={98} strokeWidth={1.45} />
        <Building2 className="onboarding-start-building" size={60} strokeWidth={1.55} />
        <ShieldCheck className="onboarding-start-shield" size={68} strokeWidth={1.6} />
      </div>
      <FloatingBadge position="top-left"><BarChart3 /></FloatingBadge>
      <FloatingBadge position="top-right"><Users /></FloatingBadge>
      <FloatingBadge position="bottom-left"><IndianRupee /><WalletCards /></FloatingBadge>
      <FloatingBadge position="bottom-right"><LockKeyhole /></FloatingBadge>
    </VisualPanel>
  )
}
