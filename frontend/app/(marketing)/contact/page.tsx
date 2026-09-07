import { ContactPageClient } from './contact-page-client'
import type { ContactRequestSource, SubscriptionPlan } from '@/lib/api-client'

const CONTACT_SOURCES: ContactRequestSource[] = ['CONTACT', 'UPGRADE', 'SUBSCRIPTION']
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = ['MONTHLY', 'YEARLY']

function contactSource(value?: string): ContactRequestSource {
  const normalized = value?.toUpperCase() as ContactRequestSource | undefined
  return normalized && CONTACT_SOURCES.includes(normalized) ? normalized : 'CONTACT'
}

function subscriptionPlan(value?: string): SubscriptionPlan | null {
  const normalized = value?.toUpperCase() as SubscriptionPlan | undefined
  return normalized && SUBSCRIPTION_PLANS.includes(normalized) ? normalized : null
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string; plan?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const source = contactSource(resolvedSearchParams?.source)
  const requestedPlan = source === 'SUBSCRIPTION' ? subscriptionPlan(resolvedSearchParams?.plan) : null

  return <ContactPageClient source={source} requestedPlan={requestedPlan} />
}
