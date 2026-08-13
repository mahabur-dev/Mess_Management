'use client'

import { useMemo, useState } from 'react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SelectField, SubmitButton, TextField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { LABELS, MEMBER_ROLES, type MemberRole } from '@/lib/form-options'
import { useAuth } from '../providers'

type FormState = {
  email: string
  role: MemberRole
  roomNo: string
  seatNo: string
  monthlyRent: string
  depositAmount: string
}

const INITIAL_FORM: FormState = {
  email: '',
  role: 'MEMBER',
  roomNo: '',
  seatNo: '',
  monthlyRent: '',
  depositAmount: '',
}

export default function AddMemberPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? '', [user])
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit() {
    setMessage('')
    if (!messId) return setMessage('No mess selected.')
    if (!form.email.trim()) return setMessage('Email is required.')

    setBusy(true)
    try {
      await api.addMember(messId, {
        email: form.email.trim().toLowerCase(),
        role: form.role,
        roomNo: form.roomNo.trim() || undefined,
        seatNo: form.seatNo.trim() || undefined,
        monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : undefined,
        depositAmount: form.depositAmount ? Number(form.depositAmount) : undefined,
      })
      setForm(INITIAL_FORM)
      setMessage('Member added successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to add member.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Add Member" subtitle="Backend DTO aligned" backHref="/members" />
      <div className="screen space-y-4">
        <section className="app-section app-form-section space-y-4">
          <TextField label="Email" value={form.email} onChange={(email) => setForm((prev) => ({ ...prev, email }))} placeholder="member@example.com" />
          <SelectField
            label="Role"
            value={form.role}
            onChange={(role) => setForm((prev) => ({ ...prev, role }))}
            options={MEMBER_ROLES}
            getLabel={(value) => LABELS.MEMBER_ROLES[value]}
          />
          <TextField label="Room No" value={form.roomNo} onChange={(roomNo) => setForm((prev) => ({ ...prev, roomNo }))} placeholder="A-2" />
          <TextField label="Seat No" value={form.seatNo} onChange={(seatNo) => setForm((prev) => ({ ...prev, seatNo }))} placeholder="S-05" />
          <TextField label="Monthly Rent" value={form.monthlyRent} onChange={(monthlyRent) => setForm((prev) => ({ ...prev, monthlyRent }))} placeholder="4500" type="number" />
          <TextField label="Deposit Amount" value={form.depositAmount} onChange={(depositAmount) => setForm((prev) => ({ ...prev, depositAmount }))} placeholder="5000" type="number" />

          {message ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{message}</div> : null}

          <SubmitButton busy={busy} onClick={handleSubmit}>
            Save Member
          </SubmitButton>
        </section>
      </div>
    </MobileShell>
  )
}
