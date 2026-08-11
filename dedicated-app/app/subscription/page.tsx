'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Crown, RefreshCw } from 'lucide-react'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { useActiveMess } from '@/hooks/use-active-mess'
import { api } from '@/lib/api'
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

function formatDate(value?: string | null) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return new Intl.DateTimeFormat('en-BD', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function daysRemaining(value?: string | null) {
  if (!value) return null
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000))
}

export default function SubscriptionPage() {
  const { user } = useAuth()
  const { activeMess, isLoading: messLoading, retry: retryMess, status: messStatus } = useActiveMess(user)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Record<string, Plan>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (messLoading) return
    if (!activeMess?.id) {
      setLoading(false)
      return
    }

    let alive = true
    setLoading(true)
    setError(null)

    Promise.all([api.getMessSubscription(activeMess.id), api.getSubscriptionPlans()])
      .then(([subscriptionResponse, plansResponse]) => {
        if (!alive) return
        setSubscription(subscriptionResponse.data)
        setPlans(plansResponse.data ?? {})
      })
      .catch((reason: unknown) => {
        if (!alive) return
        setError(reason instanceof Error ? reason.message : 'Unable to load subscription details.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [activeMess?.id, messLoading])

  const remaining = daysRemaining(subscription?.end_date)

  return (
    <MobileShell>
      <TopScreen title="Subscription" subtitle="Plan and billing access" backHref="/" />
      <div className="screen space-y-4">
        {loading || messLoading ? (
          <LoadingIndicator variant="card" label="Loading subscription" />
        ) : messStatus === 'error' ? (
          <section className="ui-card text-center">
            <p className="ui-body font-semibold">We could not find your workspace.</p>
            <button type="button" className="ui-btn ui-btn--secondary mt-4" onClick={retryMess}>
              <RefreshCw size={17} aria-hidden="true" /> Retry
            </button>
          </section>
        ) : !activeMess ? (
          <section className="ui-card text-center">
            <p className="ui-body font-semibold">Join or create a mess to view its subscription.</p>
          </section>
        ) : error ? (
          <section className="ui-notice ui-notice--danger" role="alert">{error}</section>
        ) : (
          <>
            <section className="subscription-hero">
              <div className="subscription-hero-heading">
                <span aria-hidden="true"><Crown size={25} strokeWidth={2.1} /></span>
                <div>
                  <p>{activeMess.name}</p>
                  <h1>{plans[subscription?.plan ?? '']?.label ?? subscription?.plan ?? 'Subscription'}</h1>
                </div>
                <span className="subscription-status">{subscription?.status ?? 'Unknown'}</span>
              </div>
              <div className="subscription-summary">
                <div><span>Started</span><strong>{formatDate(subscription?.start_date)}</strong></div>
                <div><span>Ends</span><strong>{formatDate(subscription?.end_date)}</strong></div>
                <div><span>Days left</span><strong>{remaining === null ? '—' : remaining}</strong></div>
              </div>
            </section>

            <section aria-labelledby="plans-heading">
              <div className="ui-section-heading">
                <div>
                  <h2 id="plans-heading" className="ui-section-title">Available plans</h2>
                  <p className="ui-section-subtitle">Choose the plan that fits your mess.</p>
                </div>
              </div>
              <div className="space-y-3">
                {Object.entries(plans).map(([code, plan]) => {
                  const current = code === subscription?.plan
                  return (
                    <article key={code} className="subscription-plan" data-current={current}>
                      <div className="subscription-plan-top">
                        <div>
                          <h3>{plan.label}</h3>
                          <p>{plan.description || `${plan.days} days of Messzen access`}</p>
                        </div>
                        {current ? <span className="subscription-current"><Check size={13} /> Current</span> : null}
                      </div>
                      <div className="subscription-plan-price">
                        <strong>{plan.currency || 'BDT'} {Number(plan.price).toLocaleString('en-BD')}</strong>
                        <span>/ {plan.days} days</span>
                      </div>
                      {plan.features?.length ? (
                        <ul>{plan.features.map((feature) => <li key={feature}><Check size={14} aria-hidden="true" />{feature}</li>)}</ul>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </section>

            <Link href={appHref('/contact-us')} className="info-page-action">
              <span>Contact support about your plan</span>
              <Crown size={17} aria-hidden="true" />
            </Link>
          </>
        )}
      </div>
    </MobileShell>
  )
}
