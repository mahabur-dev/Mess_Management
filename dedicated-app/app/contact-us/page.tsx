'use client'

import { ContactRound } from 'lucide-react'
import { InfoPage } from '@/components/mobile/info-page'
import { useTranslations } from '@/lib/i18n'

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@messzen.com'

export default function ContactUsPage() {
  const t = useTranslations('support')

  return (
    <InfoPage
      title={t('contactUs')}
      subtitle={t('contactSubtitle')}
      eyebrow={t('supportEyebrow')}
      introduction={t('contactIntroduction')}
      icon={ContactRound}
      sections={[
        { title: t('accountAccessTitle'), body: t('accountAccessBody') },
        { title: t('mealsBillingTitle'), body: t('mealsBillingBody') },
        { title: t('aiQuickAddTitle'), body: t('aiQuickAddBody') },
      ]}
      actions={[
        { href: `mailto:${supportEmail}?subject=Messzen%20Support`, label: t('emailSupport', { email: supportEmail }), external: true },
        { href: '/how-it-works', label: t('readHowItWorks') },
      ]}
    />
  )
}
