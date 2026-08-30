'use client'

import { useState } from 'react'
import { Building2, CheckCircle2 } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TextAreaField, TextField, SubmitButton } from '@/components/mobile/form-controls'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { appHref } from '@/lib/routes'
import { localizedErrorMessage, useLocale, useTranslations } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers'

type CreateMessForm = {
  messName: string
  messLocation: string
  messCategory: string
  totalSeats: string
  monthlyRent: string
  mealRate: string
  description: string
}

const initialForm: CreateMessForm = {
  messName: '',
  messLocation: '',
  messCategory: '',
  totalSeats: '',
  monthlyRent: '',
  mealRate: '0',
  description: '',
}

function optionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const numeric = Number(trimmed)
  return Number.isFinite(numeric) ? numeric : undefined
}

export default function CreateMessPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const { locale } = useLocale()
  const auth = useTranslations('auth')
  const [form, setForm] = useState<CreateMessForm>(initialForm)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const updateField = (key: keyof CreateMessForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    setMessage('')

    const messName = form.messName.trim()
    const messLocation = form.messLocation.trim()
    const mealRate = form.mealRate.trim() || '0'

    if (!messName || !messLocation) {
      setMessage(auth('messNameLocationRequired'))
      return
    }

    setBusy(true)
    try {
      await api.createMess({
        messName,
        messLocation,
        description: form.description.trim() || undefined,
        currency: 'BDT',
        meal_rate: mealRate,
        messCategory: form.messCategory.trim() || undefined,
        totalSeats: optionalNumber(form.totalSeats),
        monthlyRent: optionalNumber(form.monthlyRent),
      })
      await refresh()
      router.replace(appHref('/'))
    } catch (error) {
      setMessage(localizedErrorMessage(error, locale))
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={auth('createMessTitle')} subtitle={auth('createMessDescription')} backHref="/" />
      <div className="screen space-y-4">
        <section className="app-section">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[#edfafa] text-[#008d8c]">
              <Building2 size={23} strokeWidth={2.35} />
            </div>
            <div className="min-w-0">
              <div className="text-body font-semibold text-[#1d3a42]">{auth('managerSetup')}</div>
              <div className="mt-0.5 text-caption font-semibold text-[#65838b]">{auth('managerAfterCreation')}</div>
            </div>
          </div>
        </section>

        <section className="app-section app-form-section space-y-4">
          <div className="section-title">{auth('messDetails')}</div>
          <TextField label={auth('messName')} value={form.messName} onChange={(value) => updateField('messName', value)} placeholder={auth('messNamePlaceholder')} />
          <TextField label={auth('location')} value={form.messLocation} onChange={(value) => updateField('messLocation', value)} placeholder={auth('locationPlaceholder')} />
          <TextField label={auth('category')} value={form.messCategory} onChange={(value) => updateField('messCategory', value)} placeholder={auth('categoryPlaceholder')} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label={auth('totalSeats')} value={form.totalSeats} onChange={(value) => updateField('totalSeats', value)} placeholder="12" type="number" />
            <TextField label={auth('mealRate')} value={form.mealRate} onChange={(value) => updateField('mealRate', value)} placeholder="0" type="number" />
          </div>
          <TextField label={auth('monthlyRent')} value={form.monthlyRent} onChange={(value) => updateField('monthlyRent', value)} placeholder="50000" type="number" />
          <TextAreaField label={auth('description')} value={form.description} onChange={(value) => updateField('description', value)} placeholder={auth('messDescriptionPlaceholder')} rows={3} />

          {message ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{message}</div> : null}

          <SubmitButton busy={busy} onClick={handleSubmit}>
            <span className="inline-flex items-center justify-center gap-2">
              <CheckCircle2 size={18} strokeWidth={2.4} />
              {auth('createMessTitle')}
            </span>
          </SubmitButton>
        </section>
      </div>
    </MobileShell>
  )
}
