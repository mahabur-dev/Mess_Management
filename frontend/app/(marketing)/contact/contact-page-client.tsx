'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { apiClient, type ContactRequestSource, type SubscriptionPlan } from '@/lib/api-client'

function successMessage(source: ContactRequestSource, plan?: SubscriptionPlan | null) {
  if (source === 'UPGRADE') return 'We received your upgrade request. Our management team will contact you very soon.'
  if (source === 'SUBSCRIPTION') return `We received your ${plan === 'YEARLY' ? 'yearly' : 'monthly'} subscription request. Our team will contact you very soon.`
  return 'We received your message. Our team will contact you very soon.'
}

function sourceLabel(source: ContactRequestSource, plan?: SubscriptionPlan | null) {
  if (source === 'UPGRADE') return 'Upgrade request'
  if (source === 'SUBSCRIPTION') return plan === 'YEARLY' ? 'Yearly plan' : 'Monthly plan'
  return 'Contact Messzen'
}

const inputClass = 'h-12 rounded-xl border-[var(--marketing-line)] bg-[var(--marketing-surface)] px-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus-visible:border-[var(--brand)] focus-visible:ring-[var(--brand-ring)]'
const labelClass = 'mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground'

export function ContactPageClient({ source, requestedPlan }: { source: ContactRequestSource; requestedPlan: SubscriptionPlan | null }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const title = useMemo(() => sourceLabel(source, requestedPlan), [source, requestedPlan])
  const phoneError = useMemo(() => phone && !/^\d{11}$/.test(phone) ? 'Phone number must be exactly 11 digits' : null, [phone])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (phoneError) return setError(phoneError)
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
      setName('')
      setEmail('')
      setPhone('')
      setDescription('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="marketing-page">
      <section className="marketing-section">
        <div className="mx-auto max-w-2xl">
          <div className="mb-7 text-center">
            <p className="marketing-eyebrow">{title}</p>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.035em] text-foreground sm:text-4xl">Let’s talk</h1>
            <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground">Tell us what you need and our team will get back to you.</p>
          </div>

          <Card className="marketing-card overflow-hidden rounded-2xl">
            <div className="p-6 sm:p-8">
              {success ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  <p className="flex items-center gap-2 text-lg font-black"><CheckCircle2 size={19} /> Request submitted</p>
                  <p className="mt-2 text-sm font-medium leading-7">{success}</p>
                  <Button type="button" onClick={() => router.push('/')} className="brand-button mt-5 h-11 px-5">Back to home</Button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Name</label>
                      <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className={inputClass} required />
                    </div>
                    <div>
                      <label className={labelClass}>Email</label>
                      <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className={inputClass} required />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Phone <span className="normal-case tracking-normal">(optional)</span></label>
                    <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="01712345678" pattern="\d{11}" className={inputClass} />
                    {phoneError && <p className="mt-1 text-xs font-semibold text-red-500">{phoneError}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tell us what you need help with." className={`${inputClass} min-h-[140px] py-3`} required />
                  </div>
                  {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</div>}
                  <Button type="submit" disabled={loading || Boolean(phoneError)} className="brand-button h-12 w-full px-5">
                    {loading ? 'Submitting...' : <><Send size={16} /> Submit request</>}
                  </Button>
                </form>
              )}
            </div>
          </Card>

          <button type="button" onClick={() => router.push('/')} className="mx-auto mt-6 flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-[var(--brand)]">
            <ArrowLeft size={15} /> Back to home
          </button>
        </div>
      </section>
    </main>
  )
}
