'use client'

import { BookOpenCheck } from 'lucide-react'
import { InfoPage } from '@/components/mobile/info-page'

export default function HowItWorksPage() {
  return (
    <InfoPage
      title="How It Works"
      subtitle="A simple guide to Messzen"
      eyebrow="GET STARTED"
      introduction="Manage shared meals, expenses and monthly accounts from one reliable workspace."
      icon={BookOpenCheck}
      sections={[
        { title: 'Create or join a mess', body: 'A manager creates the workspace. Members join it and use the same live records.' },
        { title: 'Record daily activity', body: 'Add meals, bazar expenses, utilities and deposits manually or through Quick Add with AI.' },
        { title: 'Review before saving', body: 'Preview every AI-generated entry, correct the details, then confirm it. Nothing is saved before confirmation.' },
        { title: 'Close the month clearly', body: 'Messzen combines meals, costs and deposits so members can review their monthly bill and balance.' },
      ]}
      actions={[{ href: '/contact-us', label: 'Need more help? Contact us' }]}
    />
  )
}
