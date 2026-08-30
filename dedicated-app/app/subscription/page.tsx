'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Crown, RefreshCw } from 'lucide-react'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MobileShell } from '@/components/mobile-shell'
import { AssistantMetricsCard } from '@/components/mobile/assistant-metrics-card'
import { TopScreen } from '@/components/top-screen'
import { StatusPill } from '@/components/ui/badge'
import { useActiveMess } from '@/hooks/use-active-mess'
import { api } from '@/lib/api'
import {
  subscriptionFeatureCopy,
  subscriptionPlanDescription,
  subscriptionPlanTitle,
  subscriptionStatusLabel,
  useLocale,
  useLocaleFormatters,
  useLocalizedNotice,
  useTranslations,
} from '@/lib/i18n'
import { appHref } from '@/lib/routes'
import { useAuth } from '../providers'

type Subscription = {
  plan: string
  status: string
  start_date: string
  end_date: string | null
}

type Plan = {
  label: string
  price: number
  days: number
  description?: string
  currency?: string
  features?: string[]
}

function daysRemaining(value?: string | null) {
  if (!value) return null
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000))
}

export default function SubscriptionPage() {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('subscription')
  const { notice, clearNotice, showError } = useLocalizedNotice('subscription')
  const { user } = useAuth()
  const { activeMess, isLoading: messLoading, retry: retryMess, status: messStatus } = useActiveMess(user)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Record<string, Plan>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (messLoading) return
    if (!activeMess?.id) {
      setLoading(false)
      return
    }

    let alive = true
    setLoading(true)
    clearNotice()

    Promise.all([api.getMessSubscription(activeMess.id), api.getSubscriptionPlans()])
      .then(([subscriptionResponse, plansResponse]) => {
        if (!alive) return
        setSubscription(subscriptionResponse.data)
        setPlans(plansResponse.data ?? {})
      })
      .catch((reason: unknown) => {
        if (!alive) return
        showError(reason, 'loadFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [activeMess?.id, clearNotice, messLoading, showError])

  const remaining = daysRemaining(subscription?.end_date)
  const subscriptionStatus = subscription?.status ?? ''
  const normalizedStatus = subscriptionStatus.toUpperCase()
  const statusTone =
    normalizedStatus === 'ACTIVE'
      ? 'success'
      : normalizedStatus === 'EXPIRED'
        ? 'danger'
        : normalizedStatus === 'CANCELLED'
          ? 'neutral'
          : 'warning'

  return (
    <MobileShell>
      <TopScreen title={t('title')} subtitle={t('subtitle')} backHref="/" />
      <div className="screen space-y-4">
        {loading || messLoading ? (
          <LoadingIndicator variant="card" label={t('loading')} />
        ) : messStatus === 'error' ? (
          <section className="ui-card text-center">
            <p className="ui-body font-semibold">{t('workspaceUnavailable')}</p>
            <button type="button" className="ui-btn ui-btn--secondary mt-4" onClick={retryMess}>
              <RefreshCw size={17} aria-hidden="true" /> {t('retry')}
            </button>
          </section>
        ) : !activeMess ? (
          <section className="ui-card text-center">
            <p className="ui-body font-semibold">{t('noMess')}</p>
          </section>
        ) : notice ? (
          <section className={`ui-notice ui-notice--${notice.tone}`} role="alert">{notice.message}</section>
        ) : (
          <>
            <AssistantMetricsCard
              icon={Crown}
              eyebrow={activeMess.name}
              title={subscriptionPlanTitle(subscription?.plan, plans[subscription?.plan ?? '']?.label, locale)}
              titleId="subscription-summary-title"
              status={<StatusPill tone={statusTone}>{subscriptionStatus ? subscriptionStatusLabel(subscriptionStatus, locale) : t('unknown')}</StatusPill>}
              metrics={[
                { label: t('started'), value: subscription?.start_date ? format.date(subscription.start_date) : t('notSet') },
                { label: t('ends'), value: subscription?.end_date ? format.date(subscription.end_date) : t('notSet') },
                { label: t('daysLeft'), value: remaining === null ? '—' : format.number(remaining) },
              ]}
            />

            <section aria-labelledby="plans-heading">
              <div className="ui-section-heading">
                <div>
                  <h2 id="plans-heading" className="ui-section-title">{t('availablePlans')}</h2>
                </div>
              </div>
              <div className="space-y-3">
                {Object.entries(plans).map(([code, plan]) => {
                  const current = code === subscription?.plan
                  return (
                    <article key={code} className="subscription-plan" data-current={current}>
                      <div className="subscription-plan-top">
                        <div>
                          <h3>{subscriptionPlanTitle(code, plan.label, locale)}</h3>
                          <p>{subscriptionPlanDescription(code, plan.description, locale) || t('daysAccess', { days: format.number(plan.days) })}</p>
                        </div>
                        {current ? <span className="subscription-current"><Check size={13} /> {t('current')}</span> : null}
                      </div>
                      <div className="subscription-plan-price">
                        <strong>{String(plan.currency || 'BDT').toUpperCase() === 'BDT' ? format.money(plan.price) : `${plan.currency} ${format.number(plan.price)}`}</strong>
                        <span>/ {t('daysUnit', { days: format.number(plan.days) })}</span>
                      </div>
                      {plan.features?.length ? (
                        <ul>{plan.features.map((feature) => <li key={feature}><Check size={14} aria-hidden="true" />{subscriptionFeatureCopy(feature, locale)}</li>)}</ul>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </section>

            <Link href={appHref('/contact-us')} className="info-page-action">
              <span>{t('contactSupport')}</span>
              <Crown size={17} aria-hidden="true" />
            </Link>
          </>
        )}
      </div>
    </MobileShell>
  )
}
