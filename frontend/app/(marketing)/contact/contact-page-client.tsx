'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { apiClient, type ContactRequestSource, type SubscriptionPlan } from '@/lib/api-client'
import { Send, Download, Smartphone } from 'lucide-react'

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
    <main className="min-h-screen bg-[#fbfdfd] text-[#071821]">
      <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#008b80]">{currentTitle}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Send a request</h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-[#334155]">
              Fill in the form below and our team will get back to you.
            </p>
          </div>

          <Card className="overflow-hidden border border-[#d8e8e7] bg-white shadow-[0_24px_70px_rgba(0,107,99,0.10)]">
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
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#334155]">Name</label>
                      <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your name"
                        className="h-12 rounded-xl border-[#d8e8e7] bg-white px-4 text-sm font-semibold text-[#071821] placeholder:text-[#64748b] focus-visible:border-[#008b80]/60 focus-visible:ring-[#008b80]/10"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#334155]">Email</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="h-12 rounded-xl border-[#d8e8e7] bg-white px-4 text-sm font-semibold text-[#071821] placeholder:text-[#64748b] focus-visible:border-[#008b80]/60 focus-visible:ring-[#008b80]/10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#334155]">Phone</label>
                    <Input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="01712345678"
                      pattern="\d{11}"
                      title="Phone number must be exactly 11 digits"
                      className="h-12 rounded-xl border-[#d8e8e7] bg-white px-4 text-sm font-semibold text-[#071821] placeholder:text-[#64748b] focus-visible:border-[#008b80]/60 focus-visible:ring-[#008b80]/10"
                    />
                    {phoneError && (
                      <p className="mt-1 text-xs font-semibold text-red-500">{phoneError}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#334155]">Description</label>
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Tell us what you need help with."
                      className="min-h-[140px] rounded-xl border-[#d8e8e7] bg-white px-4 py-3 text-sm font-semibold text-[#071821] placeholder:text-[#64748b] focus-visible:border-[#008b80]/60 focus-visible:ring-[#008b80]/10"
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
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-[#006b63] to-[#008b80] px-5 font-black text-white shadow-[0_12px_30px_rgba(0,107,99,0.22)] hover:from-[#00574f] hover:to-[#006b63]"
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

          {/* App Download CTA */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-[#d8e8e7] shadow-[0_24px_70px_rgba(0,107,99,0.12)]">
            <div className="flex flex-col items-center gap-6 bg-gradient-to-r from-[#073735] to-[#006b63] px-6 py-8 text-center sm:flex-row sm:px-8 sm:text-left">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
                <Smartphone size={26} className="text-[#25d7c8]" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#25d7c8]">
                  Android App
                </p>
                <h2 className="mt-1 text-lg font-black tracking-tight text-white">
                  Get the Mess Management app
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-white/78">
                  Skip the browser — download the Android app and manage meals, bills, and members right from your phone.
                </p>
              </div>
              <a
                href="/app-debug.apk"
                download="mess-management-app.apk"
                className="inline-flex h-12 shrink-0 items-center gap-2.5 rounded-xl bg-white px-6 font-black text-[#006b63] shadow-[0_14px_32px_rgba(0,0,0,0.22)] transition hover:bg-[#f0f6ff]"
              >
                <Download size={16} />
                Download App
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
