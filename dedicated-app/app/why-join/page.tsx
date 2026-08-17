'use client'

import { ShieldCheck } from 'lucide-react'
import { InfoPage } from '@/components/mobile/info-page'

export default function WhyJoinPage() {
  return (
    <InfoPage
      title="Why join a mess?"
      subtitle="See what you gain from a shared workspace"
      eyebrow="MEMBER BENEFITS"
      introduction="Keep your everyday mess life organised, transparent and easier to manage with your manager and fellow members."
      icon={ShieldCheck}
      sections={[
        {
          title: 'One clear place for everything',
          body: 'Meals, expenses, utilities and deposits stay together in one shared workspace.',
          points: ['Less confusion', 'Fewer manual follow-ups'],
        },
        {
          title: 'Know your monthly position',
          body: 'Review your bill, deposits, meal usage and balance with better visibility.',
          points: ['Track what you paid', 'Understand what is due'],
        },
        {
          title: 'Stay informed in real time',
          body: 'Get important manager notices and updates without relying on separate chats.',
          points: ['Timely announcements', 'Clear member communication'],
        },
      ]}
      actions={[{ href: '/request-mess', label: 'Request to join a mess' }]}
    />
  )
}
