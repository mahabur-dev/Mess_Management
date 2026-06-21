import { DashboardContactPageClient } from './contact-page-client'
import type { ContactRequestSource, SubscriptionPlan } from '@/lib/api-client'

function normalizeSource(value?: string): ContactRequestSource {
  const normalized = value?.toUpperCase()
  if (normalized === 'SUBSCRIPTION' || normalized === 'UPGRADE' || normalized === 'CONTACT') {
    return normalized
  }
  return 'UPGRADE'
}

function normalizePlan(value?: string): SubscriptionPlan | null {
  const normalized = value?.toUpperCase()
  if (normalized === 'TRIAL' || normalized === 'MONTHLY' || normalized === 'YEARLY') {
    return normalized
  }
  return null
}

export default function DashboardContactPage({
  searchParams,
}: {
  searchParams?: { source?: string; plan?: string }
}) {
  const source = normalizeSource(searchParams?.source)
  const requestedPlan = normalizePlan(searchParams?.plan)

  return <DashboardContactPageClient source={source} requestedPlan={requestedPlan} />
}
