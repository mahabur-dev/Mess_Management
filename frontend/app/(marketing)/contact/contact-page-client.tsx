'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { apiClient, type ContactRequestSource, type SubscriptionPlan } from '@/lib/api-client'
import { localizedErrorMessage, normalizeLocalizedDigits, useLocale, useTranslations } from '@/lib/i18n'

const inputClass = 'h-12 rounded-xl border-[var(--marketing-line)] bg-[var(--marketing-surface)] px-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus-visible:border-[var(--brand)] focus-visible:ring-[var(--brand-ring)]'
const labelClass = 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'

export function ContactPageClient({ source, requestedPlan }: { source: ContactRequestSource; requestedPlan: SubscriptionPlan | null }) {
  const router = useRouter()
  const { locale } = useLocale()
  const t = useTranslations('marketing')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const title = useMemo(() => {
    if (source === 'UPGRADE') return t('contact.upgradeTitle')
    if (source === 'SUBSCRIPTION') return requestedPlan === 'YEARLY' ? t('contact.yearlyTitle') : t('contact.monthlyTitle')
    return t('contact.contactTitle')
  }, [requestedPlan, source, t])
  const normalizedPhone = useMemo(() => normalizeLocalizedDigits(phone), [phone])
  const phoneError = useMemo(() => normalizedPhone && !/^\d{11}$/.test(normalizedPhone) ? t('contact.phoneError') : null, [normalizedPhone, t])

  const successMessage = () => {
    if (source === 'UPGRADE') return t('contact.upgradeSuccess')
    if (source === 'SUBSCRIPTION') {
      return t('contact.subscriptionSuccess', {
        plan: requestedPlan === 'YEARLY' ? t('contact.yearlyPlan') : t('contact.monthlyPlan'),
      })
    }
    return t('contact.contactSuccess')
  }

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
        phone: normalizedPhone || undefined,
        description,
        source,
        requestedPlan: requestedPlan ?? undefined,
      })
      setSuccess(successMessage())
      setName('')
      setEmail('')
      setPhone('')
      setDescription('')
    } catch (caught) {
      setError(localizedErrorMessage(caught, locale, t('contact.genericError')))
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
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">{t('contact.title')}</h1>
            <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground">{t('contact.description')}</p>
          </div>

          <Card className="marketing-card overflow-hidden rounded-2xl">
            <div className="p-6 sm:p-8">
              {success ? (
                <div className="rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-softer)] p-5 text-foreground">
                  <p className="flex items-center gap-2 text-lg font-semibold text-[var(--brand)]"><CheckCircle2 size={19} /> {t('contact.successTitle')}</p>
                  <p className="mt-2 text-sm font-medium leading-7">{success}</p>
                  <Button type="button" onClick={() => router.push('/')} className="brand-button mt-5 h-11 px-5">{t('contact.backHome')}</Button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="contact-name" className={labelClass}>{t('contact.name')}</label>
                      <Input id="contact-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={t('contact.namePlaceholder')} className={inputClass} required />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className={labelClass}>{t('contact.email')}</label>
                      <Input id="contact-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className={inputClass} required />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className={labelClass}>{t('contact.phone')} <span className="normal-case tracking-normal">({t('contact.phoneOptional')})</span></label>
                    <Input id="contact-phone" inputMode="numeric" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="01712345678" maxLength={11} aria-invalid={Boolean(phoneError)} aria-describedby={phoneError ? 'contact-phone-error' : undefined} className={inputClass} />
                    {phoneError && <p id="contact-phone-error" className="mt-1 text-xs font-semibold text-destructive">{phoneError}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-description" className={labelClass}>{t('contact.descriptionLabel')}</label>
                    <Textarea id="contact-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t('contact.descriptionPlaceholder')} className={`${inputClass} min-h-[140px] py-3`} required />
                  </div>
                  {error && <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive">{error}</div>}
                  <Button type="submit" disabled={loading || Boolean(phoneError)} className="brand-button h-12 w-full px-5">
                    {loading ? t('contact.submitting') : <><Send size={16} /> {t('contact.submit')}</>}
                  </Button>
                </form>
              )}
            </div>
          </Card>

          <button type="button" onClick={() => router.push('/')} className="mx-auto mt-6 flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-[var(--brand)]">
            <ArrowLeft size={15} /> {t('contact.backHome')}
          </button>
        </div>
      </section>
    </main>
  )
}
