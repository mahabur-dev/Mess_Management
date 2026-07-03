'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { apiClient, type ContactRequestSource, type SubscriptionPlan } from '@/lib/api-client'
import { Send } from 'lucide-react'

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
  if (source === 'SUBSCRIPTION') return plan === 'YEARLY' ? 'Yearly plan' : 'Monthly plan'
  return 'Contact message'
}

export function ContactPageClient({
  source,
  requestedPlan,
}: {
  source: ContactRequestSource
  requestedPlan: SubscriptionPlan | null
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const currentTitle = useMemo(() => sourceLabel(source, requestedPlan), [source, requestedPlan])

  const phoneError = useMemo(() => {
    if (!phone) return null // phone is optional, so empty is fine
    if (!/^\d{11}$/.test(phone)) return 'Phone number must be exactly 11 digits'
    return null
  }, [phone])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Client-side phone validation
    if (phone && !/^\d{11}$/.test(phone)) {
      setError('Phone number must be exactly 11 digits')
      setLoading(false)
      return
    }

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
      setName('')
      setEmail('')
      setPhone('')
      setDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fafcff] text-[#172554]">
      <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#2f80ed]">{currentTitle}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Send a request</h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-[#6b7a99]">
              Fill in the form below and our team will get back to you.
            </p>
          </div>

          <Card className="overflow-hidden border border-[#d8e6f8] bg-white shadow-[0_24px_70px_rgba(65,103,153,0.12)]">
            <div className="p-6 sm:p-8">
              {success ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                  <p className="text-lg font-black">Request submitted</p>
                  <p className="mt-2 text-sm font-semibold leading-7">{success}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      onClick={() => router.push('/')}
                      className="h-11 rounded-xl bg-emerald-600 px-5 font-black text-white hover:bg-emerald-700"
                    >
                      Back to home
                    </Button>
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Name</label>
                      <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your name"
                        className="h-12 rounded-xl border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] placeholder:text-[#8a9bb5] focus-visible:border-[#2f80ed]/60 focus-visible:ring-[#2f80ed]/10"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Email</label>
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
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Phone</label>
                    <Input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="01712345678"
                      pattern="\d{11}"
                      title="Phone number must be exactly 11 digits"
                      className="h-12 rounded-xl border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] placeholder:text-[#8a9bb5] focus-visible:border-[#2f80ed]/60 focus-visible:ring-[#2f80ed]/10"
                    />
                    {phoneError && (
                      <p className="mt-1 text-xs font-semibold text-red-500">{phoneError}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Description</label>
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
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-5 font-black text-white shadow-[0_12px_30px_rgba(47,128,237,0.25)] hover:from-[#1f6de0] hover:to-[#2f80ed]"
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
      </section>
    </main>
  )
}
