import { ContactPageClient } from './contact-page-client'
import type { ContactRequestSource, SubscriptionPlan } from '@/lib/api-client'

export default function ContactPage({
  searchParams,
}: {
  searchParams?: { source?: string; plan?: string }
}) {
  const source = (searchParams?.source as ContactRequestSource) || 'CONTACT'
  const requestedPlan = (searchParams?.plan as SubscriptionPlan) || null

  return <ContactPageClient source={source} requestedPlan={requestedPlan} />
}
