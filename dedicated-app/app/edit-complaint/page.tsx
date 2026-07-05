'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SelectField, SubmitButton, TextAreaField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { COMPLAINT_STATUSES, LABELS, type ComplaintStatus } from '@/lib/form-options'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'

type ComplaintRecord = {
  id: string
  title: string
  description: string
  status: ComplaintStatus
  category?: string
  response?: string | null
  created_at?: string | null
}

type FormState = {
  status: ComplaintStatus
  response: string
}

export default function EditComplaintPage() {
  const searchParams = useQueryParams()
  const router = useRouter()
  const { user } = useAuth()
  const complaintId = searchParams.get('complaintId') ?? ''
  const messId = searchParams.get('messId') ?? user?.memberships?.[0]?.mess_id ?? ''

  const [complaint, setComplaint] = useState<ComplaintRecord | null>(null)
  const [form, setForm] = useState<FormState>({
    status: 'PENDING',
    response: '',
  })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const complaintLabel = useMemo(() => (complaint ? LABELS.COMPLAINT_STATUSES[complaint.status] : 'Complaint'), [complaint])

  useEffect(() => {
    if (!complaintId || !messId) return

    let alive = true
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
          setMessage('Complaint not found.')
        }
      })
      .catch(() => {
        if (!alive) return
        setMessage('Failed to load complaint details.')
      })

    return () => {
      alive = false
    }
  }, [complaintId, messId])

  async function handleSubmit() {
    setMessage('')
    if (!complaintId || !messId) return setMessage('Complaint id or mess id is missing.')

    setBusy(true)
    try {
      await api.updateComplaintStatus(complaintId, {
        status: form.status,
        response: form.response.trim() || undefined,
      })
      setMessage('Complaint updated successfully.')
      router.push('/complaints')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update complaint.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Edit Complaint" subtitle={complaint?.title ?? complaintLabel} backHref="/complaints" />
      <div className="screen space-y-4">
        <div className="glass rounded-[28px] p-4 space-y-4">
          <div className="rounded-2xl bg-[#f7fbfd] px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#667b8a]">Complaint</div>
            <div className="mt-1 text-sm font-black text-[#14324a]">{complaint?.title ?? complaintId}</div>
            <div className="mt-1 text-xs text-[#667b8a]">{complaint?.description ?? 'No description'}</div>
          </div>

          <SelectField
            label="Status"
            value={form.status}
            onChange={(status) => setForm((prev) => ({ ...prev, status }))}
            options={COMPLAINT_STATUSES}
            getLabel={(value) => LABELS.COMPLAINT_STATUSES[value]}
          />
          <TextAreaField
            label="Response"
            value={form.response}
            onChange={(response) => setForm((prev) => ({ ...prev, response }))}
            placeholder="Write the final response for this complaint"
            rows={4}
          />

          {message ? <div className="rounded-2xl border border-[#cfe3ff] bg-[#e7f1ff] px-4 py-3 text-sm font-semibold text-[#0f7e86]">{message}</div> : null}

          <SubmitButton busy={busy} onClick={handleSubmit}>
            Save Changes
          </SubmitButton>
        </div>
      </div>
    </MobileShell>
  )
}
