'use client'

import { useEffect, useMemo, useState } from 'react'
import { Edit3 } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { IconActionLink, StatusPill } from '@/components/mobile/action-links'
import { TopScreen } from '@/components/top-screen'
import { SelectField, SubmitButton, TextAreaField, TextField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES, LABELS, type ComplaintCategory, type ComplaintStatus } from '@/lib/form-options'
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
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? '', [user])
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [items, setItems] = useState<ComplaintItem[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!messId) return
    let alive = true

    api
      .getComplaintsByMess(messId, { status: form.statusFilter, limit: 20, sortBy: 'created_at', sortOrder: 'desc' })
      .then((res) => {
        if (!alive) return
        setItems(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => {
        if (!alive) return
        setItems([])
      })

    return () => {
      alive = false
    }
  }, [messId, form.statusFilter, busy])

  async function handleSubmit() {
    setMessage('')
    if (!messId) return setMessage('No mess selected.')
    if (!form.title.trim()) return setMessage('Title is required.')
    if (!form.description.trim()) return setMessage('Description is required.')

    setBusy(true)
    try {
      await api.createComplaint({
        messId,
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
      })
      setForm(INITIAL_FORM)
      setMessage('Complaint submitted successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to submit complaint.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Complaints" subtitle="Request and issue board" backHref="/" />
      <div className="screen space-y-4">
        <div className="glass rounded-[28px] p-4 space-y-4">
          <SelectField
            label="Category"
            value={form.category}
            onChange={(category) => setForm((prev) => ({ ...prev, category }))}
            options={COMPLAINT_CATEGORIES}
            getLabel={(value) => LABELS.COMPLAINT_CATEGORIES[value]}
          />
          <TextField label="Title" value={form.title} onChange={(title) => setForm((prev) => ({ ...prev, title }))} placeholder="Dinner count correction" />
          <TextAreaField
            label="Description"
            value={form.description}
            onChange={(description) => setForm((prev) => ({ ...prev, description }))}
            placeholder="My dinner was off but counted as on."
            rows={4}
          />
          {message ? <div className="rounded-2xl border border-[#ffd8c0] bg-[#fff4ea] px-4 py-3 text-sm font-semibold text-[#fc782d]">{message}</div> : null}
          <SubmitButton busy={busy} onClick={handleSubmit}>
            Submit Complaint
          </SubmitButton>
        </div>

        <div className="glass rounded-[28px] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="section-title mb-0">Recent</div>
            <SelectField
              label="Filter"
              value={form.statusFilter}
              onChange={(statusFilter) => setForm((prev) => ({ ...prev, statusFilter }))}
              options={COMPLAINT_STATUSES}
              getLabel={(value) => LABELS.COMPLAINT_STATUSES[value]}
            />
          </div>
          <div className="mt-3 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#d8ecec] bg-white px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-extrabold text-[#14324a]">{item.title}</div>
                    <div className="mt-1 text-xs text-[#667b8a]">{LABELS.COMPLAINT_CATEGORIES[item.category]}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill label={LABELS.COMPLAINT_STATUSES[item.status]} tone={getStatusTone(item.status)} />
                    <IconActionLink
                      href={`/edit-complaint?complaintId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                      label="Edit complaint"
                      icon={<Edit3 size={16} />}
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-[#667b8a]">{item.description}</p>
                {item.response ? <div className="mt-2 rounded-xl bg-[#f7fbfd] px-3 py-2 text-xs text-[#14324a]">{item.response}</div> : null}
              </div>
            ))}
            {!items.length ? <div className="py-3 text-sm text-[#667b8a]">No complaints loaded.</div> : null}
          </div>
        </div>
      </div>
    </MobileShell>
  )
}
