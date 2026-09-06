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
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title="Contact & Upgrade"
        description="Submit upgrade, subscription, or support requests without leaving the dashboard"
        showUpgradeButton={false}
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              <BadgeCheck size={12} />
              {currentTitle}
            </span>
            {requestedPlan && (
              <span className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                {requestedPlan.toLowerCase()} plan
              </span>
            )}
          </div>

          <Card className="overflow-hidden border border-border bg-background ">
            <div className="p-6 sm:p-8">
              {success ? (
                <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 text-primary">
                  <p className="text-lg font-semibold">Request submitted</p>
                  <p className="mt-2 text-sm font-semibold leading-7">{success}</p>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Name</label>
                      <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your name"
                        className="h-12 rounded-xl border-border bg-background px-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Email</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="h-12 rounded-xl border-border bg-background px-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Phone</label>
                    <Input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+8801XXXXXXXXX"
                      className="h-12 rounded-xl border-border bg-background px-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Description</label>
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Tell us what you need help with."
                      className="min-h-[140px] rounded-xl border-border bg-background px-4 py-3 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                      required
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full rounded-xl  bg-primary  px-5 font-semibold text-primary-foreground  hover:bg-primary "
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
