'use client'

import { ScrollText } from 'lucide-react'
import { InfoPage } from '@/components/mobile/info-page'
import { useTranslations } from '@/lib/i18n'

export default function PrivacyPolicyPage() {
  const t = useTranslations('support')

  return (
    <InfoPage
      title={t('privacyPolicy')}
      subtitle={t('privacySubtitle')}
      eyebrow={t('privacyEyebrow')}
      introduction={t('privacyIntroduction')}
      icon={ScrollText}
      sections={[
        { title: t('informationUseTitle'), points: [t('informationUseAccount'), t('informationUseRecords'), t('informationUseTechnical')] },
        { title: t('whyUseTitle'), body: t('whyUseBody') },
        { title: t('recordVisibilityTitle'), body: t('recordVisibilityBody') },
        { title: t('choicesTitle'), body: t('choicesBody') },
        { title: t('policyUpdatesTitle'), body: t('policyUpdatesBody') },
      ]}
      actions={[{ href: '/contact-us', label: t('privacyContactAction') }]}
    />
  )
}
