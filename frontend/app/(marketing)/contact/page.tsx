import { ContactPageClient } from './contact-page-client'
import type { ContactRequestSource, SubscriptionPlan } from '@/lib/api-client'

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string; plan?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const source = (resolvedSearchParams?.source as ContactRequestSource) || 'CONTACT'
  const requestedPlan = (resolvedSearchParams?.plan as SubscriptionPlan) || null

  return <ContactPageClient source={source} requestedPlan={requestedPlan} />
}
