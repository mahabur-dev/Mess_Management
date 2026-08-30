'use client'

import { BookOpenCheck } from 'lucide-react'
import { InfoPage } from '@/components/mobile/info-page'
import { useTranslations } from '@/lib/i18n'

export default function HowItWorksPage() {
  const t = useTranslations('support')

  return (
    <InfoPage
      title={t('howItWorks')}
      subtitle={t('howSubtitle')}
      eyebrow={t('getStarted')}
      introduction={t('howIntroduction')}
      icon={BookOpenCheck}
      sections={[
        { title: t('howCreateTitle'), body: t('howCreateBody') },
        { title: t('howRecordTitle'), body: t('howRecordBody') },
        { title: t('howReviewTitle'), body: t('howReviewBody') },
        { title: t('howCloseTitle'), body: t('howCloseBody') },
      ]}
      actions={[{ href: '/contact-us', label: t('contactHelpAction') }]}
    />
  )
}
