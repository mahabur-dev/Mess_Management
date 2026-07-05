'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SelectField, SubmitButton, TextField, ToggleField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { LABELS, MEMBER_ROLES, type MemberRole } from '@/lib/form-options'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'

type MemberRecord = {
  user_id: string
  mess_id: string
  role: MemberRole
  is_active?: boolean
  room_no?: string | null
  monthly_rent?: string | number | null
  deposit_amount?: string | number | null
  user?: { id: string; name: string; email: string }
  mess?: { id: string; name: string }
}

type FormState = {
  role: MemberRole
  roomNo: string
  monthlyRent: string
  depositAmount: string
  isActive: boolean
}

const INITIAL_FORM: FormState = {
  role: 'MEMBER',
  roomNo: '',
  monthlyRent: '',
  depositAmount: '',
  isActive: true,
}

export default function EditMemberPage() {
  const searchParams = useQueryParams()
  const router = useRouter()
  const { user } = useAuth()
  const memberId = searchParams.get('memberId') ?? ''
  const messId = searchParams.get('messId') ?? user?.memberships?.[0]?.mess_id ?? ''
  const [member, setMember] = useState<MemberRecord | null>(null)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!memberId || !messId) return
    let alive = true
    api
      .getAllMembers({ limit: 500 })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res.data) ? res.data : []
        const found = list.find((item: MemberRecord) => item.user_id === memberId && item.mess_id === messId) ?? null
        setMember(found)
        setForm({
          role: found?.role ?? 'MEMBER',
          roomNo: found?.room_no ?? '',
          monthlyRent: found?.monthly_rent ? String(found.monthly_rent) : '',
          depositAmount: found?.deposit_amount ? String(found.deposit_amount) : '',
          isActive: found?.is_active ?? true,
        })
      })
      .catch(() => {
        if (!alive) return
        setMessage('Failed to load member details.')
      })

    return () => {
      alive = false
    }
  }, [memberId, messId])

  async function handleSubmit() {
    setMessage('')
    if (!memberId || !messId) return setMessage('Member id or mess id is missing.')

    setBusy(true)
    try {
      await api.updateMember(messId, memberId, {
        role: form.role,
        roomNo: form.roomNo.trim() || undefined,
        monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : undefined,
        depositAmount: form.depositAmount ? Number(form.depositAmount) : undefined,
        isActive: form.isActive,
      })
      setMessage('Member updated successfully.')
      router.push('/members')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update member.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Edit Member" subtitle={member?.user?.name ?? 'Update member details'} backHref="/members" />
      <div className="screen space-y-4">
        <div className="glass rounded-[28px] p-4 space-y-4">
          <div className="rounded-2xl bg-[#f7fbfd] px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#667b8a]">Member</div>
            <div className="mt-1 text-sm font-black text-[#14324a]">{member?.user?.name ?? memberId}</div>
            <div className="mt-1 text-xs text-[#667b8a]">{member?.user?.email ?? ''}</div>
          </div>
          <SelectField
            label="Role"
            value={form.role}
            onChange={(role) => setForm((prev) => ({ ...prev, role }))}
            options={MEMBER_ROLES}
            getLabel={(value) => LABELS.MEMBER_ROLES[value]}
          />
          <TextField label="Room No" value={form.roomNo} onChange={(roomNo) => setForm((prev) => ({ ...prev, roomNo }))} placeholder="A-2" />
          <TextField
            label="Monthly Rent"
            value={form.monthlyRent}
            onChange={(monthlyRent) => setForm((prev) => ({ ...prev, monthlyRent }))}
            placeholder="4500"
            type="number"
          />
          <TextField
            label="Deposit Amount"
            value={form.depositAmount}
            onChange={(depositAmount) => setForm((prev) => ({ ...prev, depositAmount }))}
            placeholder="5000"
            type="number"
          />
          <ToggleField
            label="Active Member"
            hint="Disable to mark as inactive"
            checked={form.isActive}
            onChange={(isActive) => setForm((prev) => ({ ...prev, isActive }))}
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
