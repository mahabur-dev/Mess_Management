'use client'

import { useEffect, useMemo, useState } from 'react'
import { Edit3 } from 'lucide-react'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MessOnboardingActions } from '@/components/mess-onboarding-actions'
import { InlineNotice } from '@/components/mobile/meals-design'
import { MobileShell } from '@/components/mobile-shell'
import { IconActionLink, StatusPill } from '@/components/mobile/action-links'
import { TopScreen } from '@/components/top-screen'
import { SelectField, SubmitButton, TextAreaField, TextField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { canManageMess, getActiveMessId } from '@/lib/app-permissions'
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES, type ComplaintCategory, type ComplaintStatus } from '@/lib/form-options'
import { complaintCategoryLabel, complaintStatusLabel, useLocale, useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'
import { useAuth } from '../providers'

type ComplaintItem = {
  id: string
  title: string
  description: string
  category: ComplaintCategory
  status: ComplaintStatus
  response?: string | null
  created_at?: string
}

type FormState = {
  category: ComplaintCategory
  title: string
  description: string
  statusFilter: ComplaintStatus
}

const INITIAL_FORM: FormState = {
  category: 'OTHER',
  title: '',
  description: '',
  statusFilter: 'PENDING',
}

function getStatusTone(status: ComplaintStatus) {
  if (status === 'SOLVED') return 'success'
  if (status === 'PROCESSING') return 'warning'
  if (status === 'REJECTED') return 'danger'
  return 'neutral'
}

export default function ComplaintsPage() {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('communication')
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('communication')
  const { user } = useAuth()
  const messId = useMemo(() => getActiveMessId(user), [user])
  const canUpdateComplaints = canManageMess(user)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [items, setItems] = useState<ComplaintItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!messId) {
      setItems([])
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)

    api
      .getComplaintsByMess(messId, { status: form.statusFilter, limit: 20, sortBy: 'created_at', sortOrder: 'desc' })
      .then((res) => {
        if (!alive) return
        setItems(Array.isArray(res.data) ? res.data : [])
      })
      .catch((error) => {
        if (!alive) return
        setItems([])
        showError(error, 'loadComplaintsFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [busy, form.statusFilter, messId, showError])

  async function handleSubmit() {
    clearNotice()
    if (!messId) return showMessage('noMessSelected', 'danger')
    if (!form.title.trim()) return showMessage('titleRequired', 'danger')
    if (!form.description.trim()) return showMessage('descriptionRequired', 'danger')

    setBusy(true)
    try {
      await api.createComplaint({
        messId,
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
      })
      setForm(INITIAL_FORM)
      showMessage('complaintSubmitted', 'success')
    } catch (error) {
      showError(error, 'submitComplaintFailed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={t('complaints')} subtitle={t('complaintSubtitle')} backHref="/" />
      <div className="screen space-y-4">
        {!messId ? <MessOnboardingActions compact /> : null}
        {messId ? (
          <>
        <section className="app-section app-form-section space-y-4">
          <SelectField
            label={t('category')}
            value={form.category}
            onChange={(category) => setForm((prev) => ({ ...prev, category }))}
            options={COMPLAINT_CATEGORIES}
            getLabel={(value) => complaintCategoryLabel(value, locale)}
          />
          <TextField label={t('title')} value={form.title} onChange={(title) => setForm((prev) => ({ ...prev, title }))} placeholder={t('complaintTitlePlaceholder')} />
          <TextAreaField
            label={t('description')}
            value={form.description}
            onChange={(description) => setForm((prev) => ({ ...prev, description }))}
            placeholder={t('complaintDescriptionPlaceholder')}
            rows={4}
          />
          {notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}
          <SubmitButton busy={busy} onClick={handleSubmit}>
            {t('submitComplaint')}
          </SubmitButton>
        </section>

        <section className="app-section">
          <div className="flex items-center justify-between gap-3">
            <div className="section-title mb-0">{t('recent')}</div>
            <SelectField
              label={t('filter')}
              value={form.statusFilter}
              onChange={(statusFilter) => setForm((prev) => ({ ...prev, statusFilter }))}
              options={COMPLAINT_STATUSES}
              getLabel={(value) => complaintStatusLabel(value, locale)}
            />
          </div>
          <div className="app-list mt-3">
            {loading ? <LoadingIndicator variant="card" label={t('loadingComplaints')} /> : null}
            {items.map((item) => (
              <article key={item.id} className="app-list-row py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-label font-semibold text-[#1d3a42]">{item.title}</div>
                    <div className="mt-1 text-caption text-[#65838b]">{complaintCategoryLabel(item.category, locale)}</div>
                    {item.created_at ? <div className="mt-1 text-caption text-[#789096]">{t('submittedOn', { date: format.date(item.created_at, { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }) })}</div> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill label={complaintStatusLabel(item.status, locale)} tone={getStatusTone(item.status)} />
                    {canUpdateComplaints ? (
                      <IconActionLink
                        href={`/edit-complaint?complaintId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                        label={t('editComplaint')}
                        icon={<Edit3 size={16} />}
                      />
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-label text-[#65838b]">{item.description}</p>
                {item.response ? (
                  <div className="mt-2 rounded-xl bg-[#edfafa] px-3 py-2 text-label text-[#123748]">
                    <span className="mb-1 block text-caption font-bold text-[#008d8c]">{t('managerResponse')}</span>
                    {item.response}
                  </div>
                ) : null}
              </article>
            ))}
            {!loading && !items.length ? <div className="app-empty-state">{t('noComplaints')}</div> : null}
          </div>
        </section>
          </>
        ) : null}
      </div>
    </MobileShell>
  )
}
