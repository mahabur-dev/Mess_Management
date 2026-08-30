'use client'

import { InlineNotice } from '@/components/mobile/meals-design'
import { useTranslations } from '@/lib/i18n'

export type BillingCalculationStatus = 'DIRTY' | 'PROCESSING' | 'READY' | 'FAILED'

export function billingCalculationIsPending(status?: BillingCalculationStatus | null) {
  return status === 'DIRTY' || status === 'PROCESSING'
}

export function BillingCalculationNotice({
  status,
}: {
  status?: BillingCalculationStatus | null
}) {
  const t = useTranslations('billing')

  if (billingCalculationIsPending(status)) {
    return <InlineNotice tone="warning">{t('calculationUpdating')}</InlineNotice>
  }

  if (status === 'FAILED') {
    return <InlineNotice tone="danger">{t('calculationFailed')}</InlineNotice>
  }

  return null
}
