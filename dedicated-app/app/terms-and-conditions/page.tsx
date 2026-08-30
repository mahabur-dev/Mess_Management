'use client'

import { FileCheck2 } from 'lucide-react'
import { InfoPage } from '@/components/mobile/info-page'
import { useTranslations } from '@/lib/i18n'

export default function TermsAndConditionsPage() {
  const t = useTranslations('support')

  return (
    <InfoPage
      title={t('termsConditions')}
      subtitle={t('termsSubtitle')}
      eyebrow={t('termsEyebrow')}
      introduction={t('termsIntroduction')}
      icon={FileCheck2}
      sections={[
        {
          title: t('acceptingTitle'),
          body: t('acceptingBody'),
        },
        {
          title: t('accountTitle'),
          points: [
            t('accountAccurate'),
            t('accountCredentials'),
            t('accountNotify'),
          ],
        },
        {
          title: t('workspaceResponsibilitiesTitle'),
          body: t('workspaceResponsibilitiesBody'),
        },
        {
          title: t('acceptableUseTitle'),
          points: [
            t('acceptableUseSecurity'),
            t('acceptableUseContent'),
            t('acceptableUsePrivacy'),
          ],
        },
        {
          title: t('subscriptionAvailabilityTitle'),
          body: t('subscriptionAvailabilityBody'),
        },
        {
          title: t('changesSupportTitle'),
          body: t('changesSupportBody'),
        },
      ]}
      actions={[
        { href: '/privacy-policy', label: t('readPrivacyAction') },
        { href: '/contact-us', label: t('termsContactAction') },
      ]}
    />
  )
}
