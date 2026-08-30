'use client'

import { ShieldCheck } from 'lucide-react'
import { InfoPage } from '@/components/mobile/info-page'
import { useTranslations } from '@/lib/i18n'

export default function WhyJoinPage() {
  const auth = useTranslations('auth')
  return (
    <InfoPage
      title={auth('whyJoin')}
      subtitle={auth('whyJoinPageSubtitle')}
      eyebrow={auth('memberBenefits')}
      introduction={auth('whyJoinIntroduction')}
      icon={ShieldCheck}
      sections={[
        {
          title: auth('benefitOneTitle'),
          body: auth('benefitOneBody'),
          points: [auth('benefitOnePointA'), auth('benefitOnePointB')],
        },
        {
          title: auth('benefitTwoTitle'),
          body: auth('benefitTwoBody'),
          points: [auth('benefitTwoPointA'), auth('benefitTwoPointB')],
        },
        {
          title: auth('benefitThreeTitle'),
          body: auth('benefitThreeBody'),
          points: [auth('benefitThreePointA'), auth('benefitThreePointB')],
        },
      ]}
      actions={[{ href: '/request-mess', label: auth('requestToJoin') }]}
    />
  )
}
