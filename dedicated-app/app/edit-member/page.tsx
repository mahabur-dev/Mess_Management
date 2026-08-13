'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import {
  DesignedInput,
  DesignedSelect,
  DesignedToggle,
  FormFieldGrid,
  FormPageShell,
  FormSection,
  FormStatusMessage,
  FormSummaryCard,
  SubmitGradientButton,
  detailIcons,
  expenseFormIcons,
} from '@/components/mobile/expense-design'
import { api } from '@/lib/api'
import { LABELS, MEMBER_ROLES, type MemberRole } from '@/lib/form-options'
import { useAutoDismiss } from '@/hooks/use-auto-dismiss'
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

  useAutoDismiss(message, () => setMessage(''))

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
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
      <form onSubmit={handleSubmit}>
        <FormPageShell title="Edit Member" description={member?.user?.name ?? 'Update member details'} icon={User} backHref="/members">
          <FormSection>
            <FormSummaryCard
              eyebrow="Member"
              title={member?.user?.name ?? memberId}
              description={member?.user?.email ?? 'Member profile'}
              icon={User}
            />
          </FormSection>

          <FormSection title="Member Details">
            <DesignedSelect
              label="Role"
              icon={detailIcons.role}
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as MemberRole }))}
            >
              {MEMBER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {LABELS.MEMBER_ROLES[role]}
                </option>
              ))}
            </DesignedSelect>

            <DesignedInput label="Room No" icon={detailIcons.room} value={form.roomNo} onChange={(event) => setForm((prev) => ({ ...prev, roomNo: event.target.value }))} placeholder="A-2" />

            <FormFieldGrid>
              <DesignedInput
                label="Monthly Rent"
                icon={expenseFormIcons.amount}
                value={form.monthlyRent}
                onChange={(event) => setForm((prev) => ({ ...prev, monthlyRent: event.target.value }))}
                placeholder="4500"
                type="number"
              />
              <DesignedInput
                label="Deposit Amount"
                icon={expenseFormIcons.amount}
                value={form.depositAmount}
                onChange={(event) => setForm((prev) => ({ ...prev, depositAmount: event.target.value }))}
                placeholder="5000"
                type="number"
              />
            </FormFieldGrid>

            <DesignedToggle
              label="Active Member"
              hint="Disable to mark as inactive"
              icon={detailIcons.status}
              checked={form.isActive}
              onChange={(isActive) => setForm((prev) => ({ ...prev, isActive }))}
            />
          </FormSection>

          <FormStatusMessage message={message} />

          <SubmitGradientButton busy={busy}>Save Changes</SubmitGradientButton>
        </FormPageShell>
      </form>
    </MobileShell>
  )
}
