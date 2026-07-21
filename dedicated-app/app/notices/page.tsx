'use client'

import { useMemo, useState } from 'react'
import { Send } from 'lucide-react'
import { DeferredFormSection } from '@/components/mobile/deferred-form-section'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { FieldCard, SelectField, SubmitButton, TextAreaField, TextField, ToggleField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { LABELS, NOTICE_TYPES, type NoticeType } from '@/lib/form-options'
import { useAuth } from '../providers'

type FormState = {
  type: NoticeType
  title: string
  body: string
  isPinned: boolean
}

const INITIAL_FORM: FormState = {
  type: 'GENERAL',
  title: '',
  body: '',
  isPinned: false,
}

export default function NoticesPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? '', [user])
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function handleSubmit() {
    setMessage('')
    if (!messId) return setMessage('No mess selected.')
    if (!form.title.trim()) return setMessage('Title is required.')
    if (!form.body.trim()) return setMessage('Message is required.')

    setBusy(true)
    try {
      await api.createNotice({
        messId,
        type: form.type,
        title: form.title.trim(),
        body: form.body.trim(),
        isPinned: form.isPinned,
      })
      setForm(INITIAL_FORM)
      setMessage('Notice sent successfully.')
      setShowForm(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to send notice.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Notices" subtitle="Announcement center" backHref="/" />
      <div className="screen space-y-4">
        {message && !showForm ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-sm font-semibold text-[#008d8c]">{message}</div> : null}

        <DeferredFormSection
          open={showForm}
          title="Send Notice"
          description="Create an announcement when you need to notify members."
          actionLabel="Send Notice"
          icon={<Send size={20} />}
          onOpen={() => setShowForm(true)}
          onClose={() => setShowForm(false)}
        >
          <SelectField
            label="Notice Type"
            value={form.type}
            onChange={(type) => setForm((prev) => ({ ...prev, type }))}
            options={NOTICE_TYPES}
            getLabel={(value) => LABELS.NOTICE_TYPES[value]}
          />
          <TextField
            label="Title"
            value={form.title}
            onChange={(title) => setForm((prev) => ({ ...prev, title }))}
            placeholder="Payment deadline"
          />
          <TextAreaField
            label="Message"
            value={form.body}
            onChange={(body) => setForm((prev) => ({ ...prev, body }))}
            placeholder="Please clear all dues by the 10th."
          />
          <ToggleField
            label="Pinned"
            hint="Shown at the top of notice board"
            checked={form.isPinned}
            onChange={(isPinned) => setForm((prev) => ({ ...prev, isPinned }))}
          />
          {message && showForm ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-sm font-semibold text-[#008d8c]">{message}</div> : null}
          <SubmitButton busy={busy} onClick={handleSubmit}>
            Send Notice
          </SubmitButton>
        </DeferredFormSection>
      </div>
    </MobileShell>
  )
}
