'use client'

import { ContactRound } from 'lucide-react'
import { InfoPage } from '@/components/mobile/info-page'

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@messzen.com'

export default function ContactUsPage() {
  return (
    <InfoPage
      title="Contact Us"
      subtitle="Help when you need it"
      eyebrow="SUPPORT"
      introduction="Tell us what happened and include the affected month or feature so the team can help quickly."
      icon={ContactRound}
      sections={[
        { title: 'Account and access', body: 'Get help with sign-in, profile details, mess membership or manager access.' },
        { title: 'Meals and billing', body: 'Report a mismatch in meals, expenses, deposits, utilities or monthly calculations.' },
        { title: 'AI Quick Add', body: 'Share the transcript and expected result when voice transcription or command analysis needs attention.' },
      ]}
      actions={[
        { href: `mailto:${supportEmail}?subject=Messzen%20Support`, label: `Email ${supportEmail}`, external: true },
        { href: '/how-it-works', label: 'Read How It Works' },
      ]}
    />
  )
}
