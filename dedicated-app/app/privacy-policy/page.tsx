'use client'

import { ScrollText } from 'lucide-react'
import { InfoPage } from '@/components/mobile/info-page'

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      subtitle="Your information and choices"
      eyebrow="PRIVACY"
      introduction="This summary explains what Messzen uses to operate your mess workspace and keep its records available to authorized members."
      icon={ScrollText}
      sections={[
        { title: 'Information we use', points: ['Account and contact details you provide', 'Mess membership, meals, expenses and payment records', 'Technical information needed for security and reliable operation'] },
        { title: 'Why we use it', body: 'We use the information to provide app features, calculate shared accounts, protect access, resolve support requests and improve reliability.' },
        { title: 'Who can see records', body: 'Workspace records are available only according to each member or manager role. We do not sell personal information.' },
        { title: 'Your choices', body: 'You may update account information from Profile and contact support for privacy questions or account-data requests.' },
        { title: 'Policy updates', body: 'If this policy changes materially, the updated version and effective date will be made available in the app.' },
      ]}
      actions={[{ href: '/contact-us', label: 'Contact us about privacy' }]}
    />
  )
}
