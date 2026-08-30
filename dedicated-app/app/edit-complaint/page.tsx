'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import { SelectField, SubmitButton, TextAreaField } from '@/components/mobile/form-controls'
import { InlineNotice } from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { getActiveMessId } from '@/lib/app-permissions'
import { COMPLAINT_STATUSES, type ComplaintCategory, type ComplaintStatus } from '@/lib/form-options'
import { complaintCategoryLabel, complaintStatusLabel, useLocale, useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'

type ComplaintRecord = {
  id: string
  title: string
  description: string
  status: ComplaintStatus
  category?: ComplaintCategory
  response?: string | null
  created_at?: string | null
}

type FormState = {
  status: ComplaintStatus
  response: string
}

export default function EditComplaintPage() {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('communication')
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('communication')
  const searchParams = useQueryParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const complaintId = searchParams.get('complaintId') ?? ''
  const messId = searchParams.get('messId') ?? getActiveMessId(user)

  const [complaint, setComplaint] = useState<ComplaintRecord | null>(null)
  const [form, setForm] = useState<FormState>({
    status: 'PENDING',
    response: '',
  })
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const complaintLabel = useMemo(
    () => (complaint ? complaintStatusLabel(complaint.status, locale) : t('complaint')),
    [complaint, locale, t],
  )

  useEffect(() => {
    if (authLoading) return
    if (!complaintId || !messId) {
      setComplaint(null)
      setLoading(false)
      showMessage('missingComplaintContext', 'danger')
      return
    }

    let alive = true
    setLoading(true)
    clearNotice()
    api
      .getComplaintsByMess(messId, { limit: 500, sortBy: 'created_at', sortOrder: 'desc' })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res.data) ? (res.data as ComplaintRecord[]) : []
        const found = list.find((item) => item.id === complaintId) ?? null
        setComplaint(found)
        if (found) {
          setForm({
            status: found.status ?? 'PENDING',
            response: found.response ?? '',
          })
        } else {
          showMessage('complaintNotFound', 'danger')
        }
      })
      .catch((error) => {
        if (!alive) return
        setComplaint(null)
        showError(error, 'loadComplaintFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [authLoading, clearNotice, complaintId, messId, showError, showMessage])

  async function handleSubmit() {
    clearNotice()
    if (!complaintId || !messId) return showMessage('missingComplaintContext', 'danger')

    setBusy(true)
    try {
      await api.updateComplaintStatus(complaintId, {
        status: form.status,
        response: form.response.trim() || undefined,
      })
      showMessage('complaintUpdated', 'success')
      router.push('/complaints')
    } catch (error) {
      showError(error, 'updateComplaintFailed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={t('editComplaint')} subtitle={complaint?.title ?? complaintLabel} backHref="/complaints" />
      <div className="screen space-y-4">
        {loading ? <LoadingIndicator variant="card" label={t('loadingComplaint')} /> : null}
        {!loading && !complaint && notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}
        {!loading && complaint ? (
        <section className="app-section app-form-section space-y-4">
          <div className="rounded-2xl bg-[#edfafa] px-4 py-3">
            <div className="text-caption font-bold uppercase tracking-[0.12em] text-[#65838b]">{t('complaint')}</div>
            <div className="mt-1 text-label font-bold text-[#123748]">{complaint?.title ?? complaintId}</div>
            <div className="mt-1 text-caption text-[#65838b]">{complaint?.description ?? t('noDescription')}</div>
            {complaint?.category ? <div className="mt-2 text-caption font-semibold text-[#008d8c]">{complaintCategoryLabel(complaint.category, locale)}</div> : null}
            {complaint?.created_at ? <div className="mt-1 text-caption text-[#789096]">{t('submittedOn', { date: format.date(complaint.created_at, { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }) })}</div> : null}
          </div>

          <SelectField
            label={t('status')}
            value={form.status}
            onChange={(status) => setForm((prev) => ({ ...prev, status }))}
            options={COMPLAINT_STATUSES}
            getLabel={(value) => complaintStatusLabel(value, locale)}
          />
          <TextAreaField
            label={t('response')}
            value={form.response}
            onChange={(response) => setForm((prev) => ({ ...prev, response }))}
            placeholder={t('responsePlaceholder')}
            rows={4}
          />

          {notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}

          <SubmitButton busy={busy} onClick={handleSubmit}>
            {t('saveChanges')}
          </SubmitButton>
        </section>
        ) : null}
      </div>
    </MobileShell>
  )
}
