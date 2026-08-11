'use client'

import { FileCheck2 } from 'lucide-react'
import { InfoPage } from '@/components/mobile/info-page'

export default function TermsAndConditionsPage() {
  return (
    <InfoPage
      title="Terms & Conditions"
      subtitle="Rules for using Messzen"
      eyebrow="TERMS OF USE"
      introduction="These terms explain the responsibilities that help keep Messzen and every shared mess workspace accurate, secure and dependable."
      icon={FileCheck2}
      sections={[
        {
          title: 'Accepting these terms',
          body: 'By creating an account or using Messzen, you agree to follow these terms and the policies made available inside the app.',
        },
        {
          title: 'Your account',
          points: [
            'Provide accurate account information and keep it updated',
            'Keep your password and access credentials confidential',
            'Notify support if you believe your account has been used without permission',
          ],
        },
        {
          title: 'Workspace responsibilities',
          body: 'Members and managers are responsible for reviewing meals, expenses, deposits, utilities and billing entries before confirming or relying on them.',
        },
        {
          title: 'Acceptable use',
          points: [
            'Do not misuse the service, interfere with its operation or attempt unauthorized access',
            'Do not submit unlawful, misleading or harmful information',
            'Respect the privacy and access rights of other workspace members',
          ],
        },
        {
          title: 'Subscriptions and availability',
          body: 'Plan features, pricing and service availability may change. Current subscription details shown in the app apply to the connected mess workspace.',
        },
        {
          title: 'Changes and support',
          body: 'We may update these terms as Messzen evolves. Material updates will be made available in the app. Contact support if you have questions about these terms.',
        },
      ]}
      actions={[
        { href: '/privacy-policy', label: 'Read our Privacy Policy' },
        { href: '/contact-us', label: 'Contact us about these terms' },
      ]}
    />
  )
}
