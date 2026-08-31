'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type ContactRequestSource, type SubscriptionPlan } from '@/lib/api-client'
import { BadgeCheck, Send } from 'lucide-react'

// function successMessage(source: ContactRequestSource, plan?: SubscriptionPlan | null) {
//   if (source === 'UPGRADE') {
//     return 'আপনার upgrade request পেয়ে গেছি। খুব দ্রুত আমাদের management team আপনার সাথে যোগাযোগ করবে।'
//   }

//   if (source === 'SUBSCRIPTION') {
//     const planLabel = plan === 'YEARLY' ? 'yearly' : 'monthly'
//     return `আপনার ${planLabel} subscription request পেয়ে গেছি। খুব দ্রুত আমাদের management team আপনার সাথে যোগাযোগ করবে।`
//   }

//   return 'আপনার message পেয়ে গেছি। খুব দ্রুত আমাদের team আপনার সাথে যোগাযোগ করবে।'
// }

function successMessage(source: ContactRequestSource, plan?: SubscriptionPlan | null) {
  if (source === 'UPGRADE') {
    return 'We have received your upgrade request. Our management team will contact you very soon.'
  }

  if (source === 'SUBSCRIPTION') {
          const planLabel = plan === 'YEARLY' ? 'yearly' : 'monthly'
          return `We have received your ${planLabel} subscription request. Our management team will contact you very soon.`
  }

  return 'We have received your message. Our team will contact you very soon.'
}

function sourceLabel(source: ContactRequestSource, plan?: SubscriptionPlan | null) {
  if (source === 'UPGRADE') return 'Upgrade request'
  if (source === 'SUBSCRIPTION') return plan === 'YEARLY' ? 'Yearly subscription' : 'Monthly subscription'
  return 'Contact request'
}

export function DashboardContactPageClient({
  source,
  requestedPlan,
}: {
  source: ContactRequestSource
  requestedPlan: SubscriptionPlan | null
}) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const currentTitle = useMemo(() => sourceLabel(source, requestedPlan), [source, requestedPlan])

  useEffect(() => {
    if (user?.name && !name) setName(user.name)
    if (user?.email && !email) setEmail(user.email)
    if (user?.phone && !phone) setPhone(user.phone)
  }, [email, name, phone, user])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await apiClient.createContactRequest({
        name,
        email,
        phone: phone || undefined,
        description,
        source,
        requestedPlan: requestedPlan ?? undefined,
      })

      setSuccess(successMessage(source, requestedPlan))
      setDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader
        title="Contact & Upgrade"
        description="Submit upgrade, subscription, or support requests without leaving the dashboard"
        showUpgradeButton={false}
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d8e6f8] bg-[#f8faff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">
              <BadgeCheck size={12} />
              {currentTitle}
            </span>
            {requestedPlan && (
              <span className="rounded-full border border-[#ffe3b0] bg-[#fff8e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c77b00]">
                {requestedPlan.toLowerCase()} plan
              </span>
            )}
          </div>

          <Card className="overflow-hidden border border-[#e6ebf4] bg-white shadow-[0_24px_70px_rgba(65,103,153,0.12)]">
            <div className="p-6 sm:p-8">
              {success ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                  <p className="text-lg font-semibold">Request submitted</p>
                  <p className="mt-2 text-sm font-semibold leading-7">{success}</p>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7a99]">Name</label>
                      <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your name"
                        className="h-12 rounded-xl border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] placeholder:text-[#8a9bb5] focus-visible:border-[#2f80ed]/60 focus-visible:ring-[#2f80ed]/10"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7a99]">Email</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="h-12 rounded-xl border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] placeholder:text-[#8a9bb5] focus-visible:border-[#2f80ed]/60 focus-visible:ring-[#2f80ed]/10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7a99]">Phone</label>
                    <Input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+8801XXXXXXXXX"
                      className="h-12 rounded-xl border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] placeholder:text-[#8a9bb5] focus-visible:border-[#2f80ed]/60 focus-visible:ring-[#2f80ed]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7a99]">Description</label>
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Tell us what you need help with."
                      className="min-h-[140px] rounded-xl border-[#d8e6f8] bg-white px-4 py-3 text-sm font-semibold text-[#172554] placeholder:text-[#8a9bb5] focus-visible:border-[#2f80ed]/60 focus-visible:ring-[#2f80ed]/10"
                      required
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-5 font-semibold text-white shadow-[0_12px_30px_rgba(47,128,237,0.25)] hover:from-[#1f6de0] hover:to-[#2f80ed]"
                  >
                    {loading ? (
                      'Submitting...'
                    ) : (
                      <>
                        <Send size={16} />
                        Submit request
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
