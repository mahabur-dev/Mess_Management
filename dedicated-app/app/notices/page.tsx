'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, Send } from 'lucide-react'
import { DeferredFormSection } from '@/components/mobile/deferred-form-section'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SelectField, SubmitButton, TextAreaField, TextField, ToggleField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { LABELS, NOTICE_TYPES, type NoticeType } from '@/lib/form-options'
import { useAuth } from '../providers'

type FormState = {
  type: NoticeType
  title: string
  body: string
  isPinned: boolean
}

type NoticeItem = {
  id: string
  type: NoticeType
  title: string
  body: string
  is_pinned?: boolean
  created_at?: string
  creator?: { name: string }
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
  const canSendNotice = canManageMess(user)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [items, setItems] = useState<NoticeItem[]>([])

  useEffect(() => {
    if (!messId) return
    let alive = true

    api
      .getNoticesByMess(messId, { limit: 30, sortBy: 'created_at', sortOrder: 'desc' })
      .then((res) => {
        if (alive) setItems(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => {
        if (alive) setItems([])
      })

    return () => {
      alive = false
    }
  }, [messId, busy])

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

        {canSendNotice ? (
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
              placeholder="Deposit deadline"
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
        ) : null}

        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-[20px] border border-[#cfeeed] bg-white px-4 py-4 shadow-[0_8px_22px_rgba(18,55,72,0.07)]">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#edfafa] text-[#008d8c]">
                  <Bell size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-black text-[#123748]">{item.title}</h2>
                    {item.is_pinned ? <span className="rounded-full bg-[#dff4f3] px-2 py-0.5 text-[9px] font-black text-[#008d8c]">PINNED</span> : null}
                  </div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#65838b]">{LABELS.NOTICE_TYPES[item.type]}</div>
                  <p className="mt-2 text-xs leading-5 text-[#65838b]">{item.body}</p>
                </div>
              </div>
            </article>
          ))}
          {!items.length ? <div className="rounded-[20px] bg-white/90 p-6 text-center text-sm text-[#65838b]">No notices loaded.</div> : null}
        </div>
      </div>
    </MobileShell>
  )
}
